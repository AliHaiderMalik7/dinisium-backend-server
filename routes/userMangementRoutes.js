const express = require("express");
const router = express.Router();
const UserManagement = require("../controllers/userManagement");
const middleware = require("../middlewares/authMiddleware");
const userManagement = require("../controllers/userManagement");

//Get Admins with no assigned ITO yet
router.get("/admins/no_ito_assigned", userManagement.getNoItoAssignedAdmin);

//Get list of all users
router.get(
  "/getAllUers",
  middleware.auth(["admin", "super-admin"]),
  UserManagement.getAllInvestors
);

//Get profile details of users by id
router.get("/getProfile", middleware.auth(), UserManagement.getUserProfileById);

//Block users by id
router.put("/blockUser/:id", middleware.auth(), UserManagement.blockUserById);

// Get current logged in user
router.get(
  "/users/me",
  middleware.auth(),
  UserManagement.getCurrentLoggedInUser
);

// Get current logged in admin
router.get(
  "/admin/me",
  middleware.auth(),
  UserManagement.getCurrentLoggedInAdmin
);

router.put("/users/:id", middleware.auth(), UserManagement.editUser);

// Delete user

router.delete("/users/:id", middleware.auth(), UserManagement.deleteUser);

module.exports = router;
