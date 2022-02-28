const DB = require("./DB");
const client = DB.pool;

const create = async (fields) => {
    try {
        const returnFields = ["id","election_result", ...(Object.keys(fields))];
        return await DB.insertIntoQueryWithClient(client, DB.tables.electionTable, fields, returnFields);
    } catch (error) {
        throw new Error(error.message)
    }
}

const findAllElection = async (query,userId) => {

    try {

        let filter = "";

        if (query) {
            const queryFields = Object.keys(query);
            filter = queryFields.reduce((acc, field, index) => {

                acc += `${field}='${query[field]}'`

                return (index + 1) === queryFields.length ? acc : acc + " AND "
            }, "")
        }

        let queryStr = `SELECT * FROM ${DB.tables.electionTable}`

        if (filter) {
            queryStr += ` WHERE ${filter}`;
        }


        return await client.query(queryStr);

    } catch (error) {
        throw new Error(error.message)
    }
}

const findElectionById = async (id,userId) => {
    try {

       let queryStr = `SELECT t1.*, 
            CASE 
            WHEN t2.agree IS NULL 
            THEN False ELSE True END AS is_voted  
            FROM ${DB.tables.electionTable} t1 LEFT JOIN ${DB.tables.votesTable} t2 
            ON t1.id = t2.election_id AND t2.user_id = ${userId} 
            WHERE t1.id=${id}`;

        return await client.query(queryStr);

    } catch (error) {
        throw new Error(error.message)
    }
}

const updateElection = async (id, fields, returningFields) => {
    try {

        const colunms = Object.keys(fields);

        const keysToUpdate = colunms.reduce((acc, field, index) => {

            acc += `${field}='${fields[field]}'`

            return (index + 1) === colunms.length ? acc + "" : acc + ", ";

        }, "");

        let queryStr = `UPDATE ${DB.tables.electionTable} SET ${keysToUpdate} WHERE id = ${id}`;

        if (returningFields) {
            queryStr += ` returning ${returningFields.join(",")}`
        }

        return await client.query(queryStr);

    } catch (error) {
        throw new Error(error.message)
    }
}


const deleteElection = async (id) => {
    try {
        return await client.query(`DELETE FROM ${DB.tables.electionTable} WHERE id=${id}`);
    } catch (error) {
        throw new Error(error.message)
    }
}

const findElectionByIto = async (itoId) => {
    try {
        return await client.query(`Select * FROM ${DB.tables.electionTable} WHERE ito_id=${itoId}`);
    } catch (error) {
        throw new Error(error.message)
    }
}

const isUserVoted = async(userId,electionId)=>{
    try {
        return await client.query(`SELECT * FROM ${DB.tables.votesTable} WHERE user_id=${userId} AND election_id=${electionId}`)
    } catch (error) {
        throw new Error(error.message)
    }
}

const findAllVotes = async (query) => {
    try {

        let filter = "";

        if (query) {
            const queryFields = Object.keys(query);
            filter = queryFields.reduce((acc, field, index) => {

                acc += `${field}='${query[field]}'`

                return (index + 1) === queryFields.length ? acc : acc + " AND "
            }, "")
        }

        let queryStr = `SELECT * FROM ${DB.tables.votesTable} `

        if (filter) {
            queryStr += ` WHERE ${filter}`;
        }

        return await client.query(queryStr);

    } catch (error) {
        throw new Error(error.message)
    }
}


const createVote = async (fields)=>{
    try {
        const returnFields = ["id",...(Object.keys(fields))];
        return await DB.insertIntoQueryWithClient(client, DB.tables.votesTable, fields, returnFields);
    } catch (error) {
        throw new Error(error.message)
    }
}

const findOngoingElection = async(userId,query,itoIds)=>{

    try {
    
        let filter = "";

        if (query) {
            const queryFields = Object.keys(query);
            filter = queryFields.reduce((acc, field, index) => {

                acc += `${field}='${query[field]}'`

                return (index + 1) === queryFields.length ? acc : acc + " AND "
            }, "")
        }

        let queryStr =  `SELECT t1.*, 
            CASE 
            WHEN t2.agree IS NULL 
            THEN False ELSE True END AS is_voted  
            FROM ${DB.tables.electionTable} t1 LEFT JOIN ${DB.tables.votesTable} t2 
            ON t1.id = t2.election_id AND t2.user_id = ${userId} 
            WHERE t1.start_date < ( now()::date + '1 day'::interval) AND t1.end_date >= now() `;

            if (filter) {
                queryStr += ` AND ${filter}`;
            }

            if(itoIds){
                queryStr += ` AND t1.ito_id IN (${itoIds})`;
            }
        
        return client.query(queryStr);

    } catch (error) {
        throw new Error(error.message)
    }
}

const findUpcomingElection = async(query,itoIds)=>{
    try {

        let filter = "";

        if (query) {
            const queryFields = Object.keys(query);
            filter = queryFields.reduce((acc, field, index) => {

                acc += `${field}='${query[field]}'`

                return (index + 1) === queryFields.length ? acc : acc + " AND "
            }, "")
        }

        let queryStr = `SELECT * FROM ${DB.tables.electionTable} WHERE start_date > now() `

        if(filter) {
           queryStr += ` AND ${filter}`;
        }

        if(itoIds){
            queryStr += ` AND ito_id IN (${itoIds})`;
        }

        return client.query(queryStr);

    } catch (error) {
        throw new Error(error.message)
    }
}

const findClosedElection = async(query,itoIds)=>{
    try {

        let filter = "";

        if (query) {
            const queryFields = Object.keys(query);
            filter = queryFields.reduce((acc, field, index) => {

                acc += `${field}='${query[field]}'`

                return (index + 1) === queryFields.length ? acc : acc + " AND "
            }, "")
        }

        let queryStr = `SELECT * FROM ${DB.tables.electionTable} WHERE end_date < ( now()::date + '1 day'::interval) `

        if(filter) {
           queryStr += ` AND ${filter}`;
        }

        if(itoIds){
            queryStr += ` AND ito_id IN (${itoIds})`;
        }

        return client.query(queryStr);

    } catch (error) {
        throw new Error(error.message)
    }
}

const findItoElectionsCount = (itoId) =>{
    try {
        return client.query(`Select COUNT(id) FROM ${DB.tables.electionTable} WHERE ito_id=${itoId}`)
    } catch (error) {
        throw new Error(error.message)
    }
}

const findElectionsCount = () =>{
    try {
        return client.query(`Select COUNT(id) FROM ${DB.tables.electionTable}`)
    } catch (error) {
        throw new Error(error.message)
    }
}



module.exports = {
    create,
    findAllElection,
    findElectionById,
    updateElection,
    deleteElection,
    findElectionByIto,
    createVote,
    isUserVoted,
    findAllVotes,
    findOngoingElection,
    findUpcomingElection,
    findClosedElection,
    findItoElectionsCount,
    findElectionsCount
}


