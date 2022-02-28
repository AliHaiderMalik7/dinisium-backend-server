const NodeRSA = require('node-rsa');

// generateKey - Function used to generate random key with which content will be encrypted

async function generateKey() {
    const newKey = new NodeRSA({ b: 512 });
    return newKey;
}

// rsaEncryption - Function used to encrypt content with random key 

async function rsaEncryption(unencryptedContent, rsaKey) {
    try {
        const rsaEncryptedContent = rsaKey.encrypt(unencryptedContent, 'base64');
        return rsaEncryptedContent;
    } catch (e) {
        return e.message;
    }
}

// rsaEncryption - Function used to decrypt content with random key 

async function rsaDecryption(encryptedFile) {
    try {
        const rsaDecryptedContent = rsaKey.decrypt(encrypted, 'utf8');
        return rsaDecryptedContent;
    } catch (e) {
        return e.message;
    }
}

module.exports = {
    generateKey: generateKey,
    rsaEncryption: rsaEncryption,
    rsaDecryption: rsaDecryption
}

