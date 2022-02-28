const DB = require("./DB");
const client = DB.pool;
const axios = require("axios");
const server_url = process.env.BLOCKCHAIN_SERVER_URL;

const getBatchBalance = async (ito_id, account_address) => {
  try {
    console.log("In get batch balance ");
    const data = {
      ito_ids: [ito_id],
      addresses: [account_address],
    };
    console.log(data);

    return new Promise(function (resolve, reject) {
      const url = `${server_url}/get-batch-balance`;
      axios
        .post(url, data)
        .then((response) => {
          console.log("Hello World");
          resolve(response.data.data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  } catch (error) {
    throw new Error(error);
  }
};

const saveTransaction = async (fields) => {
  try {
    // const returnFields = ["id",...(Object.keys(fields))];
    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.walletTransactionsTable,
      fields
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getTransactions = async (query) => {
  try {
    let filter = "";

    if (query) {
      const queryFields = Object.keys(query);
      filter = queryFields.reduce((acc, field, index) => {
        acc += `${field}='${query[field]}'`;

        return index + 1 === queryFields.length ? acc : acc + " AND ";
      }, "");
    }

    let queryStr = `SELECT t1.*,t2.fname as user_firstname,t2.lname as user_lastname FROM ${DB.tables.walletTransactionsTable} t1 LEFT JOIN ${DB.tables.usersTable} t2 ON t1.user_id=t2.id`;

    if (filter) {
      queryStr += ` WHERE ${filter}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const getTransactionById = async (id) => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.walletTransactionsTable} where to_user_id=${id}`
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getAllTransactions = async () => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.walletTransactionsTable}`
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getTokenSoldHistory = (client, tokenId, filterBy) => {
  return new Promise(function (resolve, reject) {
    let queryStr = `select ito_id, SUM(token) as tokens, date_trunc('${filterBy}', created_at) as date
    from wallet_transactions
    where from_user_id is null and ito_id = ${tokenId}
    group by ito_id, date_trunc('${filterBy}', created_at)
    order by date_trunc('${filterBy}', created_at)`;

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

module.exports = {
  saveTransaction,
  getTransactionById,
  getTransactions,
  getBatchBalance,
  getAllTransactions,
  getTokenSoldHistory,
};
