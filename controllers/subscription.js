const client = require('../model/DB').pool;
const Subscription = require('../model/subscription');
const ITO = require('../model/ITO');
const ItoToken = require('../model/itoToken');
const { getStartAndEndTime } = require('../helper/getTime');
const Wallet = require('../model/wallet');
const AllotedSubscriptions = require('../model/allotedSubscriptions');
const Users = require('../model/Users');

const addSubscription = async (req, res) => {
  try {
    const {
      ito_name,
      ito_series,
      ito_token,
      description,
      threshold,
      start_date,
      end_date,
      threshold_type,
      // alloted_admins
    } = req.body;

    const files = req.files || [];
    console.log('files in add subscription ...', req.files);
    let allotedAdmins = req.body.alloted_admins;
    delete req.body.alloted_admins;

    if (files.length <= 0) {
      return res.status(400).send({
        msg: 'Term Sheets are mandatory',
        success: false,
      });
    }

    const [startTime, currentTime, endTime] = getStartAndEndTime(
      start_date,
      end_date,
    );

    if (startTime < currentTime) {
      return res.status(400).json({
        success: false,
        msg: `Can not start subscription with passed dates`,
      });
    }

    if (startTime >= endTime) {
      return res.status(403).json({
        success: false,
        msg: 'Start date can not be greater than or equal to end date',
      });
    }

    if (threshold <= 0) {
      return res
        .status(400)
        .json({ success: false, msg: 'Threshold must be greater than 0' });
    }

    const ito = await ITO.getNonRejectedItoByName(ito_name);
    if (ito.rowCount) {
      return res
        .status(404)
        .json({ success: false, msg: 'ITO with same name already exists' });
    }

    const token = await ItoToken.getTokenWithNonRejectedItoByName(ito_token);

    if (token.rowCount) {
      return res
        .status(404)
        .json({ success: false, msg: 'Token with same name already exists' });
    }

    const subscriptionWithItoName = (
      await Subscription.findAllNonRejectedSubscriptions({
        ito_name: ito_name,
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
        ito_token: ito_token,
      })
    ).rows[0];
    if (subscriptionWithTokenName) {
      return res.status(409).json({
        success: false,
        msg: `Token with same name already exists in subscription`,
      });
    }

    if (!allotedAdmins || allotedAdmins.length <= 0) {
      return res.status(400).json({
        success: false,
        msg: `Admins are required`,
      });
    }
    const isAllotedAdmin = allotedAdmins.every(allotedAdmin => allotedAdmin.id);
    if (!isAllotedAdmin) {
      return res.status(400).json({
        success: false,
        msg: `Admins are required`,
      });
    }

    if (files.length <= 0) {
      return res.status(400).send({
        msg: 'Term Sheets are mandatory',
        success: false,
      });
    }

    let term_sheets_files = [];
    files.forEach(file => {
      let filePath = file.path.substring(7).replace('pdf\\', 'pdf/');

      term_sheets_files = [...term_sheets_files, filePath];
    });

    await client.query('BEGIN');
    const subscription = (
      await Subscription.createSubscription({
        ito_name,
        ito_series,
        ito_token,
        description,
        start_date,
        end_date,
        threshold,
        is_threshold_reached: false,
        threshold_type,
        status: 'pending',
        term_sheets: `{${term_sheets_files.join()}}`,
        user_id: req.user.id,
        created_at: new Date(),
        updated_at: new Date(),
      })
    ).rows[0];

    allotedAdmins = [...allotedAdmins, { id: req.user.id }];
    for (const key in allotedAdmins) {
      const alloted_admin = allotedAdmins[key];
      const allotedAdminsBody = {
        admin_id: alloted_admin.id,
        subscription_id: subscription.id,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const allotedSubscriptions =
        await AllotedSubscriptions.allotSubscriptionToAdmin(allotedAdminsBody, [
          'id',
        ]);
    }

    await client.query('COMMIT');
    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, msg: error.message });
  }
};

/** Author : Ali Haider
 * Description: subscription data saved in draft table when user click on save as draft while entering data in form
 */

