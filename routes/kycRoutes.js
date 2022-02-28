const express = require("express");
const KYCController = require("../controllers/KYC");
const validationMiddleware = require("../middlewares/validationMiddlewares");
const files = require("../middlewares/files");
const middleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.post(
  "/add/kyc",
  middleware.auth("user"),
  files([
    { name: "personalPhoto", maxCount: 1 },
    { name: "licensePhoto", maxCount: 1 },
    { name: "document", maxCount: 1 },
  ]),
  validationMiddleware.kyc,
  KYCController.createKYC
);
router.put(
  "/update/kyc/status",
  middleware.auth(["admin", "super-admin"]),
  KYCController.updateKYCstatus
);
router.get(
  "/kyc",
  middleware.auth(["admin", "super-admin"]),
  KYCController.getKYC
);
router.get(
  "/kyc/loggedIn-user",
  middleware.auth(["user"]),
  KYCController.getKYCOfLoggedInUser
);
router.get(
  "/kyc/status",
  middleware.auth(["admin", "super-admin"]),
  KYCController.getKYCbyStatus
);
router.get(
  "/kyc/:id",
  middleware.auth(["admin", "super-admin"]),
  KYCController.getKYCById
);

module.exports = router;
