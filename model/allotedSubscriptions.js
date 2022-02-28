const DB = require('./DB');
const client = DB.pool;

const allotSubscriptionToAdmin = async (fields, returnFields) => {
  try {
    return await DB.insertIntoQueryWithClient(
      client,
      DB.tables.allotedSubscriptionsTable,
      fields,
      returnFields,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

// get alloted admins to subscription by subscription id except loggedin user
const getAllotedSubscriptionToVerifySubscription = async (
  subscriptionId,
  adminId,
) => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.allotedSubscriptionsTable} WHERE subscription_id=${subscriptionId} AND admin_id!=${adminId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getAllotedSubscription = async subscriptionId => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.allotedSubscriptionsTable} WHERE subscription_id=${subscriptionId}`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

//get Alloted admins for subscription draft
const getAllotedSubscriptionForDraft = async subscriptionId => {
  try {
    return await client.query(
      `SELECT * FROM ${DB.tables.draftAlloted_ITO} WHERE drafted_ito_id=${subscriptionId} AND type='Subscription'`,
    );
  } catch (error) {
    throw new Error(error.message);
  }
};
module.exports = {
  allotSubscriptionToAdmin,
  getAllotedSubscriptionToVerifySubscription,
  getAllotedSubscription,
  getAllotedSubscriptionForDraft,
};
