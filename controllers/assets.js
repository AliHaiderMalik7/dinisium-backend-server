const DB = require('../model/DB');
const client = DB.pool;
const Assets = require('../model/assets');
const Token = require('../model/itoToken');
const BackedAssets = require('../model/backedAssets');
const TokenPriceHistory = require('../model/tokenPriceHistory');

const addAsset = async (req, res) => {
  try {
    req.query.name = req.body.name;
    req.body.type = 'static';
    req.body.remaining_supply = req.body.total_supply;
    req.body.user_id = req.user.id;
    req.body.created_at = new Date();
    req.body.updated_at = new Date();

    const assetExist = await Assets.getAssets(DB.pool, req.query);

    if (assetExist.rowCount) {
      return res
        .status(409)
        .json({ success: false, msg: `Asset already exists with this name` });
    }

    if (req.body.price <= 0) {
      return res
        .status(400)
        .json({ success: false, msg: `Asset price must be greater than 0` });
    }

    const asset = (await Assets.createAsset(DB.pool, req.body)).rows[0];

    return res.status(200).json({
      success: true,
      msg: 'New asset added successfully',
      data: asset,
    });
  } catch (error) {
    return res.status(400).json({ success: false, msg: error.message });
  }
};

const getAssets = async (req, res, next) => {
  try {
    const assets = await Assets.getAssets(DB.pool, req.query);
    return res.status(200).json({ success: true, data: assets.rows });
  } catch (error) {
    return res.status(400).send({ msg: error.message });
  }
};

const getAssetApproveddetails = async (req, res, next) => {
  try {
    const assets = await Assets.getAssetApproveddetails(DB.pool, req.params.id);
    // const adminApproved = [];

    // for (let element of assets.rows) {
    //   console.log('data is ....', element);
    //   adminApproved.push(assets.rows[0].fname);
    // }
    // adminApproved.push(assets.rows[0].created_at);

    return res.status(200).json({ success: true, data: assets.rows || [] });
  } catch (error) {
    return res.status(400).send({ msg: error.message });
  }
};

const getAssetDetail = async (req, res, next) => {
  try {
    const assets = await Assets.getAssetDetail(req.query.id);
    return res.status(200).json({ success: true, data: assets.rows });
  } catch (error) {
    return res.status(400).send({ msg: error.message });
  }
};

const getAssetsBystatus = async (req, res, next) => {
  try {
    const assets = await Assets.getAssetsBystatus(DB.pool, req.params.status);
    return res.status(200).json({ success: true, data: assets.rows });
  } catch (error) {
    return res.status(400).send({ msg: error.message });
  }
};

