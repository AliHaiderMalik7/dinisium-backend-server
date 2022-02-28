const DB = require('./DB');
const client = DB.pool;

const createBlockingITodata = async (fields, returningFields) => {
  try {
    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.itoBlock,
      fields,
      returningFields,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getBlockingDetailsByITO = async ito_id => {
  try {
    return client.query(
      `SELECT * FROM ${DB.tables.itoBlock} where ito_id = ${ito_id} `,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateBlockingData = async (fields, itoId, returningFields) => {
  try {
    const colunms = Object.keys(fields);

    const keysToUpdate = colunms.reduce((acc, field, index) => {
      if (fields[field] === null) {
        acc += `${field}=${fields[field]}`;
      } else {
        acc += `${field}='${fields[field]}'`;
      }
      return index + 1 === colunms.length ? acc + '' : acc + ', ';
    }, '');

    let queryStr = `UPDATE ${DB.tables.itoBlock} SET ${keysToUpdate} WHERE ito_id = ${itoId}`;

    if (returningFields) {
      queryStr += ` returning ${returningFields.join(',')}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  createBlockingITodata,
  getBlockingDetailsByITO,
  updateBlockingData,
};
