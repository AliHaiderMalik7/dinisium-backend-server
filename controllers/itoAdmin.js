const DB = require('../model/DB');
const jwt = require('jsonwebtoken');
const config = require('../config/configBasic');
// const ITOAdmin = require("../model/itoAdmin");
const UserAuth = require('../model/userAuth');
const Wallet = require('../model/wallet');
const Users = require('../model/Users');
const KYC = require('../model/KYC');
const ITO = require('../model/ITO');
const verificationToken = require('generate-sms-verification-code');
const generatePassword = require('../helper/generatepassword');
const bcrypt = require('bcrypt');
const sendEmail = require('../helper/sendEmail');
const crypto = require('crypto');
const client = DB.pool;
const AuditLogs = require('../model/auditLogs');
const { createWallet } = require('../helper/blockchain');
const allotedIto = require('../model/allotedItos');

const create = async (req, res, next) => {
  try {
    if (
      !isNaN(parseInt(req.body.fname, 10)) ||
      !isNaN(parseInt(req.body.lname, 10))
    ) {
      return res.status(400).send({ msg: 'Name cannot start with numbers' });
    }

    req.query.email = req.body.email;

    let body = { ...req.body };

    const userExist = await UserAuth.userExists(DB.pool, body.email);

    if (userExist) {
      return res
        .status(409)
        .json({ success: false, msg: `Email already exists` });
    }

    //  req.body.role = "admin";
    //  let role = req.body.role;
    body.role = 'admin';
    body.created_at = new Date();
    body.updated_at = new Date();

    const password = generatePassword();

    let newVerificationToken = verificationToken(6, {
      type: 'number',
    }).toString();

    let encryptedToken = await jwt.sign(
      newVerificationToken,
      config.jwt.secret,
    );

    const output = `Hi ${body.fname + ' ' + body.lname},<br/> 
         Thanks for registering! <br/><br/> 
         Your password for login is ${password} <br/><br/>
         Click on this for login <a href = ${
           config.server_url
         }auth/signin> Login.
         `;

    let mailOptions = {
      from: config.mailTrap.fromEmail,
      to: req.body.email,
      subject: `Thank you for register`,
      text: `Account Details for the new user Email ${body.email}`,
      html: output,
    };

    const encryptrdPassword = await bcrypt.hash(password, 10);

    const { fname, lname, email, contact_no, country, role } = body;

    // if (role === "sub-admin") {
    //   ito_id = req.user.ito;
    // }

    const is_email_verified = true;

    await client.query('BEGIN');

    const user = await UserAuth.registerUser(
      DB.pool,
      fname,
      lname,
      email,
      contact_no,
      country,
      encryptrdPassword,
      role,
      encryptedToken,
      is_email_verified,
    );

    // const walletDetail = await createWallet();
    // if (walletDetail) {
    //   await Wallet.createWallet({
    //     user_id: user.id,
    //     fiat_balances: 0,
    //     tokens: 0,
    //     private_key: walletDetail.key,
    //     account_address: walletDetail.address,
    //     created_at: new Date(),
    //     updated_at: new Date(),
    //   });
    // }

    // if (role === "admin") {
    //   await AuditLogs.saveLogs({
    //     action: "add_subadmin_in_section_by_itoadmin",
    //     admin: req.user.id,
    //     user_id: user.id,
    //     created_at: new Date(),
    //     updated_at: new Date(),
    //   });
    // }

    await client.query('COMMIT');

    await sendEmail(mailOptions);

    // delete user.rows[0].password;

    return res.status(200).json({
      success: true,
      // msg: `${
      //   role === 'sub-admin' ? 'Sub admin' : 'Admin'
      // } registered successfully`,

      msg: 'Email verification has successfully sent to your email address',
      // data:user.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, msg: error.message });
  }
};

const getAdmins = async (req, res, next) => {
  try {
    const admins = await Users.getAdminsList([
      // "id",
      'role',
      // "fname",
      // "lname",
      'email',
      'contact_no',
      'country',
      'is_number_verification_on',
      'is_email_verification_on',
      'is_google_authentication_on',
      'is_number_verified',
      'is_email_verified',
      'is_blocked',
      'created_at',
      'updated_at',
    ]);
    console.log('admins : ', admins);
    if (admins.rowCount > 0) {
      res.status(200).send({
        success: true,
        data: admins.rows,
      });
    } else {
      res.status(200).send({
        success: false,
        msg: 'No Admin record found.',
        data: [],
      });
    }

    return res.status(200).json({ success: true, data: admins.rows });
  } catch (error) {
    return res.status(400).send({ msg: error.message });
  }
};

const getAdmin = async (req, res, next) => {
  try {
    let ito = null;
    const admin = await Users.getAdminDetail(
      [
        // "id",
        'role',
        // "fname",
        // "lname",
        'email',
        'contact_no',
        'country',
        'is_number_verification_on',
        'is_email_verification_on',
        'is_google_authentication_on',
        'is_number_verified',
        'is_email_verified',
        'is_blocked',
        'created_at',
        'updated_at',
      ],
      req.params.id,
    );
    // console.log(admin.rows);
    // let data = { ...(admin.rows || {}) };
    // console.log("data: ", data);
    // if (admin.rows && admin.rows[0] && admin.rows[0].role === "sub-admin") {
    //   const userPermissions = (
    //     await Users.findUserPermissions(admin.rows[0].id)
    //   ).rows;
    //   // console.log('user permissions : ', userPermissions);
    //   data["permissions"] = userPermissions;
    // }

    console.log('admin here : ', admin.rows[0]);
    if (admin.rows[0]) {
      console.log('admin rows exits ');
      ito = await Users.getItoDetailOfAdmin(admin.rows[0].id);
    } else {
      return res.status(200).json({
        success: false,
        msg: 'Admin does not exists.',
        data: [],
      });
    }
    console.log('ITO here : ', ito);

    if (admin.rowCount > 0 && ito.rowCount > 0) {
      return res.status(200).json({
        success: true,
        data: { admin: admin.rows[0], itos: ito.rows },
      });
    }
    if (admin.rowCount > 0) {
      return res.status(200).json({
        success: true,
        data: { admin: admin.rows[0] },
      });
    } else {
      return res.status(200).json({
        success: false,
        msg: 'No data found.',
        data: [],
      });
    }
  } catch (error) {
    return res.status(400).send({ msg: error.message });
  }
};

// const blockUnblockAdmin = async (req, res, next) => {
//   try {
//     delete [req.body.ito_id];

//     if (!Object.keys(req.body).length) {
//       return res
//         .status(400)
//         .json({ success: false, msg: "No fields to update" });
//     }

//     const admin = await Users.getUserById(req.params.id);

//     if (!admin.rows.length) {
//       return res.status(404).json({
//         success: false,
//         msg: `no admin found with id ${req.params.id}`,
//       });
//     }

//     const adminUpdated = await Users.updateUser(req.body, req.params.id, [
//       "id",
//       "fname",
//       "lname",
//       "email",
//       "contact_no",
//       "country",
//     ]);

//     return res.status(200).json({
//       success: true,
//       data: adminUpdated.rows[0],
//       msg: "admin updated successfully",
//     });
//   } catch (error) {
//     return res.status(400).json({ msg: error.message });
//   }
// };

const blockUnblockAdmin = async (req, res, next) => {
  try {
    console.log(`DEBUG: Reached Request`);

    const userID = req.params.id;
    const status = req.body.status;
    console.log('status : ', status);
    const response = await Users.blockAdminById(DB.pool, userID, status);

    console.log('DEBUG: ', response);

    if (response.rowCount === 1) {
      return res.status(200).send({
        status: 200,
        message: `Admin ${
          req.body.status ? 'blocked' : 'unblocked'
        } successfuly`,
        response: response.rows,
      });
    } else {
      res.status(400).send({
        status: 400,
        message: 'No record found',
      });
    }
  } catch (error) {
    res.status(500).send({
      error: error,
      msg: 'Internal server error',
      success: false,
    });
  }
};

const assignITO = async (req, res, next) => {
  try {
    if (!req.body.ito_id) {
      return res.status(400).json({
        success: false,
        msg: `please add ito which you want to assign`,
      });
    }

    const admin = await Users.getUserById(req.params.id);

    if (!admin.rows.length) {
      return res.status(404).json({
        success: false,
        msg: `no admin found with id ${req.params.id}`,
      });
    }

    const ito = await ITO.getITOById(req.body.ito_id);
    if (!ito.rows.length) {
      return res.status(404).json({
        success: false,
        msg: `no ito found with id ${req.body.ito_id}`,
      });
    }

    await Users.assignITOToAdmin(req.params.id, req.body.ito_id);

    return res
      .status(200)
      .json({ success: true, msg: 'ito has assigned to admin successfully' });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: error.message });
  }
};

