const content = require("../controllers/contents");

const router = require("express").Router();
const middleware = require("../middlewares/authMiddleware");
const files = require("../middlewares/files");

router.route("/contents").put(
  middleware.auth(["super-admin"]),
  files([
    { name: "logo", maxCount: 1 },
    { name: "background", maxCount: 1 },
  ]),
  content.updateContent
);

router.route("/contents").get(content.getContents);

module.exports = router;
