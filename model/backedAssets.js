const DB = require('./DB');
const client = DB.pool;

const createBackedAsset = async (client, fields) => {
  try {
    const returnFields = ['id', ...Object.keys(fields)];

    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.backedAssetTable,
      fields,
      returnFields,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getBackedAssets = async (client, query) => {
  try {
    let filter = '';
    let queryStr = ``;

    if (query) {
      const queryFields = Object.keys(query);

      filter = queryFields.reduce((acc, field, index) => {
        acc += `${field}='${query[field]}'`;

        return index + 1 === queryFields.length ? acc : acc + ' AND ';
      }, '');
    }

    queryStr = `SELECT * FROM ${DB.tables.backedAssetTable}`;

    if (filter) {
      queryStr += ` WHERE ${filter}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const getBackedAssetsForTokenDetail = async (client, tokenId) => {
  try {
    const queryStr = `SELECT t1.*, t2.name FROM ${DB.tables.backedAssetTable} as t1 LEFT JOIN ${DB.tables.assetTable} as t2 ON t1.asset_id=t2.id WHERE t1.ito_token_id=${tokenId}`;

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateBackedAsset = async (id, fields, returningFields) => {
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

    let queryStr = `UPDATE ${DB.tables.backedAssetTable} SET ${keysToUpdate} WHERE id = ${id}`;

    if (returningFields) {
      queryStr += ` returning ${returningFields.join(',')}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  createBackedAsset,
  getBackedAssets,
  getBackedAssetsForTokenDetail,
  updateBackedAsset,
};
