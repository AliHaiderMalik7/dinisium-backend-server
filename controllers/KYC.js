const DB = require("../model/DB");
const kycModel = require("../model/KYC");
const config = require("../config/configBasic");
const _ = require("lodash");
const fs = require("fs");

const getKYC = async (req, res) => {
  const userId = req.query.userId;
  const response = await kycModel.getUserKYC(DB.pool, userId);

  if (response.rowCount > 0) {
    return res.status(200).send({
      base_url: config.base_url,
      success: true,
      data: response.rows[0],
    });
  } else {
    return res.status(400).send({
      msg: "Bad Request",
      success: false,
    });
  }
};

const getKYCOfLoggedInUser = async (req, res) => {
  const userId = req.user.id;
  const response = await kycModel.getUserKYC(DB.pool, userId);

  if (response.rowCount > 0) {
    return res.status(200).send({
      base_url: config.base_url,
      success: true,
      data: response.rows[0],
    });
  } else {
    return res.status(400).send({
      msg: "Bad Request",
      success: false,
    });
  }
};

const getKYCById = async (req, res) => {
  const kycId = req.params.id;
  const response = await kycModel.getKYCById(DB.pool, kycId);

  if (response.rowCount > 0) {
    return res.status(200).send({
      base_url: config.base_url,
      success: true,
      data: response.rows[0],
    });
  } else {
    return res.status(400).send({
      msg: "Bad Request",
      success: false,
    });
  }
};

const getKYCbyStatus = async (req, res) => {
  const status = req.query.status;
  const response = await kycModel.getKYCListbyStatus(DB.pool, status);
  if (response.rows.length >= 0) {
    return res.status(200).send({
      base_url: config.base_url,
      success: true,
      data: response.rows,
    });
  } else {
    return res.status(400).send({
      msg: "Bad Request",
      success: false,
    });
  }
};

const createKYC = async (req, res) => {
  console.log("REQ BODY ==================== : ", req.body);
  console.log("REQ files ==================== : ", req.files);

  const KYCData = JSON.parse(JSON.stringify(req.body));

  let files;
  if (req.files) {
    files = JSON.parse(JSON.stringify(req.files));
  }
  console.log("KYCData ======================= : ", KYCData);
  console.log("FILES ======================= : ", files);

  if (
    ("[object Object]" == req.body.document && _.isEmpty(req.files.document)) ||
    ("[object Object]" == req.body.personalPhoto &&
      _.isEmpty(req.files.personalPhoto)) ||
    ("[object Object]" == req.body.licensePhoto &&
      _.isEmpty(req.files.licensePhoto))
  ) {
    return res.status(400).send({
      msg: "Personal Photo, License Photo and Other Documents are mandatory",
      success: false,
    });
  }

  if (files?.document) {
    KYCData.document = files.document[0].path.substring(7);
  }
  if (files?.personalPhoto) {
    KYCData.personalPhoto = files.personalPhoto[0].path.substring(7);
  }
  if (files?.licensePhoto) {
    KYCData.licensePhoto = files.licensePhoto[0].path.substring(7);
  }
  KYCData.kycStatus = "pending";
  const userKyc = (await kycModel.getUserKYC(DB.pool, req.user.id)).rows[0];
  let KYCResponse = null;

  if (
    userKyc &&
    ["approved", "pending", "single-approved"].includes(userKyc.kyc_status)
  ) {
    return res.status(400).json({
      success: false,
      msg: `Your request is ${userKyc.kyc_status}`,
    });
  }

  if (userKyc && userKyc.kyc_status === "rejected") {
    const licencePhotoPath = `public/images/${userKyc.license_photo.substring(
      7
    )}`;
    const personalPhotoPath = `public/images/${userKyc.personal_photo.substring(
      7
    )}`;
    const documentPhotoPath = `public/images/${userKyc.other_document.substring(
      7
    )}`;
    if (fs.existsSync(licencePhotoPath)) fs.unlinkSync(licencePhotoPath);
    if (fs.existsSync(personalPhotoPath)) fs.unlinkSync(personalPhotoPath);
    if (fs.existsSync(documentPhotoPath)) fs.unlinkSync(documentPhotoPath);

    KYCResponse = await kycModel.updateUserKyc(DB.pool, req.user.id, {
      full_name: KYCData.fullName,
      nationality: KYCData.nationality,
      dob: KYCData.dob,
      permanent_address: KYCData.permanentAddress,
      city: KYCData.city,
      state_or_province: KYCData.state,
      country: KYCData.country,
      personal_photo: KYCData.personalPhoto,
      license_photo: KYCData.licensePhoto,
      other_document: KYCData.document,
      kyc_status: KYCData.kycStatus,
      admin_one: null,
      admin_two: null,
      bank_name: KYCData.bankName,
      swift: KYCData.swift,
      account_number: KYCData.accountNumber,
      account_title: KYCData.accountTitle,
    });
  } else {
    KYCResponse = await kycModel.createKYC(
      DB.pool,
      KYCData.userId,
      KYCData.fullName,
      KYCData.nationality,
      KYCData.dob,
      KYCData.permanentAddress,
      KYCData.city,
      KYCData.state,
      KYCData.country,
      KYCData.personalPhoto,
      KYCData.licensePhoto,
      KYCData.document,
      KYCData.kycStatus,
      KYCData.bankName,
      KYCData.swift,
      KYCData.accountNumber,
      KYCData.accountTitle
    );
  }

  if (KYCResponse.rows?.length > 0) {
    return res.status(200).send({
      msg: "KYC information submitted.",
      success: true,
    });
  } else {
    return res.status(400).send({
      error: KYCResponse,
      msg: "Bad Request - KYC submission failed",
      success: false,
    });
  }
};

