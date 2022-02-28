const DB = require('./DB');
const client = DB.pool;

// #1 query
async function getUserProfileById(client, userID) {
  try {
    let response = await client.query(
      `SELECT OU.fname, OU.lname,OU.country,full_name,email,contact_no,state_or_province,permanent_address,personal_photo,kyc_status from ${DB.tables.usersTable} as OU LEFT JOIN ${DB.tables.kycTable} as OUC ON OU.id = OUC.user_id WHERE OU.id = ${userID}`,
    );

    return response;
  } catch (e) {
    return e.message;
  }
}

// #2 query
async function blockUserById(client, userID, status) {
  try {
    let response = await client.query(
      `UPDATE ${DB.tables.usersTable} SET is_blocked = ${status} WHERE id = ${userID}`,
    );

    return response;
  } catch (e) {
    throw new Error(error.message);
  }
}

const getUserByEmail = async email => {
  try {
    return await client.query(
      `Select * from ${DB.tables.usersTable} WHERE email = '${email}'`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getAllUsers = async query => {
  try {
    let filter = '';

    if (query) {
      const queryFields = Object.keys(query);
      filter = queryFields.reduce((acc, field, index) => {
        acc += `${field}='${query[field]}'`;

        return index + 1 === queryFields.length ? acc : acc + ' AND ';
      }, '');
    }

    let queryStr = `SELECT id,role,fname,lname,email,contact_no,country,is_email_verified, is_blocked,created_at FROM ${DB.tables.usersTable}`;

    if (filter) {
      queryStr += ` WHERE ${filter}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const getAllUsersWithoutCredentials = async query => {
  try {
    let filter = '';

    if (query) {
      const queryFields = Object.keys(query);
      filter = queryFields.reduce((acc, field, index) => {
        acc += `${field}='${query[field]}'`;

        return index + 1 === queryFields.length ? acc : acc + ' AND ';
      }, '');
    }

    let queryStr = `SELECT id,role,fname,lname,email,contact_no,country,is_blocked FROM ${DB.tables.usersTable}`;

    if (filter) {
      queryStr += ` WHERE ${filter}`;
    }

    console.log('queryStr from getAllUsersWithoutCredentials ....', queryStr);
    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};
const getAdminsToAssignItos = async adminId => {
  try {
    let queryStr = `SELECT id,role,fname,lname,email,contact_no,country,is_blocked, concat(fname,' ', lname) as label FROM ${DB.tables.usersTable} where role = 'admin' AND id != ${adminId}`;

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const getAdminsList = async fields => {
  // try {
  //   let filter = "";

  //   if (query) {
  //     const queryFields = Object.keys(query);
  //     filter = queryFields.reduce((acc, field, index) => {
  //       acc += `${field}='${query[field]}'`;

  //       return index + 1 === queryFields.length ? acc : acc + " AND ";
  //     }, "");
  //   }

  //   let queryStr = ` SELECT t1.id,t1.ito_id,t1.fname,t1.lname,t1.email,t1.contact_no,t1.country,t1.role,t2.name as ito_name FROM ${DB.tables.usersTable} t1 LEFT JOIN ${DB.tables.itoTable} t2 ON t1.ito_id=t2.id WHERE t1.role IN ('admin','sub-admin') `;

  //   if (filter) {
  //     queryStr += ` AND ${filter} ORDER BY t1.id ASC`;
  //   } else {
  //     queryStr += ` ORDER BY t1.id ASC`;
  //   }

  //   return await client.query(queryStr);
  // } catch (error) {
  //   throw new Error(error.message);
  // }
  return new Promise(function (resolve, reject) {
    let queryStr = `SELECT id, CONCAT(fname, ' ', lname) AS name, ${fields} 
        FROM ${DB.tables.usersTable} WHERE role = 'admin' AND is_email_verified = 'true'`;
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

const getAdminDetail = async (fields, userId) => {
  // try {
  //   return await client.query(
  // //     let queryStr = `SELECT t1.${fields}, t1.created_at, t1.updated_at ,t2.name as ito_name,t2.id as ito_id
  //     FROM ${DB.tables.usersTable} t1 LEFT JOIN ${DB.tables.itoTable} t2
  //     ON t1.id=t2.user_id
  //     WHERE t1.id=${userId} AND t1.role = 'admin' AND t1.is_email_verified = 'true'
  //     ORDER BY t2.created_at desc`;
  //   );
  // } catch (error) {
  //   throw new Error(error.message);
  // }
  return new Promise(function (resolve, reject) {
    let queryStr = `SELECT id, CONCAT(fname, ' ', lname) AS name, ${fields}
      FROM ${DB.tables.usersTable} 
      WHERE id=${userId} AND role = 'admin' AND is_email_verified = 'true'`;
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

const getItoDetailOfAdmin = async userId => {
  return new Promise(function (resolve, reject) {
    let queryStr = `select ito_id, token_name as ito_name
        from ito_token 
        where ito_id IN (select ito_id 
        from alloted_itos
        where admin_id = ${userId})
        order by ito_id, token_name`;
    client.query(queryStr, function (error, result) {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
  });
};

const assignITOToAdmin = async (adminId, itoId, returningFields) => {
  try {
    let queryStr = `UPDATE ${DB.tables.usersTable} SET ito_id = ${itoId} WHERE id = ${adminId}`;

    if (returningFields) {
      queryStr += ` returning ${returningFields.join(',')}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const getUserById = async userId => {
  try {
    // return await client.query(
    //   `SELECT * FROM ${DB.tables.usersTable} WHERE id=${userId}`
    // );
    return await client.query(
      `SELECT t1.*,t2.kyc_status,t2.personal_photo 
             from ${DB.tables.usersTable} t1
             LEFT JOIN ${DB.tables.kycTable} t2
             ON t1.id = t2.user_id
             WHERE t1.id = ${userId} `,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const blockAdminById = async (client, id, status) => {
  // try {
  //   const colunms = Object.keys(fields);

  //   const keysToUpdate = colunms.reduce((acc, field, index) => {
  //     acc += `${field}='${fields[field]}'`;

  //     return index + 1 === colunms.length ? acc + "" : acc + ", ";
  //   }, "");

  //   let queryStr = `UPDATE ${DB.tables.usersTable} SET ${keysToUpdate} WHERE id = ${userId}`;

  //   if (returningFields) {
  //     queryStr += ` returning ${returningFields.join(",")}`;
  //   }

  //   return await client.query(queryStr);
  // } catch (error) {
  //   throw new Error(error.message);
  // }
  return new Promise(function (resolve, reject) {
    const queryStr = `UPDATE ${DB.tables.usersTable} SET is_blocked = ${status} WHERE id = ${id} AND role = 'admin'`;
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

const deleteUser = userId => {
  try {
    client.query(`DELETE FROM ${DB.tables.usersTable} WHERE id= ${userId}`);
  } catch (error) {
    throw new Error(error.message);
  }
};
const removeAdminITO = (adminId, itoId) => {
  try {
    client.query(
      `DELETE FROM ${DB.tables.allotedItosTable} WHERE admin_id= ${adminId} AND ito_id = ${itoId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};
const saveAdminPermissions = async (userId, permissions) => {
  try {
    let permisiionvalue = permissions.map(permission =>
      DB.insertIntoQueryWithClient(client, DB.tables.subAdminPermissionsTable, {
        sub_admin: userId,
        permission,
        created_at: new Date(),
        updated_at: new Date(),
      }),
    );

    return await Promise.all(permisiionvalue);
  } catch (error) {
    throw new Error(error.message);
  }
};

const findAllPermissions = async () => {
  try {
    return await client.query(`SELECT * FROM ${DB.tables.permissionsTable}`);
  } catch (error) {
    throw new Error(error.message);
  }
};

const findUserPermissions = async userId => {
  try {
    return await client.query(
      `SELECT t1.name FROM ${DB.tables.permissionsTable} t1 where id IN (Select permission FROM ${DB.tables.subAdminPermissionsTable} WHERE sub_admin=${userId}) `,
    );
  } catch (error) {}
};

const deleteUserPermissions = async userId => {
  try {
    return await client.query(
      `DELETE FROM ${DB.tables.subAdminPermissionsTable} WHERE sub_admin=${userId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const findUsersCount = async () => {
  try {
    return await client.query(
      `SELECT COUNT(id) FROM ${DB.tables.usersTable} WHERE role = 'user'`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};
//getSoldTokens
const getSoldTokens = async (client, filterBy, interval) => {
  try {
    console.log('Filter & interval is ....', filterBy, interval);
    return new Promise(function (resolve, reject) {
      let queryStr = `SELECT 
      TO_CHAR( date_trunc('${filterBy}',  created_at ), '${filterBy}') AS "${filterBy}",
      date_trunc('${filterBy}',  created_at   ) as Registered_at,
      Sum(amount) AS total_investment
      from ${DB.tables.walletTransactionsTable} t1
      where t1.created_at >= NOW()::date - INTERVAL '${interval}' 
        GROUP BY date_trunc('${filterBy}', created_at) 
            ORDER BY date_trunc('${filterBy}', created_at) ASC ;
              `;

      client.query(queryStr, function (error, result) {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      });
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

//getRegisteredUsers
const getRegisteredUsers = async (client, filterBy, interval) => {
  try {
    var generate;
    console.log('Filter  is ....', filterBy);
    console.log('Interval is ....', interval);
    return new Promise(function (resolve, reject) {
      // if (filterBy === 'hour') {
      //   console.log('Query for 24 hours');
      //   generate = `current_date,current_date + '1 day - 1 hour'::interval,'1 hour'`;
      // }
      // if (filterBy === 'Day') {
      //   console.log('Query for 30 days');
      //   generate = `timestamp '2022-01-01'
      //   ,NOW()
      //   , interval  '1 Day' `;
      // }
      // if (filterBy === 'Month') {
      //   console.log('Query for Months');
      //   generate = ` NOW()::date - INTERVAL '${interval}'
      //   ,NOW()
      //   , interval  '1 month' `;
      // }

      // console.log('generate data');
      //get exact data for month
      // let queryStr = `SELECT *
      // FROM  (
      //    SELECT x
      //    FROM   generate_series
      //                (${generate}) t(x)
      //    ) d
      // LEFT   JOIN (
      //    SELECT date_trunc('${filterBy}', created_at)::date AS x
      //         , count(*) AS count
      //    FROM   ${DB.tables.usersTable}

      //        GROUP  BY 1
      //    ) t USING (x)
      // ORDER  BY x ASC; `;

      //generate Time series
      // let queryStr = `(select  x
      // from    generate_series
      //             (current_date,current_date + '1 day - 1 hour'::interval,'1 hour') as t(x))  ORDER BY x ASC`;

      // let queryStr = `select to_char(date_trunc('DAY',created_at), 'YYYY-MM-DD'),count(created_at)
      // from ${DB.tables.usersTable}  where
      // created_at <= '2022-12-06' and created_at >= '2021-12-01' group by
      // date_trunc('DAY',created_at) order by date_trunc('DAY',created_at) ASC;`;

      // `SELECT
      // created_at,
      // COUNT(created_at) AS Count
      // from ${DB.tables.usersTable} t1
      // where t1.created_at >= NOW()::date - INTERVAL '${interval}' AND t1.role='user'
      //   GROUP BY date_trunc('${filterBy}', created_at)
      //       ORDER BY date_trunc('${filterBy}', created_at) DESC ;
      //         `
      let queryStr = ` SELECT
      date_trunc('${filterBy}', created_at) as Registered_at,
      COUNT(created_at) AS Count
      from ${DB.tables.usersTable}
      where created_at >= NOW() - INTERVAL '1 Year'  GROUP BY date_trunc('${filterBy}', created_at)
            ORDER BY date_trunc('${filterBy}', created_at) ASC;`;
      client.query(queryStr, function (error, result) {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      });
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

const findUsersRegistered = async (client, filterBy) => {
  try {
    console.log('Filter is ....', filterBy);
    return new Promise(function (resolve, reject) {
      let queryStr = `SELECT 
              date_trunc('${filterBy}', created_at) as Registered_at,
              COUNT(created_at) AS Count
              FROM ${DB.tables.usersTable}
              WHERE role = 'user' AND is_email_verified = 'true' GROUP BY date_trunc('${filterBy}', created_at) 
              ORDER BY date_trunc('${filterBy}', created_at) `;

      client.query(queryStr, function (error, result) {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      });
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

const getAdminWithNoIto = async () => {
  try {
    return await client.query(
      `SELECT id,fname,lname,ito_id FROM ${DB.tables.usersTable} WHERE role='admin' AND ito_id is NULL`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateUser = async (userID, fields, returningFields) => {
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

    let queryStr = `UPDATE ${DB.tables.usersTable} SET ${keysToUpdate} WHERE id = ${userID}`;

    if (returningFields) {
      queryStr += ` returning ${returningFields.join(',')}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  updateUser,
  getUserProfileById: getUserProfileById,
  blockUserById: blockUserById,
  getUserByEmail,
  getAllUsers,
  getAllUsersWithoutCredentials,
  getAdminsToAssignItos,
  getAdminsList,
  getAdminDetail,
  getItoDetailOfAdmin,
  getUserById,
  assignITOToAdmin,
  blockAdminById,
  deleteUser,
  saveAdminPermissions,
  findAllPermissions,
  findUserPermissions,
  deleteUserPermissions,
  findUsersCount,
  findUsersRegistered,
  getAdminWithNoIto,
  removeAdminITO,
  getRegisteredUsers,
  getSoldTokens,
};
