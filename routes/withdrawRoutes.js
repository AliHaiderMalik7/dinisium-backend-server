const express = require('express');
const router = express.Router();
const withdraw = require('../controllers/withdrawReq'); 
const middleware = require("../middlewares/authMiddleware");
const validationMiddleware = require("../middlewares/validationMiddlewares");

//Create Withdraw Request
router.post(
    '/withdraw/create',
      middleware.auth(['user']),
      ...validationMiddleware.createWithDrawReq,
      withdraw.createWithdrawReq);

//Get Withdraw Request
// router.get('/withdraw/list', middleware.auth(), withdraw.getWithdrawReq);
router.route('/withdraw/list/:status').get( middleware.auth([ 'super-admin', 'admin']), withdraw.getWithdrawReq);

//Get Withdraw Request of Current User
router.get('/withdraw/list', middleware.auth(['user']), withdraw.getCurrentUserList)

//Update Withdraw Status

router.put(
    '/withdraw/update/status/:id',
    middleware.auth(['super-admin', 'admin']),
    ...validationMiddleware.updateWithDrawReq,
     withdraw.updateStatus)

module.exports = router;