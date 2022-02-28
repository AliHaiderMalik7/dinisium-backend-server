const authRoutes = require("../authRoutes");
const kycRoutes = require("../kycRoutes");
const userManagementRoutes = require("../userMangementRoutes");
const itoSeriesRoutes = require("../itoSeriesRoutes");
const itoRoutes = require("../itoRoutes");
const tokenRoutes = require("../tokenRoutes");
const assetManagementRoutes = require("../assetManagementRoutes");
const agentsRoutes = require("../agentRoutes");
const subscriptionRoutes = require("../subscriptionRoutes");
const fiatRoutes = require("../fiatTransactionRoutes");
const walletRoutes = require("../walletRoutes");
const adminManagementRoutes = require("../adminManagementRoutes");
const dashboardRoutes = require("../dashboard");
const exchangeRoutes = require("../exchangeOrderRoutes");
const withdrawRoutes = require("../withdrawRoutes");

module.exports = [
  authRoutes,
  kycRoutes,
  userManagementRoutes,
  itoSeriesRoutes,
  assetManagementRoutes,
  agentsRoutes,
  itoRoutes,
  tokenRoutes,
  subscriptionRoutes,
  fiatRoutes,
  walletRoutes,
  adminManagementRoutes,
  dashboardRoutes,
  withdrawRoutes,
  exchangeRoutes,
];