const draftSubscription = async (req, res) => {
  try {
    // const get_data = await Subscription.getDraftByUser(req.user.id);

    if (!Object.keys(req.body).length) {
      return res
        .status(400)
        .json({ success: false, msg: 'No fields for draft' });
    }

    const isNullish = Object.values(req.body).every(value => {
      if (value === null) {
        return true;
      }

      return false;
    });

    console.log('is nullish ....', isNullish);
    if (isNullish) {
      return res
        .status(400)
        .json({ success: false, msg: 'Enter Record to save draft' });
    }
    console.log('req.body for draft subscription  ...', req.body);

    req.body.user_id = req.user.id;
    if (req.files) {
      let files = req.files;
      console.log('req.files data exists ....');

      let term_sheets_files = [];
      files.forEach(file => {
        let filePath = file.path.substring(7).replace('pdf\\', 'pdf/');

        term_sheets_files = [...term_sheets_files, filePath];
      });
      req.body.term_sheets = `{${term_sheets_files.join()}}`;
    }
    const alloted_admins = req.body.allotedAdmins;
    delete req.body.allotedAdmins;
    const draft = await Subscription.draftSubscription(req.body);

    console.log('draft saved as subscription:=====', draft.rows);

    if (draft.rows && alloted_admins) {
      for (var i = 0; i < alloted_admins.length; i++) {
        console.log('length of admin list ....', alloted_admins.length);
        const fields = {
          drafted_ito_id: draft.rows[0].id,
          admin_id: alloted_admins[i],
          type: 'Subscription',
        };
        var allotedadmins = await ITO.allotedAdmins(fields);
        console.log('alloted admins data ....', allotedadmins);
      }
    }

    res.status(200).json({ success: true, msg: 'Subscription saved in Draft' });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

//updatedraftSubscription
const updatedraftSubscription = async (req, res, next) => {
  try {
    console.log('req.params.id is ....', req.params.id);
    console.log('req.body data ....', req.body);
    if (!Object.keys(req.body).length) {
      return res
        .status(400)
        .json({ success: false, msg: 'No fields for update' });
    }

    //get drafted subscrription
    const get_draft = (await Subscription.getdraftByID(req.params.id)).rows[0];
    console.log('previous drafted data is ....', get_draft);

    //check if file exists
    if (req.files) {
      let files = req.files;
      console.log('req.files data exists ....');

      let term_sheets_files = [];
      files.forEach(file => {
        let filePath = file.path.substring(7).replace('pdf\\', 'pdf/');

        term_sheets_files = [...term_sheets_files, filePath];
      });
      req.body.term_sheets = `{${term_sheets_files.join()}}`;
    }

    //check if there is any allotedadmins for that subscription
    console.log('req.body.allotedAdmins are ....', req.body.allotedAdmins);
    if (req.body.allotedAdmins) {
      console.log('before alloted ....');
      var alloted_admins = req.body.allotedAdmins;
      delete req.body.allotedAdmins;
      console.log('after admin....');
    }

    const update = await Subscription.updateSubscriptionDraft(
      req.body,
      get_draft.id,
      ['id'],
    );
    if (update.rows) {
      const delete_admins = await Subscription.deleteAllotedDraft(
        update.rows[0].id,
      );

      if (alloted_admins) {
        for (var i = 0; i < alloted_admins.length; i++) {
          const fields = {
            drafted_ito_id: update.rows[0].id,
            admin_id: alloted_admins[i],
            type: 'Subscription',
          };
          var allotedadmins = await ITO.allotedAdmins(fields);
        }
      }
    }

    res.status(200).json({ success: true, msg: 'Draft Updated Successfully' });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

const getdraftSubscription = async (req, res, next) => {
  try {
    console.log(req.user.id);
    const get_draft = await Subscription.getDraftByUser(req.user.id);
    console.log('draft_ data ..', get_draft.rows);
    res.status(200).json({ success: true, data: get_draft.rows || [] });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

// getdraftByID
const getdraftByID = async (req, res, next) => {
  try {
    const get_draft = await Subscription.getdraftByID(req.params.id);
    console.log('draft_ data ..', get_draft.rows);

    console.log('draft_ data ..', get_draft.rows[0].id);
    // get alloted itos by ito id other than who created this ito
    const allotedSubscriptions = (
      await AllotedSubscriptions.getAllotedSubscriptionForDraft(
        get_draft.rows[0].id,
      )
    ).rows;

    console.log('alloted subscriptions ...', allotedSubscriptions);
    const allotedAdminsIds = allotedSubscriptions.map(
      allotedSubscription => allotedSubscription.admin_id,
    );
    const admins = [];
    for (let index = 0; index < allotedAdminsIds.length; index++) {
      const adminId = allotedAdminsIds[index];

      const admin = await Users.getAllUsersWithoutCredentials({ id: adminId });

      admins.push({
        id: admin.rows[0].id,
        fname: admin.rows[0].fname,
        lname: admin.rows[0].lname,
        label: `${admin.rows[0].fname} ${admin.rows[0].lname}`,
      });
    }

    console.log('admins are ......', admins);
    //  data: { subscriptionDetail: subscription, admins } || {},
    res
      .status(200)
      .json({ success: true, data: { details: get_draft.rows, admins } || [] });
    // }
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};
const verifyAddSubscription = async (req, res, next) => {
  try {
    if (
      !req.body.status ||
      !['approved', 'rejected'].includes(req.body.status)
    ) {
      return res.status(400).json({
        success: false,
        msg: 'Status can only be approved or rejected',
      });
    }

    const subscription = (await Subscription.getSubscriptionByID(req.params.id))
      .rows[0];

    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, msg: 'No subscription found to verify' });
    }

    if (new Date(subscription.end_date) <= new Date()) {
      return res.status(403).json({
        success: false,
        msg: 'Subscription has been closed',
      });
    }

    if (subscription.user_approve) {
      return res
        .status(409)
        .json({ success: false, msg: 'Subscription already verified' });
    }

    if (subscription.user_id === req.user.id) {
      return res.status(403).json({
        success: false,
        msg: 'You created this subscription. Your cannot verify this',
      });
    }

    // get alloted subscription by subscription id other than who created this subscription
    const allotedSubscriptions = (
      await AllotedSubscriptions.getAllotedSubscriptionToVerifySubscription(
        req.params.id,
        subscription.user_id,
      )
    ).rows;

    const allotedSubscriptionsIds = allotedSubscriptions.map(
      allotedIto => allotedIto.admin_id,
    );

    if (!allotedSubscriptionsIds.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        msg: 'You cannot verify this subscription.',
      });
    }

    const fields = {
      status: req.body.status,
      user_approve: req.user.id,
    };
    if (req.body.status == 'rejected') {
      fields.rejection_message = req.body.rejection_message;
    }

    await client.query('BEGIN');

    if (req.body.status === 'approved') {
      // rollback all fiat if subscription is not successful
      setTimeout(async () => {
        // Fetching subscription again because previous one contains old subscription values
        const subscriptionDetail = (
          await Subscription.getSubscriptionByID(subscription.id)
        ).rows[0];
        if (
          subscriptionDetail.current > 0 &&
          subscriptionDetail.current < subscriptionDetail.threshold
        ) {
          const subscribers = (
            await Subscription.getAllSubscribers({
              subscription_id: subscription.id,
            })
          ).rows;

          for (let index = 0; index < subscribers.length; index++) {
            const subscriber = subscribers[index];
            const wallet = (
              await Wallet.getAllWallets({ user_id: subscriber.user_id })
            ).rows[0];

            const walletBody = {
              locked_amount:
                Number(wallet.locked_amount) - Number(subscriber.investment),
              fiat_balances:
                Number(wallet.fiat_balances) + Number(subscriber.investment),
            };
            const updatedWallet = await Wallet.updateWallet(
              wallet.id,
              walletBody,
            );

            await Subscription.updateSubscription(
              { is_invt_revert: true },
              subscription.id,
            );
          }
        }
      }, new Date(subscription.end_date).getTime() - Date.now());
    }

    const subscriptionUpdated = await Subscription.updateSubscription(
      fields,
      subscription.id,
      ['id', 'status', 'user_approve'],
    );

    if (subscriptionUpdated.rowCount > 0 && req.body.status == 'rejected') {
      const field = {
        user_id: req.user.id,
        ito_name: subscription.ito_name,
        ito_series: subscription.ito_series,
        ito_token: subscription.ito_token,
        description: subscription.description,
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        threshold: subscription.threshold,
        threshold_type: subscription.threshold_type,
        term_sheets: subscription.term_sheets,
      };
      console.log('in rejected loop', subscription);

      //alloted admins for rejected Subscription
      const allotedSubscriptions = (
        await AllotedSubscriptions.getAllotedSubscription(subscription.id)
      ).rows;

      console.log('alloted subscriptions ...', allotedSubscriptions);
      const allotedAdminsIds = allotedSubscriptions.map(
        allotedSubscription => allotedSubscription.admin_id,
      );
      const admins = [];
      for (let index = 0; index < allotedAdminsIds.length; index++) {
        const adminId = allotedAdminsIds[index];

        const admin = await Users.getAllUsersWithoutCredentials({
          id: adminId,
        });

        admins.push({
          id: admin.rows[0].id,
          fname: admin.rows[0].fname,
          lname: admin.rows[0].lname,
          label: `${admin.rows[0].fname} ${admin.rows[0].lname}`,
        });
      }

      console.log('admis .....', admins);

      // console.log('admins are ......', admins);

      const draft = await Subscription.draftSubscription(field);
      console.log('draft data .....', draft);
      if (draft.rows && admins) {
        for (var i = 0; i < admins.length; i++) {
          console.log('length of admin list ....', admins.length);
          const fields = {
            drafted_ito_id: draft.rows[0].id,
            admin_id: admins[i].id,
            type: 'Subscription',
          };
          var allotedadmins = await ITO.allotedAdmins(fields);
          console.log('alloted admins data ....', allotedadmins);
        }
      }
    }
    console.log('subscriptionUpdated .....', subscriptionUpdated);

    await client.query('COMMIT');
    return res.status(200).json({
      success: true,
      msg: `You ${req.body.status} this subscription successfully`,
      data: subscriptionUpdated.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, msg: error.message });
  }
};

const addSubscriber = async (req, res) => {
  try {
    const { subscription_id, investment } = req.body;

    const subscription = (
      await Subscription.getSubscriptionByID(subscription_id)
    ).rows[0];

    if (!subscription) {
      return res.status(404).json({
        success: false,
        msg: `No subscription found with id ${subscription_id}`,
      });
    }

    if (subscription.status !== 'approved') {
      return res.status(400).json({
        success: false,
        msg: 'Subscription is not approved yet',
      });
    }

    if (new Date(subscription.start_date) > new Date()) {
      return res.status(400).json({
        success: false,
        msg: 'Subscription is not open yet. Please wait',
      });
    }

    if (isNaN(investment) || investment <= 0) {
      return res
        .status(400)
        .json({ success: false, msg: 'Wrong investment detail' });
    }

    if (new Date(subscription.end_date) <= new Date()) {
      return res.status(403).json({
        success: false,
        msg: 'Cannot invest on closed subscription',
      });
    }

    const current =
      parseFloat(subscription.current || 0) + parseFloat(investment);
    if (
      subscription.threshold_type === 'limited' &&
      current > subscription.threshold
    ) {
      return res.status(400).json({
        success: false,
        msg: `Cannot exceed threshold limit`,
      });
    }

    let is_threshold_reached = false;
    if (current >= subscription.threshold) {
      is_threshold_reached = true;
    }

    const wallet = (await Wallet.getWalletByUser(req.user.id)).rows[0];
    if (!wallet) {
      // it can happen if user has not verified yet
      return res.status(404).json({ success: false, msg: 'No wallet found' });
    }

    const updated_fiat_balances =
      Number(wallet.fiat_balances) - Number(investment);
    const updated_locked_amount =
      Number(wallet.locked_amount) + Number(investment);
    if (updated_fiat_balances < 0) {
      return res
        .status(400)
        .json({ success: false, msg: 'Insufficient funds' });
    }

    await client.query('BEGIN');

    const walletBody = {
      fiat_balances: updated_fiat_balances,
      locked_amount: updated_locked_amount,
    };
    await Wallet.updateWallet(wallet.id, walletBody);

    const subscriber = (
      await Subscription.createSubscribers(
        req.user.id,
        subscription_id,
        investment,
      )
    ).rows[0];

    const fields = {
      current,
      is_threshold_reached,
    };

    await Subscription.updateSubscription(fields, subscription_id);

    await client.query('COMMIT');

    res.status(200).json({ success: true, data: { current } });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, msg: error.message });
  }
};

