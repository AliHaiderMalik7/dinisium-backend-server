// const { createWalletTransaction } = require("../controllers/walletTransactions");
const validation = require("../helper/validator");

const addBankAccount = [
 validation.requiredFieldValidationMW("bank_name"),
 validation.requiredFieldValidationMW("account_title"),
 validation.requiredFieldValidationMW("iban"),
 validation.requiredFieldValidationMW("swift_code"),
];

const createKYC = [
 validation.requiredFieldValidationMW("userId"),
 validation.requiredFieldValidationMW("fullName"),
 validation.requiredFieldValidationMW("nationality"),
 validation.requiredFieldValidationMW("dob"),
 validation.requiredFieldValidationMW("permanentAddress"),
 validation.requiredFieldValidationMW("city"),
 validation.requiredFieldValidationMW("state"),
 validation.requiredFieldValidationMW("country"),
 validation.requiredFieldValidationMW("bankName"),
 validation.requiredFieldValidationMW("swift"),
 validation.requiredFieldValidationMW("accountNumber"),
 validation.requiredFieldValidationMW("accountTitle"),
];

const userResiter = [
 validation.requiredFieldValidationMW("fname"),
 validation.requiredFieldValidationMW("lname"),
 validation.requiredFieldValidationMW("role"),
 validation.emailFieldValidationMW("email"),
 validation.requiredFieldValidationMW("email"),
 validation.requiredFieldValidationMW("contact_no"),
 validation.requiredFieldValidationMW("country"),
 validation.requiredFieldValidationMW("password"),
 validation.passwordFieldValidationMW("password", 6),
];

const userLogin = [
 validation.emailFieldValidationMW("email"),
 validation.requiredFieldValidationMW("email"),
 validation.requiredFieldValidationMW("password"),
 validation.requiredFieldValidationMW("role"),
];

const updatePassword = [
 validation.requiredFieldValidationMW("currentPassword"),
 validation.requiredFieldValidationMW("password"),
 validation.passwordFieldValidationMW("password", 6),
];

const itoRegister = [
 validation.requiredFieldValidationMW("ito.name"),
 validation.requiredFieldValidationMW("ito.start_date"),
 validation.requiredFieldValidationMW("ito.description"),
 // validation.requiredFieldValidationMW("ito.alloted_admins"),
 validation.requiredFieldValidationMW("ito.alloted_admins.*.id"),
 validation.requiredFieldValidationMW("token.token_symbol"),
 validation.requiredFieldValidationMW("token.token_name"),
 validation.requiredFieldValidationMW("token.supply"),
 validation.requiredFieldValidationMW("token.price"),
 validation.requiredFieldValidationMW("token.target_value"),
 validation.requiredFieldValidationMW("token.buying_spread"),
 validation.requiredFieldValidationMW("token.selling_spread"),
 validation.requiredFieldValidationMW("token.back_assets"),
 validation.requiredFieldValidationMW("series.name"),
 validation.requiredFieldValidationMW("series.start_date"),
 validation.requiredFieldValidationMW("series.end_date"),
 validation.requiredFieldValidationMW("series.description"),
 validation.requiredFieldValidationMW("series.supply"),
];

const closeRequestIto = [validation.booleanFieldValidationMW("updated_closed")];
const verifyItoClosedRequest = [validation.booleanFieldValidationMW("closed")];

const addAsset = [
 validation.requiredFieldValidationMW("name"),
 validation.requiredFieldValidationMW("price"),
 validation.requiredFieldValidationMW("unit"),
 validation.requiredFieldValidationMW("total_supply"),
];

const createItoSeries = [
 validation.requiredFieldValidationMW("name"),
 validation.requiredFieldValidationMW("ito_id"),
 validation.requiredFieldValidationMW("supply"),
 validation.requiredFieldValidationMW("start_date"),
 validation.requiredFieldValidationMW("end_date"),
 validation.requiredFieldValidationMW("description"),
];

const updateSeriesSupply = [validation.requiredFieldValidationMW("new_supply")];

const adminRegister = [
 validation.requiredFieldValidationMW("fname"),
 validation.requiredFieldValidationMW("lname"),
 validation.requiredFieldValidationMW("email"),
 validation.requiredFieldValidationMW("role"),
 validation.emailFieldValidationMW("email"),
 validation.requiredFieldValidationMW("contact_no"),
 validation.requiredFieldValidationMW("country"),
];

const agentRegister = [
 validation.requiredFieldValidationMW("fname"),
 validation.requiredFieldValidationMW("lname"),
 validation.requiredFieldValidationMW("email"),
 validation.requiredFieldValidationMW("address"),
 validation.emailFieldValidationMW("email"),
 validation.requiredFieldValidationMW("contact_no"),
 validation.requiredFieldValidationMW("country"),
];

const createOrder = [
 validation.requiredFieldValidationMW("ito_token_id"),
 validation.requiredFieldValidationMW("order_type"),
 validation.requiredFieldValidationMW("amount"),
 validation.requiredFieldValidationMW("tokens"),
 //validation.requiredFieldValidationMW("partialFill"),
 validation.requiredFieldValidationMW("sub_order"),
];

