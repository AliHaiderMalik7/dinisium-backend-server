const express = require("express");
const router = express.Router();
const wallet = require("../controllers/wallet");
const validationMiddleware = require("../middlewares/validationMiddlewares");
const middleware = require("../middlewares/authMiddleware");

router.get("/wallets/:id", middleware.auth(), wallet.getWalletDetail);
router.get("/wallets/users/me", middleware.auth(), wallet.getCurrentUserWallet);
router.get("/wallets/list/accounts", middleware.auth(), wallet.getList);
router.get("/wallets/list/accounts/:id", middleware.auth(), wallet.getListByID);

module.exports = router;
