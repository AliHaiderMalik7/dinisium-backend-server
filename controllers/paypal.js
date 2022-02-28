var paypal = require("paypal-rest-sdk");
const config = require("../config/configBasic");

paypal.configure({
  mode: "sandbox",
  client_id: config.paypal.clientID,
  client_secret: config.paypal.clientSecret,
});

const depositViaPaypal = async (req, res, next) => {
  if (!req.body.amount) {
    // console.log(0.1);
    return res.status(400).send({ msg: "Amount is required" });
  }
  let redirectUrls = {};
  if (req.body.mobileView) {
    redirectUrls = {
      return_url: `${config.base_url}api/v3/fiat/payment/process/mobile`,
      cancel_url: `${config.base_url}api/v3/fiat/payment/cancel/mobile`,
    };
  } else {
    redirectUrls = {
      return_url: `${config.server_url}investor/fiat/payment/process`,
      cancel_url: `${config.server_url}investor/fiat/payment/cancel`,
    };
  }
  var payment = {
    intent: "authorize",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: redirectUrls,
    transactions: [
      {
        amount: {
          total: req.body.amount,
          currency: "USD",
        },
        description: "wallet top up",
      },
    ],
  };
  createPay(payment)
    .then((transaction) => {
      // res.status(200).json({ data: transaction, sucess: true });
      var links = {};
      transaction.links.forEach(function (linkObj) {
        links[linkObj.rel] = {
          href: linkObj.href,
          method: linkObj.method,
        };
      });

      if (links.hasOwnProperty("approval_url")) {
        res.send({ paypalUrl: links["approval_url"].href });
        // return res.redirect(links["approval_url"].href);
      } else {
        console.error("no redirect URI present");
      }
    })
    .catch((error) => {
      console.log(error.message);
      res.status(400).json({ sucess: false, msg: error.message });
    });
};

const processPay = (req, res, next) => {
  var paymentId = req.query.paymentId;
  var payerId = { payer_id: req.query.PayerID };
  paypal.payment.execute(paymentId, payerId, function (error, payment) {
    if (error) {
      console.error(error);
    } else {
      if (payment.state == "approved") {
        res.send({ success: true, msg: "payment completed successfully" });
      } else {
        res.send({ success: false, msg: "payment not successful" });
      }
    }
  });
};

const processPayMobile = (req, res, next) => {
  var paymentId = req.query.paymentId;
  var payerId = { payer_id: req.query.PayerID };
  paypal.payment.execute(paymentId, payerId, function (error, payment) {
    if (error) {
      console.error(error);
    } else {
      if (payment.state == "approved") {
        res.send("<h1>payment completed successfully</h1>");
      } else {
        res.send("<h1>payment not successful</h1>");
      }
    }
  });
};

const cancelPay = (req, res, next) => {
  // console.log(req.query);
  res.status(200).send({ success: true, msg: "Payment has canceled" });
};

const cancelPayMobile = (req, res, next) => {
  // console.log(req.query);
  res.status(200).send("<h1>Payment has canceled</h1>");
};

const createPay = (payment) => {
  return new Promise((resolve, reject) => {
    paypal.payment.create(payment, function (err, payment) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(payment);
      }
    });
  });
};

module.exports = {
  depositViaPaypal,
  processPay,
  processPayMobile,
  cancelPay,
  cancelPayMobile,
};
