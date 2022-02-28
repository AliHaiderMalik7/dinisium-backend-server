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

const tablesAlters = [
  /////////////////////////////////
  `alter table exchange_orders add column if not exists token_price float`,
  `alter table exchange_orders add column if not exists spreadedAmount float`,
  `alter table exchange_orders add column if not exists partialFill boolean DEFAULT true`,
  `alter table exchange_orders add column if not exists sub_order varchar(15)`,
  `alter table exchange_orders add column if not exists tokens float`,
  `alter table exchange_orders add column if not exists status kyc_status`,
  `alter table exchange_orders add column if not exists admin_one int`,
  `alter table exchange_orders add column if not exists admin_two int`,
  `alter table exchange_orders add column if not exists rejectionMessage varchar(300)`,

  `ALTER TABLE kyc DROP COLUMN IF EXISTS verified_by_superadmin`,
  `alter table kyc add column if not exists bank_name varchar(50)`,
  `alter table kyc add column if not exists swift varchar(20)`,
  `alter table kyc add column if not exists account_number varchar(150)`,
  `alter table kyc add column if not exists account_title varchar(50)`,

  `alter table ito add column if not exists rejection_message varchar(300)`,
  `alter table ito add column if not exists updated_closed boolean DEFAULT false`, // add new column if exists
  `alter table ito add column if not exists closed_request_user int`, // add new column if exists
  `alter table ito add column if not exists transaction_hash varchar`,
  `alter table ito add column if not exists blockchain_ito_id varchar(50)`,

  `alter table assets add column if not exists currency varchar(50)`,
  `alter table assets add column if not exists update_rejection_message varchar(300)`,

  `alter table ito_token add column if not exists update_status update_status`,
  `alter table ito_token add column if not exists update_request_userid int`,
  `alter table ito_token add column if not exists update_verify_userid int`,
  `alter table ito_token add column if not exists new_supply int`,
  `alter table ito_token add column if not exists new_buying_spread NUMERIC`,
  `alter table ito_token add column if not exists new_selling_spread NUMERIC`,

  `alter table backed_assets add column if not exists updateasset_request_userid int`,
  `alter table backed_assets add column if not exists updateasset_verify_userid int`,
  `alter table backed_assets add column if not exists updateasset_status update_status`,
  `alter table backed_assets add column if not exists new_asset_quantity NUMERIC`,

  `alter table ito_series add column if not exists rejection_message varchar(300)`,
  `alter table ito_series add column if not exists status update_status DEFAULT 'pending'`,
  `alter table ito_series add column if not exists user_approve int`,
  `alter table ito_series add column if not exists user_id int`,
  `alter table ito_series add column if not exists subscription_id int`,
  `alter table ito_series add column if not exists remaining_supply int`,
  `alter table ito_series add column if not exists update_status update_status`,
  `alter table ito_series add column if not exists update_request_userid int`,
  `alter table ito_series add column if not exists update_verify_userid int`,
  `alter table ito_series add column if not exists new_supply int`,
  `alter table ito_series add column if not exists tokens int`,

  `alter table subscription add column if not exists rejection_message varchar(300)`,
  `alter table subscription add column if not exists is_invt_revert boolean DEFAULT false`,
  `alter table subscription add column if not exists threshold_type threshold_type`,
  `alter table subscription add column if not exists user_id int`, // add new column if not exists
  `alter table subscription add column if not exists user_approve int`, // add new column if not exists
  `alter table subscription add column if not exists status update_status`,
  `alter table subscription add column if not exists is_launched boolean DEFAULT false`,
  `alter table subscription add column if not exists ito_id int`, // add new column if not exists
  `alter table subscription add column if not exists term_sheets varchar ARRAY`, // add new column if not exists
  `alter table subscription drop column if exists token_price`,
  `ALTER TABLE subscription ALTER COLUMN threshold TYPE FLOAT`,
  `ALTER TABLE subscription ALTER COLUMN current TYPE FLOAT`,

  `alter table withdraw_request add column if not exists status kyc_status DEFAULT 'pending'`,
  `alter table withdraw_request add column if not exists admin_one int`,
  `alter table withdraw_request add column if not exists admin_two int`,
  `alter table withdraw_request add column if not exists rejection_message varchar(300)`,
  `alter table withdraw_request add column if not exists kyc_id int`,

  `alter table wallet_transactions add column if not exists amount NUMERIC`,
  `alter table wallet_transactions add column if not exists ito_id int`,
  `alter table wallet_transactions add column if not exists to_user_id int`,
  `alter table wallet_transactions add column if not exists from_user_id int`,
  `alter table wallet_transactions add column if not exists price float`,

  ////////////////////////////////

  `alter table ito_token add column if not exists update_token_supply_hash varchar(250)`,

  ////////////////////////////////

  `ALTER TABLE "ito" ADD FOREIGN KEY ("verify_closed") REFERENCES "users" ("id")`,

  `ALTER TABLE "ito" ADD FOREIGN KEY ("user_approve") REFERENCES "users" ("id")`,

  `ALTER TABLE "ito" ADD FOREIGN KEY ("closed_request_user") REFERENCES "users" ("id")`,

  `ALTER TABLE "ito_series" ADD FOREIGN KEY ("ito_id") REFERENCES "ito" ("id")`,

  `ALTER TABLE "ito_series" ADD FOREIGN KEY ("user_approve") REFERENCES "users" ("id")`,

  `ALTER TABLE "ito_series" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id")`,

  `ALTER TABLE "ito_series" ADD FOREIGN KEY ("subscription_id") REFERENCES "subscription" ("id")`,

  `ALTER TABLE "ito_series" ADD FOREIGN KEY ("update_request_userid") REFERENCES "users" ("id")`,

  `ALTER TABLE "ito_series" ADD FOREIGN KEY ("update_verify_userid") REFERENCES "users" ("id")`,

  `ALTER TABLE "alloted_itos" ADD FOREIGN KEY ("admin_id") REFERENCES "users" ("id")`,

  `ALTER TABLE "alloted_itos" ADD FOREIGN KEY ("ito_id") REFERENCES "ito" ("id")`,

  `ALTER TABLE "trusted_investors" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id")`,

  `ALTER TABLE "trusted_investors" ADD FOREIGN KEY ("agent") REFERENCES "agents" ("id")`,

  `ALTER TABLE "trusted_investors" ADD FOREIGN KEY ("ito_series") REFERENCES "ito_series" ("id")`,

  `ALTER TABLE "bank_transfers" ADD FOREIGN KEY ("investor") REFERENCES "users" ("id")`,

  `ALTER TABLE "admin_request_pool" ADD FOREIGN KEY ("verified_by") REFERENCES "users" ("id")`,

  `ALTER TABLE "admin_request_pool" ADD FOREIGN KEY ("rejected_by") REFERENCES "users" ("id")`,

  `ALTER TABLE "admin_request_pool" ADD FOREIGN KEY ("added_by") REFERENCES "users" ("id")`,

  `ALTER TABLE "admin_request_pool" ADD FOREIGN KEY ("on") REFERENCES "users" ("id")`,

  `ALTER TABLE "credentials" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id")`,

  `ALTER TABLE "assets" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id")`,

  `ALTER TABLE "ito_token" ADD FOREIGN KEY ("ito_id") REFERENCES "ito" ("id")`,

  `ALTER TABLE "ito_token" ADD FOREIGN KEY ("update_request_userid") REFERENCES "users" ("id")`,

  `ALTER TABLE "ito_token" ADD FOREIGN KEY ("update_verify_userid") REFERENCES "users" ("id")`,

  `ALTER TABLE "token_price_history" ADD FOREIGN KEY ("ito_token_id") REFERENCES "ito_token" ("id")`,

  `ALTER TABLE "backed_assets" ADD FOREIGN KEY ("updateasset_request_userid") REFERENCES "users" ("id")`,

  `ALTER TABLE "backed_assets" ADD FOREIGN KEY ("updateasset_verify_userid") REFERENCES "users" ("id")`,

  `ALTER TABLE "backed_assets" ADD FOREIGN KEY ("ito_token_id") REFERENCES "ito_token" ("id")`,

  `ALTER TABLE "backed_assets" ADD FOREIGN KEY ("asset_id") REFERENCES "assets" ("id")`,

  `ALTER TABLE "votes" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id")`,

  `ALTER TABLE "votes" ADD FOREIGN KEY ("election_id") REFERENCES "election" ("id")`,

  `ALTER TABLE "election" ADD FOREIGN KEY ("ito_id") REFERENCES "ito" ("id")`,

  `ALTER TABLE "wallet" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id")`,

  `ALTER TABLE "kyc" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id")`,

  `ALTER TABLE "kyc" ADD FOREIGN KEY ("admin_one") REFERENCES "users" ("id")`,

  `ALTER TABLE "kyc" ADD FOREIGN KEY ("admin_two") REFERENCES "users" ("id")`,

  `ALTER TABLE "fiat_transactions" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id")`,

  `ALTER TABLE "fiat_transactions" ADD FOREIGN KEY ("ito_series") REFERENCES "ito_series" ("id")`,

  `ALTER TABLE "fiat_transactions" ADD FOREIGN KEY ("ito_id") REFERENCES "ito" ("id")`,

  `ALTER TABLE "wallet_transactions" ADD FOREIGN KEY ("to_user_id") REFERENCES "users" ("id")`,

  `ALTER TABLE "subscription" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id")`,

  `ALTER TABLE "subscription" ADD FOREIGN KEY ("user_approve") REFERENCES "users" ("id")`,

  `ALTER TABLE "subscription" ADD FOREIGN KEY ("ito_series_id") REFERENCES "ito_series" ("id")`,

  `ALTER TABLE "subscription" ADD FOREIGN KEY ("ito_id") REFERENCES "ito" ("id")`,

  `ALTER TABLE "subscribers" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id")`,

  `ALTER TABLE "subscribers" ADD FOREIGN KEY ("subscription_id") REFERENCES "subscription" ("id")`,

  `ALTER TABLE "participants" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id")`,

  `ALTER TABLE "participants" ADD FOREIGN KEY ("ito_id") REFERENCES "ito" ("id")`,

  `ALTER TABLE "exchange_orders" ADD FOREIGN KEY ("ito_token_id") REFERENCES "ito_token" ("id")`,

  `ALTER TABLE "exchange_orders" ADD FOREIGN KEY ("series_id") REFERENCES "ito_series" ("id")`,

  `ALTER TABLE "exchange_orders" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id")`,

  `ALTER TABLE "agents" ADD FOREIGN KEY ("ito_id") REFERENCES "ito" ("id")`,

  `ALTER TABLE "bank_transfers" ADD FOREIGN KEY ("agent_id") REFERENCES "agents" ("id")`,

  `ALTER TABLE "bank_transfers" ADD FOREIGN KEY ("rejected_by") REFERENCES "users" ("id")`,

  `ALTER TABLE "bank_transfers" ADD FOREIGN KEY ("verified_by") REFERENCES "users" ("id")`,

  `ALTER TABLE "audit_log" ADD FOREIGN KEY ("from") REFERENCES "users" ("id")`,

  `ALTER TABLE "audit_log" ADD FOREIGN KEY ("on") REFERENCES "users" ("id")`,

  `ALTER TABLE "user_tokens" ADD FOREIGN KEY ("ito_token_id") REFERENCES "ito_token" ("id")`,

  `ALTER TABLE "user_tokens" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id")`,

  `ALTER TABLE "ito_wallet" ADD FOREIGN KEY ("ito_id") REFERENCES "ito" ("id")`,

  `ALTER TABLE "bank_details" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id")`,

  `ALTER TABLE "admin_permissions" ADD FOREIGN KEY ("sub_admin") REFERENCES "users" ("id")`,

  `ALTER TABLE "admin_permissions" ADD FOREIGN KEY ("permission") REFERENCES "permissions" ("id")`,

  `ALTER TABLE "bank_details" ADD FOREIGN KEY ("user1_approve") REFERENCES "users" ("id")`,

  `ALTER TABLE "bank_details" ADD FOREIGN KEY ("user2_approve") REFERENCES "users" ("id")`,

  `ALTER TABLE "paypal_details" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id")`,

  `ALTER TABLE "withdraw_request" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id")`,

  `ALTER TABLE "ito_block" ADD FOREIGN KEY ("ito_id") REFERENCES "ito" ("id")`,
];

const tablesRelations = async () => {
  tablesAlters.forEach(async (alter, index) => {
    pool
      .query(alter)
      .then(res => {
        console.log(`Table Altered - ${index}`);
      })
      .catch(err => {
        console.log(alter);
        console.log('err-------', err);
      });
  });
};

// (async () => {
//   await tablesRelations();
// })();
module.exports = {
  tablesRelations,
};
