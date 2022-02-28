require('dotenv').config({ path: '../.env' });

const { Pool } = require('pg');

const ICOAppConfig = require('../config/configBasic');

const pool = new Pool({
  database: ICOAppConfig.postgres.database,
  host: ICOAppConfig.postgres.hostname,
  port: ICOAppConfig.postgres.port,
  user: ICOAppConfig.postgres.username,
  password: ICOAppConfig.postgres.password,
});

pool.on('connect', () => {
  console.log('Connected to the DB');
});

async function testingTable() {
  return new Promise(function (resolve, reject) {
    const testingTable = [
      `CREATE TABLE if not exists "asd" (
        "id" SERIAL PRIMARY KEY,
        "role" user_role,
        "created_at" timestamp,
        "updated_at" timestamp
      )`,
      // `alter table asd add column if not exists new_col varchar`, // add new column if exists
      // `alter table asd alter column user_id type int using user_id::int`, // change datatype of a column
      // `alter table asd alter column new_col SET DEFAULT 7.77`, // set default value to any column
      // `alter table asd drop column if exists user_id`, // drop column if exists
    ];

    for (let index = 0; index < usersTable.length; index++) {
      const item = usersTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table testingTable Created - ' + index);
      });
    }
  });
}

async function usersTable() {
  return new Promise(function (resolve, reject) {
    const usersTable = [
      `CREATE TABLE if not exists "users" (
      "id" SERIAL PRIMARY KEY,
      "role" user_role,
      "fname" varchar(50),
      "lname" varchar(50),
      "email" varchar(50) UNIQUE,
      "contact_no" varchar(50),
      "country" varchar(50),
      "password" varchar(100),
      "password_reset_token" varchar(100),
      "auth_token" varchar(50),
      "sms_and_email_auth_token" varchar(100),
      "is_number_verification_on" boolean,
      "is_email_verification_on" boolean DEFAULT true,
      "is_google_authentication_on" boolean,
      "is_number_verified" boolean,
      "is_email_verified" boolean,
      "is_blocked" boolean,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < usersTable.length; index++) {
      const item = usersTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table usersTable Created');
      });
    }
  });
}

async function credentialsTable() {
  return new Promise(function (resolve, reject) {
    const credentialsTable = [
      `CREATE TABLE if not exists "credentials" (
      "id" SERIAL PRIMARY KEY,
      "user_id" int,
      "verification_token_secret" varchar(100),
      "password" varchar(100),
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < credentialsTable.length; index++) {
      const item = credentialsTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table credentialsTable Created');
      });
    }
  });
}

async function itoTable() {
  return new Promise(function (resolve, reject) {
    const itoTable = [
      `CREATE TABLE if not exists "ito" (
      "id" SERIAL PRIMARY KEY,
      "user_id" int,
      "name" varchar(50) UNIQUE,
      "description" text,
      "term_sheets" varchar ARRAY,
      "token_address" varchar(250),
      "onhold" boolean DEFAULT false,
      "closed" boolean DEFAULT false,
      "verify_closed" int,
      "start_date" timestamp,
      "status" update_status,
      "user_approve" int,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
      // `alter table ito add column if not exists updated_closed boolean DEFAULT false`, // add new column if exists
      // `alter table ito add column if not exists closed_request_user int`, // add new column if exists
      // `alter table ito add column if not exists transaction_hash varchar`,
      // `alter table ito add column if not exists blockchain_ito_id varchar(50)`,
    ];
    for (let index = 0; index < itoTable.length; index++) {
      const item = itoTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table itoTable Created');
      });
    }
  });
}

async function allotedItosTable() {
  return new Promise(function (resolve, reject) {
    const allotedItos = [
      `CREATE TABLE if not exists "alloted_itos" (
      "id" SERIAL PRIMARY KEY,
      "admin_id" int,
      "ito_id" int,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < allotedItos.length; index++) {
      const item = allotedItos[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table allotedItos Created');
      });
    }
  });
}

