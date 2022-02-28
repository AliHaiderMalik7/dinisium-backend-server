const multer = require("multer");
const fs = require("fs");
const MIME_TYPE_MAP = {
  "application/pdf": "pdf",
};

const upload = (fields = "ito.term_sheets") => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const isValid = MIME_TYPE_MAP[file.mimetype];
      let error = new Error("Invalid mime type");
      if (isValid) {
        error = null;
      }
      let dir = "./public/pdf";
      if (!fs.existsSync("./public")) {
        fs.mkdirSync("./public");
      }
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }

      cb(error, "./public/pdf");
    },
    filename: (req, file, cb) => {
      const name = file.fieldname
        .replace(/([A-Z])/g, " $1")
        .replace(/ /g, "_")
        .toLowerCase();
      cb(null, name + "_" + Date.now() + "." + MIME_TYPE_MAP[file.mimetype]);
    },
  });

  return multer({
    storage: storage,
    limits: { fieldSize: 25 * 1024 * 1024 },
  }).array(fields, 5);
};

module.exports = upload;
