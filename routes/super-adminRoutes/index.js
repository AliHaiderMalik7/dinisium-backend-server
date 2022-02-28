const authRoutes = require("../authRoutes");
const KYCRoutes = require("../kycRoutes");
const itoRoutes = require("../itoRoutes");
const assetManagementRoutes = require("../assetManagementRoutes");
const userManagementRoutes = require("../userMangementRoutes");
const adminRoutes = require("../adminManagementRoutes");
const tokenRoutes = require("../tokenRoutes");
const subscriptionRoutes = require("../subscriptionRoutes");
const fiatRoutes = require("../fiatTransactionRoutes");
const walletRoutes = require("../walletRoutes");
const electionRoutes = require("../electionRoutes");
const contentRoutes = require("../contentRoutes");
const auditLogsRoutes = require("../logsRoutes");
const dinisiumBankAccountsRountes = require("../dinisiumBankAccountsRountes");
const withdrawRoutes = require("../withdrawRoutes");
const dashboardRoutes = require("../dashboard");

module.exports = [
  dashboardRoutes,
  authRoutes,
  KYCRoutes,
  itoRoutes,
  assetManagementRoutes,
  userManagementRoutes,
  adminRoutes,
  tokenRoutes,
  subscriptionRoutes,
  fiatRoutes,
  walletRoutes,
  electionRoutes,
  contentRoutes,
  auditLogsRoutes,
  withdrawRoutes,
  dinisiumBankAccountsRountes,
];
