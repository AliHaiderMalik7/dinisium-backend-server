const DB = require('../model/DB');
const client = DB.pool;
const ITO = require('../model/ITO');
const ItoWallet = require('../model/ITOWallet');
const Token = require('../model/itoToken');
const Assets = require('../model/assets');
const BackedAssets = require('../model/backedAssets');
const ItoSeries = require('../model/itoSeries');
const WalletTransaction = require('../model/walletTransaction');
const crypto = require('crypto');
const AllotedIto = require('../model/allotedItos');
const { getStartAndEndTime } = require('../helper/getTime');
const {
  createWallet,
  createItoOnBlockchain,
  getAllItos,
  transferToken,
} = require('../helper/blockchain');
const Users = require('../model/Users');
const AllotedItos = require('../model/allotedItos');
const TokenPriceHistory = require('../model/tokenPriceHistory');
const Subscription = require('../model/subscription');
const AllotedSubscriptions = require('../model/allotedSubscriptions');
const Wallet = require('../model/wallet');
const itoBlock = require('../model/itoBlock');

const create = async (req, res, next) => {
  try {
    console.log('req body of ito ....', req.body);
    try {
      const itoBody = { ...req.body.ito };

      const itoAllotedAdmins = req.body?.ito?.alloted_admins
        ? [...req.body?.ito?.alloted_admins]
        : [];
      console.log('alloted admins in create body', itoAllotedAdmins);
      const tokenBody = { ...req.body.token };

      const tokenBackAssets = [...req.body?.token?.back_assets] || [];

      const seriesBody = { ...req.body.series };

      const files = req.files || [];

      const subscriptionId =
        req.body.subscription_id === 'false' ? false : req.body.subscription_id;

      let subscription = undefined;

      if (subscriptionId) {
        subscription = (await Subscription.getSubscriptionByID(subscriptionId))
          ?.rows[0];
        if (!subscription) {
          return res.status(404).json({
            success: false,
            msg: `No subscription found with id ${subscriptionId}`,
          });
        }

        if (subscription.is_launched) {
          return res.status(400).json({
            success: false,
            msg: `Subscription already launched`,
          });
        }

        if (
          new Date(subscription.end_date) > new Date() &&
          subscription.threshold_type === 'unlimited'
        ) {
          return res.status(400).json({
            success: false,
            msg: 'Subscription not closed yet',
          });
        }

        if (subscription?.threshold > subscription.current) {
          return res.status(400).json({
            success: false,
            msg: `Subscription threshold not reached yet`,
          });
        }
        itoBody.name = subscription.ito_name;
        tokenBody.token_name = subscription.ito_token;
      }

      if (!itoAllotedAdmins || itoAllotedAdmins.length <= 0) {
        return res.status(400).json({
          success: false,
          msg: `Ito - Admins are required`,
        });
      }
      let isAllotedAdmin = itoAllotedAdmins.every(
        allotedAdmin => allotedAdmin.id,
      );
      if (!isAllotedAdmin) {
        return res.status(400).json({
          success: false,
          msg: `Ito - Admins are required`,
        });
      }

      if (files.length <= 0) {
        return res.status(400).send({
          msg: 'Ito - Term Sheets are mandatory',
          success: false,
        });
      }

      const [itoStartTime, itoCurrentTime] = getStartAndEndTime(
        itoBody.start_date,
        // body.end_date
      );

      if (!subscriptionId) {
        // this check is wrong in case of ito creation from subscription
        if (itoStartTime < itoCurrentTime) {
          return res.status(400).json({
            success: false,
            msg: `Ito - Can not start ito with passed dates`,
          });
        }
      }

      if (tokenBackAssets.length <= 0) {
        return res.status(400).json({
          success: false,
          msg: `Token - Back Assets are required`,
        });
      }
      if (tokenBody.supply < 0) {
        return res.status(400).json({
          success: false,
          msg: `Token - Supply cannot be negative`,
        });
      }
      if (tokenBody.price < 0) {
        return res.status(400).json({
          success: false,
          msg: `Token - Price cannot be negative`,
        });
      }

      let totalTokens = 0;
      let tokensSent = 0; // Tokens that we are going to send to investors based on his/her investment
      if (subscriptionId) {
        // const totalTokens = Number(subscription.current) / tokenBody.price;
        // const tokensSent = Math.floor(totalTokens); // Tokens that we are going to send to investors based on his/her investment
        // const fiatToRollback = (totalTokens - tokensSent) * tokenBody.price;
        // const fiatToUtilize = tokensSent * tokenBody.price;

        const subscribers = (
          await Subscription.getAllSubscribers({
            subscription_id: subscription.id,
          })
        ).rows;

        for (let index = 0; index < subscribers.length; index++) {
          const subscriber = subscribers[index];
          const subscriberTokens =
            Number(subscriber.investment) / tokenBody.price;
          totalTokens += subscriberTokens;
          const tokensSentToSubscriber = Math.floor(subscriberTokens);
          tokensSent += tokensSentToSubscriber;
          //   const fiatToRollback = (subscriberTokens - tokensSentToSubscriber) * tokenBody.price;
          // const fiatToUtilize = tokensSentToSubscriber * tokenBody.price;
        }

        if (Number(tokenBody.supply) < tokensSent) {
          return res.status(400).json({
            success: false,
            msg: `Tokens supply cannot be less than ${tokensSent} if price is $${tokenBody.price}`,
          });
        }

        // if (
        //   tokenBody.supply * Number(tokenBody?.price) <
        //   Number(subscription.current)
        // ) {
        //   return res.status(400).json({
        //     success: false,
        //     msg: `Token worth is less than investors investment  in subscription`, // Please increase supply or token price (recommendation msg to show)
        //   });
        // }
        // return res.status(400).json({
        //   success: false,
        //   msg: `testing`,
        // });
      }

      const back_asset_enteries = [
        'weightage',
        'asset_price',
        'asset_value',
        'asset_quantity',
        'asset_id',
      ];

      for (let index = 0; index < tokenBackAssets.length; index++) {
        const backAsset = tokenBackAssets[index];

        for (const key in backAsset) {
          let requiredKey = '';
          if (!backAsset[key]) {
            if (['asset_quantity', 'asset_price'].includes(key)) {
              requiredKey = 'asset_id';
            } else {
              requiredKey = key;
            }
            return res.status(400).json({
              success: false,
              msg: `Token - BackAssets - ${requiredKey} is required`,
            });
          }
        }

        let notFindEntry = back_asset_enteries.find(
          asset_entry => !asset_entry in backAsset,
        );

        if (notFindEntry) {
          return res.status(400).json({
            success: false,
            msg: `Token - BackAssets - ${notFindEntry} is required`,
          });
        }
      }

      const assetIds = tokenBackAssets.map(back_asset => back_asset.asset_id);
      const uniqueAssetIds = [...new Set(assetIds)];
      if (uniqueAssetIds.length < assetIds.length) {
        return res.status(403).json({
          success: false,
          msg: `Token - Cannot select same asset multiple times`,
        });
      }

      const combineWeightage = tokenBackAssets.reduce((acc, current, index) => {
        return (acc += parseInt(current.weightage));
      }, 0);

      if (combineWeightage !== 100) {
        return res.status(400).json({
          success: false,
          msg: `Token - Sum of assets weightage must be equal to 100`,
        });
      }

      if (!isAllotedAdmin) {
        return res.status(400).json({
          success: false,
          msg: `Ito - Admins are required`,
        });
      }

      const [seriesStartTime, seriesCurrentTime, seriesEndTime] =
        getStartAndEndTime(seriesBody.start_date, seriesBody.end_date);

      if (subscriptionId) {
        // const totalTokens =
        //   Number(subscription.current) / Number(tokenBody.price);
        // const tokensSent = Math.floor(totalTokens); // Tokens that we are going to send to investors based on his/her investment
        // const fiatToRollback = (totalTokens - tokensSent) * tokenBody.price;
        // const fiatToUtilize = tokensSent * tokenBody.price;

        if (Number(seriesBody.supply) !== tokensSent) {
          return res.status(400).json({
            success: false,
            msg: `Series supply must be equal to ${tokensSent}`,
          });
        }
      } else {
        if (seriesStartTime < seriesCurrentTime) {
          return res.status(400).json({
            success: false,
            msg: `Series cannot start with passed dates`,
          });
        }

        if (seriesStartTime < itoStartTime) {
          return res.status(400).json({
            success: false,
            msg: `Series cannot start before ITO start time`,
          });
        }

        if (seriesStartTime >= seriesEndTime) {
          return res.status(403).json({
            success: false,
            msg: 'Series start date can not be greater than or equal to end date',
          });
        }
      }
      if (seriesBody.supply <= 0) {
        return res.status(400).json({
          success: false,
          msg: 'Series supply must be greater than 0',
        });
      }

      await client.query('BEGIN');
      const itoQuery = {};
      itoQuery.name = itoBody.name;

      const itoDetail = (await ITO.getNonRejectedItoByName(itoQuery.name))
        .rows[0];

      if (itoDetail) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          msg: `${itoDetail.name} already exist`,
        });
      }

      const tokenQuery = { token_name: tokenBody.token_name };

      const tokenWithSameName = (
        await Token.getTokenWithNonRejectedItoByName(tokenQuery.token_name)
      ).rows[0];

      if (tokenWithSameName) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          msg: `Token - ${tokenWithSameName.token_name} already exists`,
        });
      }

      if (!subscriptionId) {
        const subscriptionWithItoName = (
          await Subscription.findAllNonRejectedSubscriptions({
            ito_name: itoBody.name,
          })
        ).rows[0];
        if (subscriptionWithItoName) {
          return res.status(409).json({
            success: false,
            msg: `ITO with same name already exists in subscription`,
          });
        }

        const subscriptionWithTokenName = (
          await Subscription.findAllNonRejectedSubscriptions({
            ito_token: tokenBody.token_name,
          })
        ).rows[0];
        if (subscriptionWithTokenName) {
          return res.status(409).json({
            success: false,
            msg: `Token with same name already exists in subscription`,
          });
        }
      }

      const token_address = crypto
        .createHash('sha256')
        .update('secret')
        .digest('hex');

      let term_sheets_files = [];
      files.forEach(file => {
        let filePath = file.path.substring(7).replace('pdf\\', 'pdf/');

        term_sheets_files = [...term_sheets_files, filePath];
      });

      // Ito Creation Start
      // itoBody.id = Date.now();
      if (subscriptionId) itoBody.start_date = subscription?.start_date;
      itoBody.user_id = req.user.id;
      itoBody.status = 'pending';
      itoBody.term_sheets = `{${term_sheets_files.join()}}`;
      itoBody.token_address = token_address;
      itoBody.created_at = new Date();
      itoBody.updated_at = new Date();
      delete itoBody.alloted_admins;

      const ito = await ITO.createITo(itoBody, [
        'id',
        'onhold',
        ...Object.keys(itoBody),
      ]);

      let users = [];
      let allotedAdmins = [];
      if (subscriptionId) {
        allotedAdmins = (
          await AllotedSubscriptions.getAllotedSubscription(subscriptionId)
        ).rows;
      } else {
        allotedAdmins = [...itoAllotedAdmins];
        allotedAdmins = [...allotedAdmins, { id: req.user.id }];
      }
      for (const key in allotedAdmins) {
        const alloted_admin = allotedAdmins[key];
        const allotedAdminsBody = {
          admin_id: subscriptionId ? alloted_admin.admin_id : alloted_admin.id,
          ito_id: ito.rows[0].id,
          created_at: new Date(),
          updated_at: new Date(),
        };

        const allotedItos = await AllotedItos.allotITOToAdmin(
          allotedAdminsBody,
          ['id'],
        );

        if (allotedItos) {
          users = [...users, allotedItos.rows[0]];
        }
      }
      // Ito Creation End

      // Token Creation Start
      tokenBody.ito_id = ito.rows[0].id;
      tokenBody.token_address = crypto
        .createHash('sha256')
        .update('secret')
        .digest('hex');
      tokenBody.created_at = new Date();
      tokenBody.updated_at = new Date();
      tokenBody.remaining_supply = tokenBody.supply - seriesBody.supply;

      delete tokenBody.back_assets;

      if (Number(seriesBody.supply) > Number(tokenBody.supply)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          msg: 'Series supply cannot be greater than token supply',
        });
      }

      const token = await Token.createToken(tokenBody);

      for (let index = 0; index < tokenBackAssets.length; index++) {
        let back_asset = tokenBackAssets[index];

        const assetDetail = await Assets.getAssetById(
          DB.pool,
          back_asset.asset_id,
        );

        if (!assetDetail.rowCount) {
          throw new Error({
            status: 404,
            msg: `Token - No asset found with id ${back_asset.asset_id}`,
          });
        }

        if (
          Number(assetDetail.rows[0].remaining_supply) <
          Number(back_asset.asset_quantity)
        ) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            msg: ` Token - ${assetDetail.rows[0].name} contains insufficient supply`,
          });
        }

        // update remaining supply of assets after alloting some of the supply to token
        const assetBody = {};
        assetBody.remaining_supply =
          assetDetail.rows[0].remaining_supply - back_asset.asset_quantity;
        if (Number(assetDetail.rows[0].updated_remaining_supply)) {
          assetBody.updated_remaining_supply =
            assetDetail.rows[0].updated_remaining_supply -
            back_asset.asset_quantity;

          if (Number(assetBody.updated_remaining_supply) < 0) {
            await client.query('ROLLBACK');
            return res.status(400).send({
              msg: `Please verify "${assetDetail.rows[0].name}" updation request first`,
            });
          }
        }

        const assetUpdated = await Assets.updateAsset(
          DB.pool,
          assetBody,
          back_asset.asset_id,
          ['id', 'remaining_supply', 'updated_remaining_supply'],
        );

        const assetQuery = {};
        assetQuery.ito_token_id = token.rows[0].id;
        assetQuery.asset_id = back_asset.asset_id;

        let backedAssetsDetail = (
          await BackedAssets.getBackedAssets(DB.pool, assetQuery)
        ).rows[0];
        if (backedAssetsDetail) {
          throw new Error({
            status: 409,
            msg: 'Token - Back Asset is already assigned to this asset',
          });
        }

        back_asset.created_at = new Date();
        back_asset.updated_at = new Date();
        back_asset.ito_token_id = token.rows[0].id;
        delete back_asset.asset_price;

        // create back _asset for token
        const backedAsset = (
          await BackedAssets.createBackedAsset(DB.pool, back_asset)
        ).rows[0];
      }
      // Token Creation End

      // Series Creation Start
      if (subscriptionId) {
        seriesBody.start_date = subscription?.start_date;
        seriesBody.end_date =
          subscription?.threshold_type === 'limited'
            ? new Date()
            : subscription?.end_date;
        // seriesBody.is_subscription = true;
      }
      seriesBody.user_id = req.user.id;
      seriesBody.remaining_supply = seriesBody.supply;
      seriesBody.status = 'pending';
      seriesBody.initial_series = true;
      seriesBody.created_at = new Date();
      seriesBody.updated_at = new Date();
      seriesBody.token_address = crypto
        .createHash('sha256')
        .update('secret')
        .digest('hex');
      seriesBody.ito_id = ito.rows[0].id;

      const series = await ItoSeries.createSeries(seriesBody);

      if (subscriptionId) {
        const fields = {
          ito_series_id: series.rows[0].id,
          ito_id: ito.rows[0].id,
        };
        const updateSubscription = await Subscription.updateSubscription(
          fields,
          subscriptionId,
        );
      }

      await client.query('COMMIT');
      return res.status(200).json({
        success: true,
        msg: 'ITO created successfully.',
        data: ito.rows[0],
      });
    } catch (error) {
      console.log(`here`, error.message);
      await client.query('ROLLBACK');
      return res.status(error.message?.status || 400).json({
        success: false,
        msg: error.message?.msg || error.message || 'Something went wrong',
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
};

/** Author: Ali Haider
 * description: Function for update Ito draft
 * updatedraftIto
 */
const updatedraftIto = async (req, res, next) => {
  try {
    console.log('req.body data ....', req.body);
    req.body.user_id = req.user.id;

    req.body.ito_name = req.body?.ito?.name;
    req.body.ito_start_date = req.body?.ito?.start_date;
    req.body.description = req.body?.ito?.description;
    req.body.term_sheets = req.body?.ito?.term_sheets;
    req.body.ito_token = req.body?.token?.token_name;
    req.body.ito_token_symbol = req.body?.token?.token_symbol;
    req.body.token_supply = req.body?.token?.supply;
    req.body.token_price = req.body?.token?.price;
    req.body.token_target_value = req.body?.token?.target_value;
    req.body.buying_spread = req.body?.token?.buying_spread;
    req.body.selling_spread = req.body?.token?.selling_spread;
    req.body.ito_series = req.body?.series?.name;
    req.body.series_supply = req.body?.series?.supply;
    req.body.series_start_date = req.body?.series?.start_date;
    req.body.series_end_date = req.body?.series?.end_date;
    req.body.series_description = req.body?.series?.description;
    const allotedAdmins = req.body?.ito?.alloted_admins;
    delete req.body.ito;
    delete req.body.series;
    delete req.body.token;
    console.log('alloted admins are .....', allotedAdmins);
    console.log('req.body new data ', req.body);

    console.log('Draft id is .....', req.params.id);
    if (!Object.keys(req.body).length) {
      return res
        .status(400)
        .json({ success: false, msg: 'No fields to update' });
    }

    const get_draft = await ITO.getDraftByID(req.params.id);

    console.log('draft data ....', get_draft.rows[0]);
    if (!get_draft.rows.length) {
      return res
        .status(404)
        .json({ success: false, msg: `Draft not found to update` });
    }

    //update draft
    const update_draft = await ITO.update_draft(req.body, req.params.id, [
      'id',
    ]);

    if (allotedAdmins) {
      const delete_data = await ITO.deleteDraftedAdmins(req.params.id);
      if (delete_data) {
        console.log('Data deleted ....');
        if (delete_data.rows && allotedAdmins) {
          for (var i = 0; i < allotedAdmins.length; i++) {
            console.log('length of admin list ....', allotedAdmins.length);
            const fields = {
              drafted_ito_id: ito_draft.rows[0].id,
              admin_id: allotedAdmins[i],
              type: 'ITO',
            };
            const alloted_admins = await ITO.allotedAdmins(fields);
          }
        }
      }
    }
    console.log('updated draft data .....', update_draft);

    return res
      .status(200)
      .json({ success: true, msg: 'Draft Successfully updated' });
  } catch (error) {
    return res.status(500).send({ msg: error.message });
  }
};

//draftIto
const draftIto = async (req, res, next) => {
  try {
    console.log('req.body data ....', req.body);
    req.body.user_id = req.user.id;

    req.body.ito_name = req.body?.ito?.name;
    req.body.ito_start_date = req.body?.ito?.start_date;
    req.body.description = req.body?.ito?.description;
    req.body.term_sheets = req.body?.ito?.term_sheets;
    req.body.ito_token = req.body?.token?.token_name;
    req.body.ito_token_symbol = req.body?.token?.token_symbol;
    req.body.token_supply = req.body?.token?.supply;
    req.body.token_price = req.body?.token?.price;
    req.body.token_target_value = req.body?.token?.target_value;
    req.body.buying_spread = req.body?.token?.buying_spread;
    req.body.selling_spread = req.body?.token?.selling_spread;
    req.body.ito_series = req.body?.series?.name;
    req.body.series_supply = req.body?.series?.supply;
    req.body.series_start_date = req.body?.series?.start_date;
    req.body.series_end_date = req.body?.series?.end_date;
    req.body.series_description = req.body?.series?.description;
    const alloted_admins = req.body?.ito?.alloted_admins;
    delete req.body.ito;
    delete req.body.series;
    delete req.body.token;
    console.log('alloted admins are .....', alloted_admins);
    console.log('req.body new data ', req.body);

    // if (alloted_admins) {
    //   console.log('alloted admins are :====', alloted_admins);
    //   delete req.body.admins;
    // }

    // if (req.files) {
    //   let files = req.files;
    //   console.log('req.files data exists ....');

    //   let term_sheets_files = [];
    //   files.forEach(file => {
    //     let filePath = file.path.substring(7).replace('pdf\\', 'pdf/');

    //     term_sheets_files = [...term_sheets_files, filePath];
    //   });
    //   req.body.term_sheets = `{${term_sheets_files.join()}}`;
    // }

    const ito_draft = await ITO.draftIto(req.body, ['id']);
    console.log('ito_drafted ... ', ito_draft.rows[0].id);
    if (ito_draft.rows && alloted_admins) {
      for (var i = 0; i < alloted_admins.length; i++) {
        console.log('length of admin list ....', alloted_admins.length);
        const fields = {
          drafted_ito_id: ito_draft.rows[0].id,
          admin_id: alloted_admins[i],
          type: 'ITO',
        };
        const allotedadmins = await ITO.allotedAdmins(fields);
      }
    }
    return res
      .status(200)
      .json({ success: true, msg: 'Record Saved as Draft' });
  } catch (error) {
    return res.status(500).send({ msg: error.message });
  }
};

//getDraftedITO
const getDraftedITO = async (req, res, next) => {
  try {
    const get_draft = await ITO.getDraftedITO(req.user.id);
    const get_rejected_itos = await ITO.getRejectedItos(req.user.id);
    console.log('rejected ITOS data ....', get_rejected_itos.rows);
    const newArray = [...get_draft.rows, ...get_rejected_itos.rows];
    return res.status(200).json({ success: true, data: newArray });
  } catch (error) {
    return res.status(500).send({ msg: error.message });
  }
};

//getDraftByID
const getDraftByID = async (req, res, next) => {
  try {
    const get_draft = await ITO.getDraftByID(req.params.id);
    console.log('drafted_data .....', get_draft.rows);

    //get Alloted admins
    return res.status(200).json({ success: true, data: get_draft.rows });
  } catch (error) {
    return res.status(500).send({ msg: error.message });
  }
};

// getAllotedITO
const getAllotedITO = async (req, res, next) => {
  try {
    const get_draft = await AllotedIto.getAllotedITO(req.params.id);
    return res.status(200).json({ success: true, data: get_draft.rows });
  } catch (error) {
    return res.status(500).send({ msg: error.message });
  }
};
const getAllAdmins = async (req, res, next) => {
  try {
    // get all admins except the loggedin one
    const admins = await Users.getAdminsToAssignItos(
      (filterAdminId = req.user.id),
    );

    return res.status(200).json({ success: true, data: admins.rows });
  } catch (error) {
    return res.status(500).send({ msg: error.message });
  }
};

const verifyIto = async (req, res, next) => {
  try {
    let subscription = undefined;
    if (
      !req.body.status ||
      !['approved', 'rejected'].includes(req.body.status)
    ) {
      return res.status(400).json({
        success: false,
        msg: 'Status can only be approved or rejected',
      });
    }
    const ito = (await ITO.getITOById(req.params.id)).rows[0];

    if (!ito) {
      return res
        .status(404)
        .json({ success: false, msg: 'No ito found to verify' });
    }

    if (ito.closed) {
      return res.status(403).json({
        success: false,
        msg: 'ITO has been closed',
      });
    }

    if (ito.user_approve) {
      return res
        .status(409)
        .json({ success: false, msg: 'ITO already verified' });
    }

    if (ito.user_id === req.user.id) {
      return res.status(403).json({
        success: false,
        msg: 'You created this ITO. Your cannot verify this',
      });
    }

    // get alloted itos by ito id other than who created this ito
    const allotedItos = (
      await AllotedItos.getAllotedITOToVerifyIto(req.params.id, ito.user_id)
    ).rows;

    const allotedItosIts = allotedItos.map(allotedIto => allotedIto.admin_id);

    if (!allotedItosIts.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        msg: 'You cannot verify this ITO.',
      });
    }

    const fields = {
      status: req.body.status,
      user_approve: req.user.id,
    };

    if (req.body.status == 'rejected') {
      fields.rejection_message = req.body.rejection_message;
    }

    console.log(fields);
    await client.query('BEGIN');

    const seriesUpdated = await ItoSeries.verifyInitialSeries(fields, ito.id, [
      'id',
      'status',
      'supply',
    ]);

    const token = (await Token.getAllTokens({ ito_id: ito.id })).rows[0];
    if (req.body.status === 'approved') {
      subscription = (
        await Subscription.findAllSubscriptions({
          ito_series_id: seriesUpdated.rows[0].id,
        })
      ).rows[0];
      console.log('subscription================1===============', subscription);
      if (subscription) {
        // if we are creating ITO for a subscription
        const subscribers = (
          await Subscription.getAllSubscribers({
            subscription_id: subscription.id,
          })
        ).rows;
        console.log('subscribers================2===============', subscribers);

        for (let index = 0; index < subscribers.length; index++) {
          const subscriber = subscribers[index];
          console.log('subscriber================3===============', subscriber);

          const wallet = (
            await Wallet.getAllWallets({ user_id: subscriber.user_id })
          ).rows[0];
          console.log('wallet================4===============', wallet);

          const itoWallet = (await ItoWallet.getWalletByIto(token.ito_id))
            .rows[0];
          console.log('itoWallet================5===============', itoWallet);

          const totalTokens = Number(subscriber.investment) / token.price;
          console.log(
            'totalTokens================5===============',
            totalTokens,
          );
          const tokensSent = Math.floor(totalTokens);
          console.log('tokensSent================6===============', tokensSent);

          const fiatToRollback = (totalTokens - tokensSent) * token.price;
          console.log(
            'fiatToRollback================7===============',
            fiatToRollback,
          );

          // Congratulations! you have received ${tokensSent} for subscription with ito name ${subscription.ito_name}. $ ${fiatToRollback} is reverted from your $ ${subscriber.investment} of total investment

          const walletBody = {
            locked_amount:
              Number(wallet.locked_amount) - Number(subscriber.investment),
            tokens: Number(wallet.tokens) + tokensSent,
            fiat_balances: wallet.fiat_balances + fiatToRollback,
          };
          console.log('walletBody================7===============', walletBody);

          // try {
          //   let transferResponse = await transferToken({
          //     from_address: itoWallet.account_address,
          //     to_address: userWallet.account_address,
          //     from_private_key: itoWallet.private_key,
          //     token_value: amount + "",
          //   });
          // } catch (error) {

          // }

          const updatedWallet = await Wallet.updateWallet(
            wallet.id,
            walletBody,
          );
        }

        const fields = {
          is_launched: true,
        };
        const updateSubscription = await Subscription.updateSubscription(
          fields,
          subscription.id,
        );
      }

      // keep track of token creation/updation price
      await TokenPriceHistory.createTokenPriceHistory(DB.pool, {
        ito_token_id: token.id,
        token_price: token.price,
        created_at: new Date(),
        updated_at: new Date(),
      });
      console.log(
        'ito_id:===============',
        ito.id,
        'token_supply:==========',
        token.supply,
      );
      // create-ito on blockchain
      const dataBlockchain = await createItoOnBlockchain({
        ito_id: ito.id,
        token_supply: token.supply,
      }).catch(err => {
        throw new Error('Ito not created on blockchain - Please try again');
      });
      // console.log("dataBlockchain==========", dataBlockchain)
      // blockchain_ito_id into database
      fields.transaction_hash = dataBlockchain.hash;

      // const itos = await getAllItos();
      // const filteredIto = itos.filter((filterIto) => filterIto[0] == ito.id)[0];
      // const filteredItoId = filteredIto[0];
      // const filteredBlockchainItoId = filteredIto[1];
      // fields.blockchain_ito_id = filteredBlockchainItoId;
      // const filteredItoSupply = filteredIto[1];
    } else {
      //req.body.status === "rejected"

      // const tokenUpdated = await Token.updateToken(
      //   token.id,
      //   {
      //     remaining_supply: seriesUpdated.rows[0].supply + token.remaining_supply,
      //   },
      //   ["id", "remaining_supply"]
      // );

      const tokenBackAssets = (
        await BackedAssets.getBackedAssets(DB.pool, { ito_token_id: token.id })
      ).rows;

      // update asset quantity on rejection of ito
      for (let index = 0; index < tokenBackAssets.length; index++) {
        let back_asset = tokenBackAssets[index];

        const assetDetail = await Assets.getAssetById(
          DB.pool,
          back_asset.asset_id,
        );

        if (!assetDetail.rowCount) {
          throw new Error(
            `Token - No asset found with id ${back_asset.asset_id}`,
          );
        }

        // update remaining supply of assets after alloting some of the supply to token
        const assetBody = {};
        assetBody.remaining_supply =
          Number(assetDetail.rows[0].remaining_supply) +
          Number(back_asset.asset_quantity);
        if (assetDetail.rows[0].updated_remaining_supply) {
          assetBody.updated_remaining_supply =
            Number(assetDetail.rows[0].updated_remaining_supply) -
            Number(back_asset.asset_quantity);
        }
        const assetUpdated = await Assets.updateAsset(
          DB.pool,
          assetBody,
          back_asset.asset_id,
          ['id', 'remaining_supply'],
        );
      }
    }

    const itoUpdated = await ITO.updateITo(fields, ito.id, [
      'id',
      'status',
      'transaction_hash',
      'blockchain_ito_id',
    ]);

    if (req.body.status === 'approved') {
      // create ito wallet on blockchain and on DB too
      const walletDetail = await createWallet();
      if (walletDetail) {
        await ItoWallet.createWallet({
          ito_id: itoUpdated.rows[0].id,
          fiat_balances: subscription ? subscription.investment : 0,
          tokens: token.supply,
          private_key: walletDetail.key,
          // private_key: "oiaufdsaulfkhdsalkfjlkdsajf",
          account_address: walletDetail.address,
          // account_address: "oiuuewroijdsa;lkfj.dsnf.,m",
          created_at: new Date(),
          updated_at: new Date(),
        }).catch(err => {
          throw new Error(
            'Ito wallet not created on blockchain - Please try again',
          );
        });
      }
      console.log('wallet detail============', walletDetail);

      if (subscription) {
        const subscribers = (
          await Subscription.getAllSubscribers({
            subscription_id: subscription.id,
          })
        ).rows;
        console.log('subscribers================2===============', subscribers);

        for (let index = 0; index < subscribers.length; index++) {
          const subscriber = subscribers[index];
          console.log('subscriber================3===============', subscriber);

          const wallet = (
            await Wallet.getAllWallets({ user_id: subscriber.user_id })
          ).rows[0];
          console.log('wallet================4===============', wallet);

          const itoWallet = (await ItoWallet.getWalletByIto(token.ito_id))
            .rows[0];
          console.log('itoWallet================5===============', itoWallet);
          console.log('token================56===============', token);

          const totalTokens = Number(subscriber.investment) / token.price;
          console.log(
            'totalTokens================5===============',
            totalTokens,
          );
          const tokensSent = Math.floor(totalTokens);
          console.log('tokensSent================6===============', tokensSent);

          const fiatToRollback = (totalTokens - tokensSent) * token.price;
          console.log(
            'fiatToRollback================7===============',
            fiatToRollback,
          );

          //     from_address: itoWallet.account_address,
          //     to_address: userWallet.account_address,
          //     from_private_key: itoWallet.private_key,
          //     token_value: amount + "",

          const transferringTokens = await transferToken({
            to_address: wallet.account_address,
            from_address: itoWallet.account_address,
            from_privateKey: itoWallet.private_key,
            ito_id: token.ito_id,
            amount: tokensSent,
          }).catch(err => {
            console.log('error from blockchain  1=============', err.message);
            console.log('error from blockchain   2=============', err);
            throw new Error(
              'Tokens are not transferred on blockchain - Please try again',
            );
          });
          console.log(
            'transferring token too blockchain=================',
            transferringTokens,
          );

          const amountt = token.price * tokensSent;
          await WalletTransaction.saveTransaction({
            token: tokensSent,
            to_user_id: wallet.user_id,
            ito_id: token.ito_id,
            token_transaction_status: 'success',
            amount: amountt,
            price: token.price,
            transform_hash: transferringTokens.data.hash,
            to_user: wallet.account_address,
            from_user: itoWallet.account_address,
            created_at: new Date(),
            updated_at: new Date(),
          });
        }
      }
    }

    await client.query('COMMIT');
    return res.status(200).json({
      success: true,
      msg: `You ${req.body.status} this ito successfully`,
      data: itoUpdated.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, msg: error.message });
  }
};

