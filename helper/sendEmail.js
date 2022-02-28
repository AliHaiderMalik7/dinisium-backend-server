const nodeMailer = require('nodemailer');
const config = require('../config/configBasic');

let transporter = nodeMailer.createTransport({
  host: config.mailTrap.host,
  port: config.mailTrap.port,
  auth: {
    user: config.mailTrap.auth.user,
    pass: config.mailTrap.auth.pass,
  },
});

const sendEmail = mailOptions => {
  console.log('mail options are ....', mailOptions);
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      } else {
        return resolve(info);
      }
    });
  });
};

module.exports = sendEmail;
