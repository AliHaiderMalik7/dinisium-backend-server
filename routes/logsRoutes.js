const express = require("express");
const router = express.Router();
const middleware = require("../middlewares/authMiddleware");
const logs = require("../controllers/auditLogs");

router.route("/logs").post(logs.createLogs);
router.route("/logs").get(middleware.auth(),logs.getLogs)

module.exports = router;