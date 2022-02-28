const Withdraw = require("../model/withdrawReq");
const Wallet = require("../model/wallet");
const DB = require("../model/DB");
const KYC = require("../model/KYC");
const createWithdrawReq = async (req, res, next) => {
  try {
    console.log("current user ====>", req.user.id);

    const user_kyc = (await KYC.getUserKYC(DB.pool, req.user.id)).rows[0];

    req.body.created_at = new Date();
    req.body.updated_at = new Date();
    req.body.status = "pending";
    req.body.kyc_id = user_kyc.id;

    req.body.user_id = req.user.id;

    const data = (await Wallet.getWalletByUser(req.user.id)).rows[0];
    console.log(data);
    console.log(data.id);
    if (req.body.amount < 1 || isNaN(req.body.amount)) {
      return res.status(403).json({
        success: false,
        msg: `Can not process request with ${req.body.amount} `,
      });
    }
    if (data.fiat_balances < req.body.amount) {
      return res
        .status(403)
        .json({
          success: false,
          msg: "InSufficient Balance! Enter appropriate amount",
        });
    } else {
      let fiat_balances = data.fiat_balances - req.body.amount;
      let a = await Wallet.updateWallet(data.id, { fiat_balances });
      // console.log(a)
      let locked_amount = 0;
      locked_amount = data.locked_amount + parseInt(req.body.amount);
      await Wallet.updateWallet(data.id, { locked_amount });
      let abc = await Withdraw.createWithdraw(req.body);
      console.log("suceed", abc);
      res
        .status(200)
        .json({
          success: true,
          msg: "WithDraw Request Submitted Successfully",
        });
    }
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const getWithdrawReq = async (req, res, next) => {
  try {
    const data = req.params.status;
    console.log("Status is  ====>", data);
    const withdraw = await Withdraw.getWithdrawList(data);
    res.status(200).json({ success: true, data: withdraw.rows || [] });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

// getCurrentUserList
const getCurrentUserList = async (req, res, next) => {
  try {
    const withdraw = await Withdraw.getcurrentUserList(req.user.id);
    console.log(withdraw.rows);
    res.status(200).json({ success: true, data: withdraw.rows || [] });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const updateStatus = async (req, res, next) => {
  try {
    let adminId = req.user.id;
    const rejectionMessage = req.body.rejectionMessage;
    let status = req.body.status;
    const result = (await Withdraw.getDataByUser(req.params.id)).rows[0];
    console.log("Result is ====>", result);
    let user_id = result.user_id;

    const current_status = result.status;
    let withdraw_amount = result.amount;

    const wallet = (await Wallet.getWalletByUser(user_id)).rows[0];
    const user_balance = wallet.fiat_balances;
    console.log("user Wallet ====>", wallet);
    if (status === "rejected" && !rejectionMessage) {
      return res.status(400).send({
        msg: "Rejection reason is required",
      });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).send({
        msg: "Status can only be approved or rejected.",
      });
    }

    if (["approved", "rejected"].includes(current_status)) {
      return res.status(409).send({
        msg: `Status already ${current_status}`,
      });
    }

    if (result.admin_one === req.user.id) {
      return res.status(403).send({
        msg: `You have already approved the request, not allowed to approve again.`,
      });
    }

    if (result.admin_one && current_status !== "rejected") {
      let resultAdminTwoApprove = await Withdraw.adminTwoApprove(
        DB.pool,
        req.params.id,
        adminId,
        req.body.status,
        rejectionMessage
      );

      if (resultAdminTwoApprove.rowCount > 0) {
        if (req.body.status == "rejected") {
          let locked_amount = wallet.locked_amount - withdraw_amount;
          await Wallet.updateWallet(wallet.id, { locked_amount });

          let fiat_balances = wallet.fiat_balances + withdraw_amount;
          await Wallet.updateWallet(wallet.id, { fiat_balances });
        }
        // else{
        //   let locked_amount = wallet.locked_amount - withdraw_amount;
        //    await Wallet.updateWallet(wallet.id, { locked_amount })

        // }

        return res.status(200).send({
          msg: `User Withdraw Request has been '${status}'.`,
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
      let resultAdminOneApprove = await Withdraw.adminOneApprove(
        DB.pool,
        req.params.id,
        adminId,
        req.body.status,
        rejectionMessage
      );
      if (resultAdminOneApprove.rowCount > 0) {
        if (req.body.status == "rejected") {
          let locked_amount = wallet.locked_amount - withdraw_amount;
          await Wallet.updateWallet(wallet.id, { locked_amount });

          let fiat_balances = wallet.fiat_balances + withdraw_amount;
          await Wallet.updateWallet(wallet.id, { fiat_balances });
        }
        return res.status(200).send({
          msg: `User Withdraw request has been '${status}'.`,
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
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

module.exports = {
  createWithdrawReq,
  getWithdrawReq,
  updateStatus,
  getCurrentUserList,
};
