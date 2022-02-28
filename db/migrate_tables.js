require("dotenv").config({ path: "../.env" });
const types = require("./types");
const tables = require("./tables");
const relations = require("./table_relations");
const seed = require("./seed_db");

// const seed_ito_token = require("./seed_ito_token")
async function migrate() {
  try {
    // ENUM types;
    let typePromises = Object.keys(types).map(key => {
      return types[key]();
    });

    console.log('enum types---------------');
    await Promise.all(typePromises);
    console.log('enum types creation completed');

    //Database tables
    let tablesPromises = Object.keys(tables).map(key => {
      return tables[key]();
    });

    console.log('tables---------------------');
    await Promise.all(tablesPromises);
    console.log('tables creation completed');

    // //Tables relations
    console.log('relation------------');
    await relations.tablesRelations();
    console.log('relations creation completed');

    //Seeder
    await seed.seedDefaultRecords();
    console.log('seed_db created');
  } catch (error) {
    console.log(error.message);
  }
}

//Database migrations run
migrate();