const getItosByAdminId = async (req, res, next) => {
  try {
    const { status } = req.query;

    let result;

    if (status) {
      if (status === 'ongoing') {
        result = (await ITO.findOngoinItos(req.user.id)).rows;
        // console.log(result);
      } else if (status === 'upcoming') {
        result = (await ITO.findUpcomingItos(req.user.id)).rows;
      } else if (status === 'closed') {
        // find closed ITOs
        result = (await ITO.findClosedItos(req.user.id)).rows;
      } else {
        result = [];
      }
    } else {
      result = (await ITO.getITOsByAdminId(req.user.id)).rows;
    }

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(400).send({ msg: error.message });
  }
};

// Get ITO detail of loggedin admin By ITO Id
const getITO_Token_InitialSeriesById = async (req, res, next) => {
  try {
    // Get ITO By ID and admin Id - So that no one could access ITO in which admin is not alloted
    const ito = await ITO.getITOs({
      id: req.params.id,
    });

    if (ito.rowCount === 0 || ito === -1) {
      return res.status(404).send({ status: false, msg: 'Ito not available' });
    }

    // get alloted itos by ito id other than who created this ito
    const allotedItos = (await AllotedItos.getAllotedITO(ito.rows[0].id)).rows;

    const allotedAdminsIds = allotedItos.map(allotedIto => allotedIto.admin_id);

    if (!allotedAdminsIds.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        msg: 'You cannot access this ITO.',
      });
    }

    const admins = [];
    for (let index = 0; index < allotedAdminsIds.length; index++) {
      const adminId = allotedAdminsIds[index];

      const admin = await Users.getAllUsersWithoutCredentials({ id: adminId });

      admins.push({
        id: admin.rows[0].id,
        fname: admin.rows[0].fname,
        lname: admin.rows[0].lname,
      });
    }

    const itoToken = Token.getTokenByIto(ito.rows[0].id);
    let itoTokenData = {};

    const itoSeries = ItoSeries.getSeries({
      ito_id: ito.rows[0].id,
      initial_series: true,
    });
    let itoSeriesData = {};

    await Promise.all([itoToken, itoSeries]).then(res => {
      itoTokenData = res[0].rows[0];
      itoSeriesData = res[1].rows[0];
    });
    const subscriptionData = (
      await Subscription.findAllSubscriptions({
        ito_series_id: itoSeriesData.id,
      })
    ).rows[0];

    const backedAssets = await BackedAssets.getBackedAssetsForTokenDetail(
      client,
      itoTokenData.id,
    );

    return res.status(200).json({
      success: true,
      data:
        {
          ito: ito.rows[0],
          token: itoTokenData,
          backedAssets: backedAssets.rows,
          series: itoSeriesData,
          admins: admins,
          subscription: subscriptionData || null,
        } || {},
    });
  } catch (error) {
    return res.status(400).send({ msg: error.message });
  }
};

