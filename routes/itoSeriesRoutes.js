const express = require('express');
const router = express.Router();
const validationMiddleware = require('../middlewares/validationMiddlewares');
const middleware = require('../middlewares/authMiddleware');
const itoSeries = require('../controllers/itoSeries');
// const ito = require("../controllers/ITO");

router
  .route('/itoseries')
  .post(
    middleware.auth(['admin', 'sub-admin']),
    ...validationMiddleware.createItoSeries,
    itoSeries.createSeries,
  );
router
  .route('/itoseries/verify/:id')
  .put(
    middleware.auth(['admin', 'super-admin']),
    itoSeries.verifySeriesCreationRequest,
  );

// create request for updation of series supply
router
  .route('/itoseries/update/supply/:id')
  .put(
    middleware.auth(['admin', 'super-admin']),
    ...validationMiddleware.updateSeriesSupply,
    itoSeries.requestForUpdationOfSeriesSupply,
  );

router
  .route('/itoseries/verify/update-supply/:id')
  .put(
    middleware.auth(['admin', 'super-admin']),
    itoSeries.verifySeriesSupplyUpdationRequest,
  );

router
  .route('/itoseries')
  .get(middleware.auth(['admin', 'super-admin']), itoSeries.getSeriesList);
router
  .route('/itoseries/ito/:id/ongoing')
  .get(middleware.auth(), itoSeries.getItoOngoingSeries);
router
  .route('/itoseries/ongoing/all')
  .get(middleware.auth(), itoSeries.getAllOngoingSeries);
router
  .route('/itoseries/by_status')
  .get(middleware.auth(['admin', 'super_admin']), itoSeries.getSeriesByStatus);
router
  .route('/itoseries/:id')
  .put(middleware.auth(['admin', 'super_admin']), itoSeries.updateSeries)
  .get(middleware.auth(['admin', 'super_admin']), itoSeries.getSeriesById)
  .delete(middleware.auth(['admin']), itoSeries.deleteSeries);

//Create Series Draft
router
  .route('/itoseries/create/draft')
  .post(middleware.auth(['admin']), itoSeries.createDraft);

//Get all drafts by user
router
  .route('/get/itoseries/draft')
  .get(middleware.auth(['admin']), itoSeries.getDraftByUser);

//Get Draft By ID
router
  .route('/itoseries/draft/:id')
  .get(middleware.auth(['admin']), itoSeries.getDraftByID);

//update Draft By ID
router
  .route('/itoseries/update/draft/:id')
  .put(middleware.auth(['admin']), itoSeries.updateDraftByID);

module.exports = router;
