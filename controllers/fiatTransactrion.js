const DB = require("../model/DB");
const Wallet = require("../model/wallet");
const BankDetail = require("../model/bankDetail");
const fiatTransaction = require("../model/fiatTransaction");
const config = require("../config/configBasic");
const Users = require("../model/Users");
const AuditLogs = require("../model/auditLogs");

const addBankDetail = async (req, res, next) => {
  try {
    if (!req.file || req.file.fieldname !== "bank_draft") {
      return res
        .status(400)
        .json({ sucess: false, msg: "Bank draft is required" });
    }

    const filePath = `${req.protocol}://${req.host}:${config.port}/${req.file.path}`;

    let body = {
      bank_draft: filePath,
      swift: req.body.swift,
      bank_name: req.body.bank_name,
      account_no: req.body.account_no,
      account_name: req.body.account_name,
      from_account: req.body.from_account,
      currency: req.body.currency,
      transfer_amount: req.body.transfer_amount,
      transfer_fee: req.body.transfer_fee,
      total_amount: req.body.total_amount,
      country: req.body.country,
      user_id: req.user.id,
      status: "pending",
      created_at: new Date(),
      updated_at: new Date(),
    };

    const bankDetail = await BankDetail.addBankDetails(body);

    res.status(200).json({
      success: true,
      msg: "Bank Detailes added please wait for verification",
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

const getSingleBankDeposit = async (req, res, next) => {
  try {
    const deposit = await BankDetail.getBankDetailById(req.params.id);
    res.status(200).json({ sucess: true, data: deposit.rows[0] || {} });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

const bankDepositStatus = async (req, res, next) => {
  try {
    const bankDetail = (await BankDetail.getBankDetailById(req.params.id))
      .rows[0];

    if (!bankDetail) {
      return res
        .status(404)
        .json({ success: false, msg: "no bank details found" });
    }

    if (bankDetail.status === "approved") {
      return res.status(400).json({ success: false });
    }

    const { status } = req.body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false });
    }

    let updateField = {};
    let isApproved = false;

    if (status === "approved") {
      if (req.user.userType == "super-admin") {
        if (bankDetail.user1_approve) {
          updateField = {
            user2_approve: req.user.id,
            status: "approved",
          };
          isApproved = true;
        } else {
          updateField = {
            user1_approve: req.user.id,
            status: "approved",
          };
          isApproved = true;
        }
      } else {
        if (bankDetail.user1_approve) {
          updateField = {
            user2_approve: req.user.id,
            status: "approved",
          };
          isApproved = true;
        } else {
          updateField = {
            user1_approve: req.user.id,
          };
        }
      }

      if (isApproved) {
        await BankDetail.updateBankDetail(bankDetail.id, updateField);
        approveDeposit(bankDetail, req, res);
      } else {
        await BankDetail.updateBankDetail(bankDetail.id, updateField);
        await AuditLogs.saveLogs({
          action: "bank_transaction_approve",
          admin: req.user.id,
          user_id: bankDetail.user_id,
          created_at: new Date(),
          updated_at: new Date(),
        });
        res
          .status(200)
          .json({ success: true, msg: "your conscience added successfully." });
      }
    } else {
      await BankDetail.updateBankDetail(bankDetail.id, { status });
      await AuditLogs.saveLogs({
        action: "bank_transaction_reject",
        admin: req.user.id,
        user_id: bankDetail.user_id,
        created_at: new Date(),
        updated_at: new Date(),
      });
      res
        .status(200)
        .json({ success: true, msg: "your conscience added successfully." });
    }
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

const approveDeposit = async (bankDetail, req, res) => {
  const wallet = (await Wallet.getWalletByUser(bankDetail.user_id)).rows[0];

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
    fiat_balances += bankDetail.transfer_amount;
    await Wallet.updateWallet(wallet.id, { fiat_balances });
  }

  const transaction = {
    user_id: bankDetail.user_id,
    amount: bankDetail.transfer_amount,
    currency: bankDetail.currency,
    transaction_status: "approved",
    created_at: new Date(),
    updated_at: new Date(),
  };

  await AuditLogs.saveLogs({
    action: "bank_transaction_approve",
    admin: req.user.id,
    user_id: bankDetail.user_id,
    created_at: new Date(),
    updated_at: new Date(),
  });

  await fiatTransaction.saveFiatTransaction(transaction);

  res
    .status(200)
    .json({ success: true, msg: "transaction completed successfully." });
};

const getAllFiatTransactions = async (req, res, next) => {
  try {
    const transactions = (
      await fiatTransaction.findAllFiatTransactions(req.query)
    ).rows;
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const getFiatTransactionsByUser = async (req, res, next) => {
  try {
    const transactions = (
      await fiatTransaction.findTransactionByUser(req.user.id)
    ).rows;
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

module.exports = {
  addBankDetail,
  getAllBankDeposits,
  bankDepositStatus,
  getSingleBankDeposit,
  getAllFiatTransactions,
  getFiatTransactionsByUser,
};
