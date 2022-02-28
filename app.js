require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const superAdminRoutes = require("./routes/super-adminRoutes");
const adminRoutes = require("./routes/adminRoutes");
const investorRoutes = require("./routes/investorRoutes");
const { seedDefaultRecords } = require("./db/seed_add_liquid_assets");
//Crone Job Operations
const cronJobOperations = require("./helper/investmentReturn.cronjob");
const app = express();
cronJobOperations.investmentReturn();

app.use(express.static(path.join(__dirname, "public")));

// app.use(express.json())
app.use(cors());
// app.use(bodyParser.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(express.json({ limit: "100mb", extended: true }));
// app.use(bodyParser.urlencoded({ extended: true }));
// morgan for status OR Logger
app.use(morgan("dev"));
app.use("/api/v1", superAdminRoutes);
app.use("/api/v2", adminRoutes);
app.use("/api/v3", investorRoutes);

// // cron job
// // seeding liquid assets
// seedDefaultRecords();

app.use((req, res) => {
  res.status(404).send(`here`);
});

module.exports = app;
