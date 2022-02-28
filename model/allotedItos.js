const DB = require('./DB');
const client = DB.pool;

const allotITOToAdmin = async (fields, returnFields) => {
  try {
    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.allotedItosTable,
      fields,
      returnFields,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

// get alloted admins to ITO by ITO id except loggedin user
const getAllotedITOToVerifyIto = async (itoId, adminId) => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.allotedItosTable} WHERE ito_id=${itoId} AND admin_id!=${adminId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getAllotedITO = async itoId => {
  try {
    return await client.query(
      `SELECT t1.*,CONCAT(t2.fname, ' ',t2.lname) as admin_name FROM ${DB.tables.allotedItosTable} t1
       left join ${DB.tables.usersTable} t2 on t1.admin_id=t2.id 
      WHERE ito_id=${itoId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getItoToLink = async (client, userId) => {
  return new Promise(function (resolve, reject) {
    let queryStr = `select id,name from ito where id IN 
    (select DISTINCT ito_id from alloted_itos where ito_id NOT IN 
    (select ito_id from alloted_itos where admin_id = ${userId}))`;
    console.log('querystr : ', queryStr);
    client.query(queryStr, function (error, result) {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
  });
};

const ItoToLinkWith = async (client, userId, itoId) => {
  return new Promise(function (resolve, reject) {
    let queryStr = `INSERT INTO alloted_itos (admin_id, ito_id)
    VALUES(${userId}, ${itoId})`;
    console.log('querystr : ', queryStr);
    client.query(queryStr, function (error, result) {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
  });
};

const checkLink = async (client, userId, itoId) => {
  return new Promise(function (resolve, reject) {
    let queryStr = `SELECT * FROM ${DB.tables.allotedItosTable} WHERE admin_id=${userId}
    AND ito_id=${itoId}`;
    console.log('querystr : ', queryStr);
    client.query(queryStr, function (error, result) {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
  });
};

module.exports = {
  allotITOToAdmin,
  getAllotedITOToVerifyIto,
  getAllotedITO,
  getItoToLink,
  ItoToLinkWith,
  checkLink,
};