const getITOs = async (req, res, next) => {
  try {
    const ito = await ITO.getITOs(req.query);

    res.status(200).json({ success: true, data: ito.rows });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

const getItoByStatus = async (req, res, next) => {
  try {
    const { status } = req.query;

    let result;

    if (status) {
      if (status === 'ongoing') {
        result = (await ITO.findOngoinItos()).rows;
        // console.log(result);
      } else if (status === 'upcoming') {
        result = (await ITO.findUpcomingItos()).rows;
      } else if (status === 'closed') {
        // find closed ITOs
        result = (await ITO.findClosedItos()).rows;
      } else {
        result = [];
      }
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const getAvailableItoList = async (req, res, next) => {
  try {
    const itos = await ITO.getAvaiableItos();
    res.status(200).json({ success: true, data: itos.rows });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

const getITO = async (req, res, next) => {
  try {
    const ito = await ITO.getITOById(req.params.id);
    res.status(200).json({ success: true, data: ito.rows[0] || {} });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

//getItoApproveddetails
const getItoApproveddetails = async (req, res, next) => {
  try {
    const ito = await ITO.getItoApproveddetails(req.params.id);
    res.status(200).json({ success: true, data: ito.rows[0] || {} });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

const update = async (req, res, next) => {
  try {
    delete req.body['token_address'];
    if (!Object.keys(req.body).length) {
      return res
        .status(400)
        .json({ success: false, msg: 'No fields to update' });
    }

    console.log('req.body .....', req.body.onhold);
    const ito = await ITO.getITOById(req.params.id);

    console.log('Ito data ....', ito.rows[0]);
    if (!ito.rows.length) {
      return res
        .status(404)
        .json({ success: false, msg: `Ito not found to update` });
    }

    const ito_data = ito.rows[0];
    // closed status will be updated after dual approval after this ITO will be terminated
    if (ito.rows[0].closed) {
      return res
        .status(400)
        .json({ success: false, msg: `Ito has been closed` });
    }

    //Maintain Dual Admin Approval
    if (req.body.onhold === true) {
      let response = (await itoBlock.getBlockingDetailsByITO(req.params.id))
        .rows[0];

      if (!response) {
        const data = {
          ito_id: req.params.id,
          admin_blocked_one: req.user.id,
        };

        let createBlocking_history = await itoBlock.createBlockingITodata(data);
        return res.status(200).json({
          success: true,
          msg: 'Ito Blocked successfully',
        });
      }

      if (response) {
        if (response.admin_blocked_one === null) {
          const data = {
            admin_blocked_one: req.user.id,
          };

          let admin_one = await itoBlock.updateBlockingData(
            data,
            req.params.id,
            ['id', 'ito_id', 'admin_blocked_one', 'admin_blocked_two'],
          );
          return res.status(200).json({
            success: true,
            data: admin_one.rows[0],
            msg: 'Ito Blocked successfully',
          });
        }
        if (response.admin_blocked_one === req.user.id) {
          return res.status(400).json({
            success: false,
            msg: `Not allowed to Block again`,
          });
        }
        if (response.admin_blocked_one !== null) {
          console.log('Admin one not null');
          const data = {
            admin_blocked_two: req.user.id,
          };

          let admin_two_block = await itoBlock.updateBlockingData(
            data,
            req.params.id,
            ['id', 'ito_id', 'admin_blocked_one', 'admin_blocked_two'],
          );

          if (admin_two_block.rowCount > 0) {
            const itoUpdated = await ITO.updateITo(req.body, req.params.id, [
              'id',
              'name',
              'status',
              'onhold',
              'closed',
              'description',
              'start_date',
            ]);

            const data1 = {
              admin_unblocked_one: null,
              admin_unblocked_two: null,
            };
            let removeUnblocking = await itoBlock.updateBlockingData(
              data1,
              req.params.id,
              [
                'id',
                'ito_id',
                'admin_blocked_one',
                'admin_blocked_two',
                'admin_unblocked_one',
                'admin_unblocked_two',
              ],
            );
            console.log(admin_two_block);
            return res.status(200).json({
              success: true,
              data: admin_two_block.rows[0],
              msg: 'Ito Blocked successfully',
            });
          }
        }
      }
    }

    if (req.body.onhold === false) {
      let response = (await itoBlock.getBlockingDetailsByITO(req.params.id))
        .rows[0];

      if (!response) {
        const data = {
          ito_id: req.params.id,
          admin_unblocked_one: req.user.id,
        };
        let createBlocking_history = await itoBlock.createBlockingITodata(data);
        return res.status(200).json({
          success: true,
          msg: 'Ito unBlocked successfully',
        });
      }

      if (response) {
        if (response.admin_unblocked_one === null) {
          const data = {
            admin_unblocked_one: req.user.id,
          };

          let admin_one = await itoBlock.updateBlockingData(
            data,
            req.params.id,
            ['id', 'ito_id', 'admin_unblocked_one', 'admin_unblocked_two'],
          );
          return res.status(200).json({
            success: true,
            msg: 'Ito unBlocked successfully',
          });
        }
        if (response.admin_unblocked_one === req.user.id) {
          return res.status(400).json({
            success: false,
            msg: `Not allowed to unBlock again`,
          });
        }
        if (response.admin_unblocked_one !== null) {
          const data2 = {
            admin_unblocked_two: req.user.id,
          };

          let admin_two_unblock = await itoBlock.updateBlockingData(
            data2,
            req.params.id,
            ['id', 'ito_id', 'admin_unblocked_one', 'admin_unblocked_two'],
          );

          if (admin_two_unblock.rowCount > 0) {
            const itoUpdated = await ITO.updateITo(req.body, req.params.id, [
              'id',
              'name',
              'status',
              'onhold',
              'closed',
              'description',
              'start_date',
            ]);

            const data1 = {
              admin_blocked_one: null,
              admin_blocked_two: null,
            };
            let removeUnblocking = await itoBlock.updateBlockingData(
              data1,
              req.params.id,
              [
                'id',
                'ito_id',
                'admin_blocked_one',
                'admin_blocked_two',
                'admin_unblocked_one',
                'admin_unblocked_two',
              ],
            );

            return res.status(200).json({
              success: true,
              data: admin_two_unblock.rows[0],
              msg: 'Ito Blocked successfully',
            });
          }
        }
      }
    }

    const itoUpdated = await ITO.updateITo(req.body, req.params.id, [
      'id',
      'name',
      'status',
      'onhold',
      'closed',
      'description',
      'start_date',
    ]);

    res.status(200).json({
      success: true,
      data: itoUpdated.rows[0],
      msg: 'Ito Blocked successfully',
    });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

const closeRequestIto = async (req, res, next) => {
  try {
    // if (req.body.Updated_closed) {
    //   return res
    //     .status(403)
    //     .json({ success: false, msg: `Ito cannot be closed directly` });
    // }

    const ito = await ITO.getITOById(req.params.id);

    if (!ito.rows.length) {
      return res
        .status(404)
        .json({ success: false, msg: `Ito not found to update` });
    }

    // get alloted itos by ito id
    const allotedItos = (await AllotedItos.getAllotedITO(req.params.id)).rows;

    const allotedItosIts = allotedItos.map(allotedIto => allotedIto.admin_id);

    if (!allotedItosIts.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        msg: 'You cannot make close request in this ITO.',
      });
    }

    // closed status will be updated after dual approval after this ITO will be terminated
    if (ito.rows[0].closed) {
      return res
        .status(409)
        .json({ success: false, msg: `Ito has already been closed` });
    }

    if (ito.rows[0].status !== 'approved') {
      return res
        .status(409)
        .json({ success: false, msg: `This ito is not approved` });
    }

    if (ito.rows[0].closed_request_user) {
      return res.status(400).json({
        success: false,
        msg: `Waiting for verification of previous close request`,
      });
    }

    const body = {
      updated_closed: req.body.updated_closed,
      closed_request_user: req.user.id,
    };
    const itoUpdated = await ITO.updateITo(body, req.params.id, [
      'id',
      'name',
      'status',
      'onhold',
      'closed',
      'updated_closed',
      'closed_request_user',
    ]);

    res.status(200).json({
      success: true,
      msg: 'Ito close request generated successfully',
      data: itoUpdated.rows[0],
    });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

const verifyItoClosedRequest = async (req, res, next) => {
  try {
    const ito = (await ITO.getITOById(req.params.id)).rows[0];

    if (!ito) {
      return res
        .status(404)
        .json({ success: false, msg: 'No ito found to verify' });
    }

    if (ito.closed) {
      return res.status(403).json({
        success: false,
        msg: 'This ITO is already closed',
      });
    }

    if (!ito.closed_request_user) {
      return res.status(403).json({
        success: false,
        msg: 'Please make close request first',
      });
    }

    if (ito.closed_request_user === req.user.id) {
      return res.status(403).json({
        success: false,
        msg: 'You made close request. Your cannot verify this ITO',
      });
    }

    // get alloted itos by ito id other than who made request to close this ito
    const allotedItos = (
      await AllotedItos.getAllotedITOToVerifyIto(
        req.params.id,
        ito.closed_request_user,
      )
    ).rows;

    const allotedItosAdminIds = allotedItos.map(
      allotedIto => allotedIto.admin_id,
    );

    if (!allotedItosAdminIds.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        msg: 'You cannot verify this ITO.',
      });
    }

    const fields = {
      closed: req.body.closed,
      verify_closed: req.user.id,
      ...(!req.body.closed && {
        updated_closed: false,
        closed_request_user: null,
      }),
    };

    const itoUpdated = await ITO.updateITo(fields, ito.id, [
      'id',
      'closed',
      'verify_closed',
      'updated_closed',
      'closed_request_user',
    ]);

    return res.status(200).json({
      success: true,
      msg: `Ito close request ${
        req.body.closed ? 'approved' : 'rejected'
      } successfully`,
      data: itoUpdated.rows[0],
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

const deleteITo = async (req, res, next) => {
  try {
    const ito = await ITO.getITOById(req.params.id);
    if (!ito.rows.length) {
      return res
        .status(400)
        .json({ success: false, msg: `no ito found with id ${req.params.id}` });
    }
    await ITO.deleteITO(req.params.id);
    res.status(200).json({ success: true, msg: 'ITO deleted successfully' });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

//   getItoRevenue
const getItoRevenue = async (req, res, next) => {
  try {
    //get ito_token_id from ito_id
    const response = await Token.getTokenByIto(req.params.id);
    if (response.rowCount > 0) {
      const ito_token_id = response.rows[0].id;
      //SUM of all buy and sell transactions with spread
      let order = 'sell_order';
      let status = 'approved';
      const sell_order_response = await ITO.getItoSpreadAmount(
        ito_token_id,
        order,
        status,
      );
      let spreaded_revenue = sell_order_response.rows[0].spreaded_amount;

      let new_order = 'buy_order';
      const buy_order_response = await ITO.getItoSpreadAmount(
        ito_token_id,
        new_order,
        status,
      );

      spreaded_revenue =
        parseFloat(spreaded_revenue) +
        parseFloat(buy_order_response.rows[0].spreaded_amount);

      //Get total tokens sold amount
      const tokens_sold = await ITO.getTokensSold(req.params.id);
      const token_sold_amount = tokens_sold.rows[0].total_revenue;
      spreaded_revenue =
        parseFloat(spreaded_revenue) + parseFloat(token_sold_amount);

      res.status(200).json({ success: true, data: spreaded_revenue || [] });
    } else {
      res
        .status(400)
        .json({ success: false, msg: "Revenue isn't generated yet" });
    }
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

const assignedIto = async (req, res, next) => {
  try {
    const ito = await ITO.getAssignedItoDetail(req.user.id);

    res.status(200).json({ success: true, data: ito.rows });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

module.exports = {
  create,
  getItosByAdminId,
  getItoApproveddetails,
  getAllAdmins,
  verifyIto,
  update,
  closeRequestIto,
  verifyItoClosedRequest,
  getITOs,
  getITO_Token_InitialSeriesById,
  getITO,
  deleteITo,
  getItoRevenue,
  getAvailableItoList,
  getItoByStatus,
  assignedIto,
  draftIto,
  getDraftedITO,
  updatedraftIto,
  getDraftByID,
  getAllotedITO,
};
