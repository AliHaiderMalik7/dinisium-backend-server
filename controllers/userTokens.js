const UserToken = require("../model/userTokens");

const getAllUserTokens = async (req, res) => {
  try {
    const tokens = (await UserToken.findAllUserTokens()).rows;
    res
      .status(200)
      .json({ success: true, data: tokens, msg: "All Tokens Listing" });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const getCurrentUserTokens = async (req, res) => {
  try {
    const tokens = (await UserToken.getTokensByUser(req.user.id)).rows;
    res.status(200).json({ success: true, data: tokens });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

module.exports = {
  getAllUserTokens,
  getCurrentUserTokens,
};
