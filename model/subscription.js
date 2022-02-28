const DB = require('./DB');
const client = DB.pool;
async function createSubscription(fields) {
  try {
    const now = new Date();
    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.subscriptionTable,
      fields,
      ['id', 'ito_name', 'ito_series', 'ito_token', 'description'],
    );
  } catch (e) {
    throw new Error(e.message);
  }
}

// draftSubscription
async function draftSubscription(fields) {
  try {
    // console.log('fields', fields);
    const now = new Date();
    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.draftSubscription,
      fields,
      ['id', 'ito_name', 'ito_series', 'ito_token', 'description', 'threshold'],
    );
  } catch (e) {
    console.log('error');
    throw new Error(e.message);
  }
}

// getDraftByUser
async function getDraftByUser(id) {
  return new Promise(function (resolve, reject) {
    client.query(
      `SELECT * from ${DB.tables.draftSubscription} WHERE user_id = '${id}'`,
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

// getdraftByID
async function getdraftByID(id) {
  return new Promise(function (resolve, reject) {
    client.query(
      `SELECT * from ${DB.tables.draftSubscription} WHERE id = '${id}'`,
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

// deleteDraftByUser
async function deleteDraftByUser(id) {
  return new Promise(function (resolve, reject) {
    client.query(
      `DELETE from ${DB.tables.draftSubscription} WHERE user_id = '${id}'`,
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
async function createSubscribers(user_id, subscription_id, investment) {
  try {
    const now = new Date();
    let response = await DB.insertIntoQueryWithClient(
      client,
      DB.tables.subscribersTable,
      {
        user_id: user_id,
        subscription_id: subscription_id,
        investment: investment,
        created_at: new Date(),
        updated_at: new Date(),
      },
      ['id'],
    );
    return response;
  } catch (e) {
    return e.message;
  }
}

async function getAllSubscribers(query) {
  try {
    let filter = '';

    if (query) {
      const queryFields = Object.keys(query);
      filter = queryFields.reduce((acc, field, index) => {
        acc += `${field}='${query[field]}'`;

        return index + 1 === queryFields.length ? acc : acc + ' AND ';
      }, '');
    }

    let queryStr = `Select * FROM ${DB.tables.subscribersTable}`;

    if (filter) {
      queryStr += ` WHERE ${filter}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
}

async function getSubscriptionByID(id) {
  return new Promise(function (resolve, reject) {
    client.query(
      `SELECT * from ${DB.tables.subscriptionTable} WHERE id = '${id}'`,
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

async function getSubscriptionByIDWithAdminsDetail(id) {
  return new Promise(function (resolve, reject) {
    client.query(
      `SELECT * from ${DB.tables.subscriptionTable} WHERE id = '${id}'`,
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

async function findAllSubscriptions(query) {
  try {
    let filter = '';

    if (query) {
      const queryFields = Object.keys(query);
      filter = queryFields.reduce((acc, field, index) => {
        acc += `${field}='${query[field]}'`;

        return index + 1 === queryFields.length ? acc : acc + ' AND ';
      }, '');
    }

    let queryStr = `Select * FROM ${DB.tables.subscriptionTable}`;

    if (filter) {
      queryStr += ` WHERE ${filter}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
}

async function findAllNonRejectedSubscriptions(query) {
  try {
    let filter = '';

    if (query) {
      const queryFields = Object.keys(query);
      filter = queryFields.reduce((acc, field, index) => {
        acc += `${field}='${query[field]}'`;

        return ' AND ' + acc;
      }, '');
    }

    let queryStr = `Select * FROM ${DB.tables.subscriptionTable} WHERE status != 'rejected'`;

    if (filter) {
      queryStr += ` ${filter} `;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
}

const getSubscriptionsByAdminId = async adminId => {
  try {
    return await client.query(
      `SELECT t1.* FROM ${DB.tables.subscriptionTable} t1 left join ${DB.tables.allotedSubscriptionsTable} t2 ON t1.id=t2.subscription_id WHERE t2.admin_id=${adminId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

// getApprovedSubscriptionDetails
const getApprovedSubscriptionDetails = async ID => {
  try {
    return await client.query(
      `select t1.fname,t2.created_at from ${DB.tables.usersTable} t1 left join ${DB.tables.subscriptionTable} t2 on t1.id = t2.user_approve where t2.id = ${ID} and t2.status = 'approved'`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

async function updateSubscription(fields, id) {
  try {
    const colunms = Object.keys(fields);

    const keysToUpdate = colunms.reduce((acc, field, index) => {
      acc += `${field}='${fields[field]}'`;

      return index + 1 === colunms.length ? acc + '' : acc + ', ';
    }, '');

    let queryStr = `UPDATE ${DB.tables.subscriptionTable} SET ${keysToUpdate} WHERE id = ${id}`;

    //    if(returningFields){
    //       queryStr+=` returning ${returningFields.join(",")}`
    //    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
}

//delete Alloted Admins

async function deleteAllotedDraft(id) {
  return new Promise(function (resolve, reject) {
    client.query(
      `DELETE FROM ${DB.tables.draftAlloted_ITO} WHERE drafted_ito_id = ${id} AND type='Subscription'`,
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

//update Subscription Draft
async function updateSubscriptionDraft(fields, id, returningFields) {
  try {
    const colunms = Object.keys(fields);

    const keysToUpdate = colunms.reduce((acc, field, index) => {
      acc += `${field}='${fields[field]}'`;

      return index + 1 === colunms.length ? acc + '' : acc + ', ';
    }, '');

    let queryStr = `UPDATE ${DB.tables.draftSubscription} SET ${keysToUpdate} WHERE id = ${id}`;

    if (returningFields) {
      queryStr += ` returning ${returningFields.join(',')}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
}

async function getOpenSubscription(query) {
  try {
    let filter = '';

    if (query) {
      const queryFields = Object.keys(query);
      filter = queryFields.reduce((acc, field, index) => {
        acc += `${field}='${query[field]}'`;

        return index + 1 === queryFields.length ? acc : acc + ' AND ';
      }, '');
    }

    let queryStr = `SELECT * FROM ${DB.tables.subscriptionTable} 
      WHERE start_date < now() AND end_date >= now() AND 
      ((is_threshold_reached=false AND threshold_type='limited') OR threshold_type='unlimited')`;

    if (filter) {
      queryStr += ` AND ${filter}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
}

async function getUpcomingSubscription(query) {
  try {
    let filter = '';

    if (query) {
      const queryFields = Object.keys(query);
      filter = queryFields.reduce((acc, field, index) => {
        acc += `${field}='${query[field]}'`;

        return index + 1 === queryFields.length ? acc : acc + ' AND ';
      }, '');
    }

    let queryStr = `SELECT * FROM ${DB.tables.subscriptionTable} WHERE start_date > now()  AND status='approved'`;

    if (filter) {
      queryStr += ` AND ${filter}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
}

async function findUserSubscriptions(userId) {
  try {
    return await client.query(`Select t1.id as sub_id, t1.investment,t1.user_id,t2.*,t3.fname,t3.lname FROM ${DB.tables.subscribersTable} t1 
            LEFT JOIN ${DB.tables.subscriptionTable} t2 ON t1.subscription_id = t2.id 
            LEFT JOIN ${DB.tables.usersTable} t3 ON t1.user_id = t3.id WHERE t1.user_id = ${userId}
        `);
  } catch (e) {
    throw new Error(error.message);
  }
}

module.exports = {
  createSubscription,
  createSubscribers,
  getAllSubscribers,
  deleteAllotedDraft,
  getSubscriptionByID,
  getSubscriptionByIDWithAdminsDetail,
  findAllSubscriptions,
  findAllNonRejectedSubscriptions,
  getSubscriptionsByAdminId,
  getApprovedSubscriptionDetails,
  findUserSubscriptions,
  updateSubscription,
  getOpenSubscription,
  getUpcomingSubscription,
  draftSubscription,
  updateSubscriptionDraft,
  getDraftByUser,
  getdraftByID,
  deleteDraftByUser,
};
