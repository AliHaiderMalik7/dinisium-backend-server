require("dotenv").config({ path: "../.env" });
const IToWallet = require("../model/ITOWallet");
const DB = require("../model/DB");
const client = DB.pool;
const Order = require("../model/exchangeOrders");
const Wallet = require("../model/wallet");
const { transferToken } = require("./blockchain");
const COMMIT = "COMMIT";
const ROLLBACK = "ROLLBACK";

/*
Transfer Fiat from one wallet to other wallet
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
Transfer Tokens from one blockchain wallet to other blockchain wallet
Takes 4 parameters
1: tokens: amount of tokens to be transfered
2: to: to user wallet address which will receive fiat
3: from: from user wallet address which will send fiat from it's wallet
4: ito_id: blockchain ito id
 */
const transferTokens = async (tokens, to, from, ito_id) => {
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
  await Wallet.updateWallet(fromWallet.id, {
    locked_tokens: parseFloat(fromWallet.locked_tokens) - parseFloat(tokens),
  });

  await Wallet.updateWallet(toWallet.id, {
    tokens: parseFloat(toWallet.tokens) + parseFloat(tokens),
  });
  return n.data.hash;
};

/* 
P2P Trade
Takes the current order to be matched and processed
1: Gets all the orders from DB which are matched on the basis of current orders parameters
2: Picks 1st order from that array if array has the matched orders and then processes it
 */

