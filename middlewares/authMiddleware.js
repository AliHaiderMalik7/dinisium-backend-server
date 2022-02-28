const jwt = require("jsonwebtoken");
const config = require("../config/configBasic");
const Users = require("../model/Users");

const requireValidToken = (req, res, next) => {
  let token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ msg: "Authorizaton denied" });
  }
  try {
    let authString = token.split(" ");
    let decoded = jwt.verify(authString[1], config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).send({ msg: "Invalid token" });
  }
};

exports.auth = (roles) => (req, res, next) => {
  requireValidToken(req, res, async function () {
    try {
      const user = (await Users.getUserById(req.user.id)).rows[0];

      if (user?.is_blocked) {
        return res.status(403).send({ msg: "User has been blocked by admin" });
      }
      // console.log(permissions);

      if (!roles) return next();

      if (req.user.userType == "sub-admin") {
        const permissions = await Users.findUserPermissions(req.user.id);

        let userPermissions;
        if (permissions.rows) {
          userPermissions = permissions.rows.map(
            (permission) => permission.name
          );
        }

        // console.log(userPermissions)
      }

      if (roles.includes(req.user.userType)) {
        next();
      } else {
        res.status(403).json({
          success: false,
          msg: "You don't have the right permission to access this route :)",
        });
      }
    } catch (error) {
      console.log(`Internal server error`);
    }
  });
};
