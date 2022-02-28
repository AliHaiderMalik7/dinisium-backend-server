const DB = require('../model/DB');
const Token = require('../model/itoToken');
const ITO = require('../model/ITO');
const BackedAssets = require('../model/backedAssets');
const TokenPriceHistory = require('../model/tokenPriceHistory');
const AllotedItos = require('../model/allotedItos');
const Assets = require('../model/assets');
const crypto = require('crypto');
const client = require('../model/DB').pool;
const Wallet = require('../model/wallet');
const Blockchain = require('../helper/blockchain');
const { stringify } = require('querystring');
const {
  increaseTokenSupply,
  decreaseTokenSupply,
} = require('../helper/blockchain');

const createToken = async (req, res, next) => {
  try {
    try {
      // console.log(req.body)
      req.body.ito_id = 4;
      const ito = (await ITO.getITOById(req.body.ito_id)).rows[0];

      if (!ito) {
        return res.status(404).json({
          success: false,
          msg: `No ito found with id ${req.body.ito_id}`,
        });
      }

      const query = { token_name: req.body.token_name };

      const tokenWithSameName = (await Token.getAllTokens(query)).rows[0];

      if (tokenWithSameName) {
        return res.status(403).json({
          success: false,
          msg: `Token name must be unique`,
        });
      }

      const itoToken = (await Token.getTokenByIto(ito.id)).rows[0];

      if (itoToken) {
        return res.status(403).json({
          success: false,
          msg: `Can not create multiple tokens on same ITO`,
        });
      }

      const token_address = crypto
        .createHash('sha256')
        .update('secret')
        .digest('hex');

      // req.body.ito_id = 1;
      req.body.token_address = token_address;
      req.body.created_at = new Date();
      req.body.updated_at = new Date();
      req.body.remaining_supply = req.body.supply;

      const tokenBody = Object.assign({}, req.body);
      delete tokenBody.back_assets;

      await client.query('BEGIN');
      const token = await Token.createToken(tokenBody);

      for (let index = 0; index < req.body.back_assets.length; index++) {
        let back_asset = req.body.back_assets[index];

        const assetDetail = await Assets.getAssetById(
          DB.pool,
          back_asset.asset_id,
        );
        if (!assetDetail.rowCount) {
          throw new Error({
            status: 404,
            msg: `No asset found with id ${back_asset.asset_id}`,
          });
        }

        // update remaining supply after alloting some of the supply to token
        const assetBody = {};
        assetBody.remaining_supply =
          assetDetail.rows[0].remaining_supply - back_asset.asset_quantity;
        const assetUpdated = await Assets.updateAsset(
          DB.pool,
          assetBody,
          back_asset.asset_id,
          ['id', 'remaining_supply'],
        );

        const query = {};
        query.ito_token_id = token.rows[0].id;
        query.asset_id = back_asset.asset_id;

        let backedAssetsDetail = (
          await BackedAssets.getBackedAssets(DB.pool, query)
        ).rows[0];
        if (backedAssetsDetail) {
          throw new Error({
            status: 409,
            msg: 'Token is already assigned to this asset',
          });
        }

        back_asset.created_at = new Date();
        back_asset.updated_at = new Date();
        back_asset.ito_token_id = token.rows[0].id;
        delete back_asset.asset_price;

        const backedAsset = (
          await BackedAssets.createBackedAsset(DB.pool, back_asset)
        ).rows[0];
      }

      const backAsset = await BackedAssets.getBackedAssets(DB.pool);

      await client.query('COMMIT');
      return res.status(200).json({
        success: true,
        msg: 'Token created successfully',
        data: token.rows[0],
      });
    } catch (error) {
      console.log(error.message);
      await client.query('ROLLBACK');
      return res.status(error.message?.status || 400).json({
        success: false,
        msg: error.message?.msg || 'Something went wrong',
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
};

const addTokenTOExchange = async (req, res, next) => {
  try {
    const token = await Token.getTokenById(req.params.id);

    if (!token.rows.length) {
      return res.status(404).json({
        success: false,
        msg: `No token found with id ${req.params.id}`,
      });
    }

    if (token['is_tradeable']) {
      return res
        .status(400)
        .json({ success: false, msg: 'Token is already tradeable' });
    }

    if (!req.body['is_tradeable']) {
      // check if tradeable is false or not exists
      return res
        .status(400)
        .json({ success: false, msg: 'Please mark tradable to true first' });
    }

    const tokenUpdated = await Token.addTokenToExchange(
      req.params.id,
      req.body.is_tradeable,
      [
        'id',
        'token_symbol',
        'token_name',
        'supply',
        'is_tradeable',
        'created_at',
        'updated_at',
      ],
    );

    res.status(200).json({
      success: true,
      msg: 'Token is now tradeable',
      data: tokenUpdated.rows[0],
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

// Request for updation of supply, buying spread and selling spread
const updateTokenRequest = async (req, res, next) => {
  try {
    // req.body.new_supply, new_buying_spread, new_selling_spread
    if (req.body?.new_buying_spread < 0 || req.body?.new_selling_spread < 0) {
      return res.status(400).send({
        status: false,
        msg: 'Spreads cannot be negative',
      });
    }
    let token = (await Token.getTokenDetailById(req.params.id)).rows[0];

    if (!token) {
      return res
        .status(404)
        .json({ success: false, msg: 'No token found to update' });
    }

    const ito = (await ITO.getITOById(token.ito_id)).rows[0];

    if (!ito) {
      return res
        .status(404)
        .json({ success: false, msg: `User ITO does not exist.` });
    }

    // restrict user who can update token
    // get alloted itos by ito id
    const allotedItos = (await AllotedItos.getAllotedITO(token.ito_id)).rows;

    const allotedItosIts = allotedItos.map(allotedIto => allotedIto.admin_id);

    if (!allotedItosIts.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        msg: 'You cannot update token',
      });
    }

    if (token.update_request_userid) {
      return res.status(400).json({
        success: false,
        msg: `Please verify previous updation request first...`,
      });
    }

    if (['rejected', 'pending'].includes(ito.status)) {
      return res.status(400).json({
        success: false,
        msg: `Cannot update token on ${ito.status} ito`,
      });
    }

    if (ito.onhold || ito.closed) {
      return res.status(400).json({
        success: false,
        msg: `Cannot update token with onhold or closed ito`,
      });
    }

    const remaining_supply =
      Number(token.remaining_supply) + Number(req.body.new_supply);
    const supply = Number(token.supply) + Number(req.body.new_supply);

    if (remaining_supply < 0) {
      return res.status(400).json({
        success: false,
        msg: 'Token remaining supply cannot be less than 0',
      });
    }

    if (supply < 0) {
      return res.status(400).json({
        success: false,
        msg: 'Token total supply cannot be less than 0',
      });
    }

    const tokenBody = {};

    tokenBody.update_request_userid = req.user.id;
    tokenBody.new_supply = req.body.new_supply;
    tokenBody.new_buying_spread = req.body.new_buying_spread;
    tokenBody.new_selling_spread = req.body.new_selling_spread;
    tokenBody.update_status = 'pending';
    tokenBody.updated_at = 'now()';

    await client.query('BEGIN');
    const tokenUpdated = await Token.updateToken(
      token.id,
      tokenBody,
      Object.keys(token),
    );

    await client.query('COMMIT');
    return res.status(200).json({
      success: true,
      msg: 'Supply update request generated successfully',
      data: tokenUpdated.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(400).json({ success: false, msg: error.message });
  }
};

const verifyTokenUpdationRequest = async (req, res, next) => {
  try {
    if (
      !req.body.update_status ||
      !['approved', 'rejected'].includes(req.body.update_status)
    ) {
      return res.status(400).json({
        success: false,
        msg: 'Status can only be approved or rejected',
      });
    }

    let token = (await Token.getTokenDetailById(req.params.id)).rows[0];

    if (!token) {
      return res
        .status(404)
        .json({ success: false, msg: 'No token found to verify' });
    }

    if (!token.update_request_userid) {
      return res.status(404).json({
        success: false,
        msg: 'Please add updation request first',
      });
    }

    if (token.update_request_userid === req.user.id) {
      return res.status(403).json({
        success: false,
        msg: 'You generated updation request. Your cannot verify this',
      });
    }

    // get alloted itos by ito id other than who created updation request
    const allotedItos = (
      await AllotedItos.getAllotedITOToVerifyIto(
        token.ito_id,
        token.update_request_userid,
      )
    ).rows;

    const allotedItosIts = allotedItos.map(allotedIto => allotedIto.admin_id);

    if (!allotedItosIts.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        msg: 'You cannot verify this token.',
      });
    }

    if (['rejected', 'approved'].includes(token.update_status)) {
      return res
        .status(409)
        .json({ success: false, msg: 'Token already verified' });
    }

    const remaining_supply =
      Number(token.remaining_supply) + Number(token.new_supply);
    const supply = Number(token.supply) + Number(token.new_supply);

    if (req.body.update_status === 'approved') {
      if (remaining_supply < 0) {
        // token.remaining_supply < remaining_supply
        return res.status(400).json({
          success: false,
          msg: 'Token remaining supply cannot be less than 0', //Token remaining supply cannot be less than new supply
        });
      }

      if (supply < 0) {
        // token.supply < token.new_supply
        return res.status(400).json({
          success: false,
          msg: 'Token total supply cannot be less than 0', //Token total supply cannot be less than new supply
        });
      }
    }

    const fields = {
      update_status: req.body.update_status,
      update_verify_userid: req.user.id,
      ...(req.body.update_status === 'approved' && {
        remaining_supply,
        supply,
        buying_spread: token.new_buying_spread,
        selling_spread: token.new_selling_spread,
        price: token.target_value / supply,
      }),

      update_request_userid: null,
      new_supply: null,
      new_buying_spread: null,
      new_selling_spread: null,
    };

    await client.query('BEGIN');
    const tokenUpdated = await Token.updateToken(
      token.id,
      fields,
      Object.keys(token),
    );

    if (req.body.update_status === 'approved') {
      if (token.new_supply > 0) {
        const data = {
          amount: token.new_supply,
          // ito_token_id: token.id,
          ito_token_id: token.ito_id,
        };

        const increaseSupply = await increaseTokenSupply(data).catch(err => {
          throw new Error('Token Supply not increased... Please Try again');
        });

        const hash = increaseSupply.response.hash;
        const fields = {
          update_token_supply_hash: hash,
        };

        console.log('Token To be updated is ', token);
        const tokenUpdated = await Token.updateToken(
          token.id,
          fields,
          Object.keys(token),
        );
        // console.log(
        //  "HAsh after approved req............",
        //  increaseSupply.response.hash
        // );
      } else {
        let new_supply = Math.abs(token.new_supply);
        const data = {
          amount: new_supply,
          ito_token_id: token.id,
        };

        const decreaseSupply = await decreaseTokenSupply(data).catch(err => {
          throw new Error('Token Supply not decreased... Please Try again');
        });
        const hash = decreaseSupply.response.hash;
        const fields = {
          update_token_supply_hash: hash,
        };

        console.log('Token To be updated is ', token);
        const tokenUpdated = await Token.updateToken(
          token.id,
          fields,
          Object.keys(token),
        );
      }
      await TokenPriceHistory.createTokenPriceHistory(DB.pool, {
        ito_token_id: token.id,
        token_price: token.target_value / supply,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    await client.query('COMMIT');
    return res.status(200).json({
      success: true,
      msg: `You ${req.body.update_status} updation request successfully`,
      data: tokenUpdated.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, msg: error.message });
  }
};

// Request for updation of supply of back assets of token
const updateTokenBackAssetRequest = async (req, res, next) => {
  try {
    // req.params.id
    //req.body.new_asset_quantity
    const back_asset = (
      await BackedAssets.getBackedAssets(DB.pool, {
        id: req.params.id,
      })
    ).rows[0];

    if (!back_asset) {
      return res.status(404).json({
        success: false,
        msg: 'No back asset found with provided id',
      });
    }
    let token = (await Token.getTokenDetailById(back_asset.ito_token_id))
      .rows[0];

    if (!token) {
      return res
        .status(404)
        .json({ success: false, msg: 'No token found to update' });
    }

    const ito = (await ITO.getITOById(token.ito_id)).rows[0];

    if (!ito) {
      return res
        .status(404)
        .json({ success: false, msg: `User ITO does not exist.` });
    }

    // restrict user who can update token
    // get alloted itos by ito id
    const allotedItos = (await AllotedItos.getAllotedITO(token.ito_id)).rows;

    const allotedItosIts = allotedItos.map(allotedIto => allotedIto.admin_id);

    if (!allotedItosIts.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        msg: 'You cannot update token',
      });
    }

    const assetQuantity =
      Number(back_asset.asset_quantity) + Number(req.body.new_asset_quantity);

    if (back_asset.updateasset_request_userid) {
      return res.status(400).json({
        success: false,
        msg: `Please verify previous updation request first`,
      });
    }

    if (assetQuantity < 0) {
      return res.status(400).json({
        success: false,
        msg: 'Asset total quantity cannot be less than 0',
      });
    }

    if (['rejected', 'pending'].includes(ito.status)) {
      return res.status(400).json({
        success: false,
        msg: `Cannot update token on ${ito.status} ito`,
      });
    }

    if (ito.onhold || ito.closed) {
      return res.status(400).json({
        success: false,
        msg: `Cannot update token with onhold or closed ito`,
      });
    }

    const backAssetBody = {};

    backAssetBody.updateasset_request_userid = req.user.id;
    backAssetBody.new_asset_quantity = req.body.new_asset_quantity;
    backAssetBody.updateasset_status = 'pending';
    backAssetBody.updated_at = 'now()';

    await client.query('BEGIN');
    const backAssetUpdated = await BackedAssets.updateBackedAsset(
      req.params.id,
      backAssetBody,
      Object.keys(back_asset),
    );
    // // get all backed_assets of a token
    // const updatedbacedAssets = (
    //   await BackedAssets.getBackedAssetsForTokenDetail(client, {
    //     ito_token_id: token.id,
    //   })
    // ).rows;

    await client.query('COMMIT');
    return res.status(200).json({
      success: true,
      msg: 'Asset quantity update request generated successfully',
      data: backAssetUpdated.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(400).json({ success: false, msg: error.message });
  }
};

const verifyTokenBackAssetUpdationRequest = async (req, res, next) => {
  try {
    if (
      !req.body.updateasset_status ||
      !['approved', 'rejected'].includes(req.body.updateasset_status)
    ) {
      return res.status(400).json({
        success: false,
        msg: 'Status can only be approved or rejected',
      });
    }

    const back_asset = (
      await BackedAssets.getBackedAssets(DB.pool, {
        id: req.params.id,
      })
    ).rows[0];
    if (!back_asset) {
      return res.status(404).json({
        success: false,
        msg: 'No back asset found with provided id',
      });
    }

    let token = (await Token.getTokenDetailById(back_asset.ito_token_id))
      .rows[0];

    if (!token) {
      return res
        .status(404)
        .json({ success: false, msg: 'No token found to verify' });
    }

    const asset = (await Assets.getAssetById(DB.pool, back_asset.asset_id))
      .rows[0];

    if (!asset) {
      return res.status(404).json({
        success: false,
        msg: `No asset found with id ${req.params.id}`,
      });
    }

    if (!back_asset.updateasset_request_userid) {
      return res.status(404).json({
        success: false,
        msg: `Please add updation request first`,
      });
    }

    if (back_asset.updateasset_request_userid === req.user.id) {
      return res.status(403).json({
        success: false,
        msg: 'You generated updation request. Your cannot verify this',
      });
    }

    // get alloted itos by ito id other than who created updation request
    const allotedItos = (
      await AllotedItos.getAllotedITOToVerifyIto(
        token.ito_id,
        back_asset.updateasset_request_userid,
      )
    ).rows;

    const allotedItosIts = allotedItos.map(allotedIto => allotedIto.admin_id);

    if (!allotedItosIts.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        msg: 'You cannot verify this asset.',
      });
    }

    if (['rejected', 'approved'].includes(back_asset.updateasset_status)) {
      return res
        .status(409)
        .json({ success: false, msg: 'Asset already verified' });
    }

    const body = {};
    let tokenFields = {};

    if (req.body.updateasset_status === 'approved') {
      body.price = back_asset.new_asset_quantity;

      const assetQuantity =
        Number(back_asset.asset_quantity) +
        Number(back_asset.new_asset_quantity);

      if (assetQuantity < 0) {
        return res.status(400).json({
          success: false,
          msg: 'Asset total quantity cannot be less than 0',
        });
      }

      // original asset quantity cannot be less than 0
      const updated_remaining_asset_supply =
        Number(asset.remaining_supply) - Number(back_asset.new_asset_quantity);
      if (updated_remaining_asset_supply < 0) {
        return res.status(400).json({
          success: false,
          msg: 'Asset remaining supply cannot be less than 0. Please reject your request',
        });
      }

      await client.query('BEGIN');

      const assetUpdated = await Assets.updateAsset(
        DB.pool,
        { remaining_supply: updated_remaining_asset_supply },
        asset.id,
        ['id'],
      );

      //update token price and target_value
      const updated_asset_value =
        Number(asset.price) *
        (Number(back_asset.asset_quantity) +
          Number(back_asset.new_asset_quantity));

      const updated_target_value =
        Number(token.target_value) +
        (Number(updated_asset_value) - Number(back_asset.asset_value));

      const updated_token_price = updated_target_value / token.supply;

      tokenFields = {
        price: updated_token_price,
        target_value: updated_target_value,
      };

      // update token_price and target_value
      const tokenUpdated = await Token.updateToken(
        token.id,
        tokenFields,
        Object.keys(token),
      );

      // Keep track of token updation price
      const data = await TokenPriceHistory.createTokenPriceHistory(DB.pool, {
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
        if (tokenBackedAsset.id === back_asset.id) {
          // asset or back_asset whose price is modifying
          const updated_weightage =
            (updated_asset_value / updated_target_value) * 100;

          fields.updated_at = 'now()';
          fields.updateasset_verify_userid = req.user.id;
          fields.new_asset_quantity = 0;
          fields.asset_quantity =
            Number(back_asset.asset_quantity) +
            Number(back_asset.new_asset_quantity);
          fields.updateasset_request_userid = null;
          fields.weightage = updated_weightage;
          fields.asset_value = updated_asset_value;
          fields.updateasset_status = req.body.updateasset_status;
        } else {
          const updated_weightage =
            (tokenBackedAsset.asset_value / updated_target_value) * 100;
          fields.weightage = updated_weightage;
        }
        // update token back_asset
        await BackedAssets.updateBackedAsset(tokenBackedAsset.id, fields, [
          'id',
        ]);
        // update original asset too
      }
    }
    if (req.body.updateasset_status === 'rejected') {
      const status = req.body.updateasset_status;

      // get all backed_assets of a token
      const tokenBackAssets = (
        await BackedAssets.getBackedAssets(client, {
          ito_token_id: token.id,
        })
      ).rows;

      for (let index = 0; index < tokenBackAssets.length; index++) {
        const tokenBackedAsset = tokenBackAssets[index];
        if (tokenBackedAsset.id === back_asset.id) {
          const fields = {
            updateasset_status: status,
            updateasset_verify_userid: req.user.id,
            updateasset_request_userid: null,
          };

          const data_updated = await BackedAssets.updateBackedAsset(
            tokenBackedAsset.id,
            fields,
            ['id'],
          );
        }
      }
    }

    // get all backed_assets of a token
    const updatedbacedAssets = (
      await BackedAssets.getBackedAssetsForTokenDetail(client, token.id)
    ).rows;

    await client.query('COMMIT');
    return res.status(200).json({
      success: true,
      msg: `You ${req.body.updateasset_status} updation request successfully`,
      data: updatedbacedAssets,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, msg: error.message });
  }
};

const getTokens = async (req, res, next) => {
  try {
    const { status } = req.query;
    // return avaiable tokens for exchange
    if (status && status === 'unhold') {
      req.query.is_blocked = false;
      req.query.is_tradeable = true;
    }
    // return all onhold tokens
    if (status && status === 'onhold') {
      req.query.is_blocked = true;
      req.query.is_tradeable = true;
    }

    delete req.query['status'];

    const tokens = await Token.getAllTokens(req.query);
    if (tokens.rowCount > 0) {
      const array = tokens.rows;
      array.forEach(element => {
        element.label = element.token_name;
        element.value = element.token_name;
      });
      return res.status(200).json({ success: true, data: tokens.rows });
    } else {
      return res.status(200).json({ success: false, data: [] });
    }
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

const getExchangeTokens = async (req, res, next) => {
  try {
    if (req.query.tradable !== undefined) {
      // BuyToken investor portal
      console.log('Buy Token');
      const tokens = await Token.findAllOngoingTokens();
      console.log('tokens data ....', tokens.rows );
      return res.status(200).json({ success: true, data: tokens.rows });
    } else {
      // Market Place investor portal
      console.log('Market Place Here ');
      const tokens = await Token.findAllexchangeableokens(true);

      return res.status(200).json({ success: true, data: tokens.rows });
    }
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

/**Author:Ali haider
 * Description: function used to fetch details of tokens
 * func name: getTokensDetail
 */
// const getTokensDetail = async (req, res, next) => {
//   try {
//     console.log('Get Tokens Details .............');
//     // const response = await Blockchain.getAllItos();
//     const response = (await Token.getTokensDetail()).rows;
//     console.log('response data ....', response);

//     return res.status(200).json({ success: true, data: response || [] });
//     // }
//   } catch (error) {
//     res.status(500).json({ success: false, msg: error.message });
//   }
// };

// getSellExchangeTokens
const getSellExchangeTokens = async (req, res, next) => {
  try {
    console.log('exchange Tokens.............');
    const response = await Wallet.getAccountLists(req.user.id);
    console.log('Tokens sell list ....', response);
    const userTokenss = [];
    if (response) {
      const newArray = response.filter(result => {
        if (result.Amount_of_tokens > 0) {
          console.log(result.Amount_of_tokens);
          return result;
        }
      });
      // console.log('new array ....', newArray);
      //get
      // for (let element of newArray) {
      //   const userTokens = await Token.getTokenByIto(element.ito_id);
      //   // console.log('element ....', element);

      //   userTokenss.push(userTokens.rows[0]);
      // }

      // console.log('userTokens data ....', userTokenss);

      return res.status(200).json({ success: true, data: newArray || [] });
    }
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};
const getToken = async (req, res, next) => {
  try {
    const token = await Token.getTokenById(req.params.id);

    res.status(200).json({ success: true, data: token.rows[0] || {} });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

const updateToken = async (req, res, next) => {
  try {
    if (!Object.keys(req.body)) {
      return res
        .status(400)
        .json({ success: false, msg: 'No fields to update' });
    }

    let is_blocked = req.body.is_blocked;

    delete req.body['is_blocked'];

    const token = await Token.getTokenById(req.params.id);

    if (!token.rows.length) {
      return res.status(404).json({
        success: false,
        msg: `no token found with id ${req.params.id}`,
      });
    }

    if (is_blocked !== undefined && token.rows[0].is_tradeable) {
      req.body['is_blocked'] = is_blocked;
    }

    const tokenUpdated = await Token.updateToken(req.params.id, req.body, [
      'id',
      'token_symbol',
      'token_name',
      'supply',
      'price',
      'is_tradeable',
      'created_at',
      'updated_at',
    ]);

    res.status(200).json({
      success: true,
      data: tokenUpdated.rows[0],
      msg: 'token updated successfully',
    });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

const deleteToken = async (req, res, next) => {
  try {
    const token = await Token.getTokenById(req.params.id);
    if (!token.rows.length) {
      return res.status(400).json({
        success: false,
        msg: `no token found with id ${req.params.id}`,
      });
    }
    await Token.deleteToken(req.params.id);
    res.status(200).json({ success: true, msg: 'token deleted successfully' });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

const getAllTokensWithUser = async (req, res, next) => {
  try {
    console.log(req.user.id);
    const tokens = (await Token.findAllexchangeToeknsWithUser(req.user.id))
      .rows;
    console.log('Tokens data length', tokens.length);
    res.status(200).json({ success: true, data: tokens });
  } catch (error) {
    res.status(500).send({ msg: error.message });
  }
};

const getTokenPriceHistory = async (req, res) => {
  try {
    const id = req.params.id;
    let filterBy = '';

    // req.query.filterWith = 'lastDay';
    // console.log(req.query.filterWith);
    // if (req.query.filterWith == "lastDay") {
    //   filter += `AND t1.created_at > ( now() - '1 day'::interval) ORDER BY t1.created_at`;
    //   // filter += `AND t1.created_at >= (DATE_SUB( 'CURDATE()', INTERVAL 1 DAY )) ORDER BY t1.created_at desc`;
    // } else if (req.query.filterWith === "lastWeek") {
    //   filter += `AND t1.created_at > ( now() - '1 week'::interval) ORDER BY t1.created_at`;
    // } else if (req.query.filterWith === "lastMonth") {
    //   filter += `AND t1.created_at > ( now() - '1 month'::interval) ORDER BY t1.created_at`;
    // } else if (req.query.filterWith === "lastYear") {
    //   filter += `AND t1.created_at > ( now() - '1 year'::interval) ORDER BY t1.created_at`;
    // } else {
    //   filter += `ORDER BY t1.created_at LIMIT 15`;
    // }

    if (req.query.filterWith === 'perDay') {
      filterBy = 'day';
    } else if (req.query.filterWith === 'perWeek') {
      filterBy = 'week';
    } else if (req.query.filterWith === 'perMonth') {
      filterBy = 'month';
    } else if (req.query.filterWith === 'perYear') {
      filterBy = 'year';
    } else {
      filterBy = 'month';
    }

    const response = await TokenPriceHistory.getTokenPriceHistory(
      DB.pool,
      id,
      filterBy,
    );
    // console.log(`response : `, response.rows);

    if (response.rowCount > 0) {
      getResponse = response.rows;
      let finalObj = [];
      const groups = getResponse.reduce((groups, element) => {
        let date = JSON.stringify(element.date).split('T')[0];
        date = date.substring(1, date.length);
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(element.price);
        return groups;
      }, {});
      // console.log("GROUPS HERE: ", groups);
      // finalObj.push(groups);
      // console.log('DONE : ', groups);

      for (const [key, value] of Object.entries(groups)) {
        console.log(key, value);
        // if(!finalObj[key]){
        //   finalObj[key] = []
        // }
        finalObj.push({
          key,
          O: value[0],
          C: value[value.length - 1],
          H: Math.max(...value),
          L: Math.min(...value),
        });
      }
      // console.log("GET finalObj HERE : ", finalObj);
      return res.status(200).send({
        success: true,
        data: finalObj,
        // data: data,
      });
    } else {
      return res.status(200).send({
        success: true,
        msg: 'No record found.',
        data: [],
      });
    }
  } catch (error) {
    return res.status(500).send({
      msg: error.message,
    });
  }
};

// const getTokensCurrentPrice = async (req, res) => {
//   try {
//     console.log(`here`);
//     const response = await Token.getTokenCurrentPrice(DB.pool);
//     console.log(`here : `, response.rows);

//     if (response.rowCount > 0) {
//       return res.status(200).send({
//         success: true,
//         data: response.rows,
//       });
//     } else {
//       return res.status(200).send({
//         success: false,
//         msg: "No record found.",
//         data: [],
//       });
//     }
//   } catch (error) {
//     return res.status(500).send({
//       msg: error.message,
//     });
//   }
// };

const getTokenInfo = async (req, res) => {
  try {
    const response = await Token.getTokenInfo(DB.pool);
    console.log(`here : `, response.rows);

    if (response.rowCount > 0) {
      let objId = null;
      let newArray = [];
      const array = response.rows;
      let totalMarketCap = 0;
      let totalMintedSupplyOfTokens = 0;
      let totalTradingSupplyOfTokens = 0;

      //code to get rid of duplicate entries of token;
      array.forEach(element => {
        objId = element.ito_id;
        if (!newArray[objId]) {
          newArray[objId] = element;
        }
      });

      //code to get rid of null objects entered;
      //if tradeable === true show current price
      //else show last price of token;
      newArray = newArray.filter(element => {
        if (element !== undefined && element.is_tradeable) {
          element.is_tradeable = 'YES';
          totalMarketCap += parseFloat(element.marketcap);
          totalMintedSupplyOfTokens += parseInt(element.minted_supply);
          totalTradingSupplyOfTokens += parseInt(
            element.total_supply_available_for_trading,
          );
          element.marketcap = parseFloat(element.marketcap).toFixed(4);
          element.price = parseFloat(element.price).toFixed(2);
          delete element.token_price;
        } else if (element !== undefined && !element.is_tradeable) {
          element.is_tradeable = 'NO';
          totalMarketCap += parseFloat(element.marketcap);
          totalMintedSupplyOfTokens += parseInt(element.minted_supply);
          totalTradingSupplyOfTokens += parseInt(
            element.total_supply_available_for_trading,
          );
          element.marketcap = parseFloat(element.marketcap).toFixed(4);
          element.price = element.token_price;
          element.price = parseFloat(element.price).toFixed(2);
          delete element.token_price;
        }
        return element;
      });

      return res.status(200).send({
        success: true,
        data: newArray,
        totalMarketCap: totalMarketCap.toFixed(4),
        totalMintedSupplyOfTokens,
        totalTradingSupplyOfTokens,
      });
    } else {
      return res.status(200).send({
        success: false,
        msg: 'No record found.',
        data: [],
      });
    }
  } catch (error) {
    return res.status(500).send({
      msg: error.message,
    });
  }
};

module.exports = {
  getTokens,
  getToken,
  updateTokenRequest,
  verifyTokenUpdationRequest,
  updateTokenBackAssetRequest,
  verifyTokenBackAssetUpdationRequest,
  updateToken,
  deleteToken,
  createToken,
  addTokenTOExchange,
  getExchangeTokens,
  // getTokensDetail,
  getAllTokensWithUser,
  getTokenPriceHistory,
  // getTokensCurrentPrice,
  getTokenInfo,
  getSellExchangeTokens,
};
