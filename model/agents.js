const DB = require("./DB");

const registerAgent = async (client, fields) => {
  try {
    const returnFields = ["id", ...Object.keys(fields)];

    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.agentsTable,
      fields,
      returnFields
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getAgents = async (client, query) => {
  try {
    let filter = "";

    if (query) {
      const queryFields = Object.keys(query);

      filter = queryFields.reduce((acc, field, index) => {
        acc += `${field}='${query[field]}'`;

        return index + 1 === queryFields.length ? acc : acc + " AND ";
      }, "");
    }
    let queryStr = `SELECT * FROM ${DB.tables.agentsTable}`;

    if (filter) {
      queryStr += ` WHERE ${filter}`;
    }
    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const getAgentById = async (client, agentId) => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.agentsTable} WHERE id=${agentId}`
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateAgent = async (client, fields, agentId, returningFields) => {
  try {
    const colunms = Object.keys(fields);

    const keysToUpdate = colunms.reduce((acc, field, index) => {
      acc += `${field}='${fields[field]}'`;

      return index + 1 === colunms.length ? acc + "" : acc + ", ";
    }, "");

    let queryStr = `UPDATE ${DB.tables.agentsTable} SET ${keysToUpdate} WHERE id = ${agentId}`;

    if (returningFields) {
      queryStr += ` returning ${returningFields.join(",")}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const deleteAgent = async (client, agentId) => {
  try {
    return await client.query(
      `DELETE FROM ${DB.tables.agentsTable} WHERE id=${agentId}`
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  registerAgent,
  getAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
};
