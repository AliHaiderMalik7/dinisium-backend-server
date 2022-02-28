const Token = require('../model/itoToken');
const Wallet = require('../model/wallet');
const IToWallet = require('../model/ITOWallet');

const { getBlockchainBalance } = require('../helper/blockchain');

const order_checks = async (req, res, next) => {
  let error = {};
  const token = (await Token.getTokenById(req.body.ito_token_id)).rows[0];
  console.log('token data is ====>', token);
  if (!token) {
    return { success: false, msg: 'requested token does not exist' };
  }
  console.log('Req id =======================', req.user.id);
  const userWallet = (await Wallet.getWalletByUser(req.user.id)).rows[0];

  if (!['sell_order', 'buy_order'].includes(req.body.order_type)) {
    (error.status = 403),
      (error.success = false),
      (error.msg = 'order type not found');
    return { error };
  }

  const userBalance = userWallet && userWallet.fiat_balances;

  const userTokens = userWallet && userWallet.tokens;

  if (!['limit_order', 'market_order'].includes(req.body.sub_order)) {
    (error.status = 403),
      (error.success = false),
      (error.msg = 'order sub type not found');
    return { error };
  }

  if (
    req.body.order_type === 'buy_order' &&
    (!userBalance || userBalance < req.body.spreadedamount)
  ) {
    (error.status = 403),
      (error.success = false),
      (error.msg = 'you have insufficient balance.');
    return { error };
  }

  console.log(userTokens);
  if (
    req.body.order_type === 'sell_order' &&
    (!userTokens || userTokens < req.body.tokens)
  ) {
    (error.status = 403),
      (error.success = false),
      (error.msg = 'not enough tokens.');
    return { error };
  }

  if (req.body.sub_order === 'limit_order' && req.body.price_limit === null) {
    (error.status = 403),
      (error.success = false),
      (error.msg = 'price limit is required');
    return { error };
  }

  let body = { ...req.body };

  if (!Number.isInteger(req.body.tokens)) {
    (error.status = 403),
      (error.success = false),
      (error.msg = 'Tokens must be non-decimal');
    return { error };
  }

  body.status = 'pending';
  body.from_user_id = req.user.id;
  body.user_id = req.user.id;
  body.price_limit = req.body.price_limit;
  body.tokens = Math.floor(req.body.tokens);
  console.log('Tokens Value is ===========', body.tokens);
  body.created_at = new Date();
  body.updated_at = new Date();

  ///////////////////////////////////////////////////////////////////////////////////
  const currentToken = (
    await IToWallet.getTokenIdByItoId(req.body.ito_token_id)
  ).rows[0];

  const dataForBlockchainBalance = {
    address: userWallet.account_address,
    ito_id: currentToken.ito_id,
  };

  if (req.body.order_type === 'sell_order') {
    const balanceFromBlockchain = await getBlockchainBalance(
      dataForBlockchainBalance,
    );
    const balance = parseInt(Object.values(balanceFromBlockchain));
    console.log('BALANCE......... ', balance);
    if (balance < req.body.tokens) {
      (error.status = 403),
        (error.success = false),
        (error.msg = 'not enough tokens...');
      return { error };
    }
  }
  return { body, userWallet };
};

module.exports = {
  order_checks,
};
