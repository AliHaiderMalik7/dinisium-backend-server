require("dotenv").config({ path: "../.env" });
const { Pool } = require("pg");
const DB = require("../model/DB");
const ICOAppConfig = require("../config/configBasic");
const subAdminPermissions = require("./permissions");
const contentData = require("./content_data");

async function seedDefaultRecords() {
  try {
    await DB.insertIntoQueryWithClient(
      DB.pool,
      DB.tables.usersTable,
      {
        fname: "naurillion",
        lname: "dinisium",
        role: "super-admin",
        email: "naurillion@test.ae",
        password:
          "$2b$10$RnPsz3.p1HVsuDcSjbfsM.NDRYc3k7AfUPL1KvwIkYISsC.2uguki", //naurillion-test
        contact_no: 11112222,
        country: "UAE",
        auth_token: "",
        is_number_verification_on: false,
        is_email_verification_on: false,
        is_google_authentication_on: false,
        is_email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      ["id"]
    );

    await DB.insertIntoQueryWithClient(
      DB.pool,
      DB.tables.contentTable,
      contentData,
      ["id"]
    );

    // await DB.insertIntoQueryWithClient(
    //     DB.pool,
    //     DB.tables.itoTable,
    //     {
    //         name: "MILKSHAKE",
    //         description: "nice token",
    //         token_address: "address address",
    //         status: "ongoing",
    //         start_date: new Date(),
    //         end_date: new Date(),
    //         created_at: new Date(),
    //         updated_at: new Date(),
    //     },
    //     ["id"]
    // );
    // await DB.insertIntoQueryWithClient(
    //     DB.pool,
    //     DB.tables.itoTokenTable,
    //     {
    //         ito_id: 1,
    //         token_address: "address",
    //         token_symbol: "TK",
    //         token_decimal: 8,
    //         token_name: "MILKSHAKE",
    //         price:5,
    //         supply: 50000,
    //         remaining_supply:50000,
    //         is_blocked: false,
    //         is_tradeable: false,
    //         created_at: new Date(),
    //         updated_at: new Date(),
    //     },
    //     ["id"]
    // );

    // await DB.insertIntoQueryWithClient(
    //     DB.pool,
    //     DB.tables.fiatTransactionsTable,
    //     {
    //         user_id: 1,
    //         amount: 200,
    //         currency: "USD",
    //         transaction_status: "completed",
    //         created_at: new Date(),
    //         updated_at: new Date(),
    //     },
    //     ["id"]
    // );

    const permissionPromises = subAdminPermissions.map(async (permission) => {
      return DB.insertIntoQueryWithClient(
        DB.pool,
        DB.tables.permissionsTable,
        permission
      );
    });

    await Promise.all(permissionPromises);

    console.log("All records added");
  } catch (e) {
    console.log(e);
  }
}

//seedDefaultRecords();

module.exports = {
  seedDefaultRecords: seedDefaultRecords,
};
