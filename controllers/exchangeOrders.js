const DB = require('../model/DB');
const client = DB.pool;
const Order = require('../model/exchangeOrders');
const Token = require('../model/itoToken');
const Wallet = require('../model/wallet');
const IToWallet = require('../model/ITOWallet');
const ItoSeries = require('../model/itoSeries');
const Participant = require('../model/participants');
const FiatTransaction = require('../model/fiatTransaction');
const UserToken = require('../model/userTokens');
const AuditLogs = require('../model/auditLogs');
const { transferToken, getBlockchainBalance } = require('../helper/blockchain');
const { p2pTrade } = require('../helper/p2p');
const {
  transferTokens,
  transferAmount,
} = require('../helper/transactionalServices');
const crypto = require('crypto');
const WalletTransaction = require('../model/walletTransaction');

//const { updateWallet } = require("../model/wallet");

//Create exchnage order
const createOrder = async (req, res, next) => {
  console.log('create order body ......', req.body);
  let flag = req.body.flag;
  delete req.body.flag;

  try {
    const token = (await Token.getTokenById(req.body.ito_token_id)).rows[0];
    console.log('token data is ====>', token);
    if (!token) {
      return res
        .status(400)
        .json({ success: false, msg: 'requested token does not exist' });
    }
    console.log('Req id =======================', req.user.id);
    const userWallet = (await Wallet.getWalletByUser(req.user.id)).rows[0];

    if (!['sell_order', 'buy_order'].includes(req.body.order_type)) {
      return res
        .status(403)
        .json({ success: false, msg: 'order type not found' });
    }

    const userBalance = userWallet && userWallet.fiat_balances;

    const userTokens = userWallet && userWallet.tokens;

    if (!['limit_order', 'market_order'].includes(req.body.sub_order)) {
      return res
        .status(403)
        .json({ success: false, msg: 'order sub type not found' });
    }

    if (
      req.body.order_type === 'buy_order' &&
      (!userBalance || userBalance < req.body.amount)
    ) {
      return res
        .status(403)
        .json({ success: false, msg: 'you have insufficient balance.' });
    }

    console.log(userTokens);
    if (
      req.body.order_type === 'sell_order' &&
      (!userTokens || userTokens < req.body.tokens)
    ) {
      return res
        .status(403)
        .json({ success: false, msg: 'not enough tokens..' });
    }

    if (req.body.sub_order === 'limit_order' && req.body.price_limit === null) {
      return res
        .status(403)
        .json({ success: false, msg: 'price limit is required' });
    }

    let body = { ...req.body };

    if (!Number.isInteger(req.body.tokens)) {
      return res
        .status(403)
        .json({ success: false, msg: 'Tokens must be non-decimal' });
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
        return res
          .status(403)
          .json({ success: false, msg: 'not enough tokens...' });
      }
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////

    console.log('body=========', body);

    const order = await Order.createOrder(body);

    console.log('order=========', order);

    body.id = order.rows[0].id;

    if (req.body.order_type === 'buy_order') {
      await Wallet.updateWallet(userWallet.id, {
        fiat_balances:
          parseFloat(userWallet.fiat_balances) -
          parseFloat(req.body.spreadedamount),
        locked_amount:
          parseFloat(req.body.spreadedamount) +
          parseFloat(userWallet.locked_amount),
      });
    }
    if (req.body.order_type === 'sell_order') {
      await Wallet.updateWallet(userWallet.id, {
        tokens: parseFloat(userWallet.tokens) - parseFloat(req.body.tokens),
        locked_tokens: parseFloat(req.body.tokens) + userWallet.locked_tokens,
      });
    }

    // if (req.body.order_type === "buy_order") {
    // let data =
    await p2pTrade(body);
    //   console.log("new amount is =========================", data);

    //   if (data <= 0) {
    //     Order.updateOrder({ status: "approved" }, await order.rows[0].id);
    //   } else {
    //     await Wallet.updateWallet(userWallet.id, {
    //       fiat_balances:
    //         parseFloat(userWallet.fiat_balances) - parseFloat(data),
    //       locked_amount: parseFloat(data) + userWallet.locked_amount,
    //     });

    //     Order.updateOrder({ amount: data }, await order.rows[0].id);
    //     // body.amount = data;
    //   }
    // }
    // if (req.body.order_type === "sell_order") {
    // let data =
    // await p2pTrade(body);
    //   console.log("new amount is =========================", data);

    //   if (data <= 0) {
    //     Order.updateOrder({ status: "approved" }, await order.rows[0].id);
    //   } else {
    //     await Wallet.updateWallet(userWallet.id, {
    //       tokens: parseFloat(userWallet.tokens) - parseFloat(data),
    //       locked_tokens: parseFloat(data) + userWallet.locked_tokens,
    //     });
    //     Order.updateOrder({ tokens: data }, await order.rows[0].id);
    //   }
    // }
    // console.log("data created ===================", order.rows[0]);
    if (flag === 1) {
      return order.rows[0];
    } else {
      return res.status(200).json({
        success: true,
        msg: 'order created successfully',
        data: order.rows[0],
      });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, msg: error.message });
  }
};

