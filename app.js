const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");

const app = express();
app.use(morgan(":method :url :status Authorization: :req[authorization] Debug info: :res[x-debug] Redirect: :res[location]"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({type: 'application/json'}));


var oauthRouter = require('./oauth2');
app.use('/', oauthRouter);

var stRouter = require('./st');
app.use('/', stRouter);



module.exports = app;