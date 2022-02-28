const express = require("express");
const router = express.Router();
const validationMiddleware = require("../middlewares/validationMiddlewares");
const middleware = require("../middlewares/authMiddleware");
const wallet = require("../controllers/paypal");

router.route("/wallet/deposit/paypal")
      .post(middleware.auth(),wallet.depositViaPaypal)
router.route("/wallet/payment/process")
      .get(wallet.processPay)
router.route("/wallet/payment/cancell")
      .get(wallet.cancelPay)
                       



module.exports = router;