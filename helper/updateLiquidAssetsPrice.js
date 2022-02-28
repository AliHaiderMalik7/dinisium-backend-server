const axios = require("axios");

const liquidAssetsPrices = (base_code, conversion_code = "usd", amount) => {
  axios
    .get(
      `https://v6.exchangerate-api.com/v6/ed70ee251a90caad51ed13b8/latest/${base_code}`
    )
    .then((res) => {
      // console.log(res.data.conversion_rates);
      return res.data.conversion_rates[conversion_code.toUpperCase()] * amount;
    })
    .catch((err) => {});
};

// liquidAssetsPrices();