async function assetsTable() {
  return new Promise(function (resolve, reject) {
    const votesTable = [
      `CREATE TABLE if not exists "assets" (
      "id" SERIAL PRIMARY KEY,
      "user_id" int,
      "name" varchar(50),
      "type" varchar(50) ,
      "price" NUMERIC NOT NULL,
      "updated_price" NUMERIC,
      "unit" varchar(50),
      "total_supply" NUMERIC,
      "updated_total_supply" NUMERIC,
      "remaining_supply" NUMERIC,
      "updated_remaining_supply" NUMERIC,
      "update_status" update_status,
      "user1_approve" int,
      "user2_approve" int,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
      // `alter table assets add column if not exists currency varchar(50)`,
    ];
    for (let index = 0; index < votesTable.length; index++) {
      const item = votesTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table assetsTable Created');
      });
    }
  });
}

async function itoTokenTable() {
  return new Promise(function (resolve, reject) {
    const itoTokenTable = [
      `CREATE TABLE if not exists "ito_token" (
      "id" SERIAL PRIMARY KEY,
      "ito_id" int,
      "token_address" varchar(250),
      "token_symbol" varchar(250),
      "token_name" varchar(250) UNIQUE,
      "target_value" NUMERIC,
      "price" NUMERIC NOT NULL,
      "supply" int NOT NULL,
      "remaining_supply" int NOT NULL,
      "buying_spread" NUMERIC,
      "selling_spread" NUMERIC,
      "is_tradeable" boolean DEFAULT false,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,

      // `alter table ito_token add column if not exists update_status update_status`,
      // `alter table ito_token add column if not exists update_request_userid int`,
      // `alter table ito_token add column if not exists update_verify_userid int`,
      // `alter table ito_token add column if not exists new_supply int`,
      // `alter table ito_token add column if not exists new_buying_spread NUMERIC`,
      // `alter table ito_token add column if not exists new_selling_spread NUMERIC`,
    ];
    for (let index = 0; index < itoTokenTable.length; index++) {
      const item = itoTokenTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table itoTokenTable Created');
      });
    }
  });
}

async function tokenPriceHistoryTable() {
  return new Promise(function (resolve, reject) {
    const backedAssetsTable = [
      `CREATE TABLE if not exists "token_price_history" (
      "id" SERIAL PRIMARY KEY,
      "ito_token_id" int,
      "token_price" NUMERIC,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < backedAssetsTable.length; index++) {
      const item = backedAssetsTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table backedAssetsTable Created');
      });
    }
  });
}

async function backedAssetsTable() {
  return new Promise(function (resolve, reject) {
    const backedAssetsTable = [
      `CREATE TABLE if not exists "backed_assets" (
      "id" SERIAL PRIMARY KEY,
      "ito_token_id" int,
      "asset_id"  int,
      "weightage" NUMERIC,
      "asset_value" NUMERIC,
      "asset_quantity" NUMERIC,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < backedAssetsTable.length; index++) {
      const item = backedAssetsTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table backedAssetsTable Created');
      });
    }
  });
}

/** Ali Haider */
async function draftAlloteditos() {
  return new Promise(function (resolve, reject) {
    const draftAlloteditos = [
      `CREATE TABLE if not exists "draft_alloted_itos" (
      "id" SERIAL PRIMARY KEY,
      "admin_id" int,
      "drafted_ito_id" int,
      "type" varchar(50),
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < draftAlloteditos.length; index++) {
      const item = draftAlloteditos[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table draftAlloteditos Created');
      });
    }
  });
}
async function itoSeriesTable() {
  return new Promise(function (resolve, reject) {
    const itoSeriesTable = [
      `CREATE TABLE if not exists "ito_series" (
      "id" SERIAL PRIMARY KEY,
      "ito_id" int,
      "name" varchar(50),
      "description" text,
      "token_address" varchar(250),
      "supply" int NOT NULL,
      "initial_series" boolean default false,
      "start_date" timestamp,
      "end_date" timestamp,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
      // `alter table ito_series add column if not exists status update_status DEFAULT 'pending'`,
      // `alter table ito_series add column if not exists user_approve int`,
      // `alter table ito_series add column if not exists user_id int`,
      // `alter table ito_series add column if not exists remaining_supply int`,
      // `alter table ito_series add column if not exists update_status update_status`,
      // `alter table ito_series add column if not exists update_request_userid int`,
      // `alter table ito_series add column if not exists update_verify_userid int`,
      // `alter table ito_series add column if not exists new_supply int`,
    ];
    for (let index = 0; index < itoSeriesTable.length; index++) {
      const item = itoSeriesTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table itoSeriesTable Created');
      });
    }
  });
}

