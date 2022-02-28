const DB = require("./DB");

async function createKYC(
  client,
  userId,
  fullName,
  nationality,
  dob,
  permanentAddress,
  city,
  state,
  country,
  personal_photo,
  license_photo,
  other_document,
  kycStatus,
  bankName,
  swift,
  accountNumber,
  accountTitle
) {
  try {
    const now = new Date();
    let response = await DB.insertIntoQueryWithClient(
      client,
      DB.tables.kycTable,
      {
        user_id: userId,
        full_name: fullName,
        nationality: nationality,
        dob: dob,
        permanent_address: permanentAddress,
        city: city,
        state_or_province: state,
        country: country,
        personal_photo: personal_photo,
        license_photo: license_photo,
        other_document: other_document,
        kyc_status: kycStatus,
        created_at: new Date(),
        updated_at: new Date(),
        bank_name: bankName,
        swift: swift,
        account_number: accountNumber,
        account_title: accountTitle
      },
      ["id"]
    );
    return response;
  } catch (e) {
    return e.message;
  }
}

async function getUserKYC(client, userId) {
  return new Promise(function (resolve, reject) {
    client.query(
      `SELECT * from ${DB.tables.kycTable} WHERE user_id = '${userId}'`,
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

async function getKYCById(client, kycId) {
  return new Promise(function (resolve, reject) {
    client.query(
      `SELECT * from ${DB.tables.kycTable} WHERE id = ${kycId}`,
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

async function getKYCListbyStatus(client, status) {
  return new Promise(function (resolve, reject) {
    client.query(
      `SELECT * from ${DB.tables.kycTable} WHERE kyc_status = '${status}'`,
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

async function adminOneApprove(
  client,
  userId,
  adminId,
  status,
  rejectionMessage
) {
  return new Promise(function (resolve, reject) {
    let statusTemp = status === "approved" ? "single_approved" : "rejected";
    client.query(
      `UPDATE ${DB.tables.kycTable} SET admin_one = '${adminId}', kyc_status = '${statusTemp}', rejection_message = '${rejectionMessage}'  WHERE user_id = '${userId}'`,
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

const updateUserKyc = async function (client, userId, fields) {
  try {
    const colunms = Object.keys(fields);

    const keysToUpdate = colunms.reduce((acc, field, index) => {
      acc += `${field}= ${
        typeof fields[field] === "string" ? `'${fields[field]}'` : fields[field]
      }`;

      return index + 1 === colunms.length ? acc + "" : acc + ", ";
    }, "");

    let queryStr = `UPDATE ${DB.tables.kycTable} SET ${keysToUpdate} WHERE user_id = ${userId}`;
    queryStr += ` returning id`;

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

async function adminTwoApprove(
  client,
  userId,
  adminId,
  status,
  rejectionMessage
) {
  return new Promise(function (resolve, reject) {
    client.query(
      `UPDATE ${DB.tables.kycTable} SET admin_two = '${adminId}' , kyc_status = '${status}', rejection_message = '${rejectionMessage}' WHERE user_id = '${userId}'`,
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

async function superAdminApprove(
  client,
  userId,
  status,
  adminId,
  rejectionMessage
) {
  return new Promise(function (resolve, reject) {
    client.query(
      `UPDATE ${DB.tables.kycTable} SET admin_two = '${adminId}', kyc_status = '${status}', rejection_message = '${rejectionMessage}'  WHERE user_id = '${userId}'`,
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

module.exports = {
  createKYC,
  getUserKYC,
  getKYCById,
  adminOneApprove,
  adminTwoApprove,
  superAdminApprove,
  getKYCListbyStatus,
  updateUserKyc,
};
