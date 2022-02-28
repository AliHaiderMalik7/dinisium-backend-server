const DB = require("../model/DB");
const Agent = require("../model/agents");
const TrustedInvestor = require("../model/trustedInvestor");
const AuditLogs = require("../model/auditLogs");

const register = async (req, res, next) => {
  try {
    if (!req.user.ito) {
      return res
        .status(403)
        .json({ success: false, msg: `Admin does not linked to any ITO` });
    }

    req.query.email = req.body.email;

    const agentExist = await Agent.getAgents(DB.pool, req.query);
    // console.log("agentExist", agentExist.rows);
    if (agentExist.rows.length) {
      return res
        .status(409)
        .json({ success: false, msg: `Agent already exists with this Email` });
    }

    req.body.created_at = new Date();
    req.body.updated_at = new Date();
    req.body.ito_id = req.user.ito;

    const agent = (await Agent.registerAgent(DB.pool, req.body)).rows[0];
    // console.log("agent", agent);
    await AuditLogs.saveLogs({
      action: "add_agent_by_itoadmin",
      admin: req.user.id,
      created_at: new Date(),
      updated_at: new Date(),
    });

    res.status(200).json({
      success: true,
      msg: "Agent registered successfully",
      data: agent,
    });
  } catch (error) {
    // console.log(error);
    res.status(400).json({ success: false, msg: error.message });
  }
};

const getAgents = async (req, res, next) => {
  try {
    if (!req.user.ito) {
      return res.status(400).json({ success: false, data: [] });
    }

    req.query.ito_id = req.user.ito;

    const agents = await Agent.getAgents(DB.pool, req.query);
    return res.status(200).json({ success: true, data: agents.rows });
  } catch (error) {
    return res.status(400).send({ msg: error.message });
  }
};

const getAgent = async (req, res, next) => {
  try {
    const agent = await Agent.getAgentById(DB.pool, req.params.id);
    res.status(200).json({ success: true, data: agent.rows[0] || {} });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

const update = async (req, res, next) => {
  try {
    delete [req.body.ito_id];

    if (!Object.keys(req.body).length) {
      return res
        .status(400)
        .json({ success: false, msg: "No fields to update" });
    }

    const agent = await Agent.getAgentById(DB.pool, req.params.id);

    if (!agent.rows.length) {
      return res.status(404).json({
        success: false,
        msg: `no agent found with id ${req.params.id}`,
      });
    }

    if (req.user.ito !== agent.rows[0].ito_id) {
      return res.status(403).json({
        success: false,
        msg: "you don't have the right permission to access this resource :)",
      });
    }

    const agentUpdated = await Agent.updateAgent(
      DB.pool,
      req.body,
      req.params.id,
      ["id", "fname", "lname", "email", "contact_no", "country", "address"]
    );

    res.status(200).json({
      success: true,
      data: agentUpdated.rows[0],
      msg: "agent updated successfully",
    });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

const deleteAgent = async (req, res, next) => {
  try {
    const agent = await Agent.getAgentById(DB.pool, req.params.id);
    if (!agent.rows.length) {
      return res.status(400).json({
        success: false,
        msg: `no agent found with id ${req.params.id}`,
      });
    }
    if (req.user.ito !== agent.rows[0].ito_id) {
      return res.status(403).json({
        success: false,
        msg: "you don't have the right permission to access this resource :)",
      });
    }
    await Agent.deleteAgent(DB.pool, req.params.id);
    await AuditLogs.saveLogs({
      action: "remove_agent_itoadmin",
      admin: req.user.id,
      created_at: new Date(),
      updated_at: new Date(),
    });
    res.status(200).json({ success: true, msg: "agent deleted successfully" });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

const createAgentInvestor = async (req, res, next) => {
  try {
    let body = { ...req.body };

    body.agent = body.agent_id;
    body.created_at = new Date();
    body.updated_at = new Date();

    delete body.agent_id;

    await TrustedInvestor.saveAgentInvestor(body);

    res.status(200).json({ success: true, msg: "investor added successfully" });
  } catch (error) {
    res.status(400).send({ success: false, msg: error.message });
  }
};

const getIvestorList = async (req, res, next) => {
  try {
    const investors = (await TrustedInvestor.findInvestors(req.query)).rows;
    res.status(200).json({ success: true, data: investors });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

module.exports = {
  register,
  update,
  getAgents,
  getAgent,
  deleteAgent,
  createAgentInvestor,
  getIvestorList,
};