//Tranfer tokens and deducts the FIAT instantly
const buytoken = async (req, res, next) => {
  try {
    const { amount, token_id, ito_series_id } = req.body;
    if (amount < 1 || isNaN(amount)) {
      return res.status(403).json({
        success: false,
        msg: `Can not process transaction with ${amount} token`,
      });
    }

    const token = (await Token.getTokenById(token_id)).rows[0];
    if (!token) {
      return res
        .status(404)
        .json({ success: false, msg: 'Requested token does not exist' });
    }

    const itoSeries = (await ItoSeries.getSeriesById(ito_series_id)).rows[0];
    if (itoSeries.supply < amount) {
      return res.status(404).json({
        success: false,
        msg: 'Not enough supply.please generate buy request for tokens',
      });
    }

    const userWallet = (await Wallet.getWalletByUser(req.user.id)).rows[0];
    if (!userWallet) {
      return res
        .status(404)
        .json({ success: false, msg: 'User wallet details not found' });
    }
    const totalPrice = parseInt(amount) * parseInt(token.price);
    if (
      userWallet.fiat_balances &&
      (userWallet.fiat_balances < totalPrice || userWallet.fiat_balances <= 0)
    ) {
      return res
        .status(403)
        .json({ success: false, msg: 'You have not sufficient balance.' });
    }
    const itoWallet = (await IToWallet.getWalletByIto(token.ito_id)).rows[0];
    await client.query('BEGIN');

    let fiat_balances = parseInt(itoWallet.fiat_balances) + totalPrice;

    await IToWallet.updateWallet(token.ito_id, { fiat_balances });

    let userFiatBalace = parseInt(userWallet.fiat_balances) - totalPrice;

    let userToken = parseInt(userWallet.tokens) + parseInt(amount);

    let transferResponse = await transferToken({
      to_address: userWallet.account_address,
      from_address: itoWallet.account_address,
      from_privateKey: itoWallet.private_key,
      ito_id: itoWallet.ito_id,
      amount: amount + '',
    });

    await Wallet.updateWallet(userWallet.id, {
      fiat_balances: userFiatBalace,
      tokens: userToken,
    });

    const userTokens = (await UserToken.findUserItoToken(req.user.id, token.id))
      .rows[0];

    if (!userTokens) {
      await UserToken.saveTokens({
        ito_token_id: token.id,
        user_id: req.user.id,
        amount: amount,
        created_at: new Date(),
        updated_at: new Date(),
      });
    } else {
      await UserToken.updateUserTokens(userTokens.id, {
        amount: parseInt(userTokens.amount) + amount,
      });
    }

    let supply = itoSeries.supply - amount;

    await ItoSeries.updateSeries({ supply }, itoSeries.id);

    await FiatTransaction.saveFiatTransaction({
      user_id: req.user.id,
      amount,
      currency: 'USD',
      ito_id: token.ito_id,
      ito_series: ito_series_id,
      transaction_hash: transferResponse.receipt,
      transaction_status: 'completed',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const participant = (
      await Participant.findItoParticipant(token.ito_id, req.user.id)
    ).rows;

    if (!participant || !participant.length) {
      await Participant.saveParticipants({
        ito_id: token.ito_id,
        user_id: req.user.id,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    await client.query('COMMIT');

    return res
      .status(200)
      .json({ success: true, msg: 'transaction completed' });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(400).json({ success: false, msg: error.message });
  }
};

//Get All exchange orders
// const getOrders = async (req, res, next) => {
//   try {
//     if (req.user.userType === "admin" || req.user.userType === "sub-admin") {
//       if (!req.user.ito) {
//         return res
//           .status(404)
//           .json({ success: false, msg: "no admin ito found" });
//       }

//       const token = (await Token.getTokenByIto(req.user.ito)).rows[0];

//       if (!token) {
//         return res
//           .status(404)
//           .json({ success: false, msg: "admin ito token not found" });
//       }

//       req.query.ito_token_id = token.id || 0;
//     }

//     const orders = await Order.getOrders(req.query);

//     res.status(200).json({ success: true, data: orders.rows });
//   } catch (error) {
//     res.status(400).send({ msg: error.message });
//   }
// };

const getOrders = async (req, res, next) => {
  console.log('Message received...');

  try {
    const all_order = (await Order.getOrders(req.user.id)).rows;

    res.status(200).json({ success: true, data: all_order });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

//MANUAL TRANSFER OF TOKENS AND AMOUNT......................................
const manualTransfer = async (req, res, next) => {
  console.log('MANUAL TRANSFER IS BEING DONE....');

  const transferAmountFromITOWallet = async (amount, to, from) => {
    const toWallet = (await Wallet.getWalletByUser(to)).rows[0];
    const fromWallet = (await IToWallet.getWalletByIto(from)).rows[0]; //ito_id is required to get ito_wallet

    await IToWallet.updateWallet(fromWallet.id, {
      fiat_balances: parseFloat(fromWallet.fiat_balances) - parseFloat(amount),
    });

    await Wallet.updateWallet(toWallet.id, {
      fiat_balances: parseFloat(toWallet.fiat_balances) + parseFloat(amount),
    });
    console.log('Amount Transfered.');
  };

  const transferTokensFromITOWallet = async (tokens, to, ito_id) => {
    const toWallet = (await Wallet.getWalletByUser(to)).rows[0];
    const fromWallet = (await IToWallet.getWalletByIto()).rows[0]; // ito_id is required to get ito_wallet
    const currentToken = (await IToWallet.getTokenIdByItoId(ito_id)).rows[0]; // ito_id is required to get ito_wallet

    const data = {
      to_address: toWallet.account_address,
      from_address: fromWallet.account_address,
      from_privateKey: fromWallet.private_key,
      ito_id: currentToken.ito_id,
      amount: tokens,
    };
    console.log('DATA FOR TRANSFER TOKENS(BLOCKCHAIN)===', data);
    const n = await transferToken(data); //transferToken from blockchain

    await IToWallet.updateWallet(fromWallet.id, {
      tokens: parseFloat(fromWallet.tokens) - parseFloat(tokens),
    });

    await Wallet.updateWallet(toWallet.id, {
      tokens: parseFloat(toWallet.tokens) + parseFloat(tokens),
    });
    console.log('Tokens Transfered.');

    return n.data.hash;
  };

  try {
    let status = req.body.status;
    let rejectionMessage = req.body.rejectionMessage;
    const response = (await Order.getOrderById(req.body.id)).rows[0];

    console.log('Response data is =====', response);
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).send({
        msg: 'Status can only be approved or rejected.',
      });
    }

    if (status === 'rejected' && !rejectionMessage) {
      return res.status(400).send({
        msg: 'Rejection reason is required',
      });
    }

    if (!response) {
      return res.status(404).send({
        msg: `Order Not exists`,
      });
    }

    if (['approved', 'rejected'].includes(response.status)) {
      return res.status(409).send({
        msg: `Status already ${response.status}`,
      });
    }
    console.log('THIS IS LOGGED IN USER ID__________________==>>', req.user.id);
    console.log(
      'THIS IS THE ADMIN ONE ID__________________==>>',
      response.admin_one,
    );
    console.log('THIS IS FULL OBJECT__________________==>>', response);

    if (response.admin_one === req.user.id) {
      return res.status(403).send({
        msg: `You have already approved the request, not allowed to approve again.`,
      });
    }

    if (response.admin_one && response.status !== 'rejected') {
      const orderToBeCompleted = (await Order.getOrderById(req.body.id))
        .rows[0];
      const investorWallet = (
        await Wallet.getWalletByUser(orderToBeCompleted.user_id)
      ).rows[0];

      console.log('ORDER TO BE COMPLETED====== ', orderToBeCompleted);
      console.log('INVESTOR WALLET============', investorWallet);
      if (orderToBeCompleted.order_type === 'sell_order') {
        console.log('in sell order');
        const ito_id = await IToWallet.getTokenIdByItoId(
          orderToBeCompleted.ito_token_id,
        );

        const itoWallet = (await IToWallet.getWalletByIto()).rows[0];
        if (itoWallet.fiat_balances < orderToBeCompleted.amount) {
          return res
            .status(404)
            .json({ success: false, msg: 'Insufficient balance' });
        }

        const currentToken = (
          await IToWallet.getTokenIdByItoId(orderToBeCompleted.ito_token_id)
        ).rows[0]; // ito_id is required to get ito_wallet
        console.log('CURRENT TOKEN...', currentToken);
        const data = {
          to_address: itoWallet.account_address,
          from_address: investorWallet.account_address,
          from_privateKey: investorWallet.private_key,
          ito_id: currentToken.ito_id,
          amount: orderToBeCompleted.tokens,
        };
        console.log('DATA FOR TRANSFER TOKENS(BLOCKCHAIN)===', data);
        const transHash = await transferToken(data); //transferToken from fblockchain

        if (transHash) {
          console.log('in transhash....');
          const dataForBlockchainBalance = {
            address: itoWallet.account_address,
            ito_id: currentToken.ito_id,
          };
          const balanceFromBlockchain = await getBlockchainBalance(
            dataForBlockchainBalance,
          );

          // console.log('balanceFromBlockchain...', balanceFromBlockchain.data);
          const fields = {
            remaining_supply:
              parseInt(currentToken.remaining_supply) +
              parseInt(orderToBeCompleted.tokens),
          };
          console.log('fields are : ...', fields);
          const tokenUpdated = await Token.updateToken(
            currentToken.id,
            fields,
            Object.keys(currentToken),
          );
        }

        const current_token_price =
          orderToBeCompleted.amount / orderToBeCompleted.tokens;
        console.log('Current Token price .......', current_token_price);
        await WalletTransaction.saveTransaction({
          token: orderToBeCompleted.tokens,
          to_user_id: orderToBeCompleted.user_id,
          //ito wallet
          //  from_user_id: fromWallet.user_id,
          ito_id: currentToken.ito_id,
          token_transaction_status: 'success',
          amount: orderToBeCompleted.amount,
          price: current_token_price,
          transform_hash: transHash.data.hash,
          to_user: investorWallet.account_address,
          from_user: itoWallet.account_address,
          created_at: new Date(),
          updated_at: new Date(),
        });
        Order.updateOrder(
          {
            transaction_hash: transHash.data.hash,
          },
          orderToBeCompleted.id,
        );

        transferAmountFromITOWallet(
          orderToBeCompleted.spreadedamount,
          orderToBeCompleted.user_id,
          ito_id,
        );

        await Wallet.updateWallet(investorWallet.id, {
          locked_tokens:
            parseFloat(investorWallet.locked_tokens) -
            parseFloat(orderToBeCompleted.tokens),
        });

        await IToWallet.updateWallet(itoWallet.id, {
          tokens:
            parseFloat(itoWallet.tokens) +
            parseFloat(orderToBeCompleted.tokens),
        });

        let resultAdminTwoApprove = await Order.adminTwoApprove(
          DB.pool,
          response.id,
          req.user.id,
          status,
          rejectionMessage,
        );
        if (resultAdminTwoApprove.rowCount > 0) {
          return res.status(200).send({
            msg: `Order has been '${status}'.`, ////second approval
            success: true,
          });
        } else {
          return res.status(400).send({
            error: resultAdminTwoApprove,
            msg: 'Bad Request',
            success: false,
          });
        }

        // Order.updateOrder({ status: "approved" }, await orderToBeCompleted.id); //order id of Order
      }
      if (orderToBeCompleted.order_type === 'buy_order') {
        console.log('in Buy order');

        const currentToken = (
          await IToWallet.getTokenIdByItoId(orderToBeCompleted.ito_token_id)
        ).rows[0]; // ito_id is required to get ito_wallet

        console.log('current token .....', currentToken);
        // const itoSeries = (
        //   await ItoSeries.findItoOngoingSeriesByitoId(currentToken.ito_id)
        // ).rows[0];
        // console.log('ITO-SERIES ...', itoSeries);

        // if (itoSeries) {
        //   if (itoSeries.remaining_supply < response.tokens) {
        //     return res.status(400).send({
        //       msg: 'tokens buy request should less than the token remaining supply',
        //     });
        //   }
        //   await ItoSeries.updateSeries(
        //     {
        //       remaining_supply:
        //         parseInt(itoSeries.remaining_supply) -
        //         parseInt(orderToBeCompleted.tokens),
        //     },
        //     itoSeries.id,
        //   );
        // }

        if (currentToken) {
          if (currentToken.remaining_supply < response.tokens) {
            return res.status(400).send({
              msg: 'tokens buy request should less than the token remaining supply',
            });
          }

          // const fields = {
          //   remaining_supply: balanceFromBlockchain.data,
          // };
          // console.log('fields are : ...', fields);
          // const tokenUpdated = await Token.updateToken(
          //   currentToken.id,
          //   fields,
          //   Object.keys(currentToken),
          // );
          const fields = {
            remaining_supply:
              parseInt(currentToken.remaining_supply) -
              parseInt(orderToBeCompleted.tokens),
          };
          await Token.updateToken(
            currentToken.id,
            fields,
            Object.keys(currentToken),
          );
        }

        const itoWallet = (await IToWallet.getWalletByIto()).rows[0];
        console.log('ITO_WALLET===============', itoWallet);
        console.log('ITO_TOKENS=====', itoWallet.tokens);
        console.log(
          'ORDER TO BE COMPLETED TOKENS=== ',
          orderToBeCompleted.tokens,
        );

        const transHash = await transferTokensFromITOWallet(
          orderToBeCompleted.tokens,
          orderToBeCompleted.user_id,
          orderToBeCompleted.ito_token_id,
        );
        console.log('HHHHHHHAAAAAAAAAASSSSSSSSSHHHHHH', transHash);
        console.log('Current Token  ====', currentToken);

        const current_token_price =
          orderToBeCompleted.amount / orderToBeCompleted.tokens;
        console.log('Current Token price .......', current_token_price);
        await WalletTransaction.saveTransaction({
          token: orderToBeCompleted.tokens,
          to_user_id: orderToBeCompleted.user_id,
          //ito wallet
          //  from_user_id: fromWallet.user_id,
          ito_id: currentToken.ito_id,
          token_transaction_status: 'success',
          amount: orderToBeCompleted.amount,
          price: current_token_price,
          transform_hash: transHash,
          to_user: investorWallet.account_address,
          from_user: itoWallet.account_address,
          created_at: new Date(),
          updated_at: new Date(),
        });

        Order.updateOrder(
          {
            transaction_hash: transHash,
          },
          orderToBeCompleted.id,
        );

        await Wallet.updateWallet(investorWallet.id, {
          locked_amount:
            parseFloat(investorWallet.locked_amount) -
            parseFloat(orderToBeCompleted.amount),
        });

        await IToWallet.updateWallet(itoWallet.id, {
          fiat_balances:
            parseFloat(itoWallet.fiat_balances) +
            parseFloat(orderToBeCompleted.amount),
        });

        let resultAdminTwoApprove = await Order.adminTwoApprove(
          DB.pool,
          response.id,
          req.user.id,
          status,
          rejectionMessage,
        );
        if (resultAdminTwoApprove.rowCount > 0) {
          return res.status(200).send({
            msg: `Order has been '${status}'.`, ////second approval
            success: true,
          });
        } else {
          return res.status(400).send({
            error: resultAdminTwoApprove,
            msg: 'Bad Request',
            success: false,
          });
        }
        // Order.updateOrder(
        //   { status: "approved" },
        //   await orderToBeCompleted.id
        // ); //order id of Order
        // console.log(
        //   "DDDDDDDDDDDDDDDOOOOOOOOOOOOOOOOOOONNNNNNNNNNNNNNNNEEEEEEEEEEEEEEEEEE"
        // );

        // return res.status(200).json({
        //   success: true,
        //   msg: "order completed successfully",
        // });
        // }
      }
    } else {
      let resultAdminOneApprove = await Order.adminOneApprove(
        DB.pool,
        response.id,
        req.user.id,
        status,
        rejectionMessage,
      );
      if (resultAdminOneApprove.rowCount > 0) {
        return res.status(200).send({
          msg: `Order has been '${status}'.`,
          success: true,
        });
      } else {
        return res.status(400).send({
          error: resultAdminOneApprove,
          msg: 'Bad Request',
          success: false,
        });
      }
    }
  } catch (error) {
    console.log('ERROR..................', error);
    res.status(400).send({ msg: error.message });
  }
};

//Get current user's exhcnage orders
const getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.getOrdersByUser(req.user.id);

    res.status(200).json({ success: true, data: orders.rows || [] });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

//Get Exchange orders by Id
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.getOrderById(req.params.id);
    res.status(200).json({ success: true, data: order.rows[0] || {} });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

// getOrderUsingId
const getOrderUsingId = async (req, res, next) => {
  try {
    const order = await Order.getOrderUsingId(req.params.id);
    res.status(200).json({ success: true, data: order || [] });
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

//Approve order by Id
const approveOrder = async (req, res, next) => {
  try {
    const order = (await Order.getOrderById(req.params.id)).rows[0];

    // console.log(order);

    if (order.amount < 1 || isNaN(order.amount)) {
      return res.status(400).json({
        success: false,
        msg: `can not process transaction with ${order.amount} token`,
      });
    }

    const token = (await Token.getTokenById(order.ito_token_id)).rows[0];

    console.log(token);

    if (!token) {
      return res
        .status(404)
        .json({ success: false, msg: 'requested token does not exist' });
    }

    if (req.user.ito !== token.ito_id) {
      return res.status(403).json({
        success: false,
        msg: 'admin with different ito can not approve request.',
      });
    }

    const userToken = (
      await UserToken.findUserItoToken(order.user_id, token.id)
    ).rows[0];

    await client.query('BEGIN');

    const callback = async transaction => {
      // console.log("transaction", transacton);
      try {
        await FiatTransaction.saveFiatTransaction({
          user_id: order.user_id,
          amount: order.amount,
          currency: 'USD',
          ito_id: token.ito_id,
          transaction_hash: transaction.transform_hash,
          ito_series: order.order_type === 'buy_order' ? order.series_id : null,
          transaction_status: 'completed',
          created_at: new Date(),
          updated_at: new Date(),
        });

        await Order.confirmOrder(transaction.transform_hash, req.params.id);

        if (order.order_type === 'buy_order') {
          if (!userToken) {
            await UserToken.saveTokens({
              ito_token_id: order.ito_token_id,
              user_id: order.user_id,
              amount: order.amount,
              created_at: new Date(),
              updated_at: new Date(),
            });
          } else {
            await UserToken.updateUserTokens(userToken.id, {
              amount: parseInt(userToken.amount) + parseInt(order.amount),
            });
          }
        }

        if (order.order_type === 'sell_order') {
          await UserToken.updateUserTokens(userToken.id, {
            amount: parseInt(userToken.amount) - parseInt(order.amount),
          });
        }

        const participant = (
          await Participant.findItoParticipant(token.ito_id, order.user_id)
        ).rows;

        if (!participant || !participant.length) {
          await Participant.saveParticipants({
            ito_id: token.ito_id,
            user_id: order.user_id,
            created_at: new Date(),
            updated_at: new Date(),
          });
        }

        await client.query('COMMIT');

        res
          .status(200)
          .json({ success: true, msg: 'order completed successfully' });
      } catch (error) {
        await client.query('ROLLBACK');

        res.status(400).json({ success: false, msg: error.message });
      }
    };

    if (order.order_type === 'buy_order') {
      processBuyRequest(order, token, req, res, callback);
    }

    if (order.order_type === 'sell_order') {
      processSellRequest(order, token, userToken, req, res, callback);
    }
  } catch (error) {
    await client.query('ROLLBACK');

    res.status(400).json({ success: false, msg: error.message });
  }
};

//Update Exchange order by Id
const updateOrder = async (req, res, next) => {
  try {
    console.log('Update body ......', req.body);
    console.log('Update order Id ==>', req.params.id);

    let body = { ...req.body };
    req.body.flag = 1;
    let result = await deleteOrder(req, res, next);

    let update = await createOrder(req, res, next);
    res.status(200).json({
      success: true,
      data: update,
      msg: 'order updated successfully',
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

/*
FunctionName: deletOrder
Author: Ali Haider
Description: Delete order using order Id
*/
const deleteOrder = async (req, res, next) => {
  try {
    console.log('we are in the delete function', req.body);
    const order = await Order.getOrderById(req.params.id);
    if (!order.rows.length) {
      return res.status(400).json({
        success: false,
        msg: `no order found with id ${req.params.id}`,
      });
    }

    const user_id = order.rows[0].user_id;
    console.log('Order to be deleted is ====>', order.rows[0]);
    const toWallet = (await Wallet.getWalletByUser(user_id)).rows[0];
    console.log('User Wallet id is  =====>', toWallet);

    if (order.rows[0].order_type === 'buy_order') {
      console.log('In buy Order');
      const amount = order.rows[0].amount;
      const r1 = await Wallet.updateWallet(toWallet.id, {
        locked_amount: parseFloat(toWallet.locked_amount) - parseFloat(amount),
      });

      const r2 = await Wallet.updateWallet(toWallet.id, {
        fiat_balances: parseFloat(toWallet.fiat_balances) + parseFloat(amount),
      });

      if (r1 && r2 && !req.body.flag) {
        console.log('Amount successfully Transferred');
        await Order.deleteOrder(req.params.id);
        return res.status(200).json({ msg: 'Order Deleted' });
      }
      if (r1 && r2 && req.body.flag === 1) {
        console.log('Amount successfully Transferred using flag');
        return await Order.deleteOrder(req.params.id);
      } else {
        res
          .status(403)
          .json({ success: false, msg: 'unable to Transfer Amount' });
      }
    }

    if (order.rows[0].order_type === 'sell_order') {
      console.log('In Sell Order');

      const tokens = order.rows[0].tokens;
      console.log('Tokens are ===>', tokens);

      const r1 = await Wallet.updateWallet(toWallet.id, {
        locked_tokens: parseFloat(toWallet.locked_tokens) - parseFloat(tokens),
      });

      const r2 = await Wallet.updateWallet(toWallet.id, {
        tokens: parseFloat(toWallet.tokens) + parseFloat(tokens),
      });

      if (r1 && r2 && !req.body.flag) {
        console.log('Token successfully Transferred');
        await Order.deleteOrder(req.params.id);
        res.status(200).json({ msg: 'Order Deleted' });
      }
      if (r1 && r2 && req.body.flag === 1) {
        console.log('Token successfully Transferred using flag');
        return await Order.deleteOrder(req.params.id);
      } else {
        res
          .status(403)
          .json({ success: false, msg: 'unable to Transfer Tokens' });
      }
    }
  } catch (error) {
    res.status(400).send({ msg: error.message });
  }
};

//Deduct FIAT from user's wallet and transfer tokens to the user and saves the event in Audit Logs
const processBuyRequest = async (order, token, req, res, next) => {
  try {
    const userWallet = (await Wallet.getWalletByUser(order.user_id)).rows[0];

    if (!userWallet) {
      return res
        .status(404)
        .json({ success: false, msg: 'user wallet details not found' });
    }

    const totalPrice = parseInt(order.amount) * parseInt(token.price);

    if (userWallet.fiat_balances && userWallet.fiat_balances < totalPrice) {
      return res
        .status(403)
        .json({ success: false, msg: 'you have not sufficient balance.' });
    }

    const itoWallet = (await IToWallet.getWalletByIto(token.ito_id)).rows[0];

    // if (!itoWallet) {
    //   await IToWallet.createWallet({
    //     ito_id: token.ito_id,
    //     fiat_balances: totalPrice,
    //     account_address: crypto
    //       .createHash("sha256")
    //       .update("secret")
    //       .digest("hex"),
    //     private_key: crypto.createHash("sha256").update("secret").digest("hex"),
    //     created_at: new Date(),
    //     updated_at: new Date(),
    //   });
    // } else {
    let fiat_balances = parseInt(itoWallet.fiat_balances) + totalPrice;
    await IToWallet.updateWallet(token.ito_id, { fiat_balances });
    // }

    let userFiatBalace = userWallet.fiat_balances - totalPrice;

    let userToken = userWallet.tokens + order.amount;

    const transfer = await transferToken({
      from_address: itoWallet.account_address,
      to_address: userWallet.account_address,
      from_private_key: itoWallet.private_key,
      token_value: order.amount + '',
    });

    await Wallet.updateWallet(userWallet.id, {
      fiat_balances: userFiatBalace,
      tokens: userToken,
    });

    await AuditLogs.saveLogs({
      action: 'buy_order_request',
      admin: req.user.id,
      user_id: order.user_id,
      created_at: new Date(),
      updated_at: new Date(),
    });

    let transaction = {
      user_id: order.user_id,
      ito_admin_id: token.ito_id,
      fiat_amount: totalPrice,
      fiat_transaction_status: 'success',
      transform_hash: transfer.receipt,
      // transform_hash: transfer.data.receipt,
      from_user: itoWallet.account_address,
      to_user: userWallet.account_address,
      created_at: new Date(),
      updated_at: new Date(),
    };

    next(transaction);
  } catch (error) {
    throw new Error(error.message);
  }
};

//Deducts FIAT from ITO wallet and adds into the user's wallet and deducts tokens from user;s wallet and adds into the ITO wallet
const processSellRequest = async (order, token, userToken, req, res, next) => {
  try {
    if (!userToken) {
      return res.status(403).json({
        success: false,
        msg: 'user does not have requested token in wallet',
      });
    }

    const itoWallet = (await IToWallet.getWalletByIto(token.ito_id)).rows[0];

    if (!itoWallet) {
      return res
        .status(404)
        .json({ success: false, msg: 'not ito wallet detail' });
    }

    const totalPrice = order.amount * token.price;

    let ItoFiatBalace = itoWallet.fiat_balances - totalPrice;

    // let itoToken = (itoWallet.tokens+amount);

    const userWallet = (await Wallet.getWalletByUser(order.user_id)).rows[0];

    const userBalance = userWallet.fiat_balances + totalPrice;
    const userTokens = userWallet.tokens - order.amount;

    const transfer = await transferToken({
      from_address: userWallet.account_address,
      to_address: itoWallet.account_address,
      from_private_key: userWallet.private_key,
      token_value: order.amount + '',
    });
    // console.log(transfer);
    await Wallet.updateWallet(userWallet.id, {
      fiat_balances: userBalance,
      tokens: userTokens,
    });

    await IToWallet.updateWallet(token.ito_id, {
      fiat_balances: ItoFiatBalace,
    });

    await AuditLogs.saveLogs({
      action: 'sell_order_request',
      admin: req.user.id,
      user_id: order.user_id,
      created_at: new Date(),
      updated_at: new Date(),
    });

    let transaction = {
      user_id: order.user_id,
      ito_admin_id: token.ito_id,
      fiat_amount: totalPrice,
      fiat_transaction_status: 'success',
      transform_hash: transfer.receipt,
      // transform_hash: transfer.data.recipient,
      from_user: userWallet.account_address,
      to_user: itoWallet.account_address,
      created_at: new Date(),
      updated_at: new Date(),
    };

    next(transaction);
  } catch (error) {
    throw new Error(error.message);
  }
};

const directBuyTokens = async (req, res, next) => {
  try {
    const { tokens, amount, ito_token_id } = req.body;
    console.log('BUY tokens data is .....', req.body);
    // const ongoingItoSeries = (await ItoSeries.findItoOngoingSeriesByitoId(ito_token_id)).rows[0];

    // if(ongoingItoSeries.remaining_supply < tokens){
    //   return res.status(422)
    //     .json({ msg: "Insufficient balance in ito series.", success: false });
    // }

    //*______________________ito_token_id = ito_id;________________________*

    const wallet = (await IToWallet.getTokenIdByItoId(ito_token_id)).rows[0];

    const userWallet = (await Wallet.getWalletByUser(req.user.id)).rows[0];
    const itoWallet = (await IToWallet.getWalletByIto()).rows[0];
    const token = (await Token.getTokenDetailById(ito_token_id)).rows[0];
    console.log('Token details are ......', token);
    const ito_id = token.ito_id;
    console.log('ito id is ..........', ito_id);
    const data = {
      amount: tokens,
      ito_id: wallet.ito_id,
      from_address: itoWallet.account_address,
      from_privateKey: itoWallet.private_key,
      to_address: userWallet.account_address,
    };

    try {
      const txData = await transferToken(data);
      console.log('Hash found is ====>', txData.data.hash);

      const current_token_price = amount / tokens;
      console.log('Current Token price ________', current_token_price);
      //  WalletTransaction
      await WalletTransaction.saveTransaction({
        to_user_id: req.user.id,
        ito_id: wallet.ito_id,
        token: tokens,
        amount: amount,
        token_transaction_status: 'success',
        transform_hash: txData.data.hash,
        from_user: itoWallet.account_address,
        to_user: userWallet.account_address,
        created_at: new Date(),
        updated_at: new Date(),
        price: current_token_price,
      });

      console.log('Hello world');
      await Wallet.updateWallet(userWallet.id, {
        fiat_balances:
          parseFloat(userWallet.fiat_balances) - parseFloat(amount),
        tokens: parseFloat(userWallet.tokens) + parseFloat(tokens),
      });

      await IToWallet.updateWallet(itoWallet.id, {
        tokens: parseFloat(itoWallet.tokens) - parseFloat(tokens),
        fiat_balances: parseFloat(itoWallet.fiat_balances) - parseFloat(amount),
      });

      const itoSeriess = (await ItoSeries.findItoOngoingSeriesByitoId(ito_id))
        .rows[0];
      console.log('ITO-SERIES ...', itoSeriess);

      if (itoSeriess) {
        if (itoSeriess.remaining_supply < tokens) {
          return res.status(400).send({
            msg: 'tokens buy request should less than the token remaining supply',
          });
        }
        await ItoSeries.updateSeries(
          {
            remaining_supply:
              parseInt(itoSeriess.remaining_supply) - parseInt(tokens),
          },
          itoSeriess.id,
        );
      } else {
        return res.status(400).json({
          success: false,
          msg: `${token.token_name} has no onGoing Series..`,
        });
      }

      const series_data = (await ItoSeries.findItoOngoingSeriesByitoId(ito_id))
        .rows[0];
      console.log('ITO-SERIES ...', series_data);

      res
        .status(200)
        .json({ msg: 'Transaction successful', success: true, data: txData });
    } catch (error) {
      res
        .status(500)
        .json({ msg: 'Transaction failed', success: false, error: error });
    }
  } catch (error) {
    res
      .status(500)
      .json({ msg: 'internal server error', success: false, error: error });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  approveOrder,
  getUserOrders,
  getOrderUsingId,
  buytoken,
  manualTransfer,
  directBuyTokens,
};
