const DB = require('./DB');
const client = DB.pool;

const createToken = async fields => {
  try {
    const returnFields = ['id', 'is_tradeable', ...Object.keys(fields)];
    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.itoTokenTable,
      fields,
      returnFields,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

// //getTokensDetail
// const getTokensDetail = async () => {
//   try {
//     return await client.query(`
//         SELECT t1.*,t3.name
//         FROM ${DB.tables.itoTokenTable} t1 left join ${DB.tables.allotedItosTable} t2 on t1.ito_id=t2.ito_id
//         left join ${DB.tables.itoTable} t3 on t3.id = t2.ito_id
//         `);
//   } catch (error) {
//     throw new Error(error.message);
//   }
// };

const getAllTokens = async query => {
  try {
    let filter = '';

    if (query) {
      const queryFields = Object.keys(query);
      filter = queryFields.reduce((acc, field, index) => {
        acc += `${field}='${query[field]}'`;

        return index + 1 === queryFields.length ? acc : acc + ' AND ';
      }, '');
    }
    let queryStr = `SELECT * FROM ${DB.tables.itoTokenTable}`;

    if (filter) {
      queryStr += ` WHERE ${filter}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const getTokenDetailById = async tokenId => {
  try {
    return await client.query(`
        SELECT *
        FROM ${DB.tables.itoTokenTable} WHERE id = ${tokenId}`);
  } catch (error) {
    throw new Error(error.message);
  }
};

const getTokenById = async tokenId => {
  try {
    return await client.query(`
        SELECT t1.*,
        t2.description as ito_description,
        t2.status as ito_status,
        t2.name as ito_name,
        t2.start_date as ito_start_date,
        t3.description as series_description,
        t3.supply as series_supply
        FROM ${DB.tables.itoTokenTable} t1 LEFT JOIN ${DB.tables.itoTable} t2 ON t1.ito_id = t2.id 
        LEFT JOIN ${DB.tables.itoSeriesTable} t3 ON t2.id = t3.ito_id WHERE t1.id = ${tokenId}`);
  } catch (error) {
    throw new Error(error.message);
  }
};

const getTokenWithNonRejectedItoByName = async name => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.itoTokenTable} t1 LEFT JOIN ${DB.tables.itoTable} t2 ON t1.ito_id = t2.id WHERE t1.token_name='${name}' AND t2.status != 'rejected'`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateToken = async (tokenId, fields, returningFields) => {
  try {
    console.log('update token ......');
    const colunms = Object.keys(fields);

    const keysToUpdate = colunms.reduce((acc, field, index) => {
      if (fields[field] === null) {
        acc += `${field}=${fields[field]}`;
      } else {
        acc += `${field}='${fields[field]}'`;
      }

      return index + 1 === colunms.length ? acc + '' : acc + ', ';
    }, '');

    let queryStr = `UPDATE ${DB.tables.itoTokenTable} SET ${keysToUpdate} WHERE id = ${tokenId}`;

    if (returningFields) {
      queryStr += ` returning ${returningFields.join(',')}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateTokenByItoId = async (tokenId, fields, returningFields) => {
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

    let queryStr = `UPDATE ${DB.tables.itoTokenTable} SET ${keysToUpdate} WHERE ito_id = ${tokenId}`;

    if (returningFields) {
      queryStr += ` returning ${returningFields.join(',')}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const addTokenToExchange = async (tokenId, is_tradeable, returningFields) => {
  try {
    return await client.query(
      `UPDATE ${
        DB.tables.itoTokenTable
      } SET is_tradeable=${is_tradeable} WHERE id = ${tokenId} returning ${returningFields.join(
        ',',
      )}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const deleteToken = async tokenId => {
  try {
    return await client.query(
      `DELETE FROM ${DB.tables.itoTokenTable} WHERE id=${tokenId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getTokenByIto = async itoId => {
  try {
    return await client.query(
      `Select * FROM ${DB.tables.itoTokenTable} WHERE ito_id=${itoId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const findTokenById = async tokenId => {
  try {
    return client.query(
      `SELECT * FROM ${DB.tables.itoTokenTable} WHERE id = ${tokenId}`,
    );
  } catch (error) {}
};

const findAllexchangeableokens = async tradable => {
  try {
    return await client.query(`SELECT t1.* ,t2.description , t2.name, t3.remaining_supply as series_supply FROM ${DB.tables.itoTokenTable} as t1 
    INNER JOIN ${DB.tables.itoTable} as t2 ON t2.id = t1.ito_id
    left join ${DB.tables.itoSeriesTable} as t3 on t2.id = t3.ito_id
    WHERE  t1.is_tradeable = ${tradable} AND t2.start_date < ( now()::date + '1 day'::interval) AND t2.onhold=false AND t2.status='approved' AND t2.closed=false`);
  } catch (error) {
    throw new Error(error.message);
  }
};

const findAllOngoingTokens = async () => {
  try {
    console.log('...................');
    // return await client.query(`SELECT t1.* ,t2.description , t2.name FROM ${DB.tables.itoTokenTable} as t1
    // INNER JOIN ${DB.tables.itoTable} as t2 ON t2.id = t1.ito_id
    // WHERE t2.start_date < ( now()::date + '1 day'::interval) AND t2.onhold=false AND t2.status='approved'`);

    return await client.query(`SELECT t1.* ,t2.description , t2.name, t3.remaining_supply as series_remaining_supply, FROM ${DB.tables.itoTokenTable} as t1 
    INNER JOIN ${DB.tables.itoTable} as t2 ON t2.id = t1.ito_id INNER JOIN ${DB.tables.itoSeriesTable} as t3 ON t3.ito_id = t2.id
    WHERE t2.start_date < ( now()::date + '1 day'::interval) AND t2.onhold=false AND t2.status='approved' AND t3.start_date < ( now()::date + '1 day'::interval) AND t3.end_date >= now()`);
  } catch (error) {
    throw new Error(error.message);
  }
};

const findAllexchangeToeknsWithUser = async userId => {
  try {
    return await client.query(`Select t1.*,t2.user_id,t2.amount FROM ${DB.tables.itoTokenTable} t1
         LEFT JOIN ${DB.tables.userToken} t2 ON t1.id = t2.ito_token_id AND t2.user_id =${userId}
         WHERE t1.is_tradeable = true AND t1.ito_id IN 
          (SELECT id FROM ${DB.tables.itoTable} 
            WHERE start_date < ( now()::date + '1 day'::interval) AND onhold=false) ORDER BY t2.amount DESC NULLS LAST`);
  } catch (error) {
    throw new Error(error.message);
  }
};

const findTokensCount = async () => {
  try {
    return await client.query(
      `Select COUNT(id) FROM ${DB.tables.itoTokenTable}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getAllTokensCurrentPriceAndMarketcap = client => {
  return new Promise(function (resolve, reject) {
    client.query(
      `select t3.id as ito_id, t1.id as token_id, t1.token_name, t1.price as price,
      (t1.supply-(t2.remaining_supply + t1.remaining_supply))*t1.price as marketcap
      from ito_token t1
      left join ito t3 on t3.id = t1.ito_id
      left join ito_series t2 on t2.ito_id = t1.ito_id
      order by t3.id`,

      function (error, result) {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );
  });
};

// getAllAllotedTokes
// `select t3.id as ito_id, t1.id as token_id, t1.token_name, t1.price as price,
//       (t1.supply-(t2.remaining_supply + t1.remaining_supply))*t1.price as marketcap
//       from ito_token t1
//       left join ito t3 on t3.id = t1.ito_id
//       left join ito_series t2 on t2.ito_id = t1.ito_id
//       left join alloted_itos t4 on t4.ito_id = t1.ito_id
//       where t4.admin_id = ${admin}
//       order by t3.id`,
const getAllAllotedTokes = (client, admin) => {
  return new Promise(function (resolve, reject) {
    client.query(
      `select t3.id as ito_id, t1.id as token_id, t1.token_name, t1.price as price,
      (t1.supply-(t2.remaining_supply + t1.remaining_supply))*t1.price as marketcap
      from ${DB.tables.itoTokenTable} t1
      left join ${DB.tables.itoTable} t3 on t3.id = t1.ito_id 
      left join ${DB.tables.itoSeriesTable} t2 on t2.ito_id = t1.ito_id
      left join ${DB.tables.allotedItosTable} t4 on t4.ito_id = t1.ito_id
      where t4.admin_id = ${admin} 
      order by t3.id`,

      function (error, result) {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );
  });
};

const getTokenInfo = client => {
  return new Promise(function (resolve, reject) {
    let queryStr = `select
          t1.ito_id, 
          t1.token_name, 
          t1.price, 
          t3.token_price,
          t3.created_at,
          t1.supply as minted_supply, 
          t1.is_tradeable, 
          CONCAT(CONCAT(t5.fname,' ', t5.lname),', ',
          CONCAT(t6.fname,' ', t6.lname)) as authorized_admins,
          (t4.supply * t1.price) as marketcap,
          t4.remaining_supply as total_supply_available_for_trading,
          t1.remaining_supply as supply_held_in_admin_wallet,
          t1.supply-(t4.remaining_supply + t1.remaining_supply) as supply_held_in_user_wallet
          from ito_token t1
          left join ito t2 on t1.ito_id = t2.id
          left join token_price_history t3 on t1.ito_id = t3.ito_token_id
          left join ito_series t4 on t4.ito_id = t1.ito_id
          left join users t5 on t2.user_id IN (select t5.id from users where t5.id IN (select user_id
                                                from ito))
          left join users t6 on t2.user_approve IN (select t6.id from users where t6.id IN (select user_id
                                                from ito))
          order by  t1.ito_id, t3.created_at desc`;

    client.query(queryStr, function (error, result) {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
  });
};

const getTokenMarketcapHistory = (client, tokenId, filterBy) => {
  return new Promise(function (resolve, reject) {
    let queryStr = `select t3.id,
      (t3.supply-(t2.remaining_supply + t3.remaining_supply))*t1.token_price as marketcap, 
      date_trunc('${filterBy}', t1.created_at) as date
      from token_price_history t1
      left join ito_series t2 on t1.ito_token_id = (select id from ito_token where ito_id = ${tokenId}) and t2.ito_id = ${tokenId}
      left join ito_token t3 on t1.ito_token_id = (select id from ito_token where ito_id = ${tokenId}) and t3.ito_id = ${tokenId}
      where t1.created_at >= t2.start_date and t1.created_at <= t2.end_date
      order by date_trunc('${filterBy}', t1.created_at)
	  `;

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
  createToken,
  getAllTokens,
  getTokenDetailById,
  getTokenById,
  getTokenWithNonRejectedItoByName,
  updateToken,
  deleteToken,
  getTokenByIto,
  addTokenToExchange,
  findAllexchangeableokens,
  findAllOngoingTokens,
  findAllexchangeToeknsWithUser,
  findTokenById,
  findTokensCount,
  getAllTokensCurrentPriceAndMarketcap,
  getTokenInfo,
  updateTokenByItoId,
  getTokenMarketcapHistory,
  getAllAllotedTokes,
  // getTokensDetail,
};
