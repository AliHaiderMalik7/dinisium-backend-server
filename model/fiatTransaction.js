const DB = require("./DB");
const client = DB.pool;

const saveFiatTransaction = async(transaction)=>{
    try {
        return await DB.insertIntoQueryWithClient(client,DB.tables.fiatTransactionsTable,transaction);
      } catch (error) {
          throw new Error(error.message)
      }
}

const findTransactionByUser = async(userId)=>{
    try {
       return  client.query(`
       Select t1.*,t2.token_name FROM ${DB.tables.fiatTransactionsTable} t1
       LEFT JOIN ${DB.tables.itoTokenTable} t2 ON t1.ito_id = t2.ito_id
       WHERE user_id=${userId}`)
    } catch (error) {
        throw new Error(error.message)
    }
}

const findAllFiatTransactions = async(query)=>{
    try {
        let filter = "";

        if(query){
           const queryFields = Object.keys(query);
           filter = queryFields.reduce((acc,field,index)=>{
                acc+= `${field}='${query[field]}'`
                
                return (index+1)===queryFields.length ? acc : acc+" AND "
            },"")
        }

         let queryStr = `Select * FROM ${DB.tables.fiatTransactionsTable}`

        if(filter){
            queryStr += ` WHERE ${filter}`;
        }

        return await client.query(queryStr);

    } catch (error) {
        throw new Error(error.message)
    }
}

const findItoInvestPerMonth = async(itoId)=>{
    try {
        let queryStr = `
        SELECT 
             DATE_TRUNC('month',created_at) AS investment_to_month,
             SUM(amount) AS investment
             FROM ${DB.tables.fiatTransactionsTable} 
             WHERE ito_id = ${itoId} AND ito_series IS NOT NULL
             GROUP BY DATE_TRUNC('month',created_at)`;

             return await client.query(queryStr);

    } catch (error) {
        throw new Error(error.message)
    }
}

const findInvestPerMonth = async()=>{
    
    try {
        let queryStr = `
        SELECT 
             DATE_TRUNC('month',created_at) AS investment_to_month,
             SUM(amount) AS investment
             FROM ${DB.tables.fiatTransactionsTable}
             WHERE ito_series IS NOT NULL
             GROUP BY DATE_TRUNC('month',created_at)`;

             return await client.query(queryStr);

    } catch (error) {
        throw new Error(error.message)
    }
}

module.exports = { 
    saveFiatTransaction,
    findTransactionByUser,
    findAllFiatTransactions,
    findItoInvestPerMonth,
    findInvestPerMonth
}