async function itoBlock() {
  return new Promise(function (resolve, reject) {
    const itoBlockTable = [
      `CREATE TABLE if not exists "ito_block" (
      "id" SERIAL PRIMARY KEY,
      "ito_id" int,
      "admin_blocked_one" int,
      "admin_blocked_two" int,
      "admin_unblocked_one" int,
      "admin_unblocked_two" int,    
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < itoBlockTable.length; index++) {
      const item = itoBlockTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table itoBlockTable Created');
      });
    }
  });
}

async function votesTable() {
  return new Promise(function (resolve, reject) {
    const votesTable = [
      `CREATE TABLE if not exists "votes" (
      "id" SERIAL PRIMARY KEY,
      "user_id" int,
      "election_id" int,
      "agree" boolean,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < votesTable.length; index++) {
      const item = votesTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table votesTable Created');
      });
    }
  });
}

async function electionTable() {
  return new Promise(function (resolve, reject) {
    const electionTable = [
      `CREATE TABLE if not exists "election" (
      "id" SERIAL PRIMARY KEY,
      "ito_id" int,
      "name" varchar(100),
      "description" text,
      "start_date" timestamp,
      "end_date" timestamp,
      "election_result" text,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < electionTable.length; index++) {
      const item = electionTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table electionTable Created');
      });
    }
  });
}

async function walletTable() {
  return new Promise(function (resolve, reject) {
    const walletTable = [
      `CREATE TABLE if not exists "wallet" (
      "id" SERIAL PRIMARY KEY,
      "user_id" int,
      "fiat_balances" float DEFAULT 0,
      "tokens" int DEFAULT 0,
      "locked_amount" float DEFAULT 0,
      "locked_tokens" float DEFAULT 0,
      "private_key" varchar(250),
      "account_address" varchar(250),
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < walletTable.length; index++) {
      const item = walletTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table walletTable Created');
      });
    }
  });
}

async function itoWalletTable() {
  return new Promise(function (resolve, reject) {
    const walletTable = [
      `CREATE TABLE if not exists "ito_wallet" (
      "id" SERIAL PRIMARY KEY,
      "ito_id" int,
      "fiat_balances" int DEFAULT 0,
      "tokens" int DEFAULT 0,
      "private_key" varchar(250),
      "account_address" varchar(250),
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < walletTable.length; index++) {
      const item = walletTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table walletTable Created');
      });
    }
  });
}

async function dinisiumBankAcountsTable() {
  return new Promise(function (resolve, reject) {
    const dinisiumBankAcountsTable = [
      `CREATE TABLE if not exists "dinisium_bank_accounts_table" (
      "id" SERIAL PRIMARY KEY,
      "user_id" int, 
      "account_title" varchar(50),
      "iban" varchar(50),
      "swift_code" varchar(200),
      "bank_name" varchar(50),
      "verification_status" kyc_status,
      "rejection_message" varchar(300),
      "admin_one" int,
      "admin_two" int,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    dinisiumBankAcountsTable.forEach((item, index) => {
      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table dinisiumBankAcountsTable Created');
      });
    });
  });
}

