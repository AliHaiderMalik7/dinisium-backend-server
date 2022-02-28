const Wallet = require('../model/wallet');

const createWallet = async (req, res, next) => {
  try {
    const wallets = await Wallet.createWallet(req.body);
    res.status(200).json({ success: true, msg: 'Data Created' });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const getWalletList = async (req, res, next) => {
  try {
    const wallets = await Wallet.getAllWallets(req.query);
    res.status(200).json({ success: true, data: wallets.rows || [] });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

// const update

const getWalletDetail = async (req, res, next) => {
  try {
    const wallet = await Wallet.getWalletById(req.params.id);
    res.status(200).json({ success: true, data: wallet.rows[0] || {} });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

const getCurrentUserWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.getWalletByUser(req.user.id);
    res.status(200).json({ success: true, data: wallet.rows[0] || {} });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

// getList
const getList = async (req, res, next) => {
  try {
    const response = await Wallet.getAccountLists(req.user.id);
    var result = 0;

    if (response) {
      //Filter data so it will return Tokens that user have
      const newArray = response.filter(result => {
        if (result.Amount_of_tokens > 0) {
          console.log(result.Amount_of_tokens);
          return result;
        }
      });

      console.log('Filtered data ...', newArray);

      //Get Sum of all user Tokens
      response.map(item => {
        if (item.holdings) {
          result = result + parseInt(item.holdings);
        }
      });

      console.log(result);

      res
        .status(200)
        .json({ success: true, data: newArray || [], sum: result });
    }
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

const getListByID = async (req, res, next) => {
  try {
    const wallets = await Wallet.getAccountLists(req.params.id);
    var result = 0;

    let data = wallets.map(item => {
      if (item.balance) {
        result = result + parseInt(item.balance);
      }
    });

    console.log(result);
    //
    res.status(200).json({ success: true, data: wallets || [], sum: result });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

module.exports = {
  getWalletDetail,
  getCurrentUserWallet,
  getList,
  getListByID,
};

// const AllUsersAdminWallet = async (req, res) => {
//   try {
//     console.log(`DEBUG: Token Reached Request`);
//     userID = req.params.id;

//     const response = await Wallet.AllUsersAdminWallet(DB.pool, userID);
//     // console.log(response);

//     if (response.rowCount !== 0) {
//       return res.send({
//         status: 200,
//         message: "Response data of all investors",
//         response: response.rows,
//       });
//     } else {
//       res.status(400).send({
//         status: 400,
//         message: "No record found",
//       });
//     }
//   } catch (error) {
//     res.status(500).send({
//       error: error,
//       msg: "Internal server error",
//       success: false,
//     });
//   }

// };

// const getAdminWallet = async (req, res) => {
//   try {
//     console.log(`DEBUG: Token Reached Request`);
//     userID = req.params.id;

//     const response = await Wallet.getAdminWallet(DB.pool, userID);
//     // console.log(response);

//     if (response.rowCount !== 0) {
//       return res.send({
//         status: 200,
//         message: "Response data of all investors",
//         response: response.rows,
//       });
//     } else {
//       res.status(400).send({
//         status: 400,
//         message: "No record found",
//       });
//     }
//   } catch (error) {
//     res.status(500).send({
//       error: error,
//       msg: "Internal server error",
//       success: false,
//     });
//   }
// };
// const getSingleUserAdmin = async (req, res) => {
//   try {
//     console.log(`DEBUG: single user Reached Request`);
//     userID = req.params.id;

//     const response = await Wallet.singleUserAdminSide(DB.pool, userID);
//     // console.log(response);

//     if (response.rowCount !== 0) {
//       return res.send({
//         status: 200,
//         message: "Response data of all investors",
//         response: response.rows,
//       });
//     } else {
//       res.status(400).send({
//         status: 400,
//         message: "No record found",
//       });
//     }
//   } catch (error) {
//     res.status(500).send({
//       error: error,
//       msg: "Internal server error",
//       success: false,
//     });
//   }
// };
// const getUserTokenAdminSide = async (req, res) => {
//   try {
//     console.log(`DEBUG: admin side Token Reached Request`);
//     userID = req.params.id;

//     const response = await Wallet.getUserTokenAdminSide(DB.pool, userID);
//     // console.log(response);

//     if (response.rowCount !== 0) {
//       return res.send({
//         status: 200,
//         message: "Response data of all investors",
//         response: response.rows,
//       });
//     } else {
//       res.status(400).send({
//         status: 400,
//         message: "No record found",
//       });
//     }
//   } catch (error) {
//     res.status(500).send({
//       error: error,
//       msg: "Internal server error",
//       success: false,
//     });
//   }
// };
// const getAdminTokens = async (req, res) => {
//   try {
//     console.log(`DEBUG: admin side Token Reached Request`);
//     userID = req.params.id;

//     const response = await Wallet.getAdminTokens(DB.pool, userID);
//     // console.log(response);

//     if (response.rowCount !== 0) {
//       return res.send({
//         status: 200,
//         message: "Response data of all investors",
//         response: response.rows,
//       });
//     } else {
//       res.status(400).send({
//         status: 400,
//         message: "No record found",
//       });
//     }
//   } catch (error) {
//     res.status(500).send({
//       error: error,
//       msg: "Internal server error",
//       success: false,
//     });
//   }
// };

// const bank = async (req, res) => {
//   try {
//     console.log(`DEBUG: data insertion Reached Request`);
//     // console.log("req body=======", req.body);
//     // res.send("debugging====");
//     ito_admin_id = req.params.id;
//     country = req.body.country;
//     swift = req.body.swift;
//     branch_name = req.body.branch_name;
//     account_number = req.body.account_number;
//     from_account_number = req.body.from_account_number;
//     transfer_country = req.body.transfer_country;
//     transfer_amount = req.body.transfer_amount;
//     transfer_fee = req.body.transfer_fee;
//     total_amount = req.body.total_amount;
//     proof_image = req.body.proof_image;
//     const response = await Wallet.bank(
//       ito_admin_id,
//       country,
//       swift,
//       branch_name,
//       account_number,
//       from_account_number,
//       transfer_country,
//       transfer_amount,
//       transfer_fee,
//       total_amount,
//       proof_image
//     );
//     console.log("records added");

//     if (response.rowCount !== 0) {
//       return res.send({
//         status: 200,
//         message: "records are added",
//         response: response.rows,
//       });
//     } else {
//       res.status(400).send({
//         status: 400,
//         message: "No record found",
//       });
//     }
//   } catch (error) {
//     res.status(500).send({
//       error: error,
//       msg: "Internal server error",
//       success: false,
//     });
//   }
// };
// const getUserTokenTransactions = async (req, res) => {
//   try {
//     // console.log(`DEBUG: Token Reached Request`);
//     userID = req.params.id;

//     const response = await Wallet.bank(DB.pool, userID);
//     // console.log(response);

//     if (response.rowCount !== 0) {
//       return res.send({
//         status: 200,
//         message: "Response data of all investors",
//         response: response.rows,
//       });
//     } else {
//       res.status(400).send({
//         status: 400,
//         message: "No record found",
//       });
//     }
//   } catch (error) {
//     res.status(500).send({
//       error: error,
//       msg: "Internal server error",
//       success: false,
//     });
//   }
// };
// const getFiatTransactions = async (req, res) => {
//   try {
//     console.log(`DEBUG: Reached Request`);
//     userID = req.params.id;

//     const response = await Wallet.getFiatTransactions(DB.pool, userID);
//     // console.log(response);

//     if (response.rowCount !== 0) {
//       return res.send({
//         status: 200,
//         message: "Response data of all investors",
//         response: response.rows,
//       });
//     } else {
//       res.status(400).send({
//         status: 400,
//         message: "No record found",
//       });
//     }
//   } catch (error) {
//     res.status(500).send({
//       error: error,
//       msg: "Internal server error",
//       success: false,
//     });
//   }
// };
// const getUserBalance = async (req, res) => {
//   try {
//     console.log(`DEBUG: Reached Request`);
//     userID = req.params.id;

//     const response = await Wallet.getUserBalance(DB.pool, userID);
//     // console.log(response);

//     if (response.rowCount !== 0) {
//       return res.send({
//         status: 200,
//         message: "Response data of all investors",
//         response: response.rows,
//       });
//     } else {
//       res.status(400).send({
//         status: 400,
//         message: "No record found",
//       });
//     }
//   } catch (error) {
//     res.status(500).send({
//       error: error,
//       msg: "Internal server error",
//       success: false,
//     });
//   }
// };

// module.exports = {
//   getUserTokenTransactions: getUserTokenTransactions,
//   getFiatTransactions: getFiatTransactions,
//   AllUsersAdminWallet: AllUsersAdminWallet,
//   getSingleUserAdmin: getSingleUserAdmin,
//   getAdminWallet: getAdminWallet,
//   getUserTokenAdminSide: getUserTokenAdminSide,
//   getUserBalance: getUserBalance,
//   bank: bank,
// };
