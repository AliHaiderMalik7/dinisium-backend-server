const axios = require("axios");

//exchangerate-api (https://www.exchangerate-api.com/)
const currencyExchange = (base_code, conversion_code = "usd", amount) => {
  return new Promise((resolve, reject) => {
    axios
      .get(
        `https://v6.exchangerate-api.com/v6/ed70ee251a90caad51ed13b8/latest/${base_code}`
      )
      .then((res) => {
        // console.log(res.data.conversion_rates);
        resolve(
          res.data.conversion_rates[conversion_code.toUpperCase()] * amount
        );
      })
      .catch((err) => {
        console.log("error", err)
        reject(err);
      });
  });
};

const getCurrencyMarketprice = (base_code, conversion_code = "usd") => {
  return new Promise((resolve, reject) => {
    axios
      .get(
        `https://v6.exchangerate-api.com/v6/ed70ee251a90caad51ed13b8/latest/${base_code}`
      )
      .then((res) => {
        resolve(res.data.conversion_rates[conversion_code.toUpperCase()]);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
module.exports = { currencyExchange, getCurrencyMarketprice };
