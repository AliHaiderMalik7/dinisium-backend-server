require("dotenv").config({ path: "../.env" });
const Wallet = require("../model/wallet");
const IToWallet = require("../model/ITOWallet");
const Token = require("../model/itoToken");
const WalletTransaction = require("../model/walletTransaction");
const { transferToken } = require("./blockchain");

/*
Transfers Fiat from one wallet to other wallet
Takes 3 parameters
1: amount: fiat amount to be transfered
2: to: user id which will receive fiat
3: from: user id which will send fiat from it's wallet
 */
const transferAmount = async (amount, to, from) => {
  const toWallet = (await Wallet.getWalletByUser(to)).rows[0];
  const fromWallet = (await Wallet.getWalletByUser(from)).rows[0];

  await Wallet.updateWallet(fromWallet.id, {
    locked_amount: parseFloat(fromWallet.locked_amount) - parseFloat(amount),
  });

  await Wallet.updateWallet(toWallet.id, {
    fiat_balances: parseFloat(toWallet.fiat_balances) + parseFloat(amount),
  });
};

/* 
Transfers Tokens from one blockchain wallet to other blockchain wallet
Takes 4 parameters
1: tokens: amount of tokens to be transfered
2: to: to user wallet address which will receive fiat
3: from: from user wallet address which will send fiat from it's wallet
4: ito_id: blockchain ito id
 */
const transferTokens = async (amountt, tokens, to, from, ito_id) => {
  const toWallet = (await Wallet.getWalletByUser(to)).rows[0];
  const fromWallet = (await Wallet.getWalletByUser(from)).rows[0];

  const data = {
    to_address: toWallet.account_address,
    from_address: fromWallet.account_address,
    from_privateKey: fromWallet.private_key,
    ito_id: ito_id,
    amount: tokens,
  };

  const n = await transferToken(data);
  const current_token_price = amountt / tokens;
  await WalletTransaction.saveTransaction({
    token: tokens,
    to_user: toWallet.account_address,
    from_user: fromWallet.account_address,
    ito_id: ito_id,
    token_transaction_status: "success",
    amount: amountt,
    price: current_token_price,
    transform_hash: n.data.hash,
    to_user_id: toWallet.user_id,
    from_user_id: fromWallet.user_id,
    created_at: new Date(),
    updated_at: new Date(),
  });

  await Wallet.updateWallet(fromWallet.id, {
    locked_tokens: parseFloat(fromWallet.locked_tokens) - parseFloat(tokens),
  });

  await Wallet.updateWallet(toWallet.id, {
    tokens: parseFloat(toWallet.tokens) + parseFloat(tokens),
  });
  return n.data.hash;
};

/* 
Transfers Spread Amount from User's wallet to ITO wallet
Takes 2 parameters
1: ito_token_id: id of the ito_token the get the apread amount
2: fiatAmount: amount on which spread has to be calculated
 */
const sellSpread = async (ito_id, fiatAmount) => {
  const itoWallet = (await IToWallet.getTokenIdByItoId(ito_id)).rows[0];
  const itoTokenData = (await Token.getTokenByIto(ito_id)).rows[0];

  const itoSpreadAmount = itoTokenData.selling_spread;

  const sellSpread =
    parseFloat(fiatAmount) * (parseFloat(itoSpreadAmount) / 100);

  await IToWallet.updateWallet(ito_id, {
    fiat_balances: parseFloat(itoWallet.fiat_balances) + parseFloat(sellSpread),
  });
  return fiatAmount - sellSpread;
};

module.exports = {
  transferTokens,
  transferAmount,
  sellSpread,
};
