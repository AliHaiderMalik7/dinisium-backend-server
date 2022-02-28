require("dotenv").config({ path: "../.env" });
const DB = require("../model/DB");
const client = DB.pool;
const Users = require("../model/Users");
const Assets = require("../model/assets");
const Token = require("../model/itoToken");
const BackedAssets = require("../model/backedAssets");
const liquidAssetList = require("./liquid_assets_list");
const { exists } = require("fs");
const cron = require("node-cron");
const { getCurrencyMarketprice } = require("../helper/currencyConverter");

async function seedDefaultRecords() {
  try {
    const superAdmin = (
      await Users.getUserByEmail(process.env.SUPER_ADMIN_EMAIL)
    ).rows[0];
    if (!superAdmin || superAdmin?.role !== "super-admin") {
      return console.log(
        "please update super-admin email into environment variables first"
      );
    }

    const liquidAssetListPromises = liquidAssetList.map(async (liquidAsset) => {
      let asset;
      asset = await Assets.getAssets(DB.pool, {
        name: liquidAsset.name,
      });

      // if (asset.rowCount) {
      //   return console.log(`${liquidAsset.name} already exists`);
      // }

      if (!asset.rowCount) {
        liquidAsset.user_id = superAdmin.id;
        asset = await DB.insertIntoQueryWithClient(
          client,
          DB.tables.assetTable,
          liquidAsset,
          ["id", "currency"]
        );
      }
      // update price at 0h : 05m  -- NOTE: cron job hours range from 0 - 23
      cron.schedule("5 0 * * *", async () => {
        const assetNewPrice = await getAssetNewPrice(asset.rows[0]);
        return updateAssetPrice(asset.rows[0].id, assetNewPrice);
      });
      const assetNewPrice = await getAssetNewPrice(asset.rows[0]);
      return updateAssetPrice(asset.rows[0].id, assetNewPrice);
    });

    await Promise.all(liquidAssetListPromises).catch((err) => {
      console.log(err);
    });

    console.log("Assets created successfully");
  } catch (e) {
    console.log(e);
  }
}

module.exports = { seedDefaultRecords };

const updateAssetPrice = async (assetId, assetNewPrice) => {
  try {
    const assetUpdated = await Assets.updateAsset(
      DB.pool,
      { price: assetNewPrice },
      assetId
    );

    // get all tokens that are linked with specific asset
    const backedAssets = (
      await BackedAssets.getBackedAssets(client, {
        asset_id: assetId,
      })
    ).rows;

    if (backedAssets) {
      for (let index = 0; index < backedAssets.length; index++) {
        const backedAsset = backedAssets[index];
        const token = (await Token.getTokenDetailById(backedAsset.ito_token_id))
          .rows[0];

        const updated_asset_value = assetNewPrice * backedAsset.asset_quantity;
        const updated_target_value =
          Number(token.target_value) +
          (updated_asset_value - backedAsset.asset_value);

        const updated_token_price = updated_target_value / token.supply;

        const fields = {
          price: updated_token_price,
          target_value: updated_target_value,
        };
        // update token_price and target_value
        await Token.updateToken(token.id, fields, ["id"]);

        // get all backed_assets of a token
        const tokenBackAssets = (
          await BackedAssets.getBackedAssets(client, {
            ito_token_id: token.id,
          })
        ).rows;

        // loop through token backed assets
        for (let index = 0; index < tokenBackAssets.length; index++) {
          const tokenBackedAsset = tokenBackAssets[index];
          const fields = {};
          if (tokenBackedAsset.id === backedAsset.id) {
            // asset or back_asset whose price is modifying
            const updated_weightage =
              (updated_asset_value / updated_target_value) * 100;

            fields.weightage = updated_weightage;
            fields.asset_value = updated_asset_value;
          } else {
            const updated_weightage =
              (tokenBackedAsset.asset_value / updated_target_value) * 100;
            fields.weightage = updated_weightage;
          }
          // update token back_asset
          const backAsset = await BackedAssets.updateBackedAsset(
            tokenBackedAsset.id,
            fields,
            ["id"]
          );
        }
      }
    }
  } catch (error) {
    console.log("Error occured : ", error.message);
  }
};

const getAssetNewPrice = async (asset) => {
  if (asset.currency) {
    return await getCurrencyMarketprice(asset.currency);
  }
};
// (async () => {
//   const res = await getAssetNewPrice({ currency: "PKR" });
//   console.log(res);
// })();
