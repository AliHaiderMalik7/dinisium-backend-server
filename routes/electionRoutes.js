const express = require("express");
const router = express.Router();
const validationMiddleware = require("../middlewares/validationMiddlewares");
const middleware = require("../middlewares/authMiddleware");
const election = require("../controllers/election");

router.route("/elections").post(middleware.auth(['super-admin','admin']),...validationMiddleware.createElection,election.createElection);
router.route("/elections").get(middleware.auth(),election.getAllElections);
router.route("/elections/:id/results").get(middleware.auth(),election.getElectionResult);
router.route("/elections/by_status").get(middleware.auth(),election.getElectionByStatus);
router.route("/elections/:id")
      .get(middleware.auth(),election.getElectionById)
      .put(middleware.auth(['super-admin']),election.updateElection)
      .delete(middleware.auth(['super-admin']),election.deleteElection)
router.route("/votes").post(middleware.auth(),...validationMiddleware.createVote,election.createVote);
router.route("/votes").get(middleware.auth(),election.getAllVotes);
                       



module.exports = router;