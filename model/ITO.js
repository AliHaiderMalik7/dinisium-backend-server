const DB = require('./DB');
const client = DB.pool;

const createITo = async (fields, returnFields) => {
  try {
    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.itoTable,
      fields,
      returnFields,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const createIToAssetDraft = async (fields, returnFields) => {
  try {
    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.itoAssetDraft,
      fields,
      returnFields,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getITOs = async query => {
  try {
    let filter = '';

    if (query) {
      const queryFields = Object.keys(query);
      filter = queryFields.reduce((acc, field, index) => {
        acc += `${field}='${query[field]}'`;

        return index + 1 === queryFields.length ? acc : acc + ' AND ';
      }, '');
    }

    let queryStr = `SELECT * FROM ${DB.tables.itoTable}`;

    if (filter) {
      queryStr += ` WHERE ${filter}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const getITOsByAdminId = async adminId => {
  try {
    return await client.query(
      `SELECT t1.*,t3.token_name,t3.supply,t3.remaining_supply,
      CASE WHEN t1.closed=true THEN 'closed' 
      WHEN t1.status='pending' THEN 'pending' 
      WHEN t1.status='approved' THEN 'approved'
      WHEN t1.status='rejected' THEN 'rejected'
      END as status
      FROM ${DB.tables.itoTable} t1 left join ${DB.tables.allotedItosTable} t2 ON t1.id=t2.ito_id left join ${DB.tables.itoTokenTable} t3 ON t1.id=t3.ito_id WHERE t2.admin_id=${adminId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

//draftIto
async function draftIto(fields, returnFields) {
  try {
    // console.log('fields', fields);
    const now = new Date();
    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.itoDraft,
      fields,
      returnFields,
    );
  } catch (e) {
    console.log('error');
    throw new Error(e.message);
  }
}

//allotedAdminsDraft
async function allotedAdmins(fields, returnFields) {
  try {
    console.log('fields', fields);
    const now = new Date();
    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.draftAlloted_ITO,
      fields,
      returnFields,
    );
  } catch (e) {
    console.log('error');
    throw new Error(e.message);
  }
}

//getDraftedITO
const getDraftedITO = async userID => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.itoDraft} WHERE user_id=${userID}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

//deleteDraftedAdmins
const deleteDraftedAdmins = async userID => {
  try {
    return await client.query(
      `DELETE  FROM ${DB.tables.draftAlloted_ITO} WHERE drafted_ito_id=${userID}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

//getDraftByID
const getDraftByID = async userID => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.itoDraft} WHERE id=${userID}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

//deleteDraft
const deleteDraft = async userID => {
  try {
    return await client.query(
      `DELETE  FROM ${DB.tables.itoDraft} WHERE user_id=${userID}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const findOngoingItosByAdminId = async adminId => {
  try {
    return client.query(
      `SELECT t1.*,t3.token_name,t3.supply,t3.remaining_supply FROM ${DB.tables.itoTable} t1 left join ${DB.tables.allotedItosTable} t2 ON t1.id=t2.ito_id left join ${DB.tables.itoTokenTable} t3 ON t1.id=t3.ito_id WHERE t1.start_date < ( now()::date + '1 day'::interval) AND t1.closed=false AND t2.admin_id=${adminId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const findUpcomingItosByAdminId = async adminId => {
  try {
    return client.query(
      `SELECT t1.*,t3.token_name,t3.supply,t3.remaining_supply FROM ${DB.tables.itoTable} t1 left join ${DB.tables.allotedItosTable} t2 ON t1.id=t2.ito_id left join ${DB.tables.itoTokenTable} t3 ON t1.id=t3.ito_id WHERE t1.start_date > now() AND t1.closed=false AND t2.admin_id=${adminId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const findClosedItosByAdminId = async adminId => {
  try {
    return client.query(
      `SELECT t1.*,t3.token_name,t3.supply,t3.remaining_supply FROM ${DB.tables.itoTable} t1 left join ${DB.tables.allotedItosTable} t2 ON t1.id=t2.ito_id left join ${DB.tables.itoTokenTable} t3 ON t1.id=t3.ito_id WHERE t1.closed=true AND t2.admin_id=${adminId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getITOById = async itoId => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.itoTable} WHERE id=${itoId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getNonRejectedItoByName = async name => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.itoTable} WHERE name='${name}' AND status != 'rejected'`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};
//getRejectedItos
const getRejectedItos = async UserId => {
  try {
    return await client.query(
      `SELECT  t1.id as ito_id, t1.name as ito_name,t1.description as description,t1.term_sheets,
      t1.status as ito_status,t1.start_date as ito_start_date,t1.rejection_message,t2.token_name as ito_token, 
      t2.token_symbol as ito_token_symbol,t2.target_value as token_target_value,t2.price as token_price,
      t2.supply as token_supply,t2.buying_spread,t2.selling_spread,t3.name as ito_series,t3.description as series_description,
        t3.supply as series_supply, t3.start_date as series_start_date, t3.end_date as series_end_date FROM ${DB.tables.itoTable} t1
        left join ${DB.tables.itoTokenTable} t2 ON t1.id = t2.ito_id
        left join ${DB.tables.itoSeriesTable} t3 ON t3.ito_id = t1.id
      WHERE t1.user_id='${UserId}' AND t1.status = 'rejected' AND t3.initial_series = 'true'`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};
const findOngoinItos = async () => {
  try {
    return client.query(
      `SELECT t1.*,t2.id as ito_token_id FROM ${DB.tables.itoTable} t1 LEFT JOIN ${DB.tables.itoTokenTable} t2 ON t1.id=t2.ito_id WHERE t1.start_date < ( now()::date + '1 day'::interval) AND t1.closed=false `,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const findUpcomingItos = async () => {
  try {
    return client.query(
      `SELECT * FROM ${DB.tables.itoTable} WHERE start_date > now() `,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const findClosedItos = async () => {
  try {
    return client.query(
      `SELECT * FROM ${DB.tables.itoTable} WHERE closed=true`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getAvaiableItos = async () => {
  try {
    let queryStr = `
        Select * from ${DB.tables.itoTable} WHERE id NOT IN
       ( Select t1.id From ${DB.tables.itoTable} t1 
         INNER JOIN ${DB.tables.usersTable} t2 
         ON t1.id = t2.ito_id )`;

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateITo = async (fields, itoId, returningFields) => {
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

    let queryStr = `UPDATE ${DB.tables.itoTable} SET ${keysToUpdate} WHERE id = ${itoId}`;

    if (returningFields) {
      queryStr += ` returning ${returningFields.join(',')}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

//update_draft
const update_draft = async (fields, itoId, returningFields) => {
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

    let queryStr = `UPDATE ${DB.tables.itoDraft} SET ${keysToUpdate} WHERE id = ${itoId}`;

    if (returningFields) {
      queryStr += ` returning ${returningFields.join(',')}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const deleteITO = async itoId => {
  try {
    return await client.query(
      `DELETE FROM ${DB.tables.itoTable} WHERE id=${itoId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

//getItoApproveddetails
const getItoApproveddetails = async itoId => {
  try {
    return await client.query(
      `select t1.fname,t2.created_at from ${DB.tables.usersTable} t1 left join ${DB.tables.itoTable} t2 on t1.id = t2.user_approve where t2.id = ${itoId} and t2.status = 'approved'`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
  e;
};
const getAssignedItoDetail = async userId => {
  try {
    return client.query(
      `SELECT t2.name,t2.start_date,t2.end_date,t3.token_name, t3.supply,t3.remaining_supply, t4.account_address FROM ${DB.tables.usersTable} t1 JOIN ${DB.tables.itoTable} t2 ON t1.ito_id=t2.id LEFT JOIN ${DB.tables.itoTokenTable} t3 on t2.id=t3.ito_id LEFT JOIN ${DB.tables.itoWalletTable} t4 on t2.id=t4.ito_id  WHERE t1.id=${userId} `,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

// getItoRevenue
const getItoSpreadAmount = async (id, order, status) => {
  try {
    console.log('status', status);
    return client.query(
      // `select SUM(amount) as total_revenue from ${DB.tables.walletTransactionsTable} where ito_id=${id}`,
      `select SUM(amount) as actual_amount, SUM(spreadedamount) as spreaded_amount from ${DB.tables.exchangeOrdersTable} where status='approved'AND ito_token_id=${id} AND order_type='${order}'`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

//getTokensSold
const getTokensSold = async id => {
  try {
    return client.query(
      `select SUM(amount) as total_revenue from ${DB.tables.walletTransactionsTable} where ito_id=${id} AND from_user_id IS null `,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getItoToLink = async (client, userId) => {
  return new Promise(function (resolve, reject) {
    let queryStr = `select id,name from ito where id IN 
    (select DISTINCT ito_id from alloted_itos where ito_id NOT IN 
    (select ito_id from alloted_itos where admin_id = ${userId}))`;
    console.log('querystr : ', queryStr);
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
  createITo,
  updateITo,
  getITOs,
  getITOsByAdminId,
  findOngoingItosByAdminId,
  findUpcomingItosByAdminId,
  findClosedItosByAdminId,
  getITOById,
  getItoApproveddetails,
  getNonRejectedItoByName,
  deleteITO,
  getAvaiableItos,
  findClosedItos,
  findUpcomingItos,
  findOngoinItos,
  getAssignedItoDetail,
  getItoSpreadAmount,
  getTokensSold,
  getItoToLink,
  draftIto,
  allotedAdmins,
  getDraftedITO,
  deleteDraft,
  createIToAssetDraft,
  getDraftByID,
  getRejectedItos,
  update_draft,
  deleteDraftedAdmins,
};