const createToken = [
 validation.requiredFieldValidationMW("token_name"),
 validation.requiredFieldValidationMW("token_symbol"),
 validation.requiredFieldValidationMW("token_decimal"),
 validation.requiredFieldValidationMW("supply"),
 validation.requiredFieldValidationMW("target_value"),
 validation.requiredFieldValidationMW("back_assets"),
];

const createBankDetail = [
 validation.requiredFieldValidationMW("country"),
 validation.requiredFieldValidationMW("swift"),
 validation.requiredFieldValidationMW("bank_name"),
 validation.requiredFieldValidationMW("account_no"),
 validation.requiredFieldValidationMW("account_name"),
 validation.requiredFieldValidationMW("from_account"),
 validation.requiredFieldValidationMW("currency"),
 validation.requiredFieldValidationMW("transfer_amount"),
 validation.requiredFieldValidationMW("transfer_fee"),
 validation.requiredFieldValidationMW("total_amount"),
];

const buyToken = [
 validation.requiredFieldValidationMW("ito_token_id"),
 validation.requiredFieldValidationMW("tokens"),
 validation.requiredFieldValidationMW("amount"),
];

const createSubscription = [
 validation.requiredFieldValidationMW("ito_name"),
 validation.requiredFieldValidationMW("ito_series"),
 validation.requiredFieldValidationMW("ito_token"),
 validation.requiredFieldValidationMW("description"),
 validation.requiredFieldValidationMW("threshold"),
 validation.requiredFieldValidationMW("start_date"),
 validation.requiredFieldValidationMW("end_date"),
];

const addSubscriber = [
 validation.requiredFieldValidationMW("subscription_id"),
 validation.requiredFieldValidationMW("investment"),
];

const createElection = [
 validation.requiredFieldValidationMW("ito_id"),
 validation.requiredFieldValidationMW("name"),
 validation.requiredFieldValidationMW("description"),
 validation.requiredFieldValidationMW("start_date"),
 validation.requiredFieldValidationMW("end_date"),
];

const createVote = [validation.requiredFieldValidationMW("election_id")];

const assingAdminPermission = [
 validation.requiredFieldValidationMW("sub_admin"),
 validation.requiredFieldValidationMW("permissions"),
];

const approveFiatDeposit = [validation.requiredFieldValidationMW("status")];

createAgentInvestor = [
 validation.requiredFieldValidationMW("agent_id"),
 validation.requiredFieldValidationMW("investment"),
 validation.requiredFieldValidationMW("ito_series"),
];

const createWalletTransaction = [
 validation.requiredFieldValidationMW("to_address"),
 validation.requiredFieldValidationMW("token_amount"),
 validation.requiredFieldValidationMW("token_id"),
];

const verifyUpdateAssetStatus = [
 validation.requiredFieldValidationMW("update_status"),
];

const updateWithDrawReq = [validation.requiredFieldValidationMW("status")];

const createWithDrawReq = [validation.requiredFieldValidationMW("amount")];
const middlewares = {
 register: [userResiter, validation.validationResultMW],
 login: [userLogin, validation.validationResultMW],
 updatePassword: [updatePassword, validation.validationResultMW],
 kyc: [createKYC, validation.validationResultMW],
 itoRegister: [itoRegister, validation.validationResultMW],
 closeRequestIto: [closeRequestIto, validation.validationResultMW],
 verifyItoClosedRequest: [
  verifyItoClosedRequest,
  validation.validationResultMW,
 ],

 addAsset: [addAsset, validation.validationResultMW],
 verifyUpdateAssetStatus: [
  verifyUpdateAssetStatus,
  validation.validationResultMW,
 ],
 createItoSeries: [createItoSeries, validation.validationResultMW],
 updateSeriesSupply: [updateSeriesSupply, validation.validationResultMW],

 createToken: [createToken, validation.validationResultMW],
 adminRegister: [adminRegister, validation.validationResultMW],
 agentRegister: [agentRegister, validation.validationResultMW],
 createOrder: [createOrder, validation.validationResultMW],
 createBankDetail: [createBankDetail, validation.validationResultMW],
 buyToken: [buyToken, validation.validationResultMW],
 createSubscription: [createSubscription, validation.validationResultMW],
 addSubscriber: [addSubscriber, validation.validationResultMW],
 createElection: [createElection, validation.validationResultMW],
 createVote: [createVote, validation.validationResultMW],
 assingPermission: [assingAdminPermission, validation.validationResultMW],
 approveFiatDeposit: [approveFiatDeposit, validation.validationResultMW],
 createAgentInvestor: [createAgentInvestor, validation.validationResultMW],
 createWalletTransaction: [
  createWalletTransaction,
  validation.validationResultMW,
 ],
 updateWithDrawReq: [updateWithDrawReq, validation.validationResultMW],
 createWithDrawReq: [createWithDrawReq, validation.validationResultMW],
 addBankAccount: [addBankAccount, validation.validationResultMW],
};

module.exports = middlewares;