async function kycTable() {
  return new Promise(function (resolve, reject) {
    const kycTable = [
      `CREATE TABLE if not exists "kyc" (
      "id" SERIAL PRIMARY KEY,
      "user_id" int,
      "full_name" varchar(50),
      "nationality" varchar(50),
      "dob" varchar(50),
      "permanent_address" varchar(200),
      "city" varchar(50),
      "state_or_province" varchar(50),
      "country" varchar(50),
      "personal_photo" varchar(100),
      "license_photo" varchar(100),
      "other_document" varchar(100),
      "kyc_status" kyc_status,
      "rejection_message" varchar(300),
      "admin_one" int,
      "admin_two" int,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < kycTable.length; index++) {
      const item = kycTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table kycTable Created');
      });
    }
  });
}

async function fiatTransactionsTable() {
  return new Promise(function (resolve, reject) {
    const fiatTransactionsTable = [
      `CREATE TABLE if not exists "fiat_transactions" (
      "id" SERIAL PRIMARY KEY,
      "user_id" int,
      "amount" int NOT NULL,
      "currency" varchar(50),
      "ito_id" int,
      "ito_series" int,
      "transaction_hash" varchar(100),
      "transaction_status" transaction_status,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < fiatTransactionsTable.length; index++) {
      const item = fiatTransactionsTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table fiatTransactionsTable Created');
      });
    }
  });
}

async function walletTransactionsTable() {
  return new Promise(function (resolve, reject) {
    const walletTransactionsTable = [
      `CREATE TABLE if not exists "wallet_transactions" (
        "id" SERIAL PRIMARY KEY,
        "token" int,
        "token_transaction_status" wallet_transaction_status,
        "transform_hash" varchar(250),
        "from_user" varchar(250),
        "to_user" varchar(250),
        "created_at" timestamp,
        "updated_at" timestampSelect Asset Name
        Select...
        Enter Weightage
        %
        Asset Value
        $
        Asset Quantity
        
    )`,
    ];
    for (let index = 0; index < walletTransactionsTable.length; index++) {
      const item = walletTransactionsTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table walletTransactionsTable Created');
      });
    }
  });
}

async function subscriptionTable() {
  return new Promise(function (resolve, reject) {
    const subscriptionTable = [
      `CREATE TABLE if not exists "subscription" (
      "id" SERIAL PRIMARY KEY,
      "ito_series_id" int,
      "ito_name" varchar(250),
      "ito_series" varchar(250),
      "ito_token" varchar(250),
      "description" text,
      "start_date" timestamp,
      "end_date" timestamp,
      "threshold" int,
      "current" int DEFAULT 0,
      "is_threshold_reached" boolean,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < subscriptionTable.length; index++) {
      const item = subscriptionTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table subscriptionTable Created');
      });
    }
  });
}

/** Author: Ali Haider */
async function subscriptionDraftTable() {
  return new Promise(function (resolve, reject) {
    const subscriptionDraftTable = [
      `CREATE TABLE if not exists "subscription_draft" (
      "id" SERIAL PRIMARY KEY,
      "user_id" int,
      "ito_name" varchar(250),
      "ito_series" varchar(250),
      "ito_token" varchar(250),
      "description" text,
      "start_date" timestamp,
      "end_date" timestamp,
      "threshold" int,
      "threshold_type" threshold_type,
      "current" int DEFAULT 0,
      term_sheets varchar ARRAY,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < subscriptionDraftTable.length; index++) {
      const item = subscriptionDraftTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table subscriptionDraftTable Created');
      });
    }
  });
}

