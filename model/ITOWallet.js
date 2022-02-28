const DB = require("./DB");
const client = DB.pool;

const createWallet = async (fields) => {
  try {
    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.itoWalletTable,
      fields
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateWallet = async (walletId, fields) => {
  try {
    const colunms = Object.keys(fields);

    const keysToUpdate = colunms.reduce((acc, field, index) => {
      acc += `${field}='${fields[field]}'`;

      return index + 1 === colunms.length ? acc + "" : acc + ", ";
    }, "");

    let queryStr = `UPDATE ${DB.tables.itoWalletTable} SET ${keysToUpdate} WHERE id = ${walletId}`;

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const getWallets = async () => {
  try {
  } catch (error) {}
};

const getById = async (itoId) => {
  try {
    return await client.query(
      `Select * FROM ${DB.tables.itoWalletTable} WHERE id = ${itoId}`
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getWalletByIto = async () => {
  try {
    return await client.query(
      `Select * FROM ${DB.tables.itoWalletTable} WHERE id=1`
    );
  } catch (error) {
    throw new Error(error.message);
  }
};
const getTokenIdByItoId = async (ito_id) => {
  try {
    return await client.query(
      `Select * FROM ${DB.tables.itoTokenTable} WHERE id=${ito_id}`
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  createWallet,
  updateWallet,
  getWallets,
  getById,
  getWalletByIto,
  getTokenIdByItoId,
};
