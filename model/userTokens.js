const DB = require("./DB");
const client = DB.pool;

const saveTokens = async (fields) => {
  try {
    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.userToken,
      fields
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const findAllUserTokens = async () => {
  try {
    return await client.query(`SELECT * FROM ${DB.tables.userToken}`);
  } catch (error) {
    throw new Error(error.message);
  }
};

const getTokensByUser = async (userId) => {
  try {
    return await client.query(
      `Select t1.id, t1.user_id, t1.ito_token_id,  t2.token_name, t1.amount, t1.amount as "Number of tokens", t2.price as token_price, t2.price as "Token price", t1.amount*t2.price as total_worth_of_tokens, t1.amount*t2.price as "Total worth of tokens" FROM ${DB.tables.userToken} t1 LEFT JOIN ${DB.tables.itoTokenTable} t2 ON t1.ito_token_id=t2.id WHERE t1.user_id = ${userId}`
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getItoTokens = async (tokenId) => {
  try {
    return await client.query(
      `Select * FROM ${DB.tables.userToken} WHERE ito_token_id = ${tokenId}`
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateUserTokens = async (id, fields) => {
  try {
    const colunms = Object.keys(fields);

    const keysToUpdate = colunms.reduce((acc, field, index) => {
      acc += `${field}='${fields[field]}'`;

      return index + 1 === colunms.length ? acc + "" : acc + ", ";
    }, "");

    let queryStr = `UPDATE ${DB.tables.userToken} SET ${keysToUpdate} WHERE id = ${id}`;

    //    if(returningFields){
    //       queryStr+=` returning ${returningFields.join(",")}`
    //    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const findUserItoToken = async (userId, tokenId) => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.userToken} WHERE user_id=${userId} AND ito_token_id=${tokenId}`
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const deleteUserItoToken = async (userId, tokenId) => {
  try {
    return await client.query(
      `DELETE FROM ${DB.tables.userToken} WHERE user_id=${userId} AND ito_token_id=${tokenId}`
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  saveTokens,
  findAllUserTokens,
  getTokensByUser,
  getItoTokens,
  updateUserTokens,
  findUserItoToken,
  deleteUserItoToken,
};
