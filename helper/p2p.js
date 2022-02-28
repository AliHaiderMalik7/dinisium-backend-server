require("dotenv").config({ path: "../.env" });
const IToWallet = require("../model/ITOWallet");
const DB = require("../model/DB");
const client = DB.pool;
const Order = require("../model/exchangeOrders");
const Wallet = require("../model/wallet");
const WalletTransaction = require("../model/walletTransaction");
const { transferToken } = require("./blockchain");
const { sellSpread } = require("./transactionalServices");
const COMMIT = "COMMIT";
const ROLLBACK = "ROLLBACK";

/*
Transfer Fiat from one wallet to other wallet
Takes 3 parameters
1: amount: fiat amount to be transfered
2: to: user id which will receive fiat
3: from: user id which will send fiat from it's wallet
 */
const transferAmount = async (buy_order, sell_order) => {

  console.log("IN TRANSFER AMOUNT......");

  console.log("BUY ORDER", buy_order);
  console.log("SELL ORDER", sell_order);
  
  const buyWallet = (await Wallet.getWalletByUser(buy_order.user_id)).rows[0];
  const sellWallet = (await Wallet.getWalletByUser(sell_order.user_id)).rows[0];
  const itoWallet = (await IToWallet.getWalletByIto()).rows[0];

  if(buy_order.tokens == sell_order.tokens){

    await Wallet.updateWallet(sellWallet.id, {
      fiat_balances: parseFloat(sellWallet.fiat_balances) + parseFloat(sell_order.spreadedamount),
    });
    
    await Wallet.updateWallet(buyWallet.id, {
      locked_amount: parseFloat(buyWallet.locked_amount) - parseFloat(buy_order.spreadedamount),
    });
  
    await IToWallet.updateWallet(itoWallet.id, {
      fiat_balances: parseFloat(itoWallet.fiat_balances) + parseFloat(buy_order.spreadedamount - buy_order.amount),
    });
  }

  if(buy_order.tokens > sell_order.tokens){

    await Wallet.updateWallet(sellWallet.id, {
      fiat_balances: parseFloat(sellWallet.fiat_balances) + parseFloat(sell_order.spreadedamount),
    });

    const amountToDeduct = parseFloat((buy_order.spreadedamount/buy_order.tokens) * sell_order.tokens);
    await Wallet.updateWallet(buyWallet.id, {
      locked_amount: parseFloat(buyWallet.locked_amount) - parseFloat(amountToDeduct),
    });

    await IToWallet.updateWallet(itoWallet.id, {
      fiat_balances: parseFloat(itoWallet.fiat_balances) + parseFloat(amountToDeduct - sell_order.amount),
    });

    await Order.updateOrder(
      { spreadedamount: parseFloat(buy_order.spreadedamount) - parseFloat(amountToDeduct)},
      buy_order.id
    );
  }

  if(buy_order.tokens < sell_order.tokens){

    const amountToDeduct = parseFloat((sell_order.spreadedamount/sell_order.tokens) * buy_order.tokens);
    await Wallet.updateWallet(sellWallet.id, {
      locked_amount: parseFloat(sellWallet.locked_amount) - parseFloat(amountToDeduct),
    });

    await Wallet.updateWallet(buyWallet.id, {
      locked_amount: parseFloat(buyWallet.locked_amount) - parseFloat(buy_order.spreadedamount),
    });

    await IToWallet.updateWallet(itoWallet.id, {
      fiat_balances: parseFloat(itoWallet.fiat_balances) + parseFloat(buy_order.spreadedamount - buy_order.amount),
    });

    await Order.updateOrder(
      { spreadedamount: parseFloat(sell_order.spreadedamount) - parseFloat(amountToDeduct)},
      sell_order.id
    );
  }
};         

/* 
Transfer Tokens from one blockchain wallet to other blockchain wallet
Takes 4 parameters
1: tokens: amount of tokens to be transfered
2: to: to user wallet address which will receive fiat
3: from: from user wallet address which will send fiat from it's wallet
4: ito_id: blockchain ito id
 */
const transferTokens = async (amountt, tokens, to, from, ito_id) => {
  console.log("IN TRANSFER TOKEN");
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
P2P Trade
Takes the current order to be matched and processed
1: Gets all the orders from DB which are matched on the basis of current orders parameters
2: Picks 1st order from that array if array has the matched orders and then processes it
 */

const p2pTrade = async (currentOrder) => {
  console.log(
    "this is current order________________________________",
    currentOrder
  );
  currentOrder.userId = currentOrder.user_id;
  const token_price = currentOrder.token_price;

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
          currentOrder.sub_order,
          token_price
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
      console.log("Orders to process................", ordersToProcess);
      //This loop processes the current order with the orders picked up on the basis of current order parameters;
      for (let i = 0; i < ordersToProcess.length; i++) {
        //If the current order tokens are equal to the tokens of order picked up to be processed;
        if (currentTokens == ordersToProcess[i].tokens) {
          transferAmount(
            ordersToProcess[i],
            currentOrder,
          );

          const transHash = await transferTokens(
            currentAmount,
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
            ordersToProcess[i],
            currentOrder,
          );

          const transHash = await transferTokens(
            ordersToProcess[i].amount,
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
            ordersToProcess[i],
            currentOrder,
          );

          const transHash = await transferTokens(
            currentAmount,
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
          currentOrder.sub_order,
          token_price
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
      console.log("Orders to process.........", ordersToProcess);
      //This loop processes the current order with the orders picked up on the basis of current order parameters;
      for (let i = 0; i < ordersToProcess.length; i++) {
        //If the current order tokens are equal to the tokens of order picked up to be processed;
        if (currentTokens == ordersToProcess[i].tokens) {
          transferAmount(
            currentOrder,
            ordersToProcess[i],
          );
          const transHash = await transferTokens(
            ordersToProcess[i].amount,
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
            currentOrder,
            ordersToProcess[i],
          );
          const transHash = await transferTokens(
            ordersToProcess[i].amount,
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
            currentOrder,
            ordersToProcess[i],
          );
          const transHash = await transferTokens(
            currentAmount,
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
