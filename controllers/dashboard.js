const Order = require('../model/exchangeOrders');
const Token = require('../model/itoToken');
const TokenPriceHistory = require('../model/tokenPriceHistory');
const Election = require('../model/elections');
const Participant = require('../model/participants');
const Users = require('../model/Users');
const FiatTransaction = require('../model/fiatTransaction');
const ItoSeries = require('../model/itoSeries');
const DB = require('../model/DB');
const ITO = require('../model/ITO');
const walletTransactions = require('../model/walletTransaction');

const getItoOrdersCount = async (req, res, next) => {
  try {
    const token = (await Token.getTokenByIto(req.params.id)).rows[0];

    const result = (await Order.findItoOrdersCount(token.id)).rows[0];

    res.status(200).json({ success: true, count: result.count });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const getAllOrdersCount = async (req, res, next) => {
  try {
    const result = (await Order.findAllOrdersCount()).rows[0];
    res.status(200).json({ success: true, count: result.count });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const getItoElectionCount = async (req, res, next) => {
  try {
    const result = (await Election.findItoElectionsCount(req.params.id || 0))
      .rows[0];

    res.status(200).json({ success: true, count: result.count });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const getAllElectionCount = async (req, res, next) => {
  try {
    const result = (await Election.findElectionsCount()).rows[0];
    res.status(200).json({ success: true, count: result.count });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const getItoUsersCount = async (req, res, next) => {
  try {
    const result = (await Participant.findParticipantCount(req.params.id || 0))
      .rows[0];

    res.status(200).json({ success: true, count: result.count });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const getAllUsersCount = async (req, res, next) => {
  try {
    const result = (await Users.findUsersCount()).rows[0];

    res.status(200).json({ success: true, count: result.count });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const getItoUsersRegisterPerMonth = async (req, res, next) => {
  try {
    const result = (
      await Participant.findParticipantRegisterPerMonth(req.params.id || 0)
    ).rows;

    console.log(result);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const getUsersRegistered = async (req, res, next) => {
  try {
    let filterBy = '';

    if (req.query.filterWith === 'perDay') {
      filterBy = 'day';
    } else if (req.query.filterWith === 'perWeek') {
      filterBy = 'week';
    } else if (req.query.filterWith === 'perMonth') {
      filterBy = 'month';
    } else if (req.query.filterWith === 'perYear') {
      filterBy = 'year';
    } else {
      filterBy = 'month';
    }

    const result = await Users.findUsersRegistered(DB.pool, filterBy);
    console.log('result data ....', result.rows);

    if (result.rowCount > 0) {
      res.status(200).json({ success: true, data: result.rows });
    } else {
      res
        .status(200)
        .json({ success: false, msg: 'No record found.', data: [] });
    }
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

//getSoldTokens
const getSoldTokens = async (req, res, next) => {
  try {
    let filterBy = '';
    let interval = '';
    if (req.query.filterWith === 'Day') {
      filterBy = 'hour';
      interval = '24 hour';
    }
    if (req.query.filterWith === 'Week') {
      filterBy = 'Day';
      interval = '7 Day';
    }
    if (req.query.filterWith === 'Month') {
      filterBy = 'Day';
      interval = '30 Day';
    }

    if (req.query.filterWith === 'Year') {
      filterBy = 'Month';
      interval = '12 Month';
    }

    const result = await Users.getSoldTokens(DB.pool, filterBy, interval);
    console.log('result data ....', result.rows);

    if (result.rowCount > 0) {
      result.rows.sort((a, b) => {
        return new Date(b.registered_at) - new Date(a.registered_at);
      });
      // const expected_output = [...result.rows].reverse();
      res.status(200).json({ success: true, data: result.rows });
    } else {
      res
        .status(200)
        .json({ success: false, msg: 'No record found.', data: [] });
    }
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

//getRegisteredUsers
const getRegisteredUsers = async (req, res, next) => {
  try {
    let filterBy = '';
    let interval = '';
    if (req.query.filterWith === 'Day') {
      filterBy = 'hour';
      interval = '24 hour';
    }
    if (req.query.filterWith === 'Week') {
      filterBy = 'Day';
      interval = '7 Day';
    }
    if (req.query.filterWith === 'Month') {
      filterBy = 'Day';
      interval = '30 Day';
    }

    if (req.query.filterWith === 'Year') {
      filterBy = 'Month';
      interval = '12 Month';
    }

    const result = await Users.getRegisteredUsers(DB.pool, filterBy, interval);
    console.log('result data ....', result.rows);

    if (result.rowCount > 0) {
      res.status(200).json({ success: true, data: result.rows });
    } else {
      res
        .status(200)
        .json({ success: false, msg: 'No record found.', data: [] });
    }
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const getItoInvestmentPerMonth = async (req, res, next) => {
  try {
    const result = (await FiatTransaction.findItoInvestPerMonth(req.params.id))
      .rows;
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const getInvestmentPerMonth = async (req, res, next) => {
  try {
    const result = (await FiatTransaction.findInvestPerMonth(req.params.id))
      .rows;
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const getItoExchangePerDay = async (req, res, next) => {
  try {
    const token = (await Token.getTokenByIto(req.params.id)).rows[0];

    if (!token) {
      return res.status(200).json({ success: true, data: [] });
    }

    const result = (await Order.findItoExchangePerDay(token.id)).rows;

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const getExchangeBuySellPerDay = async (req, res) => {
  try {
    let filterBy = '';
    let interval = '';
    if (req.query.filterWith === 'Day') {
      filterBy = 'hour';
      interval = '24 hour';
    }
    if (req.query.filterWith === 'Week') {
      filterBy = 'Day';
      interval = '7 Day';
    }
    if (req.query.filterWith === 'Month') {
      filterBy = 'Day';
      interval = '30 Day';
    }

    if (req.query.filterWith === 'Year') {
      filterBy = 'Month';
      interval = '12 Month';
    }
    const result = (await Order.getAllExchangePerDay(filterBy, interval)).rows;
    if (result.length === 0) {
      res
        .status(200)
        .json({ success: false, msg: 'No record found', data: [] });
    } else {
      res.status(200).json({ success: true, data: result });
    }
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const getAllExchangePerDay = async (req, res, next) => {
  try {
    let type = req.params.type;

    if (req.query.filterWith === 'Day') {
      filterBy = 'hour';
      interval = '24 hour';
    }
    if (req.query.filterWith === 'Week') {
      filterBy = 'Day';
      interval = '7 Day';
    }
    if (req.query.filterWith === 'Month') {
      filterBy = 'Day';
      interval = '30 Day';
    }

    if (req.query.filterWith === 'Year') {
      filterBy = 'Month';
      interval = '12 Month';
    }

    const result = (await Order.findAllExchangePerDay(type, filterBy, interval))
      .rows;

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const getItoSeriesCount = async (req, res) => {
  try {
    const count = (await ItoSeries.findItoSeriesCount(req.query.ito || 0))
      .rows[0];
    return res.status(200).json({ success: false, data: count });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const getAllTokensCount = async (req, res, next) => {
  try {
    const tokenCount = (await Token.findTokensCount()).rows[0];
    res.status(200).json({ success: true, data: tokenCount });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const getAllTokensCurrentPriceAndMarketcap = async (req, res) => {
  try {
    // const response = await Token.getAllTokensCurrentPriceAndMarketcap(DB.pool);
    const response = await Token.getAllAllotedTokes(DB.pool, req.user.id);
    console.log(`here : `, response.rows.length);

    if (response.rowCount > 0) {
      return res.status(200).send({
        success: true,
        data: response.rows,
      });
    } else {
      return res.status(200).send({
        success: false,
        msg: 'No record found.',
        data: [],
      });
    }
  } catch (error) {
    return res.status(500).send({
      msg: error.message,
    });
  }
};

const getTokenPriceHistory = async (req, res) => {
  try {
    const id = req.params.id;
    let filterBy = '';
    let interval = '';
    let output = [];
    if (req.query.filterWith === 'perDay') {
      filterBy = 'hour';
      interval = '24 hour';
    }
    if (req.query.filterWith === 'perWeek') {
      filterBy = 'Day';
      interval = '7 Day';
    }
    if (req.query.filterWith === 'perMonth') {
      filterBy = 'Day';
      interval = '30 Day';
    }

    if (req.query.filterWith === 'perYear') {
      filterBy = 'Month';
      interval = '12 Month';
    }
    // req.query.filterWith = 'lastDay';
    // console.log(req.query.filterWith);
    // if (req.query.filterWith == "lastDay") {
    //   filter += `AND t1.created_at > ( now() - '1 day'::interval) ORDER BY t1.created_at`;
    //   // filter += `AND t1.created_at >= (DATE_SUB( 'CURDATE()', INTERVAL 1 DAY )) ORDER BY t1.created_at desc`;
    // } else if (req.query.filterWith === "lastWeek") {
    //   filter += `AND t1.created_at > ( now() - '1 week'::interval) ORDER BY t1.created_at`;
    // } else if (req.query.filterWith === "lastMonth") {
    //   filter += `AND t1.created_at > ( now() - '1 month'::interval) ORDER BY t1.created_at`;
    // } else if (req.query.filterWith === "lastYear") {
    //   filter += `AND t1.created_at > ( now() - '1 year'::interval) ORDER BY t1.created_at`;
    // } else {
    //   filter += `ORDER BY t1.created_at LIMIT 15`;
    // }

    // if (req.query.filterWith === 'perDay') {
    //   filterBy = 'day';
    // } else if (req.query.filterWith === 'perWeek') {
    //   filterBy = 'week';
    // } else if (req.query.filterWith === 'perMonth') {
    //   filterBy = 'month';
    // } else if (req.query.filterWith === 'perYear') {
    //   filterBy = 'year';
    // } else {
    //   filterBy = 'month';
    // }

    const ito = await ITO.getITOById(id);
    if (ito.rowCount > 0) {
      console.log('HERE');
      const response = await TokenPriceHistory.getTokenPriceHistory(
        DB.pool,
        id,
        filterBy,
        interval,
      );

      if (response.rowCount > 0) {
        getResponse = response.rows;
        console.log('RESPONSE ROWS : ', response.rows);
        let finalObj = [];
        const groups = getResponse.reduce((groups, element) => {
          // let date = JSON.stringify(element.date).split('T')[0];
          let date = element.date;
          // date = date.substring(1, date.length);
          if (!groups[date]) {
            groups[date] = [];
          }
          groups[date].push(element.price);
          return groups;
        }, {});
        for (const [key, value] of Object.entries(groups)) {
          console.log(key, value);
          finalObj.push({
            key,
            O: value[0],
            C: value[value.length - 1],
            H: Math.max(...value),
            L: Math.min(...value),
          });
        }
        console.log('GET finalObj HERE : ', finalObj);

        return res.status(200).send({
          success: true,
          data: finalObj,
          // data: data,
        });
      } else {
        return res.status(200).send({
          success: true,
          msg: "ITO doesn't exists.",
          data: [],
        });
      }
    }
  } catch (error) {
    return res.status(500).send({
      msg: error.message,
    });
  }
};

const getTokenInfo = async (req, res) => {
  try {
    const response = await Token.getTokenInfo(DB.pool);
    console.log(`here : `, response.rows);

    if (response.rowCount > 0) {
      let objId = null;
      let newArray = [];
      const array = response.rows;
      let totalMarketCap = 0;
      let totalMintedSupplyOfTokens = 0;
      let totalTradingSupplyOfTokens = 0;

      //code to get rid of duplicate entries of token;
      array.forEach(element => {
        objId = element.ito_id;
        if (!newArray[objId]) {
          newArray[objId] = element;
        }
      });

      //code to get rid of null objects entered;
      //if tradeable === true show current price
      //else show last price of token;
      newArray = newArray.filter(element => {
        if (element !== undefined && element.is_tradeable) {
          element.is_tradeable = 'YES';
          totalMarketCap += parseFloat(element.marketcap);
          totalMintedSupplyOfTokens += parseInt(element.minted_supply);
          totalTradingSupplyOfTokens += parseInt(
            element.total_supply_available_for_trading,
          );
          element.marketcap = parseFloat(element.marketcap).toFixed(4);
          element.price = parseFloat(element.price).toFixed(2);
          delete element.token_price;
        } else if (element !== undefined && !element.is_tradeable) {
          element.is_tradeable = 'NO';
          totalMarketCap += parseFloat(element.marketcap);
          totalMintedSupplyOfTokens += parseInt(element.minted_supply);
          totalTradingSupplyOfTokens += parseInt(
            element.total_supply_available_for_trading,
          );
          element.marketcap = parseFloat(element.marketcap).toFixed(4);
          element.price = element.token_price;
          element.price = parseFloat(element.price).toFixed(2);
          delete element.token_price;
        }
        return element;
      });

      return res.status(200).send({
        success: true,
        data: newArray,
        totalMarketCap: totalMarketCap.toFixed(4),
        totalMintedSupplyOfTokens,
        totalTradingSupplyOfTokens,
      });
    } else {
      return res.status(200).send({
        success: false,
        msg: 'No record found.',
        data: [],
      });
    }
  } catch (error) {
    return res.status(500).send({
      msg: error.message,
    });
  }
};

const getTokenMarketcapHistory = async (req, res) => {
  try {
    let filterBy = '',
      tokenId = req.params.id;

    if (req.query.filterWith === 'perDay') {
      filterBy = 'day';
    } else if (req.query.filterWith === 'perWeek') {
      filterBy = 'week';
    } else if (req.query.filterWith === 'perMonth') {
      filterBy = 'month';
    } else if (req.query.filterWith === 'perYear') {
      filterBy = 'year';
    } else {
      filterBy = 'month';
    }
    const ito = await ITO.getITOById(tokenId);
    if (ito.rowCount > 0) {
      const response = await Token.getTokenMarketcapHistory(
        DB.pool,
        tokenId,
        filterBy,
      );
      console.log('my response : ', response);
      if (response.rowCount > 0) {
        //
        getResponse = response.rows;
        console.log('RESPONSE ROWS : ', response.rows);
        let finalObj = [];
        const groups = getResponse.reduce((groups, element) => {
          let date = JSON.stringify(element.date).split('T')[0];
          date = date.substring(1, date.length);
          if (!groups[date]) {
            groups[date] = [];
          }
          groups[date].push(element.marketcap);
          return groups;
        }, {});

        for (const [key, value] of Object.entries(groups)) {
          console.log(key, value);
          finalObj.push({
            key,
            value: value[value.length - 1],
          });
        }
        console.log('CHECKING : ', finalObj);
        //
        res.status(200).send({
          success: true,
          data: finalObj,
        });
      } else {
        res.status(200).send({
          success: false,
          msg: 'Marketcap history is not available!',
          data: [],
        });
      }
    } else {
      res.status(200).send({
        success: false,
        msg: "ITO doesn't exists.",
        data: [],
      });
    }
  } catch (error) {
    return res.status(500).send({
      msg: error.message,
    });
  }
};

const getTokenSoldHistory = async (req, res) => {
  try {
    let filterBy = '',
      tokenId = req.params.id;

    if (req.query.filterWith === 'perDay') {
      filterBy = 'day';
    } else if (req.query.filterWith === 'perWeek') {
      filterBy = 'week';
    } else if (req.query.filterWith === 'perMonth') {
      filterBy = 'month';
    } else if (req.query.filterWith === 'perYear') {
      filterBy = 'year';
    } else {
      filterBy = 'month';
    }
    const ito = await ITO.getITOById(tokenId);
    if (ito.rowCount > 0) {
      const response = await walletTransactions.getTokenSoldHistory(
        DB.pool,
        tokenId,
        filterBy,
      );
      if (response.rowCount > 0) {
        //
        // getResponse = response.rows;
        // console.log("RESPONSE ROWS : ", response.rows);
        // let finalObj = [];
        // const groups = getResponse.reduce((groups, element) => {
        //   let date = JSON.stringify(element.date).split("T")[0];
        //   date = date.substring(1, date.length);
        //   if (!groups[date]) {
        //     groups[date] = [];
        //   }
        //   groups[date].push(element.marketcap);
        //   return groups;
        // }, {});

        // for (const [key, value] of Object.entries(groups)) {
        //   console.log(key, value);
        //   finalObj.push({
        //     key,
        //     value: value[value.length - 1],
        //   });
        // }
        console.log('CHECKING : ', response.rows);
        //
        res.status(200).send({
          success: true,
          data: response.rows,
        });
      } else {
        res.status(200).send({
          success: false,
          msg: 'Something wrong with the graph!',
        });
      }
    } else {
      res.status(200).send({
        success: false,
        msg: "ITO doesn't exists.",
      });
    }
  } catch (error) {
    return res.status(500).send({
      msg: error.message,
    });
  }
};

module.exports = {
  getItoOrdersCount,
  getAllOrdersCount,
  getItoElectionCount,
  getAllElectionCount,
  getItoUsersCount,
  getAllUsersCount,
  getItoUsersRegisterPerMonth,
  getUsersRegistered,
  getRegisteredUsers,
  getItoInvestmentPerMonth,
  getInvestmentPerMonth,
  getItoExchangePerDay,
  getAllExchangePerDay,
  getExchangeBuySellPerDay,
  getItoSeriesCount,
  getAllTokensCount,
  getAllTokensCurrentPriceAndMarketcap,
  getTokenPriceHistory,
  getTokenInfo,
  getTokenMarketcapHistory,
  getTokenSoldHistory,
  getSoldTokens,
};
