const express = require("express");
const router = express.Router();
const validationMiddleware = require("../middlewares/validationMiddlewares");
const middleware = require("../middlewares/authMiddleware");
const admin = require("../controllers/itoAdmin");

router
  .route("/admins")
  .post(
    middleware.auth(["super-admin"]),
    ...validationMiddleware.adminRegister,
    admin.create,
  );

router
  .route("/admins/get/all")
  .get(middleware.auth(["super-admin"]), admin.getAdmins);

router
  .route("/admins/:id")
  .put(middleware.auth(["super-admin"]), admin.blockUnblockAdmin)
  .get(middleware.auth(["super-admin", "admin"]), admin.getAdmin)
  .delete(middleware.auth(["super-admin", "admin"]), admin.deleteAdmin);

router
  .route("/admins/:id/addITO")
  .put(middleware.auth(["super-admin"]), admin.assignITO);

router
  .route("/admins/:id/ito/tolink")
  .get(middleware.auth(["super-admin"]), admin.itoToLink);

router
  .route("/admins/:id/ito/tolinkWith/:tid")
  .post(middleware.auth(["super-admin"]), admin.itoToLinkWith);

router
  .route("/admins/:id/ito/tolink/:itoId")
  .delete(middleware.auth(["super-admin"]), admin.itoUnlink);

router
  .route("/admins/user/permissions")
  .post(
    middleware.auth(["admin"]),
    ...validationMiddleware.assingPermission,
    admin.createAdminPermissions,
  );

router
  .route("/admins/permissions/all")
  .get(middleware.auth("admin"), admin.getPermissions);

module.exports = router;
