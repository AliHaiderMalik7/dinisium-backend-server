const DB = require("./DB");
const client = DB.pool;

const saveAgentInvestor = async(fields)=>{
    try {
        return await DB.insertIntoQueryWithClient(client,DB.tables.trustedInvestorsTable,fields);
      } catch (error) {
       throw new Error(error.message)
      }
}

const findInvestors=async(query)=>{
    try {

        let filter = "";
        
        if(query){

           const queryFields = Object.keys(query);
           filter = queryFields.reduce((acc,field,index)=>{
                acc+= `${field}='${query[field]}'`
                
                return (index+1)===queryFields.length ? acc : acc+" AND "
            },"")
        }

         let queryStr = `
            SELECT t1.*,t2.ito_id,t2.name as series_name,t3.token_name FROM ${DB.tables.trustedInvestorsTable} t1
            LEFT JOIN ${DB.tables.itoSeriesTable} t2 ON t1.ito_series = t2.id
            LEFT JOIN ${DB.tables.itoTokenTable} t3 ON t2.ito_id = t3.ito_id
         `

        if(filter){
            queryStr += ` WHERE ${filter}`;
        }

        return await client.query(queryStr);

    } catch (error) {
        throw new Error(error.message)
    }
}

module.exports = {
    saveAgentInvestor,
    findInvestors
}
