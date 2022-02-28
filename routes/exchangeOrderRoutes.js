const express = require("express");
const router = express.Router();
const validationMiddleware = require("../middlewares/validationMiddlewares");
const middleware = require("../middlewares/authMiddleware");
const order = require("../controllers/exchangeOrders");

router
  .route("/orders")
  .post(
    middleware.auth(["user"]),
    ...validationMiddleware.createOrder,
    order.createOrder
  );
router
  .route("/orders/buytoken")
  .post(
    middleware.auth(["user"]),
    ...validationMiddleware.buyToken,
    order.directBuyTokens
  );

router.get("/order/:id", middleware.auth(), order.getOrderUsingId);
// router
// .route("/order/:id")
// .get(middleware.auth(["admin"]), order.getOrderUsingId);
router
  .route("/orders")
  .get(middleware.auth(["admin", "super-admin", "sub-admin"]), order.getOrders);
router
  .route("/orders/users/me")
  .get(middleware.auth(["user"]), order.getUserOrders);
router
  .route("/orders/:id")
  .put(middleware.auth(), order.updateOrder)
  .get(middleware.auth(), order.getOrderById)
  .delete(middleware.auth(), order.deleteOrder);
router
  .route("/orders/:id/approve")
  .put(middleware.auth(["admin", "sub-admin"]), order.approveOrder);
/////////////////////////////////////For testing////////////////////////////////////////////////////////////////////////////
router
  .route("/orders/manualtransfer/put")
  .put(middleware.auth(["admin"]), order.manualTransfer);

// router.put("/orders/manualtransfer", order.manualTransfer);

module.exports = router;