/** Author: Ali Haider */
async function ITODraftTable() {
  return new Promise(function (resolve, reject) {
    const ITODraftTable = [
      `CREATE TABLE if not exists "ito_draft" (
      "id" SERIAL PRIMARY KEY,
      "user_id" int,
      "ito_name" varchar(250),
      "ito_start_date" timestamp,
      term_sheets varchar ARRAY,
      description varchar(250),
      "ito_token" varchar(250),
      "ito_token_symbol" varchar(250),
      "token_supply" int,
      "token_target_value" int,
      "token_price" int,
      "buying_spread" int,
      "selling_spread" int,
      "ito_series" varchar(250),
      "series_supply" int,
      "series_start_date" timestamp,
      "series_end_date" timestamp,
      "series_description" varchar(250),
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < ITODraftTable.length; index++) {
      const item = ITODraftTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table ITODraftTable Created');
      });
    }
  });
}

/** Author: Ali Haider */
async function ITOAssetDraft() {
  return new Promise(function (resolve, reject) {
    const ITOAssetDraft = [
      `CREATE TABLE if not exists "ito_assetdraft" (
      "id" SERIAL PRIMARY KEY,
      "user_id" int,
      "asset_type" varchar(250),
      "asset_name" varchar(250),
      "weightage" int,
      "value" int,
      "quantity" int,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < ITOAssetDraft.length; index++) {
      const item = ITOAssetDraft[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table ITOAssetDraft Created');
      });
    }
  });
}

//SubscriptionAdminsDraft
/** Author: Ali Haider */
async function SubscriptionAdminsDraft() {
  return new Promise(function (resolve, reject) {
    const SubscriptionAdminsDraft = [
      `CREATE TABLE if not exists "subscription_admin_draft" (
      "id" SERIAL PRIMARY KEY,
      "draft_id" int,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < SubscriptionAdminsDraft.length; index++) {
      const item = SubscriptionAdminsDraft[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table SubscriptionAdminsDraft Created');
      });
    }
  });
}

async function SeriesDraft() {
  return new Promise(function (resolve, reject) {
    const SeriesDraft = [
      `CREATE TABLE if not exists "series_draft" (
      "id" SERIAL PRIMARY KEY,
      "user_id" int,
      "ito_id" int,
      "series_name" varchar(250),
      "description" varchar(250),
      "supply" int,
      "start_date" timestamp,
      "end_date" timestamp,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < SeriesDraft.length; index++) {
      const item = SeriesDraft[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table SeriesDraft Created');
      });
    }
  });
}

async function allotedSubscriptionsTable() {
  return new Promise(function (resolve, reject) {
    const allotedItos = [
      `CREATE TABLE if not exists "alloted_subscriptions" (
      "id" SERIAL PRIMARY KEY,
      "admin_id" int,
      "subscription_id" int,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < allotedItos.length; index++) {
      const item = allotedItos[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table allotedItos Created');
      });
    }
  });
}

async function subscribersTable() {
  return new Promise(function (resolve, reject) {
    const subscribersTable = [
      `CREATE TABLE if not exists "subscribers" (
      "id" SERIAL PRIMARY KEY,
      "user_id" int,
      "subscription_id" int,
      "investment" float,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < subscribersTable.length; index++) {
      const item = subscribersTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table subscribersTable Created');
      });
    }
  });
}

async function participantsTable() {
  return new Promise(function (resolve, reject) {
    const participantsTable = [
      `CREATE TABLE if not exists "participants" (
      "id" SERIAL PRIMARY KEY,
      "user_id" int,
      "ito_id" int,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < participantsTable.length; index++) {
      const item = participantsTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table participantsTable Created');
      });
    }
  });
}

async function exchangeOrdersTable() {
  return new Promise(function (resolve, reject) {
    const exchangeOrdersTable = [
      `CREATE TABLE if not exists "exchange_orders" (
      "id" SERIAL PRIMARY KEY,
      "user_id" int,
      "ito_token_id" int,
      "series_id" int,
      "from_user_id" int,
      "to_user_id" int,
      "order_type" order_type,
      "amount" float,
      "price_limit" float,
      "status" order_status,
      "transaction_hash" varchar(100),
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
      // `alter table ito_series add column if not exists tokens int`,
    ];
    for (let index = 0; index < exchangeOrdersTable.length; index++) {
      const item = exchangeOrdersTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table exchangeOrdersTable Created');
      });
    }
  });
}

