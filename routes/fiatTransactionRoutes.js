const express = require("express");
const router = express.Router();

const validationMiddleware = require("../middlewares/validationMiddlewares");
const middleware = require("../middlewares/authMiddleware");
const bankDetail = require("../controllers/bankDetail");
const upload = require("../middlewares/bank_draft");
const fiatTransaction = require("../controllers/fiatTransactrion");
const paypal = require("../controllers/paypal");

router
  .route("/fiat/add/bank")
  .post(
    middleware.auth(),
    upload.single("bank_draft"),
    ...validationMiddleware.createBankDetail,
    bankDetail.addBankDetail
  );
router
  .route("/fiat/add/paypal")
  .post(middleware.auth(), paypal.depositViaPaypal);
router.route("/fiat/payment/process").get(paypal.processPay);
router.route("/fiat/payment/cancel").get(paypal.cancelPay);
router.route("/fiat/payment/process/mobile").get(paypal.processPayMobile);
router.route("/fiat/payment/cancel/mobile").get(paypal.cancelPayMobile);
router
  .route("/fiat/deposits")
  .get(middleware.auth(), bankDetail.getAllBankDeposits);
router
  .route("/fiat/transactions/me")
  .get(middleware.auth(), fiatTransaction.getFiatTransactionsByUser);
router
  .route("/fiat/deposits/:id")
  .get(middleware.auth(), bankDetail.getSingleDeposit);
router
  .route("/fiat/deposits/pending/approved_1")
  .get(middleware.auth(), bankDetail.getSingleApproveDeposits);
router
  .route("/fiat/deposits/pending/approved_0")
  .get(middleware.auth(), bankDetail.getNotApprovedDeposits);
router
  .route("/fiat/deposits/:id/status")
  .put(
    middleware.auth(["super-admin", "admin", "sub-admin"]),
    ...validationMiddleware.approveFiatDeposit,
    bankDetail.depositStatus
  );

module.exports = router;
