require("dotenv").config({ path: '../.env' });
const { Pool } = require("pg");
const DB = require("../model/DB");
const ICOAppConfig = require("../config/configBasic");

async function seedDefaultRecords() {
  try {
    let response1 = await DB.insertIntoQueryWithClient(
      DB.pool,
      DB.tables.itoAdminTable,
      {
        fname: "naurillion",
        lname: "dinisium",
        email: "naurillion@test.ae",
        contact_no: 11112222,
        country: "UAE",
        password:
          "$2b$10$RnPsz3.p1HVsuDcSjbfsM.NDRYc3k7AfUPL1KvwIkYISsC.2uguki", //naurillion-test
        auth_token: "",
        is_number_verification_on: false,
        is_email_verification_on: false,
        is_google_authentication_on: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      ["id"]
    );
    // let response2 = await DB.insertIntoQueryWithClient(
    //     DB.pool,
    //     DB.tables.usersTable,
    //     {
    //         fname: "naurillion",
    //         lname: "dinisium",
    //         email: "naurillion@test.ae",
    //         contact_no: 11112222,
    //         country: "UAE",
    //         auth_token: "",
    //         is_number_verification_on: false,
    //         is_email_verification_on: false,
    //         is_google_authentication_on: false,
    //         created_at: new Date(),
    //         updated_at: new Date(),
    //     },
    //     ["id"]
    // )

    // let response3 = await DB.insertIntoQueryWithClient(
    //     DB.pool,
    //     DB.tables.itoAdminTable,
    //     {
    //         fname: "naurillion",
    //         lname: "dinisium",
    //         email: "naurillion@test.ae",
    //         contact_no: 11112222,
    //         country: "UAE",
    //         created_at: new Date(),
    //         updated_at: new Date(),
    //     },
    //     ["id"]
    // )
    console.log("All records added");
  } catch (e) {
    console.log(e);
  }
}

seedDefaultRecords();

module.exports = {
  seedDefaultRecords: seedDefaultRecords,
};
