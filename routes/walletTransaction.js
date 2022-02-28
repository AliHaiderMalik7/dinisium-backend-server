const express = require("express");
const router = express.Router();
const walletTransaction = require("../controllers/walletTransactions");
const validationMiddleware = require("../middlewares/validationMiddlewares");
const middleware = require("../middlewares/authMiddleware");

router.get(
  "/wallet_transactions",
  middleware.auth(),
  walletTransaction.getTransactions
);
router.post(
  "/wallet_transactions",
  middleware.auth(),
   ...validationMiddleware.createWalletTransaction,
  walletTransaction.createWalletTransaction
);

module.exports = router;
