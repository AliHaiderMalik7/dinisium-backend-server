const app = require("./app.js");
const config = require("./config/configBasic");
const http = require("http");
const process = require("process");

const port = config.port;

app.set("port", port);
const httpServer = http.createServer(app);

let server = httpServer.listen(port, () => {
  console.log("Server running on port ", port);
});
process.on("SIGINT", function () {
  console.log("\nGracefully shutting down from SIGINT (Ctrl-C)");
  //  some other closing procedures go here
  process.exit(0);
});
