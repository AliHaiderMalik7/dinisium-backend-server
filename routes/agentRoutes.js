const express = require("express");
const router = express.Router();
const validationMiddleware = require("../middlewares/validationMiddlewares");
const middleware = require("../middlewares/authMiddleware");
const Agent = require("../controllers/agents");

router.route("/agents").post(middleware.auth(["admin","sub-admin"]),...validationMiddleware.agentRegister,Agent.register);
router.route("/agents").get(middleware.auth(["admin","sub-admin"]),Agent.getAgents);
router.route("/agents/:id")
      .put(middleware.auth(["admin","sub-admin"]),Agent.update)
      .get(middleware.auth(["admin","sub-admin"]),Agent.getAgent)
      .delete(middleware.auth(["admin","sub-admin"]),Agent.deleteAgent)
router.route("/investors")
      .post(middleware.auth(["admin","sub-admin"]),...validationMiddleware.createAgentInvestor,Agent.createAgentInvestor);
router.route("/investors").get(middleware.auth(),Agent.getIvestorList);
                       



module.exports = router;