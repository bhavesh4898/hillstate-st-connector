const _ = require("underscore");
const randomstring = require("randomstring");
const express = require('express');
const router = express.Router();

const EXPECTED_CLIENT_ID = "dummy-client-id";
const EXPECTED_CLIENT_SECRET = "dummy-client-secret";
const PERMITTED_REDIRECT_URLS = ["https://c2c-ap.smartthings.com/oauth/callback"];

const AUTH_REQUEST_PATH = "/o/oauth2/v2/auth";
const ACCESS_TOKEN_REQUEST_PATH = "/oauth2/v4/token";


const code2token = {};
const refresh2personData = {};
let redirect_uri;


function errorMsg(descr, expected, actual) {
  return "expected " + descr + ": " + expected + ", actual: " + actual;
}

function permittedRedirectURLs() {
    return _.reduce(PERMITTED_REDIRECT_URLS, (a, b) => a === "" ? b : a + ", " + b, "" );
}


function validateAuthRequest(req, res) {
  if (req.query.client_id !== EXPECTED_CLIENT_ID) {
    res.writeHead(401, {
      "X-Debug": errorMsg("client_id", EXPECTED_CLIENT_ID, req.query.client_id)
    });
    return false;
  }
  if (req.query.response_type !== "code") {
    res.writeHead(401, {
      "X-Debug": errorMsg("response_type", "code", req.query.response_type)
    });
    return false;
  }
  if (req.query.redirect_uri && ! _.contains(PERMITTED_REDIRECT_URLS, req.query.redirect_uri)) {
    res.writeHead(401, {
      "X-Debug" : errorMsg("redirect_uri", "one of " + permittedRedirectURLs(), req.query.redirect_uri)
    });
    return false;
  }
  return true;
}



function validateAccessTokenRequest(req, res) {
  let success = true, msg;

  if (req.body.client_id !== EXPECTED_CLIENT_ID) {
    success = false;
    msg = errorMsg("client_id", EXPECTED_CLIENT_ID, req.body.client_id);
  }
  if (req.body.client_secret !== EXPECTED_CLIENT_SECRET) {
    success = false;
    msg = errorMsg("client_secret", EXPECTED_CLIENT_SECRET, req.body.client_secret);
  }
  header = req.headers["authorization"].trim();
  header = header.substring("Basic ".length).trim();
  const decoded = new Buffer(header, "base64").toString("ascii").trim();
  if (decoded !== EXPECTED_CLIENT_ID+":"+EXPECTED_CLIENT_SECRET) {
    success = false;
    msg = errorMsg("Authorization header", EXPECTED_CLIENT_ID+":"+EXPECTED_CLIENT_SECRET, decoded);
  }

  if (req.body.grant_type !== "authorization_code" && req.body.grant_type !== "refresh_token") {
    success = false;
    msg = errorMsg("grant_type", "authorization_code or refresh_token", req.body.grant_type);
  }
  if (req.body.grant_type === "refresh_token") {
    let personData = refresh2personData[req.body.refresh_token];
    if (personData === undefined) {
      success = false;
      msg = "invalid refresh token";
    }
  }
  
  if (req.body.grant_type === "authorization_code" && redirect_uri !== req.body.redirect_uri) {
    success = false;
    msg = errorMsg("redirect_uri", redirect_uri, req.body.redirect_uri);
  }
  if (!success) {
    const params = {};
    if (msg) {
      params["X-Debug"] = msg;
    }
    res.writeHead(401, params);
  }
  return success;
}






function createToken(expires_in, client_state) {
  const code = "C-" + randomstring.generate(3);
  const accesstoken = "ACCT-" + randomstring.generate(6);
  const refreshtoken = "REFT-" + randomstring.generate(6);
  const token = {
    access_token: accesstoken,
    expires_in: expires_in,
    refresh_token: refreshtoken,
    state: client_state,
    token_type: "Bearer"
  };
  code2token[code] = token;
  refresh2personData[refreshtoken] = {
    exists: true
  };
  return code;
}








router.get(AUTH_REQUEST_PATH, (req, res) => {
  if (validateAuthRequest(req, res)) {
    redirect_uri = req.query.redirect_uri;
    const code = createToken(31556952, req.query.state);
    let location = `${redirect_uri}${redirect_uri.includes('?') ? '&' : '?'}code=${code}`;
    if (req.query.state) {
      location += "&state=" + req.query.state;
    }
    res.writeHead(307, {"Location": location});
  } else {

  }
  res.end();
});



router.post(ACCESS_TOKEN_REQUEST_PATH, (req, res) => {
  console.log("VIPER CALLS TO GET AC/RT", req.body, refresh2personData)
  if (validateAccessTokenRequest(req, res)) {
    let code = null;
    if (req.body.grant_type === "refresh_token") {
      const refresh = req.body.refresh_token;
      const personData = refresh2personData[refresh];
      code = createToken(31556952, null);
      delete refresh2personData[refresh];
    } else {
      code = req.body.code;
    }
    const token = code2token[code];
    if (token !== undefined) {
      console.log("access token response body: ", token);
      res.send(token);
    }
  }
  res.end();
});



module.exports = router;