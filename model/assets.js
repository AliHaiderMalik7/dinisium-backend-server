const DB = require('./DB');
const client = DB.pool;
const createAsset = async (client, fields) => {
  try {
    const returnFields = ['id', ...Object.keys(fields)];

    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.assetTable,
      fields,
      returnFields,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getAssets = async (client, query) => {
  try {
    let filter = '';
    let queryStr = ``;
    if (query) {
      const queryFields = Object.keys(query);

      filter = queryFields.reduce((acc, field, index) => {
        acc += `${field}='${query[field]}'`;

        return index + 1 === queryFields.length ? acc : acc + ' AND ';
      }, '');

      queryStr = `SELECT *,name as label FROM ${DB.tables.assetTable}`;
    } else {
      queryStr = `SELECT * FROM ${DB.tables.assetTable}`;
    }
    if (filter) {
      queryStr += ` WHERE ${filter}`;
    }
    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const getAssetDetail = async ID => {
  try {
    return await client.query(
      ` SELECT t1.id as asset_id, t1.name as asset_name,t1.type as asset_type,t1.unit as asset_unit,t1.price as asset_price,t1.created_at as asset_created_at,
        t1.remaining_supply as asset_remaining_supply, t1.total_supply as asset_total_supply ,t1.updated_price,t1.update_status as update_statuss,
        t1.user1_approve,t1.user2_approve,t1.updated_total_supply,t1.updated_remaining_supply,
        t2.asset_value,t2.asset_quantity,t3.* from ${DB.tables.assetTable}
        t1 left join ${DB.tables.backedAssetTable} t2 on t1.id=t2.asset_id
        left join ${DB.tables.itoTokenTable} t3 on t2.ito_token_id=t3.id
        WHERE t1.id =${ID}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

// const getAssetDetail = async (client, query) => {
//   try {
//     let filter = '';
//     let queryStr = ``;
//     if (query) {
//       const queryFields = Object.keys(query);

//       filter = queryFields.reduce((acc, field, index) => {
//         acc += `t1.${field}='${query[field]}'`;

//         return index + 1 === queryFields.length ? acc : acc + ' AND ';
//       }, '');
//       // queryStr = `SELECT t1.*,t2.*,t3.*,t1.name as asset_name,t1.type as asset_type,t1.unit as asset_unit,t1.price as asset_price,t1.created_at as asset_created_at, t1.remaining_supply as asset_remaining_supply, t1.total_supply as asset_total_supply
//       // FROM ${DB.tables.assetTable} t1
//       // LEFT JOIN ${DB.tables.backedAssetTable} t2 ON t1.id = t2.asset_id
//       // left JOIN ${DB.tables.itoTokenTable} t3 ON t3.id = t2.ito_token_id`;
//       queryStr = `SELECT t1.id as asset_id, t1.* ,t2.*,t3.*,t1.name as asset_name,t1.type as asset_type,t1.unit as asset_unit,t1.price as asset_price,t1.created_at as asset_created_at, t1.remaining_supply as asset_remaining_supply, t1.total_supply as asset_total_supply
//       FROM ${DB.tables.assetTable} t1
//       LEFT JOIN ${DB.tables.backedAssetTable} t2 ON t1.id = t2.asset_id
//       left JOIN ${DB.tables.itoTokenTable} t3 ON t3.id = t2.ito_token_id`;
//     } else {
//       queryStr = `SELECT * FROM ${DB.tables.assetTable}`;
//     }
//     if (filter) {
//       queryStr += ` WHERE ${filter}`;
//     }
//     console.log('query string data ....', queryStr);
//     return await client.query(queryStr);
//   } catch (error) {
//     throw new Error(error.message);
//   }
// };
// getAssetApproveddetails
const getAssetApproveddetails = async (client, ID) => {
  try {
    return await client.query(
      ` select t1.fname,t2.created_at from ${DB.tables.usersTable} t1 left join ${DB.tables.assetTable} t2 on t1.id = t2.user1_approve OR t1.id = t2.user2_approve where t2.id = '${ID}'`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getAssetsBystatus = async (client, status) => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.assetTable} WHERE update_status='${status}'`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getAssetById = async (client, assetId) => {
  try {
    console.log('assets id ....', assetId);
    return await client.query(
      `SELECT * FROM ${DB.tables.assetTable} WHERE id=${assetId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateAsset = async (client, fields, assetId, returningFields) => {
  try {
    const colunms = Object.keys(fields);

    const keysToUpdate = colunms.reduce((acc, field, index) => {
      acc += `${field}='${fields[field]}'`;

      return index + 1 === colunms.length ? acc + '' : acc + ', ';
    }, '');

    let queryStr = `UPDATE ${DB.tables.assetTable} SET ${keysToUpdate} WHERE id = ${assetId}`;

    if (returningFields) {
      queryStr += ` returning ${returningFields.join(',')}`;
    }
    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const deleteAgent = async (client, agentId) => {
  try {
    return await client.query(
      `DELETE FROM ${DB.tables.agentsTable} WHERE id=${agentId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  createAsset,
  getAssetApproveddetails,
  getAssets,
  getAssetDetail,
  getAssetsBystatus,
  getAssetById,
  updateAsset,
  deleteAgent,
};