async function agentsTable() {
  return new Promise(function (resolve, reject) {
    const agentsTable = [
      `CREATE TABLE if not exists "agents" (
      "id" SERIAL PRIMARY KEY,
      "ito_id" int,
      "fname" varchar(50),
      "lname" varchar(50),
      "contact_no" varchar(50),
      "email" varchar(50),
      "country" varchar(50),
      "address" text,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < agentsTable.length; index++) {
      const item = agentsTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table agentsTable Created');
      });
    }
  });
}

async function trustedInvestorsTable() {
  return new Promise(function (resolve, reject) {
    const trustedInvestorsTable = [
      `CREATE TABLE if not exists "trusted_investors" (
      "id" SERIAL PRIMARY KEY,
      "user_id" int,
      "agent" int,
      "investment" int NOT NULL,
      "ito_series" int NOT NULL,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < trustedInvestorsTable.length; index++) {
      const item = trustedInvestorsTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table trustedInvestorsTable Created');
      });
    }
  });
}

async function bankTransfersTable() {
  return new Promise(function (resolve, reject) {
    const bankTransfersTable = [
      `CREATE TABLE if not exists "bank_transfers" (
      "id" SERIAL PRIMARY KEY,
      "investor" int,
      "agent_id" int,
      "added_by" int,
      "verified_by" int,
      "rejected_by" int,
      "is_verified" boolean,
      "transaciton_details" text,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < bankTransfersTable.length; index++) {
      const item = bankTransfersTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table bankTransfersTable Created');
      });
    }
  });
}

async function adminRequestPoolTable() {
  return new Promise(function (resolve, reject) {
    const adminRequestPoolTable = [
      `CREATE TABLE if not exists "admin_request_pool" (
      "id" SERIAL PRIMARY KEY,
      "added_by" int,
      "on" int,
      "verified_by" int,
      "rejected_by" int,
      "description" text,
      "request_type" requests,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < adminRequestPoolTable.length; index++) {
      const item = adminRequestPoolTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table adminRequestPoolTable Created');
      });
    }
  });
}

async function auditLogTable() {
  return new Promise(function (resolve, reject) {
    const auditLogTable = [
      `CREATE TABLE if not exists "audit_log" (
      "id" SERIAL PRIMARY KEY,
      "action" admin_actions,
      "admin" int,
      "user_id" int,
      "from" int,
      "on" int,
      "created_at" timestamp,
      "updated_at" timestamp
    )`,
    ];
    for (let index = 0; index < auditLogTable.length; index++) {
      const item = auditLogTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Table auditLogTable Created');
      });
    }
  });
}

async function userTokensTable() {
  return new Promise(function (resolve, reject) {
    const userTokensTable = [
      `CREATE TABLE if not exists "user_tokens" (
        "id" SERIAL PRIMARY KEY,
        "ito_token_id" int NOT NULL,
        "user_id" int,
        "amount" int NOT NULL,
        "created_at" timestamp,
        "updated_at" timestamp
      )`,
    ];
    for (let index = 0; index < userTokensTable.length; index++) {
      const item = userTokensTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('userTokens table Created');
      });
    }
  });
}

async function bankDetailsTable() {
  return new Promise(function (resolve, reject) {
    const bankDetailsTable = [
      `CREATE TABLE if not exists "bank_details" (
        "id" SERIAL PRIMARY KEY,
        "user_id" int,
        "status" bank_status,
        "country" varchar(150),
        "swift" varchar(20),
        "bank_name" varchar(20),
        "account_no" varchar(150),
        "account_name" varchar(150),
        "from_account" varchar(150),
        "currency" varchar(50),
        "transfer_amount" float,
        "transfer_fee" float,
        "total_amount" float,
        "bank_draft" varchar(150),
        "user1_approve" int,
        "user2_approve" int,
        "created_at" timestamp,
        "updated_at" timestamp
      )`,
    ];
    for (let index = 0; index < bankDetailsTable.length; index++) {
      const item = bankDetailsTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('userTokens table Created');
      });
    }
  });
}

