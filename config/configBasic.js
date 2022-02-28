const config = {
  postgres: {
    hostname: process.env.HOST,
    database: process.env.DATABASE,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    saltRounds: parseInt(process.env.JWT_SALTROUNDS),
  },
  investorHost: process.env.INVESTOR_HOST,
  port: process.env.SERVER_PORT,
  serverEncryption: {
    key: process.env.SERVER_ENCRYPTION_KEY,
  },
  verificationTokenSize: process.env.VERIFICATION_TOKEN_SIZE,
  base_url: process.env.BASE_URL,
  server_url: process.env.SERVER_URL,

  mailTrap: {
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    auth: {
      user: process.env.MAILTRAP_AUTH_USER,
      pass: process.env.MAILTRAP_AUTH_PASS,
    },
    fromEmail: process.env.MAILTRAP_FROM_EMAIL,
  },
  nexmo: {
    apiKey: process.env.NEXMO_API_KEY,
    apiSecret: process.env.NEXMO_API_SECRET,
    phoneNumber: process.env.NEXMO_PHONE_NO,
  },
  paypal: {
    clientID: process.env.PAYPAY_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNTSID,
    authToken: process.env.TWILIO_AUTHTOKEN,
    serviceId: process.env.TWILIO_SERVICEID,
  },
};

module.exports = config;
