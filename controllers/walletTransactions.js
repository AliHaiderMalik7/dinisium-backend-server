const WalletTransaction = require("../model/walletTransaction");
const Wallet = require("../model/wallet");
const UserToken = require("../model/userTokens");
const Token = require("../model/itoToken");
const client = require("../model/DB").pool;
const crypto = require("crypto");

const { transferToken } = require("../helper/blockchain");


const getTransactions = async (req, res, next) => {
  try {
    const transactions = await WalletTransaction.getTransactions(req.query);
    res.status(200).json({ success: true, data: transactions.rows });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

const createWalletTransaction = async (req, res, next) => {
  try {
    let { to_address, token_amount, token_id } = req.body;
    

    //get current user address from wallet Table
    token_amount = parseInt(token_amount);
    console.log(to_address);
    console.log(token_amount);
    console.log(token_id);
    console.log(req.user.id);
    toWallet = (await Wallet.getWalletByAddress(to_address)).rows[0];
    fromWallet = (await Wallet.getWalletByUser(req.user.id)).rows[0];
    console.log(fromWallet.account_address);

    const token = (await Token.findTokenById(token_id)).rows[0];
    // console.log(token)
   
    if (!token) {
      return res
        .status(404)
        .json({ sucess: false, msg: "requested token detail not found" });
    }

     const get_balance = await WalletTransaction.getBatchBalance(token_id,fromWallet.account_address);
     console.log(get_balance[0])
     ITOAssetDraft
      if(get_balance < token_amount){
        return res
        .status(403)
        .json({success: false, msg: "User doesn't have sufficient balance"})
      }


      const userToken = (await UserToken.findUserItoToken(req.user.id, token.id))
        .rows[0];

      if (!userToken || userToken.amount < token_amount) {
        return res
          .status(403)
          .json({ sucess: false, msg: "user does not have enough tokens" });
      }

      if (!toWallet) {
        return res
          .status(404)
          .json({ success: false, msg: "wallet address does not exist" });
      }

      if (!fromWallet) {
        return res
          .status(404)
          .json({ success: false, msg: "sender wallet details not found" });
      }

      client.query("BEGIN");

      const transfer = await transferToken({
        from_address: fromWallet.account_address,
        to_address,
        from_private_key: fromWallet.private_key,
        token_value: token_amount + "",
      });
       console.log(transfer);
      let newTokens = userToken.amount - token_amount;

      if (!newTokens) {
        await userToken.deleteUserItoToken(req.user.id, token.id);
      } else {
        await UserToken.updateUserTokens(userToken.id, {
          amount: newTokens,
        });
      }

      await Wallet.updateWallet(fromWallet.id, {
        tokens: fromWallet.tokens - token_amount,
      });

      const tokenSum = parseInt(toWallet.tokens || 0) + token_amount;
      await Wallet.updateWallet(toWallet.id, {
        tokens: tokenSum,
      });

      const toUserToken = (
        await UserToken.findUserItoToken(toWallet.user_id, token.id)
      ).rows[0];

      if (!toUserToken) {
        await UserToken.saveTokens({
          ito_token_id: token.id,
          user_id: toWallet.user_id,
          amount: token_amount,
          created_at: new Date(),
          updated_at: new Date(),
        });
      } else {
        await UserToken.updateUserTokens(toUserToken.id, {
          amount: parseInt(toUserToken.amount) + token_amount,
        });
      }

      await WalletTransaction.saveTransaction({
        user_id: req.user.id,
        token: token_amount,
        token_transaction_status: "success",
        transform_hash: transfer.receipt,
        from_user: fromWallet.account_address,
        to_user: toWallet.account_address,
        created_at: new Date(),
        updated_at: new Date(),
      });

      res.status(200).send({ msg: "Tokens transferred successfully" });

      await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: error });
  }
};

const getUserWalletTransactions = async (req, res, next) => {
  try {
  } catch (error) {}
};

module.exports = {
  getTransactions,
  createWalletTransaction,
};
