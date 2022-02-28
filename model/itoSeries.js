const DB = require('./DB');
const client = DB.pool;

const createSeries = async fields => {
  try {
    const returnFields = ['id', ...Object.keys(fields)];
    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.itoSeriesTable,
      fields,
      returnFields,
    );
  } catch (error) {
    console.log('err-->', error.message);
    throw new Error(error.message);
  }
};

// createDraft
const createDraft = async fields => {
  try {
    const returnFields = ['id', ...Object.keys(fields)];
    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.itoSeriesDraft,
      fields,
      returnFields,
    );
  } catch (error) {
    console.log('err-->', error.message);
    throw new Error(error.message);
  }
};

const getSeries = async (query, status) => {
  try {
    let filter = '';

    if (query) {
      const queryFields = Object.keys(query);
      filter = queryFields.reduce((acc, field, index) => {
        acc += `${field}='${query[field]}'`;

        return index + 1 === queryFields.length ? acc : acc + ' AND ';
      }, '');
    }
    if (status) {
      filter += ` AND ${status}`;
    }

    let queryStr = `SELECT * FROM ${DB.tables.itoSeriesTable}`;

    if (filter) {
      queryStr += ` WHERE ${filter}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const getSeriesById = async seriesId => {
  try {
    return await client.query(
      `SELECT t1.*,t2.name as ito_name FROM ${DB.tables.itoSeriesTable} t1 left join ${DB.tables.itoTable} t2 on t1.ito_id=t2.id WHERE t1.id=${seriesId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

// getDraftByUser
const getDraftByUser = async userId => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.itoSeriesDraft}  WHERE user_id=${userId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

// getRejectedSeries
const getRejectedSeries = async userId => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.itoSeriesTable}  WHERE user_id=${userId} AND status ='rejected'`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

//updateDraft

const update_draft = async (fields, id, returningFields) => {
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

    let queryStr = `UPDATE ${DB.tables.itoSeriesDraft} SET ${keysToUpdate} WHERE id = ${id}`;

    if (returningFields) {
      queryStr += ` returning ${returningFields.join(',')}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

// getDraftByID
const getDraftByID = async ID => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.itoSeriesDraft}  WHERE id=${ID}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateSeries = async (fields, seriesId, returningFields) => {
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

    let queryStr = `UPDATE ${DB.tables.itoSeriesTable} SET ${keysToUpdate} WHERE id = ${seriesId}`;

    if (returningFields) {
      queryStr += ` returning ${returningFields.join(',')}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateOngoingSeries = async (fields, seriesId, returningFields) => {
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
    let queryStr = `UPDATE ${DB.tables.itoSeriesTable} SET ${keysToUpdate} WHERE start_date <= now() AND end_date >= now()`;
    if (returningFields) {
      queryStr += ` returning ${returningFields.join(',')}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

// verify initial series
const verifyInitialSeries = async (fields, itoId, returningFields) => {
  try {
    const colunms = Object.keys(fields);

    const keysToUpdate = colunms.reduce((acc, field, index) => {
      acc += `${field}='${fields[field]}'`;

      return index + 1 === colunms.length ? acc + '' : acc + ', ';
    }, '');

    let queryStr = `UPDATE ${DB.tables.itoSeriesTable} SET ${keysToUpdate} WHERE ito_id=${itoId} AND initial_series=true`;

    if (returningFields) {
      queryStr += ` returning ${returningFields.join(',')}`;
    }

    return await client.query(queryStr);
  } catch (error) {
    throw new Error(error.message);
  }
};

const findOngoingSeries = async () => {
  try {
    return client.query(
      `SELECT * FROM ${DB.tables.itoSeriesTable} WHERE start_date < ( now()::date + '1 day'::interval) AND end_date >= now() `,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const findItoOngoingSeries = async userId => {
  try {
    return client.query(
      `SELECT t1.*,t2.name as ito_name FROM ${DB.tables.itoSeriesTable} as t1 left join ${DB.tables.itoTable} t2 ON t2.id=t1.ito_id left join ${DB.tables.allotedItosTable} t3 ON t2.id=t3.ito_id WHERE t1.start_date < ( now()::date + '1 day'::interval) AND t1.end_date >= now() AND t3.admin_id=${userId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const findUpcomingSeries = async userId => {
  try {
    return client.query(
      `SELECT t1.*,t2.name as ito_name FROM ${DB.tables.itoSeriesTable} as t1 left join ${DB.tables.itoTable} t2 ON t2.id=t1.ito_id left join ${DB.tables.allotedItosTable} t3 ON t2.id=t3.ito_id WHERE t1.start_date > now() AND t3.admin_id=${userId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const findClosedSeries = async userId => {
  try {
    return client.query(
      `SELECT t1.*,t2.name as ito_name FROM ${DB.tables.itoSeriesTable} as t1 left join ${DB.tables.itoTable} t2 ON t2.id=t1.ito_id left join ${DB.tables.allotedItosTable} t3 ON t2.id=t3.ito_id WHERE t1.end_date < now() AND t3.admin_id=${userId}`, //end_date < ( now()::date + '1 day'::interval)
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const deleteSeries = async seriesId => {
  try {
    return await client.query(
      `DELETE FROM ${DB.tables.itoSeriesTable} WHERE id=${seriesId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const findItoSeriesCount = async itoId => {
  try {
    return client.query(
      `SELECT COUNT(id) FROM ${DB.tables.itoSeriesTable} WHERE ito_id=${itoId} `,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const findItoOngoingSeriesByitoId = async ito_id => {
  try {
    return client.query(
      `SELECT t1.* FROM ${DB.tables.itoSeriesTable} t1
        WHERE t1.start_date < ( now()::date + '1 day'::interval)
        AND t1.end_date >= now()
        AND t1.ito_id=${ito_id}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  createSeries,
  updateSeries,
  verifyInitialSeries,
  getSeriesById,
  getSeries,
  deleteSeries,
  findClosedSeries,
  findOngoingSeries,
  findUpcomingSeries,
  findItoOngoingSeries,
  findItoSeriesCount,
  findItoOngoingSeriesByitoId,
  updateOngoingSeries,
  createDraft,
  getDraftByUser,
  getRejectedSeries,
  getDraftByID,
  update_draft,
};
