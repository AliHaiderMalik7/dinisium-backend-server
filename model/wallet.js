// const { default: axios } = require("axios");
const DB = require('./DB');
const { createOrder } = require('./exchangeOrders');
const client = DB.pool;
const axios = require('axios');
const { created_at } = require('../db/content_data');
const server_url = process.env.BLOCKCHAIN_SERVER_URL;

const createWallet = async fields => {
  try {
    console.log(fields);
    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.walletTable,
      fields,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getAllWallets = async query => {
  try {
    let filter = '';

    if (query) {
      const queryFields = Object.keys(query);
      filter = queryFields.reduce((acc, field, index) => {
        acc += `${field}='${query[field]}'`;

        return index + 1 === queryFields.length ? acc : acc + ' AND ';
      }, '');
    }

    let queryStr = `SELECT * FROM ${DB.tables.walletTable}`;

    if (filter) {
      queryStr += ` WHERE ${filter}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const getWalletById = async walletId => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.walletTable} WHERE id=${walletId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getWalletByUser = async userId => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.walletTable} where user_id=${userId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getAccountLists = async userId => {
  try {
    let accounts_address = await client.query(
      `SELECT * FROM ${DB.tables.walletTable} where user_id='${userId}'`,
    );
    if (accounts_address.rowCount === 0) {
      throw new Error();
    }
    let ito_data = await client.query(
      `SELECT t1.id,t2.id as token_id,t2.token_address, t1.name, t2.token_name, t2.price, t2.buying_spread,t2.selling_spread FROM ${DB.tables.itoTable} t1 LEFT JOIN ${DB.tables.itoTokenTable} t2 ON t1.id = t2.ito_id `,
    );
    var id_data_length = ito_data.rows.length;

    const data = {
      price: [],
      ito_ids: [],
      addresses: [],
    };

    for (var i = 0; i < id_data_length; i++) {
      data.price[i] = ito_data.rows[i].price;
      data.ito_ids[i] = ito_data.rows[i].id;
      data.addresses[i] = accounts_address.rows[0].account_address;
    }

    console.log('ito_data....', ito_data);

    return new Promise(function (resolve, reject) {
      const url = `${server_url}/get-batch-balance`;
      axios
        .post(url, data)
        .then(response => {
          resolve(
            response.data?.data?.map((item, index) => {
              console.log(ito_data.rows[index]);
              return {
                id: ito_data.rows[index].token_id,
                token_name: ito_data.rows[index].token_name,
                token_address: ito_data.rows[index].token_address,
                price: ito_data.rows[index].price,
                'Per token price': ito_data.rows[index].price,
                ito_id: ito_data.rows[index].id,
                ito_name: ito_data.rows[index].name,
                holdings: item,
                Amount_of_tokens: item,
                token_name: ito_data.rows[index].token_name,
                total_worth: item * ito_data.rows[index].price,
                'Tokens worth': item * ito_data.rows[index].price,
                buying_spread: ito_data.rows[index].buying_spread,
                selling_spread: ito_data.rows[index].selling_spread,
              };
            }),
          );
        })
        .catch(error => {
          console.log(error.response);
          reject(error.response);
        });
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

const getWalletByAddress = async account_address => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.walletTable} where account_address='${account_address}'`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateWallet = async (walletId, fields) => {
  try {
    console.log('in update Wallet');
    const colunms = Object.keys(fields);

    const keysToUpdate = colunms.reduce((acc, field, index) => {
      acc += `${field}= '${fields[field]}'`;

      return index + 1 === colunms.length ? acc + '' : acc + ', ';
    }, '');

    const queryStr = `UPDATE ${DB.tables.walletTable} SET ${keysToUpdate} WHERE id = ${walletId}`;

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const p2pWallet = async (
  ito_token_id,
  partialFill,
  order_type,
  user_id,
  sub_order,
  token_price,
) => {
  try {
    console.log(ito_token_id, partialFill);
    console.log('getting orders');
    console.log({
      ito_token_id,
      partialFill,
      order_type,
      user_id,
      sub_order,
      token_price,
    });
    return await client.query(
      `SELECT * FROM ${DB.tables.exchangeOrdersTable} 
      WHERE ito_token_id = ${ito_token_id} 
      AND partialfill = ${partialFill} 
      AND order_type = '${order_type}'
      AND user_id <> ${user_id}
      AND sub_order = '${sub_order}'
      AND status = 'pending'
      AND token_price = ${token_price}
      ORDER BY created_at ASC`,
    );
  } catch (error) {
    console.log('ERROR', error);
    throw new Error(error.message);
  }
};

module.exports = {
  getAllWallets,
  getWalletById,
  getWalletByUser,
  createWallet,
  updateWallet,
  getWalletByAddress,
  getAccountLists,
  p2pWallet,
};

// const DB = require("./DB");

// const AllUsersAdminWallet = async (client, userID) => {
//   try {
//     let response = await client.query(
//       `SELECT fname, lname, email, country   FROM ${DB.tables.usersTable}`
//     );
//     return response;
//   } catch (e) {
//     return e.message;
//   }
// };

// const singleUserAdminSide = async (client, userID) => {
//   try {
//     let response = await client.query(
//       `SELECT  i.token_name, t.price , t.market_cap, t.balances,
//        t.fiat_balances, t.tokens
//        FROM ${DB.tables.tokenTable} t INNER JOIN
//        ${DB.tables.itoTokenTable} i ON
//        t.ito_token_id = i.id INNER JOIN ${DB.tables.usersTable} u ON
//        t.user_id = u.id WHERE t.user_id = ${userID}`
//     );
//     return response;
//   } catch (e) {
//     return e.message;
//   }
// };
// const getAdminWallet = async (client, userID) => {
//   try {
//     let response = await client.query(
//       `SELECT i.token_name, t.price , t.market_cap, t.balances,
//        t.fiat_balances, t.tokens
//        FROM ${DB.tables.tokenTable} t INNER JOIN
//        ${DB.tables.itoTokenTable} i ON
//        t.ito_token_id = i.id INNER JOIN ${DB.tables.itoAdminTable} u ON
//        t.ito_admin_id = u.id WHERE t.ito_admin_id = ${userID}`
//     );
//     return response;
//   } catch (e) {
//     return e.message;
//   }
// };
// const getAdminTokens = async (client, userID) => {
//   try {
//     let response = await client.query(
//       // `SELECT token FROM ${DB.tables.tokenTable} t INNER JOIN ${DB.tables.usersTable} u ON t.user_id = u.id WHERE user_id = ${userID}`
//       `SELECT tokens   FROM ${DB.tables.tokenTable} w
//        INNER JOIN ${DB.tables.itoAdminTable} u ON
//        w.ito_admin_id = u.id WHERE ito_admin_id = ${userID}`
//     );
//     return response;
//   } catch (e) {
//     return e.message;
//   }
// };
// const getUserTokenAdminSide = async (client, userID) => {
//   try {
//     let response = await client.query(
//       // `SELECT token FROM ${DB.tables.tokenTable} t INNER JOIN ${DB.tables.usersTable} u ON t.user_id = u.id WHERE user_id = ${userID}`
//       `SELECT tokens   FROM ${DB.tables.tokenTable} w
//        INNER JOIN ${DB.tables.usersTable} u ON
//        w.user_id = u.id WHERE user_id = ${userID}`
//     );
//     return response;
//   } catch (e) {
//     return e.message;
//   }
// };
// async function bank(
//   ito_admin_id,
//   country,
//   swift,
//   branch_name,
//   account_number,
//   from_account_number,
//   transfer_country,
//   transfer_amount,
//   transfer_fee,
//   total_amount,
//   proof_image
// ) {
//   try {
//     const now = new Date();
//     let response = await DB.insertIntoQueryWithClient(
//       DB.pool,
//       DB.tables.bankTable,
//       {
//         ito_admin_id: ito_admin_id,
//         country: country,
//         swift: swift,
//         branch_name: branch_name,
//         account_number: account_number,
//         from_account_number: from_account_number,
//         transfer_country: transfer_country,
//         transfer_amount: transfer_amount,
//         transfer_fee: transfer_fee,
//         total_amount: total_amount,
//         proof_image: proof_image,
//         created_at: new Date(),
//         updated_at: new Date(),
//       },
//       ["id"]
//     );
//     return response;
//   } catch (e) {
//     return e.message;
//   }
// }

// const getUserTokenTransactions = async (client, userID) => {
//   try {
//     let response = await client.query(
//       `SELECT u.fname, u.lname,
//        w.token_transaction_status, w.token   FROM ${DB.tables.walletTransactionsTable} w
//        INNER JOIN ${DB.tables.usersTable} u ON
//        w.user_id = u.id WHERE w.user_id = ${userID}`
//     );
//     return response;
//   } catch (e) {
//     return e.message;
//   }
// };
// const getFiatTransactions = async (client, userID) => {
//   try {
//     let response = await client.query(
//       `SELECT fname, lname, amount,
//       transaction_status, currency, fiat_balance   FROM ${DB.tables.fiatTransactionsTable} w
//       INNER JOIN ${DB.tables.usersTable} u ON
//       w.user_id = u.id WHERE user_id = ${userID}`
//     );
//     return response;
//   } catch (e) {
//     return e.message;
//   }
// };

// const getWalletByUser = async (client, userID)=>{
//      try {

//         return await client.query(`Select * FROM ${DB.tables.wallet} WHERE user_id = ${userID}`)

//      } catch (error) {
//         throw new Error(error.message)
//      }
// }

// const getUserBalance = async (client, userID) => {
//   try {
//     let response = await client.query(
//       `SELECT balances   FROM ${DB.tables.tokenTable} w
//        INNER JOIN ${DB.tables.usersTable} u ON
//        w.user_id = u.id WHERE user_id = ${userID}`
//     );
//     return response;
//   } catch (e) {
//     return e.message;
//   }
// };

// module.exports = {
//   getUserTokenTransactions: getUserTokenTransactions,
//   getFiatTransactions: getFiatTransactions,
//   AllUsersAdminWallet: AllUsersAdminWallet,
//   singleUserAdminSide: singleUserAdminSide,
//   getAdminWallet: getAdminWallet,
//   getUserTokenAdminSide: getUserTokenAdminSide,
//   getAdminTokens: getAdminTokens,
//   getUserBalance: getUserBalance,
//   bank: bank,
//   getWalletByUser
// };

//Changing in wallet
