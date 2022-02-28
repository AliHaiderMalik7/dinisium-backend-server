const DB = require('./DB');
const client = DB.pool;
// {"account_title" varchar(50),
// "iban" varchar(50),
// "swift_code" varchar(200),
// "bank_name" varchar(50),
// "verification_status" kyc_status}

async function addBankAccountDetails(
  //  client,
  //  userId,
  //  bankName,
  //  accountTitile,
  //  swiftCode,
  //  iban,
  //  status
  fields,
) {
  try {
    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.dinisiumBankAcountsTable,
      fields,
    );
  } catch (error) {
    throw new Error(error.message);
  }
}

async function getAllAccounts(client) {
  return new Promise(function (resolve, reject) {
    client.query(
      `SELECT * from ${DB.tables.dinisiumBankAcountsTable}'`,
      function (error, result) {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );
  });
}

const updateCurrentUserDetails = async (userId, fields) => {
  try {
    console.log('in update super-admin details');
    const colunms = Object.keys(fields);

    const keysToUpdate = colunms.reduce((acc, field, index) => {
      acc += `${field}= '${fields[field]}'`;

      return index + 1 === colunms.length ? acc + '' : acc + ', ';
    }, '');

    const queryStr = `UPDATE ${DB.tables.dinisiumBankAcountsTable} SET ${keysToUpdate} WHERE user_id = ${userId}`;

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

async function geAccountById(client, id) {
  return new Promise(function (resolve, reject) {
    client.query(
      `SELECT * from ${DB.tables.dinisiumBankAcountsTable} WHERE user_id = ${id}`,
      function (error, result) {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );
  });
}

// getAccountDetails
async function getAccountDetails(client, id) {
  return new Promise(function (resolve, reject) {
    client.query(
      `SELECT * from ${DB.tables.dinisiumBankAcountsTable}`,
      function (error, result) {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );
  });
}
async function getApprovedAccounts(client) {
  return new Promise(function (resolve, reject) {
    client.query(
      `SELECT * from ${DB.tables.dinisiumBankAcountsTable} WHERE status = 'approved'`,
      function (error, result) {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );
  });
}

async function adminOneApprove(client, id, adminId, status) {
  return new Promise(function (resolve, reject) {
    let statusTemp = status === 'approved' ? 'single_approved' : 'rejected';
    client.query(
      `UPDATE ${DB.tables.dinisiumBankAcountsTable} SET admin_one = '${adminId}', status = '${statusTemp}'  WHERE id = '${id}'`,
      function (error, result) {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );
  });
}

async function adminTwoApprove(client, id, adminId, status) {
  return new Promise(function (resolve, reject) {
    client.query(
      `UPDATE ${DB.tables.dinisiumBankAcountsTable} SET admin_two = '${adminId}' , status = '${status}' WHERE id = '${id}'`,
      function (error, result) {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );
  });
}

const deleteBankDetail = async (client, id) => {
  try {
    return await client.query(
      `DELETE FROM ${DB.tables.bankDetail} WHERE id=${id}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  addBankAccountDetails,
  getAllAccounts,
  geAccountById,
  getApprovedAccounts,
  adminOneApprove,
  adminTwoApprove,
  deleteBankDetail,
  getAccountDetails,
  updateCurrentUserDetails,
};
