require("dotenv").config({ path: "../.env" });
const { Pool } = require("pg");

const ICOAppConfig = require("../config/configBasic");

const pool = new Pool({
  database: ICOAppConfig.postgres.database,
  host: ICOAppConfig.postgres.hostname,
  port: ICOAppConfig.postgres.port,
  user: ICOAppConfig.postgres.username,
  password: ICOAppConfig.postgres.password,
});

pool.on("connect", () => {
  console.log("Connected to the DB");
});

async function testingType() {
  return new Promise(function (resolve, reject) {
    const gameType = `DROP TYPE IF EXISTS game; 
        CREATE TYPE "game" AS ENUM (
          'cricket',
          'footbal'
        )`;

    pool.query(gameType, function (error, result, fields) {
      if (error) {
        reject(error);
        return;
      }
      resolve("Type gameType Created");
    });
  });
}

async function rolesType() {
  return new Promise(function (resolve, reject) {
    const rolesType = `DROP TYPE IF EXISTS roles;
      CREATE TYPE "roles" AS ENUM (
        'super_admin',
        'ito_admin',
        'sub_admin',
        'user'
      )`;

    pool.query(rolesType, function (error, result, fields) {
      if (error) {
        reject(error);
        return;
      }
      resolve("Type rolesType Created");
    });
  });
}

async function statusType() {
  return new Promise(function (resolve, reject) {
    const statusType = `DROP TYPE IF EXISTS status;
      CREATE TYPE "status" AS ENUM (
        'ongoing',
        'closed',
        'expired',
        'upcoming'
      )`;

    pool.query(statusType, function (error, result, fields) {
      if (error) {
        reject(error);
        return;
      }
      resolve("Type statusType Created");
    });
  });
}

async function updateStatusType() {
  return new Promise(function (resolve, reject) {
    const updateStatusType = `DROP TYPE IF EXISTS update_status;
      CREATE TYPE "update_status" AS ENUM (
        'pending',
        'approved',
        'rejected'
      )`;

    pool.query(updateStatusType, function (error, result, fields) {
      if (error) {
        reject(error);
        return;
      }
      resolve("Type updateStatusType Created");
    });
  });
}

async function bankStatusType() {
  return new Promise(function (resolve, reject) {
    const bankStatusType = `DROP TYPE IF EXISTS bank_status;
      CREATE TYPE "bank_status" AS ENUM (
        'pending',
        'approved',
        'rejected'
      )`;

    pool.query(bankStatusType, function (error, result, fields) {
      if (error) {
        reject(error);
        return;
      }
      resolve("Type statusType Created");
    });
  });
}

async function transactionStatusType() {
  return new Promise(function (resolve, reject) {
    const transactionStatusType = `DROP TYPE IF EXISTS transaction_status;
      CREATE TYPE "transaction_status" AS ENUM (
        'pending',
        'completed'
      )`;

    pool.query(transactionStatusType, function (error, result, fields) {
      if (error) {
        reject(error);
        return;
      }
      resolve("Type transactionStatusType Created");
    });
  });
}

async function walletTransactionStatusType() {
  return new Promise(function (resolve, reject) {
    const walletTransactionStatusType = `DROP TYPE IF EXISTS wallet_transaction_status;
      CREATE TYPE "wallet_transaction_status" AS ENUM (
        'success',
        'failed'
      )`;

    pool.query(walletTransactionStatusType, function (error, result, fields) {
      if (error) {
        reject(error);
        return;
      }
      resolve("Type walletTransactionStatusType Created");
    });
  });
}

async function orderType() {
  return new Promise(function (resolve, reject) {
    const orderType = `DROP TYPE IF EXISTS order_type;
      CREATE TYPE "order_type" AS ENUM (
        'buy_order',
        'sell_order'
      )`;

    pool.query(orderType, function (error, result, fields) {
      if (error) {
        reject(error);
        return;
      }
      resolve("Type orderType Created");
    });
  });
}

