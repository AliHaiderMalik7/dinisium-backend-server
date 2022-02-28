const DB = require('./DB');
const client = DB.pool;

const createWithdraw = async fields => {
  try {
    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.withdraw,
      fields,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getWithdrawList = async status => {
  try {
    return await client.query(
      `SELECT t1.id,t1.user_id, t2.fname,t2.lname,t1.amount,  t1.status,t1.rejection_message, t1.created_at, t1.updated_at, t1.kyc_id,t1.admin_one FROM ${DB.tables.withdraw} t1 LEFT JOIN ${DB.tables.usersTable} t2 ON t1.user_id = t2.id WHERE t1.status = '${status}' ORDER BY id ASC`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateWithdrawStatus = async (fields, userId, returningFields) => {
  try {
    const colunms = Object.keys(fields);
    const data = Object.values(fields);

    if (colunms == 'status' && data == 'rejected') {
      let queryStr = `UPDATE ${DB.tables.withdraw} SET ${colunms} = '${data}' WHERE id = ${userId}`;
      if (returningFields) {
        queryStr += ` returning ${returningFields.join(',')}`;
      }

      return await client.query(queryStr);
    }
    if (colunms == 'status' && data == 'approved') {
      let queryStr = `UPDATE ${DB.tables.withdraw} SET ${colunms} = '${data}' WHERE id = ${userId}`;
      if (returningFields) {
        queryStr += ` returning ${returningFields.join(',')}`;
      }

      return await client.query(queryStr);
    } else {
      throw new Error();
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

const getDataByUser = async userId => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.withdraw} where id=${userId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

// getcurrentUserList
const getcurrentUserList = async userId => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.withdraw} where user_id=${userId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

async function adminOneApprove(
  client,
  userId,
  adminId,
  status,
  rejectionMessage,
) {
  if (!rejectionMessage) {
    rejectionMessage = null;
  }
  return new Promise(function (resolve, reject) {
    let statusTemp = status === 'approved' ? 'single_approved' : 'rejected';
    client.query(
      `UPDATE ${DB.tables.withdraw} SET admin_one = '${adminId}', status = '${statusTemp}', rejection_message = '${rejectionMessage}'  WHERE id = '${userId}'`,
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

async function adminTwoApprove(
  client,
  userId,
  adminId,
  status,
  rejectionMessage,
) {
  if (!rejectionMessage) {
    rejectionMessage = null;
  }
  return new Promise(function (resolve, reject) {
    client.query(
      `UPDATE ${DB.tables.withdraw} SET admin_two = '${adminId}' , status = '${status}', rejection_message = '${rejectionMessage}' WHERE id = '${userId}'`,
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

module.exports = {
  createWithdraw,
  getWithdrawList,
  getDataByUser,
  updateWithdrawStatus,
  adminOneApprove,
  adminTwoApprove,
  getcurrentUserList,
};