async function permissionsTable() {
  return new Promise(function (resolve, reject) {
    const permissionsTable = [
      `CREATE TABLE if not exists "permissions" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar(150),
        "slug" varchar(150),
        "created_at" timestamp,
        "updated_at" timestamp 
      )`,
    ];
    for (let index = 0; index < permissionsTable.length; index++) {
      const item = permissionsTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('permission table Created');
      });
    }
  });
}

async function subAdminPermissionsTable() {
  return new Promise(function (resolve, reject) {
    const subAdminPermissionsTable = [
      `CREATE TABLE if not exists "admin_permissions" (
        "id" SERIAL PRIMARY KEY,
        "sub_admin" int,
        "permission" int,
        "created_at" timestamp ,
        "updated_at" timestamp 
      )`,
    ];
    for (let index = 0; index < subAdminPermissionsTable.length; index++) {
      const item = subAdminPermissionsTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('sub admin perssions table Created');
      });
    }
  });
}

async function paypalDetailsTable() {
  return new Promise(function (resolve, reject) {
    const paypalDetailsTable = [
      `CREATE TABLE if not exists "paypal_details" (
          "id" SERIAL PRIMARY KEY,
          "user_id" int,
          "amount" int,
          "capture_id" int,
          "created_at" timestamp ,
          "updated_at" timestamp 
        )`,
    ];
    for (let index = 0; index < paypalDetailsTable.length; index++) {
      const item = paypalDetailsTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('paypal detail table Created');
      });
    }
  });
}

async function withdrawReqTable() {
  return new Promise(function (resolve, reject) {
    const withdrawReqTable = [
      `CREATE TABLE if not exists "withdraw_request" (
        "id" SERIAL PRIMARY KEY,
        "user_id" int,
        "amount" float,
        "iban" varchar(150),
        "status" kyc_status,
        "admin_one" int,
        "admin_two" int,
        "rejection_message" varchar(300),
        "created_at" timestamp,
        "updated_at" timestamp 

      )`,
    ];
    for (let index = 0; index < withdrawReqTable.length; index++) {
      const item = withdrawReqTable[index];
      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('Withdraw Request table Created');
      });
    }
  });
}

async function contentTable() {
  return new Promise(function (resolve, reject) {
    const contentTable = [
      `CREATE TABLE if not exists "contents" (
          "id" SERIAL PRIMARY KEY,
          "title" text,
          "logo" varchar(150),
          "background" varchar(150),
          "tagline" text,
          "about" text,
          "email" varchar(50),
          "address" varchar(150),
          "created_at" timestamp ,
          "updated_at" timestamp 
        )`,
    ];
    for (let index = 0; index < contentTable.length; index++) {
      const item = contentTable[index];

      pool.query(item, function (error, result, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve('content table Created');
      });
    }
  });
}

module.exports = {
  usersTable,
  credentialsTable,
  itoTable,
  allotedItosTable,
  assetsTable,
  itoTokenTable,
  tokenPriceHistoryTable,
  backedAssetsTable,
  itoSeriesTable,
  votesTable,
  electionTable,
  walletTable,
  dinisiumBankAcountsTable,
  kycTable,
  fiatTransactionsTable,
  walletTransactionsTable,
  subscriptionTable,
  allotedSubscriptionsTable,
  subscribersTable,
  participantsTable,
  exchangeOrdersTable,
  agentsTable,
  trustedInvestorsTable,
  bankTransfersTable,
  adminRequestPoolTable,
  auditLogTable,
  userTokensTable,
  itoWalletTable,
  bankDetailsTable,
  permissionsTable,
  subAdminPermissionsTable,
  paypalDetailsTable,
  contentTable,
  withdrawReqTable,
  itoBlock,
  subscriptionDraftTable,
  ITODraftTable,
  ITOAssetDraft,
  draftAlloteditos,
  SeriesDraft,
  SubscriptionAdminsDraft,
};
