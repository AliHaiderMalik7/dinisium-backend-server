const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const DB = require('../model/DB');
const Auth = require('../model/userAuth');
const Users = require('../model/Users');
const Wallet = require('../model/wallet');
const Ito = require('../model/ITO');
const ITOtoken = require('../model/itoToken');
const config = require('../config/configBasic');
const verificationToken = require('generate-sms-verification-code');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const client = require('twilio')(
  config.twilio.accountSid,
  config.twilio.authToken,
);
const QRCode = require('qrcode');
var generator = require('generate-password');
const phoneToken = require('generate-sms-verification-code');
const sendEmail = require('../helper/sendEmail');
const Nexmo = require('nexmo');
const { createWallet } = require('../helper/blockchain');
const { Context } = require('express-validator/src/context');

const nexmo = new Nexmo(
  {
    apiKey: config.nexmo.apiKey,
    apiSecret: config.nexmo.apiSecret,
  },
  { debug: true },
);

const transport = nodemailer.createTransport({
  host: config.mailTrap.host,
  port: config.mailTrap.port,
  auth: {
    user: config.mailTrap.auth.user,
    pass: config.mailTrap.auth.pass,
  },
});

const userRegister = async (req, res) => {
  const investorData = req.body;
  try {
    if (
      !isNaN(parseInt(req.body.fname, 10)) ||
      !isNaN(parseInt(req.body.lname, 10))
    ) {
      return res.status(400).send({ msg: 'Name cannot start with numbers' });
    }

    if (await Auth.userExists(DB.pool, investorData.email)) {
      return res.status(409).send({ msg: 'User already exists!' });
    }

    const encryptedPassword = await bcrypt.hash(investorData.password, 10);

    let newVerificationToken = verificationToken(6, {
      type: 'number',
    }).toString();

    let role = 'user';

    let encryptedToken = await jwt.sign(
      newVerificationToken,
      config.jwt.secret,
    );

    const registerResponse = await Auth.registerUser(
      DB.pool,
      investorData.fname,
      investorData.lname,
      investorData.email,
      investorData.contact_no,
      investorData.country,
      encryptedPassword,
      role,
      encryptedToken,
    );

    if (registerResponse.rowCount === 1) {
      const output = `Hi ${investorData.fname},<br/> Thanks for registering! <br/><br/> Your email verification link is <a href = ${config.server_url}verifyemail/${encryptedToken}>${config.server_url}verifyemail/${encryptedToken}</a><br/><br/>`;
      let mailOptions = {
        from: config.mailTrap.fromEmail,
        to: investorData.email,
        subject: `Thank you for register`,
        text: `Account Details for the new user Email ${investorData.email}`,
        html: output,
      };

      console.log('mailOptions are .....', mailOptions);
      const data = await sendEmail(mailOptions);
      console.log('data ...', data);
      res.status(200).send({
        msg: 'Email sent Successfully. To Login, Please verify your email',
        success: true,
      });
    } else {
      return res.status(400).send({
        error: registerResponse,
        msg: 'Bad Request - Registration failed',
        success: false,
      });
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      msg: error.message,
      success: false,
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    let code = req.body.token;

    const user = (await Auth.getUsersDetailsByCode(DB.pool, code)).rows[0];
    if (user) {
      const response = await Auth.verifyEmail(DB.pool, user.id);
      if (response) {
        await Auth.verifyEmail(DB.pool, user.id);

        const walletDetail = await createWallet();

        if (walletDetail) {
          await Wallet.createWallet({
            user_id: user.id,
            fiat_balances: 0,
            tokens: 0,
            private_key: walletDetail.key,
            account_address: walletDetail.address,
            created_at: new Date(),
            updated_at: new Date(),
          });
        }
        userLoginResponse(user, res, 'Email verfied');
      } else {
        res.status(500).send({
          status: 403,
          msg: 'Invalid Auth Code, verification failed. Please verify the system Date and Time',
        });
      }
    } else {
      res.status(400).send({
        status: 403,
        msg: 'Invalid Auth Code, verification failed. Please verify the system Date and Time',
      });
    }
  } catch (error) {
    res.status(500).send({
      error: error,
      msg: error.message,
      success: false,
    });
  }
};

const userLogin = async (req, res) => {
  try {
    console.log('For login.......', req.body);
    const user = (await Auth.userLogin(DB.pool, req.body.email)).rows[0];

    if (!user) {
      return res.status(400).send({
        msg: `${req.body.email} is not a user`,
        success: false,
      });
    }

    if (user.role === 'sub-admin' && req.body.role === 'admin') {
      req.body.role = 'sub-admin';
    }

    if (user.role !== req.body.role) {
      return res.status(403).send({ success: false, msg: 'Permission Denied' });
    }

    if (!(await await Auth.isEmailVerified(DB.pool, req.body.email))) {
      return res.status(400).send({ msg: 'Email not verified' });
    }

    if (user.is_blocked) {
      return res.status(400).send({ msg: 'user has been blocked by admin.' });
    }

    bcrypt.compare(req.body.password, user.password, async (err, response) => {
      if (response) {
        if (user.is_email_verification_on) {
          var generatedToken = phoneToken(8, { type: 'string' });

          var mailOptions = {
            from: `"Example Team" ${config.mailTrap.fromEmail}`,
            to: user.email,
            subject: 'Dinisium Test',
            text: 'Hey there, it’s our first message sent with Dinisium ;) ',
            html: `<b>Hey there! </b><br> Your verification token is ${generatedToken}`,
          };

          // const salt = bcrypt.genSaltSync(config.jwt.saltRounds);

          const encryptedPassword = await bcrypt.hash(
            generatedToken,
            config.jwt.saltRounds,
          );

          transport.sendMail(mailOptions, async (error, info) => {
            if (error) {
              return res
                .status(501)
                .send({ status: 501, msg: 'Error in sending email' });
            }

            await Auth.updateSMSAndEmailCode(
              DB.pool,
              encryptedPassword,
              user.id,
            );
          });
          return res.status(200).send({
            status: 200,
            msg: 'Verification code sent to your email, Please verify to login',
            data: { authentication: 'email', id: user.id, email: user.email },
          });
        } else if (user.is_number_verification_on) {
          let number = user.contact_no;
          const response_sms = await client.verify
            .services(config.twilio.serviceId)
            .verifications.create({ to: number, channel: 'sms' });

          if (response_sms.status === 'pending') {
            return res.status(200).send({
              status: 200,
              msg: 'Verification code sent to your contact number, Please verify to login',
              data: {
                authentication: 'sms',
                id: user.id,
                contact_no: number,
              },
            });
          }
        } else if (user.is_google_authentication_on) {
          return res.status(200).send({
            status: 200,
            msg: 'Verification code required, Please verify to login',
            data: { authentication: 'google', id: user.id },
          });
        } else {
          delete user.password;
          userLoginResponse(user, res);
        }
      } else {
        return res.status(401).send({
          error: err,
          msg: 'Password is incorrect',
          success: false,
        });
      }
    });
  } catch (e) {
    res.status(500).send({
      success: false,
      msg: 'Internal server error',
    });
  }
};

const enable2FA = async (req, res) => {
  try {
    if (typeof req.body.status !== 'boolean') {
      return res.send({ msg: 'Invalid type' });
    }

    const investorUser = await Auth.getUsersDetailsById(DB.pool, req.user.id);

    const response = await Auth.updateGoogleAuthStatus(
      DB.pool,
      req.body.status,
      req.user.id,
    );

    if (response.rowCount === 1) {
      console.log(
        `DEBUG: Received TFA setup request====`,
        investorUser.rows[0].fname,
      );

      const secret = speakeasy.generateSecret({
        length: 10,
        name: investorUser.rows[0].fname,
        issuer: 'Dinisium v0.0',
      });

      var url = speakeasy.otpauthURL({
        secret: secret.base32,
        label: investorUser.rows[0].fname,
        issuer: 'Dinisium',
        encoding: 'base32',
      });

      QRCode.toDataURL(url, async (err, dataURL) => {
        let response = await Auth.updateGoogleAuthToken(
          DB.pool,
          secret.base32,
          req.user.id,
        );

        if (response.rowCount === 1) {
          return res.json({
            msg: 'TFA Auth needs to be verified',
            tempSecret: secret.base32,
            dataURL,
            tfaURL: secret.otpauth_url,
            data: {
              ...investorUser.rows[0],
              is_google_authentication_on: req.body.status,
            },
          });
        } else {
          return res.status(400).send({
            error: err,
            msg: 'Failed to enable 2fa',
            success: false,
          });
        }
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

const verifySMSAndEmailCode = async (req, res) => {
  try {
    console.log(`DEBUG: Received TFA Verify request`);
    const investorUser = await Auth.getUsersDetailsById(DB.pool, req.body.id);
    bcrypt.compare(
      req.body.token,
      investorUser.rows[0].sms_and_email_auth_token,
      async (err, response) => {
        console.log(`DEBUG: SMS TFA is verified`);

        if (response) {
          userLoginResponse(
            investorUser.rows[0],
            res,
            'SMS Two-factor Auth is verified',
          );
        } else {
          console.log(`ERROR: TFA is verified to be wrong`);

          res.status(400).send({
            status: 403,
            // msg:
            //   "Invalid Auth Code, verification failed. Please verify the system Date and Time",
            msg: 'Invalid verification code',
          });
        }
      },
    );
  } catch (error) {
    res.status(500).send({
      error: error,
      msg: error.message,
      success: false,
    });
  }
};

const verifySMSCode = async (req, res) => {
  try {
    const { code, id } = req.body;
    const getnumber = (await Auth.getUsersDetailsById(DB.pool, id)).rows[0];
    const result = await client.verify
      .services(config.twilio.serviceId)
      .verificationChecks.create({ to: getnumber.contact_no, code: code });

    if (result.status.toString() === 'approved') {
      const investorUser = (
        await Auth.getUsersDetailsById(DB.pool, req.body.id)
      ).rows[0];
      if (investorUser) {
        userLoginResponse(investorUser, res, 'SMS Code verified');
      } else {
        return res
          .status(401)
          .json({ success: false, msg: 'no user detail found' });
      }
    } else {
      return res.status(400).send({
        msg: 'Verfication is incorrect',
        success: false,
      });
    }
  } catch (error) {
    return res.status(500).send({
      error: error,
      msg: 'Internal server error',
      success: false,
    });
  }
};

const verify2FAtoken = async (req, res) => {
  try {
    console.log(`DEBUG: Received TFA Verify request`);
    const investorUser = await Auth.getUsersDetailsById(DB.pool, req.body.id);
    if (!investorUser.rows.length) {
      return res
        .status(200)
        .send({ status: 200, success: false, msg: 'User does not exist.' });
    }
    let isVerified = speakeasy.totp.verify({
      secret: investorUser.rows[0].auth_token,
      encoding: 'base32',
      token: req.body.token,
    });

    if (isVerified) {
      console.log(`DEBUG: TFA is verified to be enabled`);
      return userLoginResponse(
        investorUser.rows[0],
        res,
        'Two-factor Auth is verified successfully',
      );
    }

    console.log(`ERROR: TFA is verified to be wrong`);
    return res.status(500).send({
      status: 403,
      msg: 'Invalid Auth Code, verification failed. Please verify the system Date and Time',
    });
  } catch (error) {
    res.status(500).send({
      error: error,
      msg: 'Internal server error',
      success: false,
    });
  }
};

const updateGoogleAuthStatus = async (req, res) => {
  try {
    if (typeof req.body.status !== 'boolean') {
      return res.send({ msg: 'Invalid type' });
    }

    const userDetail = (await Auth.getUsersDetailsById(DB.pool, req.user.id))
      .rows[0];

    if (
      req.body.status &&
      (userDetail.is_email_verification_on ||
        userDetail.is_number_verification_on)
    ) {
      return res.status(403).json({
        success: false,
        msg: 'can not enable multiple authentications.',
      });
    }

    const response = await Auth.updateGoogleAuthStatus(
      DB.pool,
      req.body.status,
      req.user.id,
    );

    if (response.rowCount === 1) {
      return res.json({
        status: 200,
        msg: 'Two-factor Auth status updated',
        data: { ...userDetail, is_google_authentication_on: req.body.status },
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

const updatePassword = async (req, res) => {
  try {
    const investorUser = await Auth.getUsersDetailsById(DB.pool, req.user.id);

    bcrypt.compare(
      req.body.currentPassword,
      investorUser.rows[0].password,
      async (err, response) => {
        if (response) {
          const encryptedPassword = await bcrypt.hash(
            req.body.password,
            config.jwt.saltRounds,
          );
          const response = await Auth.updatePassword(
            DB.pool,
            encryptedPassword,
            investorUser.rows[0].id,
          );
          if (response.rowCount === 1) {
            // console.log(`DEBUG: Password updated`);

            return res.send({
              status: 200,
              msg: 'Password updated',
            });
          }

          return res.status(500).send({
            status: 500,
            msg: 'Internal server error',
          });
        } else
          return res.status(401).send({
            error: err,
            msg: 'Current password is incorrect',
            success: false,
          });
      },
    );
  } catch (error) {
    res.status(500).send({
      error: error,
      msg: 'Internal server error',
      success: false,
    });
  }
};

const updateEmailVerificationStatus = async (req, res) => {
  try {
    if (typeof req.body.status !== 'boolean') {
      return res.send({ msg: 'Invalid type' });
    }

    const userDetail = (await Auth.getUsersDetailsById(DB.pool, req.user.id))
      .rows[0];

    if (
      req.body.status &&
      (userDetail.is_google_authentication_on ||
        userDetail.is_number_verification_on)
    ) {
      return res.status(403).json({
        success: false,
        msg: 'can not enable multiple authentications.',
      });
    }

    const response = await Auth.updateEmailVerificationStatus(
      DB.pool,
      req.body.status,
      req.user.id,
    );

    if (response.rowCount === 1) {
      console.log(`DEBUG: Email Verification status updated`);

      return res.json({
        status: 200,
        msg: 'Email Verification status updated',
        data: { ...userDetail, is_email_verification_on: req.body.status },
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

const updateSMSVerificationStatus = async (req, res) => {
  try {
    if (typeof req.body.status !== 'boolean') {
      return res.send({ msg: 'Invalid type' });
    }

    const userDetail = (await Auth.getUsersDetailsById(DB.pool, req.user.id))
      .rows[0];

    if (
      req.body.status &&
      (userDetail.is_google_authentication_on ||
        userDetail.is_email_verification_on)
    ) {
      return res.status(403).json({
        success: false,
        msg: 'can not enable multiple authentications.',
      });
    }

    const response = await Auth.updateSMSVerificationStatus(
      DB.pool,
      req.body.status,
      req.user.id,
    );

    if (response.rowCount === 1) {
      console.log(`DEBUG: SMS Verification status updated`);

      return res.json({
        status: 200,
        msg: 'SMS Verification status updated',
        data: { ...userDetail, is_number_verification_on: req.body.status },
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

const forgotPassword = async (req, res) => {
  try {
    if (!(await Auth.userExists(DB.pool, req.body.email))) {
      return res.status(400).send({ msg: "User doesn't exists!" });
    }

    let generatedCode = generator.generate({
      length: 8,
      numbers: true,
    });

    let encryptedToken = await jwt.sign(generatedCode, config.jwt.secret);

    const response = await Auth.resetPassword(
      DB.pool,
      encryptedToken,
      req.body.email,
    );

    const output = `Hi,<br/> Your password reset link is ${config.server_url}auth/reset-password/${encryptedToken} <br/><br/>`;
    let mailOptions = {
      from: config.mailTrap.fromEmail,
      to: req.body.email,
      subject: `Pasword Reset`,
      html: output,
    };

    if (response.rowCount === 1) {
      console.log(`DEBUG: Password updated`);
      transport.sendMail(mailOptions, async (error, info) => {
        if (error) {
          return res
            .status(501)
            .send({ status: 501, msg: 'Error in sending email' });
        }
        console.log('Message sent: %s', info.messageId);
      });
      return res.send({
        status: 200,
        msg: 'Password reset Link to your email',
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      error: error,
      msg: 'Internal server error',
      success: false,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    let code = req.body.token;
    let newPassword = req.body.password;
    const investorUser = await Auth.getUsersDetailsByResetCode(DB.pool, code);
    if (investorUser.rows.length > 0) {
      const response = await Auth.updatePassword(
        DB.pool,
        await bcrypt.hash(newPassword, config.jwt.saltRounds),
        investorUser.rows[0].id,
      );
      if (response) {
        await Auth.verifyEmail(DB.pool, investorUser.rows[0].id);
        return res.status(200).send({
          status: 200,
          msg: 'Password reset successful',
        });
      } else {
        console.log(`ERROR: Reset token is verified to be wrong`);
        res.status(500).send({
          status: 403,
          msg: 'Invalid Auth Code, verification failed. Please verify the system Date and Time',
        });
      }
      ITOAssetDraft;
    } else {
      console.log(`ERROR: TFA is verified to be wrong`);
      res.status(500).send({
        status: 403,
        msg: 'Invalid Auth Code, verification failed. Please verify the system Date and Time',
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

const userLoginResponse = async (user, res, msg) => {
  try {
    let userDetails = {};

    if (user.role === 'sub-admin') {
      const permissions = (await Users.findUserPermissions(user.id)).rows;
      if (permissions && permissions.length) {
        userDetails['permissions'] = permissions.map(
          permission => permission.name,
        );
      } else {
        userDetails['permissions'] = [];
      }
    }

    return res.status(200).send({
      status: 200,
      msg: 'Succefully logged in',
      data: {
        userDetails: {
          ...userDetails,
          ...user,
        },
        token: jwt.sign(
          {
            id: user.id,
            email: user.email,
            ito: user.ito_id,
            userType: user.role,
          },
          config.jwt.secret,
        ),
        msg: msg,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

module.exports = {
  userRegister,
  userLogin,
  enable2FA,
  verify2FAtoken,
  updateGoogleAuthStatus,
  updatePassword,
  updateEmailVerificationStatus,
  updateSMSVerificationStatus,
  verifySMSAndEmailCode,
  verifySMSCode,
  forgotPassword,
  verifyEmail,
  resetPassword,
};
