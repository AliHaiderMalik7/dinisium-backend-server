const { Pool } = require('pg');

const taswitAppConfig = require('../config/configBasic');

const pool = new Pool({
  database: taswitAppConfig.postgres.database,
  host: taswitAppConfig.postgres.hostname,
  port: taswitAppConfig.postgres.port,
  user: taswitAppConfig.postgres.username,
  password: taswitAppConfig.postgres.password,
});

pool.on('connect', () => {
  console.log('Connected to the DB');
});

function insertIntoQueryWithClient(client, table, values, returningColumns) {
  let columns = Object.keys(values);
  let parameterIds = [];
  let parameterValues = [];

  for (let i = 0; i < columns.length; i++) {
    parameterIds.push(`$${i + 1}`);
    parameterValues.push(values[columns[i]]);
  }

  let queryString = `insert into ${table} (${columns.join(
    ',',
  )}) values (${parameterIds.join(',')})`;
  if (returningColumns) {
    queryString += ` returning ${returningColumns.join(',')}`;
  }

  return client.query(queryString, parameterValues);
}

const tables = {
  // superAdminTable: "super_admin",
  usersTable: 'users',
  credentialsTable: 'credentials',
  itoTable: 'ito',
  allotedItosTable: 'alloted_itos',
  allotedSubscriptionsTable: 'alloted_subscriptions',
  assetTable: 'assets',
  itoTokenTable: 'ito_token',
  tokenPriceHistoryTable: 'token_price_history',
  backedAssetTable: 'backed_assets',
  itoSeriesTable: 'ito_series',
  votesTable: 'votes',
  electionTable: 'election',
  walletTable: 'wallet',
  kycTable: 'kyc',
  dinisiumBankAcountsTable: 'dinisium_bank_accounts_table',
  fiatTransactionsTable: 'fiat_transactions',
  walletTransactionsTable: 'wallet_transactions',
  subscriptionTable: 'subscription',
  subscribersTable: 'subscribers',
  participantsTable: 'participants',
  exchangeOrdersTable: 'exchange_orders',
  // itoAdminTable: "ito_admin",
  // subAdminTable: "sub_admin",
  agentsTable: 'agents',
  trustedInvestorsTable: 'trusted_investors',
  bankTransfersTable: 'bank_transfers',
  adminRequestPoolTable: 'admin_request_pool',
  auditLogTable: 'audit_log',
  userToken: 'user_tokens',
  bankDetail: 'bank_details',
  itoWalletTable: 'ito_wallet',
  permissionsTable: 'permissions',
  subAdminPermissionsTable: 'admin_permissions',
  contentTable: 'contents',
  withdraw: 'withdraw_request',
  itoBlock: 'ito_block',
  draftSubscription: 'subscription_draft',
  itoDraft: 'ito_draft',
  itoAssetDraft: 'ito_assetdraft',
  draftAlloted_ITO: 'draft_alloted_itos',
  itoSeriesDraft: 'series_draft',
};

module.exports = {
  pool: pool,
  tables: tables,
  insertIntoQueryWithClient: insertIntoQueryWithClient,
};
