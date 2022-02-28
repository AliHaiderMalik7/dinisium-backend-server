const DB = require("../model/DB");
const client = DB.pool;

const saveLogs = async (fields) => {
  try {
    console.log(fields);
    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.auditLogTable,
      fields,
      ["id"]
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const findLogs = async () => {
  try {
    return await client.query(`
         SELECT t1.*,CONCAT(t2.fname, ' ',t2.lname) as admin_name,CONCAT(t3.fname, ' ',t3.lname) as user_name FROM ${DB.tables.auditLogTable} t1
         LEFT JOIN ${DB.tables.usersTable} t2 ON t1.admin = t2.id
         LEFT JOIN ${DB.tables.usersTable} t3 ON t1.user_id = t3.id
        `);
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  saveLogs,
  findLogs,
};