const getSubscriptionsByAdminId = async (req, res, next) => {
  try {
    const subscriptions = (
      await Subscription.getSubscriptionsByAdminId(req.user.id)
    ).rows;
    res.status(200).json({ success: true, data: subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

// getApprovedSubscriptionDetails
const getApprovedSubscriptionDetails = async (req, res, next) => {
  try {
    const subscriptions = (
      await Subscription.getApprovedSubscriptionDetails(req.params.id)
    ).rows;
    res.status(200).json({ success: true, data: subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};
const getSubscriptionsByStatus = async (req, res, next) => {
  try {
    const { status } = req.query;

    let result = [];

    if (status == 'open') {
      result = (await Subscription.getOpenSubscription({ status: 'approved' }))
        .rows;
    }

    if (status == 'upcoming') {
      result = (
        await Subscription.getUpcomingSubscription({ status: 'approved' })
      ).rows;
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

const getSubscriptionByID = async (req, res) => {
  try {
    const subscription = (await Subscription.getSubscriptionByID(req.params.id))
      .rows[0];

    console.log('subscription data is ....', subscription);
    if (!subscription) {
      return res
        .status(404)
        .send({ status: false, msg: 'Subscription not available' });
    }

    // get alloted itos by ito id other than who created this ito
    const allotedSubscriptions = (
      await AllotedSubscriptions.getAllotedSubscription(subscription.id)
    ).rows;

    const allotedAdminsIds = allotedSubscriptions.map(
      allotedSubscription => allotedSubscription.admin_id,
    );

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
        label: `${admin.rows[0].fname} ${admin.rows[0].lname}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: { subscriptionDetail: subscription, admins } || {},
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

const getCurrentUserSubscription = async (req, res) => {
  try {
    const subscriptions = (
      await Subscription.findUserSubscriptions(req.user.id)
    ).rows;
    res.status(200).json({ success: true, data: subscriptions });
  } catch (e) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

module.exports = {
  addSubscription,
  draftSubscription,
  updatedraftSubscription,
  verifyAddSubscription,
  getSubscriptionsByAdminId,
  getSubscriptionByID,
  addSubscriber,
  getCurrentUserSubscription,
  getSubscriptionsByStatus,
  getApprovedSubscriptionDetails,
  getdraftSubscription,
  getdraftByID,
};
