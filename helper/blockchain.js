const server_url = process.env.BLOCKCHAIN_SERVER_URL;
const http = require("http");
const axios = require("axios");

const createWallet = () => {
  return new Promise(function (resolve, reject) {
    const url = `${server_url}/create-ethaccount`;
    let wallet_detail = "";
    const request = http.request(url, (res) => {
      res.on("data", (data) => {
        wallet_detail += data.toString();
      });
      res.on("end", () => {
        wallet_detail = JSON.parse(wallet_detail);
        resolve(wallet_detail);
      });
    });
    request.on("error", (error) => {
      reject(error);
    });
    request.end();
  });
};

const transferToken = (data) => {
  return new Promise(function (resolve, reject) {
    const url = `${server_url}/transfer`;
    console.log("transfer token url======", url);
    axios
      .post(url, data)
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        console.log(error.response);
        reject(error);
      });
  });
};

const getBlockchainBalance = (data) => {
  return new Promise(function (resolve, reject) {
    const url = `${server_url}/balance`;
    axios
      .post(url, data)
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        // console.log(error.response);
        reject(error);
      });
  });
};

const createItoOnBlockchain = (data) => {
  return new Promise(function (resolve, reject) {
    const url = `${server_url}/create-ito`;
    console.log("Create ITO on Blockchain url======", url, data);
    axios
      .post(url, data)
      .then((response) => {
        resolve(response.data.data);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

const increaseTokenSupply = (data) => {
  return new Promise(function (resolve, reject) {
    const url = `${server_url}/increase-token-supply`;
    console.log("Increase Token Supply on Blockchain url======", url, data);
    axios
      .post(url, data)
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

const decreaseTokenSupply = (data) => {
  return new Promise(function (resolve, reject) {
    const url = `${server_url}/decrease-token-supply`;
    console.log("Decrease Token Supply on Blockchain url======", url, data);
    axios
      .post(url, data)
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

const getAllItos = () => {
  return new Promise(function (resolve, reject) {
    const url = `${server_url}/itos`;
    axios
      .get(url)
      .then((response) => {
        resolve(response.data.data);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

// const createItoOnBlockchain = (data) => {
//   return new Promise(function (resolve, reject) {
//     const url = `${server_url}/create-ito`;
//     axios
//       .post(url, data)
//       .then((response) => {
//         resolve(response.data.data);
//       })
//       .catch((error) => {
//         reject(error);
//       });
//   });
// };

module.exports = {
  createWallet,
  transferToken,
  createItoOnBlockchain,
  getAllItos,
  getBlockchainBalance,
  decreaseTokenSupply,
  increaseTokenSupply,
};
