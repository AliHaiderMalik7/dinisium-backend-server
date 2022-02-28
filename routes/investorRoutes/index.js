const authRoutes = require("../authRoutes");
const kycRoutes = require("../kycRoutes");
const userManagementRoutes = require("../userMangementRoutes");
const exchangeOrderRoutes = require("../exchangeOrderRoutes");
const walletRoutes = require("../walletRoutes");
const tokenRoutes = require("../tokenRoutes");
const walletTransactions = require("../walletTransaction");
const subscriptionRoutes = require("../subscriptionRoutes");
const fiatRoutes = require("../fiatTransactionRoutes");
const itoSeriesRoutes = require("../itoSeriesRoutes");
const withdrawRoutes = require("../withdrawRoutes");

module.exports = [
  authRoutes,
  kycRoutes,
  userManagementRoutes,
  exchangeOrderRoutes,
  walletRoutes,
  tokenRoutes,
  walletTransactions,
  subscriptionRoutes,
  fiatRoutes,
  itoSeriesRoutes,
  withdrawRoutes
];