const updateKYCstatus = async (req, res) => {
  const userId = req.body.userId;
  let status = req.body.status;
  const rejectionMessage = req.body.rejectionMessage;
  let adminId = req.user.id;
  let response = (await kycModel.getUserKYC(DB.pool, userId)).rows[0];

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).send({
      msg: "Status can only be approved or rejected.",
    });
  }

  if (status === "rejected" && !rejectionMessage) {
    return res.status(400).send({
      msg: "Rejection reason is required",
    });
  }

  if (!response) {
    return res.status(404).send({
      msg: `KYC of this user doesn't exist.`,
    });
  }

  if (["approved", "rejected"].includes(response.kyc_status)) {
    return res.status(409).send({
      msg: `Status already ${response.kyc_status}`,
    });
  }

  if (response.admin_one === req.user.id) {
    return res.status(403).send({
      msg: `You have already approved the request, not allowed to approve again.`,
    });
  }

  if (response.admin_one && response.kyc_status !== "rejected") {
    let resultAdminTwoApprove = await kycModel.adminTwoApprove(
      DB.pool,
      userId,
      adminId,
      status,
      rejectionMessage
    );
    if (resultAdminTwoApprove.rowCount > 0) {
      return res.status(200).send({
        msg: `User KYC has been '${status}'.`,
        success: true,
      });
    } else {
      return res.status(400).send({
        error: resultAdminTwoApprove,
        msg: "Bad Request",
        success: false,
      });
    }
  } else {
    let resultAdminOneApprove = await kycModel.adminOneApprove(
      DB.pool,
      userId,
      adminId,
      status,
      rejectionMessage
    );
    if (resultAdminOneApprove.rowCount > 0) {
      return res.status(200).send({
        msg: `User KYC has been '${status}'.`,
        success: true,
      });
    } else {
      return res.status(400).send({
        error: resultAdminOneApprove,
        msg: "Bad Request",
        success: false,
      });
    }
  }
};

module.exports = {
  createKYC,
  getKYC,
  getKYCOfLoggedInUser,
  getKYCById,
  getKYCbyStatus,
  updateKYCstatus,
};
