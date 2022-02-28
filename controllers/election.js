const Election = require("../model/elections");
const Participant = require("../model/participants");
const AuditLogs = require("../model/auditLogs");
const { getStartAndEndTime } = require("../helper/getTime");

const createElection = async (req, res) => {
  try {
    const body = { ...req.body };

    const [startTime, endTime, currentTime] = getStartAndEndTime(
      body.start_date,
      body.end_date
    );

    if (startTime < currentTime) {
      return res.status(400).json({
        success: false,
        msg: `can not start election with passed dates`,
      });
    }

    if (startTime >= endTime) {
      return res.status(403).json({
        success: false,
        msg: "start date can not be greater than or equal to end date",
      });
    }

    body.created_at = new Date();
    body.updated_at = new Date();
    const election = (await Election.create(body)).rows[0];
    await AuditLogs.saveLogs({
      action:"create_vote_by_admin",
      admin:req.user.id,
      created_at: new Date(),
      updated_at: new Date()
    })
    res.status(200).json({ success: true, data: election });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

const getAllElections = async (req, res) => {
  try {
    const elections = (await Election.findAllElection(req.query, req.user.id))
      .rows;
    res.status(200).json({ success: true, data: elections });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const getElectionById = async (req, res) => {
  try {
    const election = (
      await Election.findElectionById(req.params.id, req.user.id)
    ).rows[0];
    res.status(200).json({ success: true, data: election });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const getElectionResult = async (req, res, next) => {
  try {
    let data = {};
    const election = (
      await Election.findElectionById(req.params.id, req.user.id)
    ).rows[0];
    if (!election) {
      return status(404).json({
        success: false,
        msg: "election detail not found",
      });
    }

    const votes = (await Election.findAllVotes({ election_id: election.id }))
      .rows;

    if (votes.length) {
      let agreed = votes.reduce((acc, vote) => {
        if (vote.agree) {
          acc++;
        }
        return acc;
      }, 0);

      let total_participants = votes.length;
      let result = (agreed / total_participants) * 100;

      data = {
        result,
        total_participants,
      };
    } else {
      data = {
        result: 0,
        total_participants: 0,
      };
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const updateElection = async (req, res) => {
  try {
    const election = (await Election.findElectionById(req.params.id)).rows[0];

    if (!election) {
      return res.status(404).json({
        success: false,
        msg: `election with id ${req.params.id} not found`,
      });
    }

    const returningkeys = Object.keys(election);

    const updateElection = (
      await Election.updateElection(req.params.id, req.body, returningkeys)
    ).rows[0];

    res.status(200).json({ success: true, data: updateElection });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const deleteElection = async (req, res) => {
  try {
    const election = (await Election.findElectionById(req.params.id)).rows[0];

    if (!election) {
      return res.status(404).json({
        success: false,
        msg: `election with id ${req.params.id} not found`,
      });
    }

    await Election.deleteElection(req.params.id);

    res
      .status(200)
      .json({ success: true, msg: `election deleted successfully` });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const getElectionByStatus = async (req, res, next) => {
  try {
    const { status } = req.query;
    let result = null;
    let itoIds = [];

    if (status) {
      if (req.user.userType == "admin" || req.user.userType == "sub-admin") {
        itoIds.push(req.user.ito);
      }

      if (req.user.userType == "user") {
        itoIds = (await Participant.findParticipantIto(req.user.id)).rows.map(
          (user) => user.ito_id
        );
      }

      if (req.user.userType == "super-admin") {
        itoIds = null;
      }

      delete req.query["status"];
      if (status === "ongoing") {
        result = (
          await Election.findOngoingElection(req.user.id, req.query, itoIds)
        ).rows;
      } else if (status === "upcoming") {
        result = (await Election.findUpcomingElection(req.query, itoIds)).rows;
      } else if (status === "closed") {
        result = (await Election.findClosedElection(req.query, itoIds)).rows;
      } else {
        result = [];
      }
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const createVote = async (req, res) => {
  try {
    const body = { ...req.body };

    if (typeof body.agree !== "boolean") {
      return res.status(400).json({ success: false, msg: "invalid comments" });
    }

    const election = (
      await Election.findElectionById(body.election_id, req.user.id)
    ).rows[0];

    if (!election) {
      return res
        .status(404)
        .json({ success: false, msg: `no election detail found` });
    }

    const participant = (
      await Participant.findItoParticipant(election.ito_id, req.user.id)
    ).rows[0];

    if (
      !participant &&
      (req.user.userType == "admin" || req.user.userType == "sub-admin") &&
      req.user.ito !== election.ito_id
    ) {
      return res
        .status(404)
        .json({ success: false, msg: `not ito participant` });
    }

    const isVoted = (await Election.isUserVoted(req.user.id, election.id))
      .rows[0];

    if (isVoted) {
      return res
        .status(403)
        .json({ success: false, msg: `user already voted` });
    }

    const [startTime, endTime, currentTime] = getStartAndEndTime(
      election.start_date,
      election.end_date
    );

    if (startTime > currentTime) {
      res
        .status(400)
        .json({ success: false, msg: `election is not started yet` });
    }

    if (endTime < currentTime) {
      return res
        .status(403)
        .json({ success: false, msg: "election has closed now" });
    }

    body.created_at = new Date();
    body.updated_at = new Date();
    body.user_id = req.user.id;

    const vote = (await Election.createVote(body)).rows[0];

    res.status(200).json({ success: true, data: vote });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

const getAllVotes = async (req, res) => {
  try {
    console.log(req.query);
    const votes = (await Election.findAllVotes(req.query)).rows;
    res.status(200).json({ success: true, data: votes });
  } catch (error) {}
};

module.exports = {
  createElection,
  getAllElections,
  getElectionById,
  updateElection,
  deleteElection,
  createVote,
  getAllVotes,
  getElectionByStatus,
  getElectionResult,
};
