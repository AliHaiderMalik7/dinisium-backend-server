const express = require('express');
const bankAcountCtr = require('../controllers/dinisiumBankDetails');
const validationMiddleware = require('../middlewares/validationMiddlewares');
const files = require('../middlewares/files');
const middleware = require('../middlewares/authMiddleware');
const router = express.Router();

router
  .route('/bank/account')
  .post(
    middleware.auth(['super-admin']),
    validationMiddleware.addBankAccount,
    bankAcountCtr.addBankAccountDetails,
  );
//  .get(middleware.auth(["super-admin"]), bankAcountCtr.getAllAccounts);

router
  .route('/bank/details')
  .get(middleware.auth(['super-admin']), bankAcountCtr.getAccountById);

router
  .route('/update/bank/details')
  .put(
    middleware.auth(['super-admin']),
    bankAcountCtr.updateCurrentUserDetails,
  );

//get Super-admin account details
router
  .route('/dinisium/bank/details')
  .get(
    middleware.auth(['super-admin', 'user']),
    bankAcountCtr.getAccountDetails,
  );

module.exports = router;
