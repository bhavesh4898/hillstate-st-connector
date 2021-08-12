const app = require("./app");

const PORT = 8000;
const server = app.listen(PORT);
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

console.log("Running on http://localhost:" + PORT);

process.on("SIGTERM", function() {
  server.close(() => {
    process.exit(0);
  });
});
 