const itoToLink = async (req, res) => {
  try {
    const userId = req.params.id;
    let getIto = null;
    const admin = await Users.getAdminDetail(
      [
        'role',
        'email',
        'contact_no',
        'country',
        'is_number_verification_on',
        'is_email_verification_on',
        'is_google_authentication_on',
        'is_number_verified',
        'is_email_verified',
        'is_blocked',
        'created_at',
        'updated_at',
      ],
      userId,
    );
    console.log('admin: ========', admin);
    if (admin && admin.rows[0]) {
      getIto = await allotedIto.getItoToLink(DB.pool, userId);
      console.log('toLink ITOs : ', getIto);
    } else {
      return res.status(200).send({
        success: false,
        msg: `Admin with this ID doesn't exists!`,
        data: [],
      });
    }
    if (getIto.rowCount > 0) {
      return res.status(200).send({
        success: true,
        data: getIto.rows,
      });
    } else {
      return res.status(200).send({
        success: false,
        msg: `No ITO's found to be linked`,
        data: [],
      });
    }
  } catch (error) {
    return res.status(400).send({
      msg: error.message,
    });
  }
};

const itoUnlink = async (req, res) => {
  try {
    const { id, itoId } = req.params;
    await Users.removeAdminITO(id, itoId);
    return res
      .status(200)
      .json({ success: true, msg: 'Ito unlink successfully' });
  } catch (error) {
    return res.status(400).send({ msg: error.message });
  }
};

