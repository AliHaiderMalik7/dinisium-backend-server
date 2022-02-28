const DB = require("./DB");
const client = DB.pool;

const saveParticipants = async (fields)=>{
    try {
        await DB.insertIntoQueryWithClient(client,DB.tables.participantsTable,fields,["id"])
    } catch (error) {
        throw new Error(error.message)
    }
}

const findItoParticipant= async(itoId,userId)=>{
    try {
        return await client.query(`Select * FROM ${DB.tables.participantsTable} WHERE user_id= ${userId} AND ito_id=${itoId}`)
    } catch (error) {
         throw new Error(error.message)
    }
}

const findParticipantIto = async(userId)=>{
    try {
        return await client.query(`Select * FROM ${DB.tables.participantsTable} WHERE user_id= ${userId}`)
    } catch (error) {
         throw new Error(error.message)
    }
}

const findParticipantCount = async(itoId)=>{
    try {
        return await client.query(`Select COUNT(id) FROM ${DB.tables.participantsTable} WHERE ito_id= ${itoId}`)
    } catch (error) {
         throw new Error(error.message)
    }
}

const findParticipantRegisterPerMonth = async(itoId)=>{
    try {

       let queryStr = `
        SELECT 
             DATE_TRUNC('month',created_at) AS register_to_month,
             COUNT(id) AS count
             FROM ${DB.tables.participantsTable} 
             WHERE ito_id = ${itoId}
             GROUP BY DATE_TRUNC('month',created_at)`;

        return await client.query(queryStr);

    } catch (error) {
         throw new Error(error.message)
    }
}

module.exports = {
    saveParticipants,
    findItoParticipant,
    findParticipantIto,
    findParticipantCount,
    findParticipantRegisterPerMonth
}