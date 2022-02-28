const DB = require('./DB');
const client = DB.pool;
const server_url = process.env.BLOCKCHAIN_SERVER_URL;
const axios = require('axios');
const createOrder = async fields => {
  try {
    const returnFields = ['id', ...Object.keys(fields)];
    console.log(fields);
    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.exchangeOrdersTable,
      fields,
      returnFields,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getOrders = async userId => {
  try {
    let filter = '';
    // if (query) {
    //   const queryFields = Object.keys(query);
    //   filter = queryFields.reduce((acc, field, index) => {
    //     acc += `${field}='${query[field]}'`;

    //     return index + 1 === queryFields.length ? acc : acc + " AND ";
    //   }, "");
    // }

    // let queryStr = `SELECT t1.*,t2.token_name,t2.token_symbol,t3.fname,t3.lname FROM ${DB.tables.exchangeOrdersTable} t1
    //      LEFT JOIN ${DB.tables.itoTokenTable} t2 ON t1.ito_token_id=t2.id
    //      LEFT JOIN ${DB.tables.usersTable} t3 ON t1.user_id=t3.id
    //      `;

    let queryStr = `SELECT eot.id, eot.amount, eot.tokens,eot.created_at,eot.order_type,eot.admin_one,eot.admin_two,eot.status,itt.token_name,itt.token_symbol,ut.fname,eot.transaction_hash, eot.spreadedamount
    FROM ${DB.tables.exchangeOrdersTable} eot
    RIGHT JOIN ${DB.tables.itoTokenTable} itt
    ON itt.id = eot.ito_token_id
    RIGHT JOIN ${DB.tables.usersTable} ut
    ON ut.id = eot.user_id
    WHERE itt.ito_id IN (
      SELECT ito_id FROM ${DB.tables.allotedItosTable} WHERE admin_id = ${userId}
      )
    `;

    if (filter) {
      queryStr += ` WHERE ${filter}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    console.log('errror', error);

    throw new Error(error.message);
  }
};

const getOrdersByUser = async userId => {
  try {
    return await client.query(
      `SELECT t1.*,t2.token_name,t2.token_symbol,t2.price FROM ${DB.tables.exchangeOrdersTable} t1 LEFT JOIN ${DB.tables.itoTokenTable} t2 ON t1.ito_token_id = t2.id WHERE t1.from_user_id=${userId} ORDER BY updated_at DESC`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getOrderById = async orderId => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.exchangeOrdersTable} WHERE id=${orderId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

// getOrderUsingId

const getOrderUsingId = async orderId => {
  try {
    console.log('In getorderUsingId ', orderId);
    let accounts_address = await client.query(
      `SELECT * FROM ${DB.tables.walletTable} where user_id='${orderId}'`,
    );

    //   if(!accounts_address){
    // return res.status(403).json({msg: " data not found"})
    //   }
    // console.log("Accounts address ==========", accounts_address.rows[0].account_address);
    // if(accounts_address.rowCount <  1){

    // }
    // `SELECT t1.*,t2.token_name,t2.token_symbol FROM ${DB.tables.exchangeOrdersTable} t1 LEFT JOIN ${DB.tables.itoTokenTable} t2 ON t1.ito_token_id = t2.id WHERE t1.from_user_id=${userId}`
    let ito_data = await client.query(
      `SELECT t1.id,t1.name,t2.token_symbol FROM ${DB.tables.itoTable}  t1 JOIN ${DB.tables.itoTokenTable} t2 ON t1.id = t2.ito_id  WHERE t1.user_id ='${orderId}'`,
    );
    console.log('My ito data ====>', ito_data.rows);

    var id_data_length = ito_data.rows.length;
    const data = {
      ito_ids: [id_data_length],
      addresses: [id_data_length],
    };
    for (var i = 0; i < id_data_length; i++) {
      data.ito_ids[i] = ito_data.rows[i].id;
      data.addresses[i] = accounts_address.rows[0].account_address;
    }

    console.log('Object data is ==========>', data);

    return new Promise(function (resolve, reject) {
      const url = `${server_url}/get-batch-balance`;
      axios
        .post(url, data)
        .then(response => {
          console.log('in response');
          resolve(
            response.data?.data?.map((item, index) => {
              //  console.log(" =====================================",ito_data.rows[index].name)
              console.log(item);
              return {
                ito_name: ito_data.rows[index].name,
                symbol: ito_data.rows[index].token_symbol,
                balance: item,
              };
            }),
          );
        })
        .catch(error => {
          // console.log(error.response);
          reject(error.response);
        });
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

// const getOrderUsingId = async (userId) => {
//   try {
//     let accounts_address = await client.query(
//       `SELECT * FROM ${DB.tables.walletTable} where user_id='${userId}'`
//     );

//     console.log("Accounts address ==========", accounts_address.rows)

//     let ito_data = await client.query(`SELECT * FROM ${DB.tables.itoTable}`);
//     console.log("Ito data ==========", accounts_address.rows)

//     // return await client.query(
//     //   `SELECT * FROM ${DB.tables.exchangeOrdersTable} WHERE id=${orderId}`
//     // );
//   } catch (error) {
//     throw new Error(error.message);
//   }
// };

// adminOneApprove;
async function adminOneApprove(
  client,
  userId,
  adminId,
  status,
  rejectionMessage,
) {
  console.log(
    'Hellllllllllllllllllllllllllllllllllllllllllllllooooooooooooooo',
  );
  console.log('=========================================', rejectionMessage);
  if (rejectionMessage == undefined) {
    rejectionMessage = null;
  }
  return new Promise(function (resolve, reject) {
    let statusTemp = status === 'approved' ? 'single_approved' : 'rejected';
    client.query(
      `UPDATE ${DB.tables.exchangeOrdersTable} SET admin_one = '${adminId}', status = '${statusTemp}', rejectionMessage = '${rejectionMessage}'  WHERE id = '${userId}'`,
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
// adminTwoApprove
async function adminTwoApprove(client, id, adminId, status, rejectionMessage) {
  console.log('Id is -----------> ', id);
  return new Promise(function (resolve, reject) {
    client.query(
      `UPDATE ${DB.tables.exchangeOrdersTable} SET admin_two = '${adminId}' , status = '${status}', rejectionMessage = '${rejectionMessage}' WHERE id = '${id}'`,
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

const confirmOrder = async (transactionHash, orderId) => {
  try {
    let queryStr = `UPDATE ${DB.tables.exchangeOrdersTable} SET status = 'completed', transaction_hash = '${transactionHash}' WHERE id = ${orderId}`;

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateOrder = async (fields, orderId, returningFields) => {
  try {
    const colunms = Object.keys(fields);

    const keysToUpdate = colunms.reduce((acc, field, index) => {
      acc += `${field}='${fields[field]}'`;

      return index + 1 === colunms.length ? acc + '' : acc + ', ';
    }, '');

    let queryStr = `UPDATE ${DB.tables.exchangeOrdersTable} SET ${keysToUpdate} WHERE id = ${orderId}`;

    if (returningFields) {
      queryStr += ` returning ${returningFields.join(',')}`;
    }
    console.log('Update Order query string========', queryStr);
    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const deleteOrder = async orderId => {
  try {
    return await client.query(
      `DELETE FROM ${DB.tables.exchangeOrdersTable} WHERE id=${orderId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const findItoOrdersCount = async tokenId => {
  try {
    return await client.query(
      `Select COUNT(*) FROM ${DB.tables.exchangeOrdersTable} WHERE ito_token_id=${tokenId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const findAllOrdersCount = async () => {
  try {
    return await client.query(
      `Select COUNT(*) FROM ${DB.tables.exchangeOrdersTable} `,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const findItoExchangePerDay = async tokenId => {
  try {
    let queryStr = `
        SELECT 
             DATE_TRUNC('day',created_at) AS exchange_to_day,
             COUNT(order_type) FILTER (WHERE order_type = 'sell_order') AS count_sell,
             COUNT(order_type) FILTER (WHERE order_type = 'buy_order') AS count_buy
             FROM ${DB.tables.exchangeOrdersTable}
             WHERE ito_token_id = ${tokenId} AND status = 'completed'
             GROUP BY DATE_TRUNC('day',created_at)`;

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const findAllExchangePerDay = async (type, filterBy, interval) => {
  try {
    console.log('type is ....', type, filterBy);
    let name = '';
    if (type === 'sell_order') {
      name = 'sell_count';
    }
    if (type === 'buy_order') {
      name = 'buy_count';
    }
    let queryStr = `
        SELECT 
             DATE_TRUNC('${filterBy}',created_at) AS exchange_day,
             COUNT(order_type) FILTER (WHERE order_type ='${type}') AS ${name}          
             FROM ${DB.tables.exchangeOrdersTable}
             where created_at >= NOW()::date - INTERVAL '${interval}'
             GROUP BY DATE_TRUNC('${filterBy}',created_at)
             ORDER BY DATE_TRUNC('${filterBy}',created_at) ASC
             `;
    //   COUNT(order_type) FILTER (WHERE order_type = 'buy_order') AS count_buy
    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

//Get all exchange buy and sell list
const getAllExchangePerDay = async (filterBy, interval) => {
  try {
    let queryStr = `
        SELECT 
             DATE_TRUNC('${filterBy}',created_at) AS exchange_day,
             COUNT(order_type) FILTER (WHERE order_type = 'buy_order') AS Buy_count,
             COUNT(order_type) FILTER (WHERE order_type = 'sell_order') AS Sell_count          
             FROM ${DB.tables.exchangeOrdersTable}
             where created_at >= NOW()::date - INTERVAL '${interval}'
             GROUP BY DATE_TRUNC('${filterBy}',created_at)
             ORDER BY DATE_TRUNC('${filterBy}',created_at) ASC
             `;
    //   COUNT(order_type) FILTER (WHERE order_type = 'buy_order') AS count_buy
    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

//Get all exchange orders by price limit
const getOrderByPriceLimit = async priceLimit => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.exchangeOrdersTable} WHERE price_limit=${priceLimit}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getOrderForP2pExchnage = async (tokenId, priceLimit, order_type) => {
  try {
    return await client.query(
      `SELECT * from ${DB.tables.exchangeOrdersTable} where ito_token_id = ${tokenId} and order_type = ${order_type} and price_limit = ${priceLimit}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateOrderAmountById = async (id, amount) => {
  try {
    return await client.query(
      `Update ${DB.tables.exchangeOrdersTable} Set amount = ${amount} where exchange_orders.id = ${id} `,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getItoIdsByUserId = async id => {
  try {
    return await client.query(`Select id from ito where user_id =${id}`);
  } catch (error) {
    //console.log("ERROR==== ",error);
    throw new Error(error.message);
  }
};

const getTokenIdsByItoIds = async ids => {
  console.log('IDS=== ', ids);
  //ids = [2]
  try {
    return await client.query(
      `Select id from ito_token where ito_id IN (${ids.join(',')})`,
    );
  } catch (error) {
    console.log('ERROR=== ', error);
    throw new Error(error.message);
  }
};

const getExchangeOrdersByItoTokenIds = async ids => {
  try {
    return await client.query(
      `select t1.*,t2.token_name,t2.token_symbol,t3.fname,t3.lname from exchange_orders t1 INNER JOIN ito_token t2 ON t1.ito_token_id = t2.id INNER JOIN users t3 ON t1.from_user_id = t3.id where t1.ito_token_id IN (${ids.join(
        ',',
      )});`,
    );
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};

const getAllITODetails = async () => {
  try {
    return await client.query(`Select id,name from ${DB.tables.itoTable}`);
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  createOrder,
  updateOrder,
  getOrders,
  getOrderById,
  getOrderUsingId,
  deleteOrder,
  getOrdersByUser,
  confirmOrder,
  findItoOrdersCount,
  findAllOrdersCount,
  findItoExchangePerDay,
  findAllExchangePerDay,
  getAllExchangePerDay,
  getOrderByPriceLimit,
  updateOrderAmountById,
  getItoIdsByUserId,
  getTokenIdsByItoIds,
  adminOneApprove,
  adminTwoApprove,
  getExchangeOrdersByItoTokenIds,
  getAllITODetails,
  getOrderForP2pExchnage,
};