const itoToLinkWith = async (req, res) => {
  try {
    let response = null;
    const userId = req.params.id;
    const itoId = req.params.tid;
    const admin = await Users.getAdminDetail(
      [
        'role',
        'email',
        'contact_no',
        'country',
        'is_number_verification_on',
        'is_email_verification_on',
        'is_google_authentication_on',
        'is_number_verified',
        'is_email_verified',
        'is_blocked',
        'created_at',
        'updated_at',
      ],
      userId,
    );

    // const response = await allotedIto.checkLink(DB.pool, userId, itoId);

    const ito = await ITO.getITOById(itoId);
    console.log(ito);

    if (admin && admin.rows[0] && ito && ito.rows[0]) {
      response = await allotedIto.checkLink(DB.pool, userId, itoId);
      console.log('RESPONSE : ', response);
    } else {
      return res.status(200).send({
        success: false,
        msg: `Admin or Token is not valid`,
        data: [],
      });
    }
    if (response.rowCount === 0) {
      const getIto = await allotedIto.ItoToLinkWith(DB.pool, userId, itoId);
      console.log('toLink ITOs : ', getIto);
      if (getIto.rowCount > 0) {
        return res.status(200).send({
          success: true,
          msg: 'Admin and Token are now linked.',
          data: getIto.rows,
        });
      } else {
        return res.status(200).send({
          success: false,
          msg: `Could'nt link Admin with the Token.`,
          data: [],
        });
      }
    } else {
      return res.status(200).send({
        success: false,
        msg: `Could'nt link with the ITO.`,
        data: [],
      });
    }
  } catch (error) {
    return res.status(400).send({
      msg: error.message,
    });
  }
};

const deleteAdmin = async (req, res, next) => {
  try {
    const admin = await Users.getUserById(req.params.id);
    if (!admin.rows.length) {
      return res.status(400).json({
        success: false,
        msg: `no admin found with id ${req.params.id}`,
      });
    }
    await Users.deleteUser(req.params.id);
    return res
      .status(200)
      .json({ success: true, msg: 'admin deleted successfully' });
  } catch (error) {
    return res.status(400).send({ msg: error.message });
  }
};

const createAdminPermissions = async (req, res, next) => {
  try {
    const { permissions, sub_admin } = req.body;

    const userPermissions = (await Users.findUserPermissions(sub_admin)).rows;

    if (userPermissions.length) {
      await Users.deleteUserPermissions(sub_admin);
    }

    if (!Array.isArray(permissions) || !permissions.length) {
      return res
        .status(403)
        .json({ success: false, msg: 'invalid permissions detail' });
    }

    const user = (await Users.getUserById(sub_admin)).rows[0];

    if (!user || user.role !== 'sub-admin' || !user.ito_id) {
      return res.status(403).json({
        success: false,
        msg: 'user detail not found or user is not sub admin',
      });
    }

    await Users.saveAdminPermissions(user.id, permissions);

    res
      .status(200)
      .json({ success: true, msg: 'user permissions added successfully' });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

const getPermissions = async (req, res, next) => {
  try {
    const permissions = (await Users.findAllPermissions()).rows;
    res.status(200).json({ success: true, data: permissions });
  } catch (error) {
    res.status(500).send({ success: false, msg: error.message });
  }
};

const getAdminPermissions = async (req, res, next) => {
  try {
    // const permissions = (await Users.)
  } catch (error) {}
};

module.exports = {
  create,
  blockUnblockAdmin,
  getAdmins,
  getAdmin,
  deleteAdmin,
  assignITO,
  itoToLink,
  itoToLinkWith,
  getPermissions,
  createAdminPermissions,
  itoUnlink,
};
