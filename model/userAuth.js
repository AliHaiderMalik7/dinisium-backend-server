const DB = require("./DB");

async function registerUser(
  client,
  fname,
  lname,
  email,
  contact_no,
  country,
  password,
  role,
  sms_and_email_auth_token,
  is_email_verified
) {
  try {
    const now = new Date();
    let response = await DB.insertIntoQueryWithClient(
      client,
      DB.tables.usersTable,
      {
        fname: fname,
        lname: lname,
        email: email,
        contact_no: contact_no,
        country: country,
        password: password,
        role: role,
        password_reset_token: null,
        auth_token: null,
        sms_and_email_auth_token: sms_and_email_auth_token,
        is_number_verified: false,
        is_number_verification_on: false,
        is_email_verified: is_email_verified,
        is_email_verification_on: false,
        is_google_authentication_on: false,
        is_blocked: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      ["id"]
    );
    return response;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function userExists(client, email) {
  return new Promise(function (resolve, reject) {
    client.query(
      `SELECT * from ${DB.tables.usersTable} WHERE email = '${email}' `,
      function (error, result) {
        if (error) {
          reject(error);
          return;
        }
        if (result.rows.length > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    );
  });
}

async function isEmailVerified(client, email) {
  return new Promise(function (resolve, reject) {
    client.query(
      `SELECT * from ${DB.tables.usersTable} WHERE email = '${email}' and is_email_verified = true `,
      function (error, result) {
        if (error) {
          reject(error);
          return;
        }
        if (result.rows.length > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    );
  });
}

async function userLogin(client, email) {
  return new Promise(function (resolve, reject) {
    client.query(
      `SELECT t1.*,t2.id as wallet_id,t2.fiat_balances,t2.tokens,t3.kyc_status,t3.personal_photo 
             from ${DB.tables.usersTable} t1 LEFT JOIN ${DB.tables.walletTable} t2 
             ON t1.id = t2.user_id 
             LEFT JOIN ${DB.tables.kycTable} t3
             ON t1.id = t3.user_id
             WHERE t1.email = '${email}' `,
      function (error, result) {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );
  });
}

async function getUsersDetailsById(client, id) {
  return new Promise(function (resolve, reject) {
    client.query(
      `SELECT * from ${DB.tables.usersTable} as OU WHERE OU.id = '${id}' `,
      function (error, result) {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );
  });
}

async function getUsersDetailsByCode(client, code) {
  return new Promise(function (resolve, reject) {
    client.query(
      `SELECT * from ${DB.tables.usersTable} WHERE sms_and_email_auth_token = '${code}' `,
      function (error, result) {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );
  });
}

async function getUsersDetailsByResetCode(client, code) {
  return new Promise(function (resolve, reject) {
    client.query(
      `SELECT * from ${DB.tables.usersTable} WHERE password_reset_token = '${code}' `,
      function (error, result) {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );
  });
}

async function verifyEmail(client, id) {
  try {
    let response = await client.query(
      `UPDATE ${DB.tables.usersTable} SET is_email_verified = true WHERE id = ${id}`
    );
    return response;
  } catch (e) {
    return e.message;
  }
}

async function updateGoogleAuthToken(client, token, id) {
  try {
    let response = await client.query(
      `UPDATE ${DB.tables.usersTable} SET auth_token = '${token}' WHERE id = ${id}`
    );
    return response;
  } catch (e) {
    return e.message;
  }
}

async function updateSMSAndEmailCode(client, token, id) {
  try {
    let response = await client.query(
      `UPDATE ${DB.tables.usersTable} SET sms_and_email_auth_token = '${token}' WHERE id = ${id}`
    );
    return response;
  } catch (e) {
    return e.message;
  }
}

async function updateEmailVerificationStatus(client, status, id) {
  try {
    let response = await client.query(
      `UPDATE ${DB.tables.usersTable} SET is_email_verification_on = '${status}' WHERE id = ${id}`
    );
    return response;
  } catch (e) {
    return e.message;
  }
}

async function updateSMSVerificationStatus(client, status, id) {
  try {
    let response = await client.query(
      `UPDATE ${DB.tables.usersTable} SET is_number_verification_on = '${status}' WHERE id = ${id}`
    );
    return response;
  } catch (e) {
    return e.message;
  }
}

async function updateGoogleAuthStatus(client, status, id) {
  try {
    let response = await client.query(
      `UPDATE ${DB.tables.usersTable} SET is_google_authentication_on = '${status}' WHERE id = ${id}`
    );
    return response;
  } catch (e) {
    return e.message;
  }
}

async function updatePassword(client, password, id) {
  try {
    let response = await client.query(
      `UPDATE ${DB.tables.usersTable} SET password = '${password}' WHERE id = ${id}`
    );
    return response;
  } catch (e) {
    return e.message;
  }
}

async function resetPassword(client, token, email) {
  try {
    let response = await client.query(
      `UPDATE ${DB.tables.usersTable} SET password_reset_token = '${token}' WHERE email = '${email}'`
    );
    return response;
  } catch (e) {
    return e.message;
  }
}

module.exports = {
  userLogin,
  getUsersDetailsById,
  updateGoogleAuthToken,
  updateGoogleAuthStatus,
  updatePassword,
  updateEmailVerificationStatus,
  updateSMSVerificationStatus,
  updateSMSAndEmailCode,
  userExists,
  registerUser,
  getUsersDetailsByCode,
  verifyEmail,
  resetPassword,
  getUsersDetailsByResetCode,
  isEmailVerified,
};