const updateAsset = async (req, res, next) => {
  try {
    const asset = await Assets.getAssetById(DB.pool, req.params.id);

    if (!asset.rowCount) {
      return res.status(404).json({
        success: false,
        msg: `No asset found with id ${req.params.id}`,
      });
    }

    if (
      req.body.updated_remaining_supply < 0 ||
      req.body.updated_total_supply < 0
    ) {
      return res.status(400).json({
        success: false,
        msg: `Remaining supply or total Supply cannot be negative`,
      });
    }

    if (
      Number(req.body.updated_price) !== Number(asset.rows[0].price) &&
      asset.rows[0].type === 'liquid'
    ) {
      return res.status(400).json({
        success: false,
        msg: `Cannot change price of liquid asset`,
      });
    }

    if (req.body.updated_price < 0) {
      return res.status(400).json({
        success: false,
        msg: `Price cannot be less than zero`,
      });
    }

    if (!asset.rows[0].user2_approve && asset.rows[0].user1_approve) {
      if (asset.rows[0].user1_approve === req.user.id) {
        return res.status(400).send({
          success: false,
          msg: 'Waiting for previous verification',
        });
      }

      if (asset.rows[0].user1_approve !== req.user.id) {
        return res.status(400).send({
          success: false,
          msg: 'Please approve or disapprove previous updation first',
        });
      }
    }

    req.body.update_status = 'pending';
    req.body.updated_at = 'now()';
    req.body.user1_approve = req.user.id;
    req.body.user2_approve = 0;
    const assetUpdated = await Assets.updateAsset(
      DB.pool,
      req.body,
      req.params.id,
      Object.keys(asset.rows[0]),
    );

    return res.status(200).json({
      success: true,
      msg: 'Asset updation request generated',
      data: assetUpdated.rows[0],
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
};

const verifyUpdateAsset = async (req, res, next) => {
  try {
    console.log('req.user.id .....', req.user.id);
    console.log(req.body);
    if (!['approved', 'rejected'].includes(req.body.update_status)) {
      return res.status(400).json({
        success: false,
        msg: `Verify status can only be approved or rejected`,
      });
    }

    const asset = await Assets.getAssetById(DB.pool, req.params.id);
    console.log('Assets data ....', asset.rows[0]);
    if (!asset.rowCount) {
      return res.status(404).json({
        success: false,
        msg: `No asset found with id ${req.params.id}`,
      });
    }

    if (asset.rows[0].update_status !== 'pending') {
      return res.status(400).send({
        success: false,
        msg: 'Asset Already updated',
      });
    }

    if (asset.rows[0].user1_approve === req.user.id) {
      return res.status(400).send({
        success: false,
        msg: 'You generated this request. You cannot verify it',
      });
    }

    const {
      total_supply,
      remaining_supply,
      updated_total_supply,
      updated_remaining_supply,
    } = asset.rows[0];

    // if we create an ito without verifying updation request of an asset, this error will occur
    if (
      total_supply > remaining_supply &&
      updated_total_supply === updated_remaining_supply
    )
      return res.status(400).send({
        success: false,
        msg: 'You created an ito without verifying updation request. Please reject this request and create new request',
      });

    await client.query('BEGIN');

    console.log('req.body data ....', req.body);
    if (req.body.update_status === 'approved') {
      console.log('approved starting.....');
      req.body.price = asset.rows[0].updated_price;
      req.body.total_supply = asset.rows[0].updated_total_supply;
      req.body.remaining_supply = asset.rows[0].updated_remaining_supply;

      // if price has updated then update token price too
      if (asset.rows[0].price !== asset.rows[0].updated_price) {
        // get all tokens that are linked with specific asset
        const backedAssets = (
          await BackedAssets.getBackedAssets(client, {
            asset_id: asset.rows[0].id,
          })
        ).rows;

        if (backedAssets) {
          for (let index = 0; index < backedAssets.length; index++) {
            const backedAsset = backedAssets[index];
            const token = (
              await Token.getTokenDetailById(backedAsset.ito_token_id)
            ).rows[0];

            const updated_asset_value =
              asset.rows[0].updated_price * backedAsset.asset_quantity;
            const updated_target_value =
              Number(token.target_value) +
              (updated_asset_value - backedAsset.asset_value);

            const updated_token_price = updated_target_value / token.supply;

            const fields = {
              price: updated_token_price,
              target_value: updated_target_value,
            };
            // update token_price and target_value
            await Token.updateToken(token.id, fields, ['id']);

            // keep track of token updation price
            await TokenPriceHistory.createTokenPriceHistory(DB.pool, {
              ito_token_id: token.id,
              token_price: updated_token_price,
              created_at: new Date(),
              updated_at: new Date(),
            });

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
              await BackedAssets.updateBackedAsset(
                tokenBackedAsset.id,
                fields,
                ['id'],
              );
            }
          }
        }
      }
    }

    req.body.updated_at = 'now()';
    req.body.user2_approve = req.user.id;
    req.body.updated_price = 0;
    req.body.updated_total_supply = 0;
    req.body.updated_remaining_supply = 0;

    const assetUpdated = await Assets.updateAsset(
      DB.pool,
      req.body,
      req.params.id,
      Object.keys(asset.rows[0]),
    );

    await client.query('COMMIT');
    return res.status(200).json({
      success: true,
      msg: `Asset Update Request ${assetUpdated.rows[0].update_status} `,
      data: assetUpdated.rows[0],
    });
  } catch (error) {
    console.log(error.message);
    await client.query('ROLLBACK');
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
};

module.exports = {
  addAsset,
  getAssets,
  getAssetDetail,
  getAssetsBystatus,
  updateAsset,
  verifyUpdateAsset,
  getAssetApproveddetails,
};
