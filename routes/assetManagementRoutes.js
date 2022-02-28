const express = require('express');
const router = express.Router();
const validationMiddleware = require('../middlewares/validationMiddlewares');
const middleware = require('../middlewares/authMiddleware');
const Assets = require('../controllers/assets');

router
  .route('/assets')
  .post(
    middleware.auth(['admin', 'super-admin']),
    ...validationMiddleware.addAsset,
    Assets.addAsset,
  );
router
  .route('/assets')
  .get(middleware.auth(['admin', 'super-admin']), Assets.getAssets);
router
  .route('/assets/detail')
  .get(middleware.auth(['admin', 'super-admin']), Assets.getAssetDetail);
router
  .route('/assets/status/:status')
  .get(middleware.auth(['admin', 'super-admin']), Assets.getAssetsBystatus);
router
  .route('/assets/:id')
  .put(middleware.auth(['admin', 'super-admin']), Assets.updateAsset);

router
  .route('/assets/verify/:id')
  .put(
    middleware.auth(['admin', 'super-admin']),
    ...validationMiddleware.verifyUpdateAssetStatus,
    Assets.verifyUpdateAsset,
  );

//AssetsApprovedDetails
router
  .route('/asset/approved/details/:id')
  .get(
    middleware.auth(['admin', 'super-admin']),
    Assets.getAssetApproveddetails,
  );
module.exports = router;
