const DB = require("./DB");
const client = DB.pool;

const addBankDetails = async (fields) => {
  try {
    const returnFields = ["id", ...Object.keys(fields)];
    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.bankDetail,
      fields,
      returnFields
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

// const getBankDetails=async(query)=>{

//     try {

//         let filter = "";

//         if(query){
//            const queryFields = Object.keys(query);
//            filter = queryFields.reduce((acc,field,index)=>{
//                 acc+= `${field}='${query[field]}'`

//                 return (index+1)===queryFields.length ? acc : acc+" AND "
//             },"")
//         }

//          let queryStr = `SELECT * FROM ${DB.tables.bankDetail}`

//         if(filter){
//             queryStr += ` WHERE ${filter}`;
//         }

//         return await client.query(queryStr);

//     } catch (error) {
//         throw new Error(error.message)
//     }
// }
const getBankDetails = async (query) => {
  try {
    return await client.query(
      `SELECT t1.*,t2.fname,t2.lname FROM ${DB.tables.bankDetail} t1 LEFT JOIN ${DB.tables.usersTable} t2 ON t1.user_id=t2.id WHERE t1.status='${query.status}'`
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getBankDetailById = async (bankId) => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.bankDetail} WHERE id=${bankId}`
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateBankDetail = async (bankId, fields) => {
  try {
    const colunms = Object.keys(fields);

    const keysToUpdate = colunms.reduce((acc, field, index) => {
      acc += `${field}='${fields[field]}'`;

      return index + 1 === colunms.length ? acc + "" : acc + ", ";
    }, "");

    let queryStr = `UPDATE ${DB.tables.bankDetail} SET ${keysToUpdate} WHERE id = ${bankId}`;

    //    if(returningFields){
    //       queryStr+=` returning ${returningFields.join(",")}`
    //    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const deleteBankDetail = async (client, bankId) => {
  try {
    return await client.query(
      `DELETE FROM ${DB.tables.bankDetail} WHERE id=${bankId}`
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const findSingleApprovedDeposits = async () => {
  try {
    return await client.query(
      `SELECT t1.*,t2.fname,t2.lname FROM ${DB.tables.bankDetail} t1 LEFT JOIN ${DB.tables.usersTable} t2 ON t1.user_id=t2.id WHERE status='pending' AND user1_approve IS NOT NULL`
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const findNotApprovedDeposits = async () => {
  try {
    return await client.query(
      `SELECT t1.*,t2.fname,t2.lname FROM ${DB.tables.bankDetail} t1 LEFT JOIN ${DB.tables.usersTable} t2 ON t1.user_id=t2.id WHERE status='pending' AND user1_approve IS NULL AND user2_approve IS NULL`
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  addBankDetails,
  getBankDetailById,
  getBankDetails,
  updateBankDetail,
  deleteBankDetail,
  findSingleApprovedDeposits,
  findNotApprovedDeposits,
};