const p2pTrade = async (currentOrder) => {
  currentOrder.userId = currentOrder.user_id;

  let currentAmount = currentOrder.amount;
  let currentTokens = currentOrder.tokens;

  const ITOfromBlockchain =
    //Gets the particular ITO wallet from the current order ito id
    (await IToWallet.getTokenIdByItoId(currentOrder.ito_token_id)).rows[0];

  //This array contains all the orders to be process
  let ordersToProcess = [];

  try {
    //checks the type of order buy/sell
    if (currentOrder.order_type === "sell_order") {
      const p2pOrders = (
        await Wallet.p2pWallet(
          currentOrder.ito_token_id,
          currentOrder.partialFill,
          "buy_order",
          currentOrder.userId,
          currentOrder.sub_order
        )
      ).rows;

      //checks if the order is limit priced order and partial fill is false
      if (
        currentOrder.sub_order === "limit_order" &&
        currentOrder.partialFill === false
      ) {
        for (let i = 0; i < p2pOrders.length; i++) {
          if (
            currentOrder.price_limit === p2pOrders[i].price_limit &&
            currentOrder.tokens === p2pOrders[i].tokens
          ) {
            ordersToProcess = [...ordersToProcess, p2pOrders[i]];
          }
        }
      }

      //checks if the order is limit priced order and partial fill is true
      else if (
        currentOrder.sub_order === "limit_order" &&
        currentOrder.partialFill === true
      ) {
        for (let i = 0; i < p2pOrders.length; i++) {
          if (currentOrder.price_limit === p2pOrders[i].price_limit) {
            ordersToProcess = [...ordersToProcess, p2pOrders[i]];
          }
        }
      }

      //checks if the order is market priced order and partial fill is true
      else if (
        currentOrder.sub_order === "market_order" &&
        currentOrder.partialFill === false
      ) {
        for (let i = 0; i < p2pOrders.length; i++) {
          if (currentOrder.tokens === p2pOrders[i].tokens) {
            ordersToProcess = [...ordersToProcess, p2pOrders[i]];
          }
        }
      }

      //checks if the order is market priced order and partial fill is false
      else {
        ordersToProcess = [...p2pOrders];
      }

      //This loop processes the current order with the orders picked up on the basis of current order parameters;
      for (let i = 0; i < ordersToProcess.length; i++) {
        //If the current order tokens are equal to the tokens of order picked up to be processed;
        if (currentTokens == ordersToProcess[i].tokens) {
          transferAmount(
            currentAmount,
            currentOrder.userId,
            ordersToProcess[i].user_id
          );

          const transHash = await transferTokens(
            currentTokens,
            ordersToProcess[i].user_id,
            currentOrder.userId,
            ITOfromBlockchain.ito_id
          );

          await Order.updateOrder(
            { transaction_hash: transHash, status: "approved" },
            ordersToProcess[i].id
          );

          await Order.updateOrder(
            { status: "approved", transaction_hash: transHash },
            currentOrder.id
          );
          break;
        }

        //If the current order tokens are more than the tokens of order picked up to be processed;
        else if (currentTokens > ordersToProcess[i].tokens) {
          transferAmount(
            ordersToProcess[i].amount,
            currentOrder.userId,
            ordersToProcess[i].user_id
          );

          const transHash = await transferTokens(
            ordersToProcess[i].tokens,
            ordersToProcess[i].user_id,
            currentOrder.userId,
            ITOfromBlockchain.ito_id
          );

          await Order.updateOrder(
            { transaction_hash: transHash, status: "approved" },
            ordersToProcess[i].id
          );

          await Order.updateOrder(
            {
              amount:
                parseFloat(currentAmount) -
                parseFloat(ordersToProcess[i].amount),
              tokens:
                parseFloat(currentTokens) -
                parseFloat(ordersToProcess[i].tokens),
            },
            currentOrder.id
          );
          currentTokens =
            parseFloat(currentTokens) - parseFloat(ordersToProcess[i].tokens);
          currentAmount =
            parseFloat(currentAmount) - parseFloat(ordersToProcess[i].amount);
        }

        //If the current order tokens are less than the tokens of order picked up to be processed;
        else {
          transferAmount(
            currentAmount,
            currentOrder.userId,
            ordersToProcess[i].user_id
          );

          const transHash = await transferTokens(
            currentTokens,
            ordersToProcess[i].user_id,
            currentOrder.userId,
            ITOfromBlockchain.ito_id
          );
          await Order.updateOrder(
            {
              transaction_hash: transHash,
            },
            currentOrder.id
          );

          await Order.updateOrder({ status: "approved" }, currentOrder.id);

          await Order.updateOrder(
            {
              amount:
                parseFloat(ordersToProcess[i].amount) -
                parseFloat(currentAmount),
              tokens:
                parseFloat(ordersToProcess[i].tokens) -
                parseFloat(currentTokens),
            },
            ordersToProcess[i].id
          );
          break;
        }
      }
    }

    //checks the type of order buy/sell
    if (currentOrder.order_type === "buy_order") {
      const p2pOrders = (
        await Wallet.p2pWallet(
          currentOrder.ito_token_id,
          currentOrder.partialFill,
          "sell_order",
          currentOrder.userId,
          currentOrder.sub_order
        )
      ).rows;

      //checks if the order is limit priced order and partial fill is false
      if (
        currentOrder.sub_order === "limit_order" &&
        currentOrder.partialFill === false
      ) {
        for (let i = 0; i < p2pOrders.length; i++) {
          if (
            currentOrder.price_limit === p2pOrders[i].price_limit &&
            currentOrder.tokens === p2pOrders[i].tokens
          ) {
            ordersToProcess = [...ordersToProcess, p2pOrders[i]];
          }
        }
      }

      //checks if the order is limit priced order and partial fill is true
      else if (
        currentOrder.sub_order === "limit_order" &&
        currentOrder.partialFill === true
      ) {
        for (let i = 0; i < p2pOrders.length; i++) {
          if (currentOrder.price_limit === p2pOrders[i].price_limit) {
            ordersToProcess = [...ordersToProcess, p2pOrders[i]];
          }
        }
      }

      //checks if the order is market priced order and partial fill is false
      else if (
        currentOrder.sub_order === "market_order" &&
        currentOrder.partialFill === false
      ) {
        for (let i = 0; i < p2pOrders.length; i++) {
          if (currentOrder.tokens === p2pOrders[i].tokens) {
            ordersToProcess = [...ordersToProcess, p2pOrders[i]];
          }
        }
      }

      //checks if the order is market priced order and partial fill is false
      else {
        ordersToProcess = [...p2pOrders];
      }

      //This loop processes the current order with the orders picked up on the basis of current order parameters;
      for (let i = 0; i < ordersToProcess.length; i++) {
        //If the current order tokens are equal to the tokens of order picked up to be processed;
        if (currentTokens == ordersToProcess[i].tokens) {
          transferAmount(
            ordersToProcess[i].amount,
            ordersToProcess[i].user_id,
            currentOrder.userId
          );
          const transHash = await transferTokens(
            ordersToProcess[i].tokens,
            currentOrder.userId,
            ordersToProcess[i].user_id,
            ITOfromBlockchain.ito_id
          );

          await Order.updateOrder(
            { transaction_hash: transHash, status: "approved" },
            ordersToProcess[i].id
          );

          await Order.updateOrder(
            { status: "approved", transaction_hash: transHash },
            currentOrder.id
          );
          break;
        }

        //If the current order tokens are more than the tokens of order picked up to be processed;
        else if (currentTokens > ordersToProcess[i].tokens) {
          transferAmount(
            ordersToProcess[i].amount,
            ordersToProcess[i].user_id,
            currentOrder.userId
          );
          const transHash = await transferTokens(
            ordersToProcess[i].tokens,
            currentOrder.userId,
            ordersToProcess[i].user_id,
            ITOfromBlockchain.ito_id
          );

          await Order.updateOrder(
            { transaction_hash: transHash, status: "approved" },
            ordersToProcess[i].id
          );

          await Order.updateOrder(
            {
              amount:
                parseFloat(currentAmount) -
                parseFloat(ordersToProcess[i].amount),
              tokens:
                parseFloat(currentTokens) -
                parseFloat(ordersToProcess[i].tokens),
            },
            currentOrder.id
          );
          currentTokens =
            parseFloat(currentTokens) - parseFloat(ordersToProcess[i].tokens);
          currentAmount =
            parseFloat(currentTokens) - parseFloat(ordersToProcess[i].tokens);
        }

        //If the current order tokens are less than the tokens of order picked up to be processed;
        else {
          transferAmount(
            currentAmount,
            ordersToProcess[i].user_id,
            currentOrder.userId
          );
          const transHash = await transferTokens(
            currentTokens,
            currentOrder.userId,
            ordersToProcess[i].user_id,
            ITOfromBlockchain.ito_id
          );

          await Order.updateOrder(
            { status: "approved", transaction_hash: transHash },
            currentOrder.id
          );

          await Order.updateOrder(
            {
              amount:
                parseFloat(ordersToProcess[i].amount) -
                parseFloat(currentAmount),
              tokens:
                parseFloat(ordersToProcess[i].tokens) -
                parseFloat(currentTokens),
            },
            ordersToProcess[i].id
          );
          break;
        }
      }
    }

    await client.query(COMMIT);
  } catch (error) {
    await client.query(ROLLBACK);
    throw new Error();
  }
};

module.exports = {
  p2pTrade,
};
