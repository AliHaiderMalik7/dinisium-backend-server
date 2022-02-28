const DB = require("./DB");
const client = DB.pool;

const updateContent = async (fields,returningFields)=>{
    try {
        const colunms = Object.keys(fields);
        
        const keysToUpdate = colunms.reduce((acc,field,index)=>{

            acc+=`${field}='${fields[field]}'`

            return (index+1)=== colunms.length ? acc+"":acc+", ";

        },"");

        let queryStr = `UPDATE ${DB.tables.contentTable} SET ${keysToUpdate}`;

       if(returningFields){
          queryStr+=` returning ${returningFields.join(",")}`
       }

       return await client.query(queryStr);

    } catch (error) {
        throw new Error(error.message)
    }
}

const findContents = async()=>{
    try {
        return await client.query(`Select * from ${DB.tables.contentTable}`)
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = {
    updateContent,
    findContents
}