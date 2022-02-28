const express = require('express');
const router = express.Router();
const validationMiddleware = require('../middlewares/validationMiddlewares');
const middleware = require('../middlewares/authMiddleware');
const token = require('../controllers/itoToken');
const UserTokens = require('../controllers/userTokens');

router
  .route('/tokens')
  .post(
    middleware.auth(),
    ...validationMiddleware.createToken,
    token.createToken,
  );
router.route('/tokens').get(middleware.auth(), token.getTokens);
router
  .route('/tokens/users/me')
  .get(middleware.auth(), UserTokens.getCurrentUserTokens);

//get available tokens list with alloted admins
// router
//   .route('/tokens/available')
//   .get(middleware.auth(['super-admin']), token.getTokensDetail);

router
  .route('/tokens/status/exchangeable')
  .get(middleware.auth(), token.getExchangeTokens);

router
  .route('/tokens/status/sell')
  .get(middleware.auth(), token.getSellExchangeTokens);
router
  .route('/tokens/status/exchangeable/users')
  .get(middleware.auth(), token.getAllTokensWithUser);
router
  .route('/tokens/:id')
  .put(middleware.auth(['super-admin']), token.updateToken)
  .get(middleware.auth(), token.getToken)
  .delete(middleware.auth(['super-admin']), token.deleteToken);

// make token traedable
router
  .route('/tokens/:id/add')
  .put(middleware.auth(['admin', 'super-admin']), token.addTokenTOExchange);

// Add token updation request
router
  .route('/tokens/:id/add/update-request')
  .put(middleware.auth(), token.updateTokenRequest);

// Verify token updation request
router
  .route('/tokens/:id/verify/update-request')
  .put(middleware.auth(), token.verifyTokenUpdationRequest);

// Add token back_asset, quantity updation request
router
  .route('/tokens/add/update-request/back_asset/:id')
  .put(middleware.auth(), token.updateTokenBackAssetRequest);

// Verify token back_asset, quantity updation request
router
  .route('/tokens/verify/update-request/back_asset/:id')
  .put(middleware.auth(), token.verifyTokenBackAssetUpdationRequest);

// router
//   .route("/tokens/price_history/:id")
//   .get(middleware.auth(), token.getTokenPriceHistory);

// router
//   .route("/tokens/current_price/all")
//   .get(middleware.auth(), token.getTokensCurrentPrice);

// router
//   .route("/tokens/info/all")
//   .get(middleware.auth(), token.getTokenInfo);

module.exports = router;
