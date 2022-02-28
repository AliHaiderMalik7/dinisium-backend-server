const dashboard = require('../controllers/dashboard');
const express = require('express');
const router = express.Router();
const middleware = require('../middlewares/authMiddleware');

router
  .route('/dashboard/orders/ito/:id/counts')
  .get(middleware.auth(), dashboard.getItoOrdersCount);
router
  .route('/dashboard/elections/ito/:id/counts')
  .get(middleware.auth(), dashboard.getItoElectionCount);
router
  .route('/dashboard/users/ito/:id/counts')
  .get(middleware.auth(), dashboard.getItoUsersCount);
router
  .route('/dashboard/users/ito/:id/register_month')
  .get(middleware.auth(), dashboard.getItoUsersRegisterPerMonth);
router
  .route('/dashboard/investment/ito/:id/total_month')
  .get(middleware.auth(), dashboard.getItoInvestmentPerMonth);
router
  .route('/dashboard/exchange/ito/:id/count_day')
  .get(middleware.auth(), dashboard.getItoExchangePerDay);
router
  .route('/dashboard/itoseries/ongoing/count')
  .get(middleware.auth(), dashboard.getItoSeriesCount);

router
  .route('/dashboard/orders/counts')
  .get(middleware.auth(), dashboard.getAllOrdersCount);
router
  .route('/dashboard/tokens/counts')
  .get(middleware.auth(), dashboard.getAllTokensCount);
router
  .route('/dashboard/elections/counts')
  .get(middleware.auth(), dashboard.getAllElectionCount);
router
  .route('/dashboard/users/counts')
  .get(middleware.auth(['admin', 'super-admin']), dashboard.getAllUsersCount);
router
  .route('/dashboard/users/registered/all')
  .get(middleware.auth(['admin', 'super-admin']), dashboard.getUsersRegistered);
router
  .route('/users/registered/all')
  .get(middleware.auth(['admin', 'super-admin']), dashboard.getRegisteredUsers);
//get sold tokens data for graph
router
  .route('/tokens/sold/data')
  .get(middleware.auth(['admin', 'super-admin']), dashboard.getSoldTokens);

router
  .route('/dashboard/investment/total_month')
  .get(middleware.auth(), dashboard.getInvestmentPerMonth);
router
  .route('/dashboard/exchange/count_day/:type')
  .get(middleware.auth(), dashboard.getAllExchangePerDay);
// router.route("/dashboard/itoseries/ongoing/all").get(middleware.auth(),dashboard.getAllOngoingSeries);
// router
//   .route('orders/:type')
//   .get(middleware.auth(), dashboard.getOrdersData);

//getBuy&SellData

router
  .route('/dashboard/exchange/count_days')
  .get(middleware.auth(), dashboard.getExchangeBuySellPerDay);


router
  .route('/tokens/current_price/all')
  .get(middleware.auth(), dashboard.getAllTokensCurrentPriceAndMarketcap);

router
  .route('/dashboard/tokens/price_history/:id')
  .get(middleware.auth(), dashboard.getTokenPriceHistory);

router
  .route('/dashboard/tokens/info/all')
  .get(middleware.auth(), dashboard.getTokenInfo);

router
  .route('/dashboard/tokens/marketcap/:id')
  .get(middleware.auth(), dashboard.getTokenMarketcapHistory);

router
  .route('/dashboard/tokens/sold/:id')
  .get(middleware.auth(), dashboard.getTokenSoldHistory);

module.exports = router;
