const express = require('express');
const router = express.Router();
const validationMiddleware = require('../middlewares/validationMiddlewares');
const middleware = require('../middlewares/authMiddleware');
const ito = require('../controllers/ITO');
const itoFiles = require('../middlewares/itoFiles');

// router.route("/ito/assigned").get(middleware.auth(["admin"]), ito.assignedIto);

// Get all admins to assign ITOs
router
  .route('/ito/admins/all')
  .get(middleware.auth(['admin', 'super-admin']), ito.getAllAdmins);

//create ITO
router
  .route('/itos')
  .post(
    middleware.auth(['admin', 'super-admin']),
    itoFiles(),
    ...validationMiddleware.itoRegister,
    ito.create,
  );

//Add ito draft
router
  .route('/draft/itos')
  .post(
    middleware.auth(['admin', 'super-admin']),
    itoFiles('term_sheets'),
    ito.draftIto,
  );

//Update ito draft
router
  .route('/draft/update/:id')
  .put(
    middleware.auth(['admin', 'super-admin']),
    itoFiles('term_sheets'),
    ito.updatedraftIto,
  );

//GetItoDraft
router
  .route('/get/ito/draft')
  .get(middleware.auth(['admin', 'super-admin']), ito.getDraftedITO);

//getAllotedItos
router
  .route('/get/alloted/ito/:id')
  .get(middleware.auth(['super-admin']), ito.getAllotedITO);

//GetItoDraftByID
router
  .route('/get/ito/draft/:id')
  .get(middleware.auth(['admin', 'super-admin']), ito.getDraftByID);

// Get Itos of loggedIn Admin
router
  .route('/itos/admin/assigned')
  .get(middleware.auth(['admin', 'super-admin']), ito.getItosByAdminId);

//ITOApprovedDetails
router
  .route('/ito/approved/details/:id')
  .get(middleware.auth(['admin', 'super-admin']), ito.getItoApproveddetails);
//GetITOApprovedDetails
// router
//   .route("/ito/approved/details")
//   .get(middleware.auth(["admin", "super-admin"]), ito.getItoApprovedDetails);
//select * from users t1 left join ito t2 on t1.id = t2.user_approve where t2.user_approve = 11
// Get ITO detail of loggedin admin By ITO Id
router
  .route('/itos/admin/assigned/:id')
  .get(
    middleware.auth(['admin', 'super-admin']),
    ito.getITO_Token_InitialSeriesById,
  );

// Verify ITO as approved or rejected
router
  .route('/itos/verify/:id')
  .put(middleware.auth(['admin', 'super-admin']), ito.verifyIto);

// Request to close ITO
router
  .route('/ito/close-request/:id')
  .put(
    middleware.auth(['admin', 'super-admin']),
    ...validationMiddleware.closeRequestIto,
    ito.closeRequestIto,
  );

// Verify ITO close request
router
  .route('/ito/close-request/verify/:id')
  .put(
    middleware.auth(['admin', 'super-admin']),
    ...validationMiddleware.verifyItoClosedRequest,
    ito.verifyItoClosedRequest,
  );

router
  .route('/itos')
  .get(middleware.auth(['admin', 'super-admin']), ito.getITOs);

router
  .route('/itos/ito_status')
  .get(middleware.auth(['admin', 'super-admin']), ito.getItoByStatus);

router
  .route('/itos/available')
  .get(middleware.auth(['admin', 'super-admin']), ito.getAvailableItoList);
router
  .route('/itos/:id')
  // .put(middleware.auth(['super-admin']),ito.update)
  .put(middleware.auth(), ito.update)
  .get(middleware.auth(), ito.getITO)
  .delete(middleware.auth(['super-admin']), ito.deleteITo);

// Show ITO revenue
router
  .route('/ito/revenue/:id')
  .get(middleware.auth(['admin', 'super-admin']), ito.getItoRevenue);
module.exports = router;
