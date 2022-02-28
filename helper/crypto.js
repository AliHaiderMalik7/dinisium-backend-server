const config = require('../config/configBasic');
var CryptoJS = require("crypto-js");

// serverEncryption - Function is used to encrypt data with server key

async function serverEncryption(unencryptedData) {
    try {
        return CryptoJS.AES.encrypt(unencryptedData.toString(), config.serverEncryption.key).toString();
    } catch (e) {
        return e.message;
    }
}

// serverDecryption - Function is used to decrypt data with server key

async function serverDecryption(encryptedData) {
    try {
        let bytes = CryptoJS.AES.decrypt(encryptedData, config.serverEncryption.key);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
        return e.message;
    }
}

module.exports = {
    serverEncryption: serverEncryption,
    serverDecryption: serverDecryption
}