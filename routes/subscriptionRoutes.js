const express = require('express');
const router = express.Router();
const validationMiddleware = require('../middlewares/validationMiddlewares');
const middleware = require('../middlewares/authMiddleware');
const Subscription = require('../controllers/subscription');
const itoFiles = require('../middlewares/itoFiles');

router
  .route('/subscriptions')
  .post(
    middleware.auth(['admin', 'super-admin']),
    itoFiles('term_sheets'),
    validationMiddleware.createSubscription,
    Subscription.addSubscription,
  );

router
  .route('/draft/subscriptions')
  .post(
    middleware.auth(['admin', 'super-admin']),
    itoFiles('term_sheets'),
    Subscription.draftSubscription,
  );

//UpdateDraft
router
  .route('/update/draft/subscriptions/:id')
  .put(
    middleware.auth(['admin', 'super-admin']),
    itoFiles('term_sheets'),
    Subscription.updatedraftSubscription,
  );

router
  .route('/get/draft/subscriptions')
  .get(
    middleware.auth(['admin', 'super-admin']),
    Subscription.getdraftSubscription,
  );

//getdraftByDraftID
router
  .route('/get/draft/subscriptions/:id')
  .get(middleware.auth(['admin', 'super-admin']), Subscription.getdraftByID);

router
  .route('/subscription/verify/:id')
  .put(
    middleware.auth(['admin', 'super-admin']),
    Subscription.verifyAddSubscription,
  );

router
  .route('/subscriptions/admin/assigned')
  .get(
    middleware.auth(['admin', 'super-admin']),
    Subscription.getSubscriptionsByAdminId,
  );
router
  .route('/subscriptions/by_status')
  .get(middleware.auth(['user']), Subscription.getSubscriptionsByStatus);
router
  .route('/subscriptions/me')
  .get(middleware.auth('user'), Subscription.getCurrentUserSubscription);
router
  .route('/subscriptions/subscribe')
  .post(
    middleware.auth('user'),
    validationMiddleware.addSubscriber,
    Subscription.addSubscriber,
  );
router
  .route('/subscriptions/:id')
  .get(
    middleware.auth(['admin', 'super-admin']),
    Subscription.getSubscriptionByID,
  );

//getApprovedSubscriptionDetails
router
  .route('/subscription/approved/details/:id')
  .get(
    middleware.auth(['admin', 'super-admin']),
    Subscription.getApprovedSubscriptionDetails,
  );

module.exports = router;
