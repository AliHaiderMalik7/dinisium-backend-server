const DB = require('../model/DB');
const dinisiumAccountsModel = require('../model/bankAccountDetails');
const config = require('../config/configBasic');
const fs = require('fs');

const getAllAccounts = async (req, res) => {
  try {
    const response = await dinisiumAccountsModel.getAllAccounts(DB.pool);

    if (response.rowCount > 0) {
      return res.status(200).send({
        base_url: config.base_url,
        success: true,
        data: response.rows,
      });
    } else {
      return res.status(400).send({
        msg: 'Bad Request',
        success: false,
      });
    }
  } catch (error) {
    return res.status(500).send({
      msg: 'Internal server error',
      success: false,
    });
  }
};

// const getCurrentUserAccount = async (req, res, next) => {
//  try {
//   const data = req.user.id;
//   console.log("data to be fetched  ====>", data);
//   const response = await Withdraw.getCurrentUserAccount(data);
//   res.status(200).json({ success: true, data: response.rows || [] });
//  } catch (error) {
//   res.status(500).json({ success: false, msg: error.message });
//  }
// };

//get Super-admin account details
const getAccountDetails = async (req, res) => {
  console.log('hello world here');
  const response = await dinisiumAccountsModel.getAccountDetails(DB.pool);
  if (response.rowCount > 0) {
    return res.status(200).send({
      // base_url: config.base_url,
      success: true,
      data: response.rows[0],
    });
  } else {
    return res.status(400).send({
      msg: 'Bank details not found',
      success: false,
    });
  }
};

const getAccountById = async (req, res) => {
  try {
    const id = req.user.id;
    const response = await dinisiumAccountsModel.geAccountById(DB.pool, id);

    if (response.rowCount > 0) {
      return res.status(200).send({
        // base_url: config.base_url,
        success: true,
        data: response.rows[0],
      });
    } else {
      return res.status(400).send({
        msg: 'Bank details not found',
        success: false,
      });
    }
  } catch (error) {
    return res.status(500).send({
      msg: 'Internal server error',
      success: false,
    });
  }
};

const getApprovedAccounts = async (req, res) => {
  try {
    const response = await dinisiumAccountsModel.getApprovedAccounts(DB.pool);
    if (response.rows.length >= 0) {
      return res.status(200).send({
        base_url: config.base_url,
        success: true,
        data: response.rows,
      });
    } else {
      return res.status(400).send({
        msg: 'Bad Request',
        success: false,
      });
    }
  } catch (error) {
    return res.status(500).send({
      msg: 'Internal server error',
      success: false,
    });
  }
};

const addBankAccountDetails = async (req, res) => {
  try {
    console.log('Hello myself__________');
    const { bankName, accountTitle, iban, swiftCode } = req.body;
    req.body.user_id = req.user.id;
    const response = await dinisiumAccountsModel.addBankAccountDetails(
      req.body,
    );

    console.log('Response from Api :===', response.rows);
    return res.status(200).send({
      msg: 'account details added successfully',
      success: true,
      data: response.rows,
    });
  } catch (error) {
    return res.status(500).send({
      msg: 'Internal server error',
      success: false,
      error: error.message,
    });
  }
};

//Update Account Details
const updateCurrentUserDetails = async (req, res, next) => {
  try {
    const id = req.user.id;
    console.log('data to be fetched  ====>', id);
    const response = await dinisiumAccountsModel.updateCurrentUserDetails(id, {
      bank_name: req.body.bank_name,
      account_title: req.body.account_title,
      iban: req.body.iban,
      swift_code: req.body.swift_code,
    });
    // console.log(response.rows[0]);
    res.status(200).json({ success: true, msg: 'Data Updated Successfully' });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};
module.exports = {
  //  getCurrentUserAccount,
  updateCurrentUserDetails,
  getAllAccounts,
  getAccountById,
  getAccountDetails,
  getApprovedAccounts,
  addBankAccountDetails,
};