async function kycStatusType() {
  return new Promise(function (resolve, reject) {
    const kycStatusType = `DROP TYPE IF EXISTS kyc_status;
      CREATE TYPE "kyc_status" AS ENUM (
        'pending',
        'single_approved',
        'approved',
        'rejected'
      )`;

    pool.query(kycStatusType, function (error, result, fields) {
      if (error) {
        reject(error);
        return;
      }
      resolve("Type kycStatusType Created");
    });
  });
}

async function orderStatusType() {
  return new Promise(function (resolve, reject) {
    const orderStatusType = `DROP TYPE IF EXISTS order_status;
      CREATE TYPE "order_status" AS ENUM (
        'pending',
        'completed'
      )`;

    pool.query(orderStatusType, function (error, result, fields) {
      if (error) {
        reject(error);
        return;
      }
      resolve("Type orderStatusType Created");
    });
  });
}

async function adminRoleType() {
  return new Promise(function (resolve, reject) {
    const adminRoleType = `DROP TYPE IF EXISTS admin_role;
      CREATE TYPE "admin_role" AS ENUM (
        'kyc_admin',
        'agents_admin'
      )`;

    pool.query(adminRoleType, function (error, result, fields) {
      if (error) {
        reject(error);
        return;
      }
      resolve("Type adminRoleType Created");
    });
  });
}

async function requestsType() {
  return new Promise(function (resolve, reject) {
    const requestsType = `DROP TYPE IF EXISTS requests;
      CREATE TYPE "requests" AS ENUM (
        'kyc_request',
        'bank_transfers_request'
      )`;

    pool.query(requestsType, function (error, result, fields) {
      if (error) {
        reject(error);
        return;
      }
      resolve("Type requestsType Created");
    });
  });
}

async function userRoleType() {
  return new Promise(function (resolve, reject) {
    const requestsType = `DROP TYPE IF EXISTS user_role;
      CREATE TYPE "user_role" AS ENUM (
        'super-admin',
        'admin',
        'user',
        'sub-admin'
      )`;

    pool.query(requestsType, function (error, result, fields) {
      if (error) {
        reject(error);
        return;
      }
      resolve("Type user role Created");
    });
  });
}

async function adminActionsType() {
  return new Promise(function (resolve, reject) {
    const adminActionsType = `DROP TYPE IF EXISTS admin_actions;
      CREATE TYPE "admin_actions" AS ENUM (
        'ito_admin_logged_in',
        'ito_admin_logged_out',
        'block_user',
        'unblock_user',
        'kyc_request',
        'kyc_approve',
        'kyc_reject',
        'bank_transaction_request',
        'bank_transaction_approve',
        'bank_transaction_reject',
        'add_itoadmin_by_superadmin',
        'remove_itoadmin_by_superadmin',
        'add_subadmin_in_section_by_itoadmin',
        'remove_subadmin_in_section_by_itoadmin',
        'buy_order_request',
        'sell_order_request',
        'add_token_by_superadmin',
        'remove_token_by_superadmin',
        'create_vote_by_admin',
        'create_vote_by_superadmin',
        'add_agent_by_itoadmin',
        'remove_agent_itoadmin',
        'create_election_by_itoadmin'
      )`;

    pool.query(adminActionsType, function (error, result, fields) {
      if (error) {
        reject(error);
        return;
      }
      resolve("Type adminActionsType Created");
    });
  });
}
async function thresholdType() {
  return new Promise(function (resolve, reject) {
    const requestsType = `DROP TYPE IF EXISTS threshold_type;
      CREATE TYPE "threshold_type" AS ENUM (
        'limited',
        'unlimited'
      )`;

    pool.query(requestsType, function (error, result, fields) {
      if (error) {
        reject(error);
        return;
      }
      resolve("Type threshold type Created");
    });
  });
}

module.exports = {
  rolesType,
  updateStatusType,
  statusType,
  transactionStatusType,
  walletTransactionStatusType,
  orderType,
  kycStatusType,
  orderStatusType,
  adminRoleType,
  requestsType,
  adminActionsType,
  bankStatusType,
  userRoleType,
  thresholdType,
};
