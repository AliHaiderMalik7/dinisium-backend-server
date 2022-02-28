const DB = require("./DB");

const createTokenPriceHistory = async (client, fields) => {
  try {
    const returnFields = ["id", ...Object.keys(fields)];

    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.tokenPriceHistoryTable,
      fields,
      returnFields
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getTokenPriceHistory = (client, tokenId, filterBy, interval) => {
  return new Promise(function (resolve, reject) {
    // let queryStr = `SELECT t1.*,
    //     t2.token_name,
    //     t2.price
    //     FROM ${DB.tables.tokenPriceHistoryTable} t1
    //     LEFT JOIN ${DB.tables.itoTokenTable} t2 ON t1.ito_token_id = t2.id
    //     WHERE t1.ito_token_id = ${tokenId} `;

    let queryStr = `select token_price as price,
        date_trunc('${filterBy}', created_at) as date
        from token_price_history
        where ito_token_id = (select id from ito_token where ito_id = ${tokenId})
        ORDER by date_trunc('${filterBy}', created_at)`;

    // if (filterBy) {
    //   queryStr += filterBy;
    // }
    console.log(queryStr);

    client.query(queryStr, function (error, result) {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
  });
};

// const getAssets = async (client, query) => {
//   try {
//     let filter = "";
//     let queryStr = ``;
//     if (query) {
//       const queryFields = Object.keys(query);

//       filter = queryFields.reduce((acc, field, index) => {
//         acc += `${field}='${query[field]}'`;

//         return index + 1 === queryFields.length ? acc : acc + " AND ";
//       }, "");

//       queryStr = `SELECT *,name as label FROM ${DB.tables.assetTable}`;
//     } else {
//       queryStr = `SELECT * FROM ${DB.tables.assetTable}`;
//     }
//     if (filter) {
//       queryStr += ` WHERE ${filter}`;
//     }
//     return await client.query(queryStr);
//   } catch (error) {
//     throw new Error(error.message);
//   }
// };


module.exports = {
  createTokenPriceHistory,
  getTokenPriceHistory,
  
  // getAssets,
};
