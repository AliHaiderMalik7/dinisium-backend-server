const multer = require('multer');
const path = require('path');
const fs = require('fs');


const allwoedTypes = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "application/pdf": "pdf"
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let dir = './public/bankDrafts';
        if (!fs.existsSync("./public")) {
            fs.mkdirSync("./public");
        }
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, './public/bankDrafts');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {

    if (allwoedTypes[file.mimetype]) {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

module.exports = multer({storage: storage, fileFilter: fileFilter, limits: {fieldSize: 25 * 1024 * 1024}});