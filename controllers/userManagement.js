const DB = require("../model/DB");
const Users = require("../model/Users");
const Auth = require("../model/userAuth");
const Ito = require("../model/ITO");
const ITOtoken = require("../model/itoToken");
const Order = require("../model/exchangeOrders");
const getAllInvestors = async (req, res) => {
 try {
  // console.log("Req query is ",req.query)
  const response = await Users.getAllUsers(req.query);
  console.log(response.rows);
  if (response.rowCount !== 0) {
   return res.status(200).send({
    status: 200,
    message: "Response data of all investors",
    response: response.rows,
   });
  } else {
   res.status(200).send({
    status: 200,
    message: "No record found",
    response: [],
   });
  }
 } catch (error) {
  res.status(500).send({
   success: false,
   msg: "Internal server error",
  });
 }
};

const getUserProfileById = async (req, res) => {
 try {
  console.log(`DEBUG: Reached Request`);

  const userID = req.query.id;
  console.log("UserId is ==================", userID);
  const response = await Users.getUserProfileById(DB.pool, userID);

  console.log("User profile ======>", response.rows[0]);
  if (response.rowCount !== 0) {
   console.log(`DEBUG: Profile Details Of One User`);

   return res.send({
    status: 200,
    message: "Profile Details Of User",
    response: response.rows[0],
   });
  } else {
   // const data = await Order.getOrderById();
   res.status(400).send({
    status: 400,
    message: "No record found",
   });
  }
 } catch (error) {
  res.status(500).send({
   error: error,
   msg: "Internal server error",
   success: false,
  });
 }
};

const blockUserById = async (req, res) => {
 try {
  console.log(`DEBUG: Reached Request`);

  const userID = req.params.id;
  const status = req.body.status;
  const response = await Users.blockUserById(DB.pool, userID, status);

  // console.log("DEBUG: ", response);

  if (response.rowCount === 1) {
   return res.send({
    status: 200,
    message: `User ${req.body.status ? "blocked" : "unblocked"} successfuly`,
    response: response.rows,
   });
  } else {
   res.status(400).send({
    status: 400,
    message: "No record found",
   });
  }
 } catch (error) {
  res.status(500).send({
   error: error,
   msg: "Internal server error",
   success: false,
  });
 }
};

const getCurrentLoggedInUser = async (req, res) => {
 try {
  const user = (await Users.getUserById(req.user.id)).rows[0];
  if (user) delete user.password;
  res.status(200).json({ success: true, data: user || {} });
 } catch (error) {
  res.status(400).json({ success: false, msg: error.message });
 }
};

const getCurrentLoggedInAdmin = async (req, res) => {
 try {
  const user = (await Auth.getUsersDetailsById(DB.pool, req.user.id)).rows[0];
  if (user) delete user.password;

  let userDetails = {};

  res.status(200).json({
   success: true,
   data:
    {
     userDetails: {
      ...userDetails,
      ...user,
     },
    } || {},
  });
 } catch (error) {
  res.status(400).json({ success: false, msg: error.message });
 }
};

const deleteUser = async (req, res) => {
 try {
  const user = (await Users.getUserById(req.user.id)).rows[0];

  if (!user) {
   return res.status(404).json({
    success: false,
    msg: `no user found with id ${req.params.id}`,
   });
  }

  if (user.id === req.user.id) {
   return res
    .status(400)
    .json({ success: false, msg: "can not delete loggedin user" });
  }

  await Users.deleteUser(user.id);

  res.status(200).json({ success: true, msg: "user deleted successfully" });
 } catch (error) {
  res.status(400).json({ success: false, msg: error.message });
 }
};

const editUser = async (req, res) => {
 try {
  const keysToRemove = ["ito_id", "role"];

  keysToRemove.forEach((key) => {
   delete req.body[key];
  });

  if (!Object.keys(req.body).length) {
   return res.status(400).json({ success: false, msg: "No fields to update" });
  }

  const user = (await Users.getUserById(req.params.id)).rows[0];

  if (!user) {
   return res.status(400).json({
    success: false,
    msg: `No user found with id ${req.params.id}`,
   });
  }
  if (user) {
   delete user.kyc_status;
   delete user.personal_photo;
  }
  const returningkeys = Object.keys(user);

  const updateUser = (
   await Users.updateUser(req.params.id, req.body, returningkeys)
  ).rows[0];

  res.status(200).json({ success: true, data: updateUser });
 } catch (error) {
  res.status(400).json({ success: false, msg: error.message });
 }
};

const getNoItoAssignedAdmin = async (req, res) => {
 try {
  const users = (await Users.getAdminWithNoIto()).rows;

  res.status(200).json({ success: true, data: users || {} });
 } catch (error) {
  res.status(400).json({ success: false, msg: error.message });
 }
};

module.exports = {
 getAllInvestors,
 getUserProfileById,
 blockUserById,
 getCurrentLoggedInUser,
 getCurrentLoggedInAdmin,
 deleteUser,
 editUser,
 getNoItoAssignedAdmin,
};
