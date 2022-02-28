const client = require('../model/DB').pool;
const Wallet = require('../model/wallet');
const BankDetail = require('../model/bankDetail');
const config = require('../config/configBasic');
const AuditLogs = require('../model/auditLogs');
const { currencyExchange } = require('../helper/currencyConverter');

const addBankDetail = async (req, res, next) => {
  try {
    // console.log(req.file);
    if (!req.file || req.file.fieldname !== 'bank_draft') {
      return res
        .status(400)
        .json({ success: false, msg: 'Bank draft is required' });
    }

    const filePath = `/bankDrafts/${req.file.filename}`;

    console.log('Req.body of /api/v3/fiat/add/bank is ====>', req.body);
    // //Exchange Currency
    let exchangedAmmount = null;
    // exchangedAmmount = await currencyExchange(
    //   req.body.currency,
    //   "usd",
    //   req.body.transfer_amount
    // );

    let body = {
      bank_draft: filePath,
      swift: req.body.swift,
      bank_name: req.body.bank_name,
      account_no: req.body.account_no,
      account_name: req.body.account_name,
      from_account: req.body.from_account,
      currency: req.body.currency,
      transfer_amount: exchangedAmmount || req.body.transfer_amount,
      transfer_fee: req.body.transfer_fee,
      total_amount: req.body.total_amount,
      country: req.body.country,
      user_id: req.user.id,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    };

    const bankDetail = await BankDetail.addBankDetails(body);

    res.status(200).json({
      success: true,
      msg: 'Bank Details added please wait for verification',
      data: bankDetail.rows[0],
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

const getAllBankDeposits = async (req, res, next) => {
  try {
    const details = await BankDetail.getBankDetails(req.query);

    res.status(200).json({ success: true, data: details.rows });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

const getSingleDeposit = async (req, res, next) => {
  try {
    const deposit = await BankDetail.getBankDetailById(req.params.id);
    res.status(200).json({ sucess: true, data: deposit.rows[0] || {} });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

const depositStatus = async (req, res, next) => {
  try {
    const bankDetail = (await BankDetail.getBankDetailById(req.params.id))
      .rows[0];

    if (!bankDetail) {
      return res
        .status(404)
        .json({ success: false, msg: 'no bank details found' });
    }

    if (bankDetail.user_id === req.user.id) {
      return res.status(403).json({
        success: false,
        msg: 'you are not authorized to approve this transaction.',
      });
    }

    if (bankDetail.status === 'approved') {
      return res
        .status(400)
        .json({ success: false, msg: 'detail already approved' });
    }

    if (bankDetail.status === 'rejected') {
      return res.status(400).json({
        success: false,
        msg: 'detail has been rejected by other user',
      });
    }

    const { status } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false });
    }

    if (
      bankDetail.user1_approve === req.user.id ||
      bankDetail.user2_approve === req.user.id
    ) {
      return res
        .status(403)
        .json({ success: false, msg: 'your conscience already added' });
    }

    let approved = false;
    let fields = {};

    if (status === 'approved') {
      if (!bankDetail.user1_approve) {
        if (req.user.userType === 'super-admin') {
          fields = { status: 'approved', user1_approve: req.user.id };
          approved = true;
        } else {
          fields = { status: 'pending', user1_approve: req.user.id };
        }
      } else {
        fields = { status: 'approved', user2_approve: req.user.id };
        approved = true;
      }
    } else {
      await BankDetail.updateBankDetail(bankDetail.id, { status });
      await AuditLogs.saveLogs({
        action: 'bank_transaction_reject',
        admin: req.user.id,
        user_id: bankDetail.user_id,
        created_at: new Date(),
        updated_at: new Date(),
      });
      return res
        .status(200)
        .json({ success: true, msg: 'your conscience added successfully.' });
    }

    if (approved) {
      approveStatus(bankDetail, fields, req, res);
    } else {
      await BankDetail.updateBankDetail(bankDetail.id, fields);
      await AuditLogs.saveLogs({
        action: 'bank_transaction_approve',
        admin: req.user.id,
        user_id: bankDetail.user_id,
        created_at: new Date(),
        updated_at: new Date(),
      });
      res
        .status(200)
        .json({ success: true, msg: 'your conscience added successfully.' });
    }
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

const approveStatus = async (bankDetail, fields, req, res) => {
  try {
    const wallet = (await Wallet.getWalletByUser(bankDetail.user_id)).rows[0];
    await client.query('BEGIN');
    if (!wallet) {
      const fields = {
        user_id: bankDetail.user_id,
        fiat_balances: bankDetail.transfer_amount,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await Wallet.createWallet(fields);
    } else {
      let fiat_balances = wallet.fiat_balances;
      // console.log("fiat balance", fiat_balances);
      // console.log("Transfer Amount", bankDetail.transfer_amount);
      fiat_balances += bankDetail.transfer_amount;
      await Wallet.updateWallet(wallet.id, { fiat_balances });
    }

    await BankDetail.updateBankDetail(bankDetail.id, fields);
    await AuditLogs.saveLogs({
      action: 'bank_transaction_approve',
      admin: req.user.id,
      user_id: bankDetail.user_id,
      created_at: new Date(),
      updated_at: new Date(),
    });
    await client.query('COMMIT');
    return res
      .status(200)
      .json({ success: true, msg: 'Transaction completed successfully.' });
  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(error.message);
  }
};

const getSingleApproveDeposits = async (req, res) => {
  try {
    try {
      const deposits = (await BankDetail.findSingleApprovedDeposits()).rows;
      res.status(200).json({ success: true, data: deposits });
    } catch (error) {
      res.status(500).json({ success: false, msg: error.message });
    }
  } catch (error) {}
};

const getNotApprovedDeposits = async (req, res) => {
  try {
    try {
      const deposits = (await BankDetail.findNotApprovedDeposits()).rows;
      res.status(200).json({ success: true, data: deposits });
    } catch (error) {
      res.status(500).json({ success: false, msg: error.message });
    }
  } catch (error) {}
};

module.exports = {
  addBankDetail,
  getAllBankDeposits,
  depositStatus,
  getSingleDeposit,
  getSingleApproveDeposits,
  getNotApprovedDeposits,
};
