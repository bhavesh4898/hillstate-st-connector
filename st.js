const fetch = require('sync-fetch')
const express = require('express');
const JSONdb = require('simple-json-db');
const router = express.Router();

// =========== Hillstate API Related ==================

const username = "HILLSTATE_USERNAME"
const password = "HILLSTATE_PASSWORD"
const dong = "101"
const ho = "715"


function login() {
  const loginJSON = fetch("https://www2.hthomeservice.com/proxy/htservice/oauth/token", {
		"headers": {
			"accept": "application/json, text/plain, */*",
			"accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
			"cache-control": "no-cache",
			"content-type": "application/json;charset=UTF-8",
			"pragma": "no-cache",
			"sec-fetch-dest": "empty",
			"sec-fetch-mode": "cors",
			"sec-fetch-site": "same-origin",
			"cookie": "lang=ko-KR"
		},
		"referrer": "https://www2.hthomeservice.com/",
		"referrerPolicy": "strict-origin-when-cross-origin",
		"body": "{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}",
		"method": "POST",
		"mode": "cors"
	}).json();
  return loginJSON['access_token'];
}


function fetchLightState(access_token) {
  const lightStateJSON = fetch("https://hillstategwanggyo.hthomeservice.com/proxy/core/device?siteId=338&dong=" + dong + "&ho=" + ho + "&deviceAlevType=AG001&deviceBlevType=AGA010&access_token=" + access_token, {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
      "cache-control": "no-cache, no-store, must-revalidate",
      "expires": "0",
      "pragma": "no-cache",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "cookie": "lang=ko-KR; hts_access_token=" + access_token
    },
    "referrer": "https://hillstategwanggyo.hthomeservice.com/",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors"
  }).json();
  return lightStateJSON;
}

function getLightState(lightStateJSON, deviceID) {
  let state = {
    power: ''
  };
  lightStateJSON.useDeviceList.map(({deviceId, deviceState}) => {
    if (deviceId == deviceID) {
      state.power = JSON.parse(deviceState)[0].value;
    }
  });
  return state;
}


function fetchACState(access_token) {
  const acStateJSON = fetch("https://hillstategwanggyo.hthomeservice.com/proxy/core/device?siteId=338&dong=" + dong + "&ho=" + ho + "&deviceAlevType=AG001&deviceBlevType=AGA001&access_token=" + access_token, {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
      "cache-control": "no-cache, no-store, must-revalidate",
      "expires": "0",
      "pragma": "no-cache",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "cookie": "lang=ko-KR; hts_access_token=" + access_token
    },
    "referrer": "https://hillstategwanggyo.hthomeservice.com/",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors"
  }).json();
  return acStateJSON;
}

function getACState(acStateJSON, deviceID) {
  let state = {
    power: '',
    currTemp: 0,
    setTemp: 0,
  }
  acStateJSON.useDeviceList.map(({deviceId, deviceState}) => {
    if (deviceId == deviceID) {
      deviceState = JSON.parse(deviceState)
      state.power = deviceState[0].value;
      state.currTemp = deviceState[4].value * 1;
      state.setTemp = deviceState[3].value * 1;
    }
  });
  return state;
}




function fetchCommandResponse(access_token, device_id, command_name, command_value) {
  const commandResponseJSON = fetch("https://hillstategwanggyo.hthomeservice.com/proxy/core/homepage/device/command?access_token=" + access_token, {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
      "cache-control": "no-cache, no-store, must-revalidate",
      "content-type": "application/json;charset=UTF-8",
      "expires": "0",
      "pragma": "no-cache",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "cookie": "lang=ko-KR; hts_access_token=" + access_token
    },
    "referrer": "https://hillstategwanggyo.hthomeservice.com/",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": "{\"siteId\":338,\"dong\":\"" + dong + "\",\"ho\":\"" + ho + "\",\"deviceId\":\"" + device_id + "\",\"devicePropertyList\":[{\"name\":\"" + command_name + "\",\"value\":\"" + command_value + "\"}]}",
    "method": "POST",
    "mode": "cors"
  }).json();
  return commandResponseJSON;
}










// ============ ST Schema Request Types ==============

// Discovery Request
function discoveryRequest(requestId) {
  let discoveryResponse = require("./responses/discoveryResponse.json");
  discoveryResponse.headers.requestId = requestId
  return discoveryResponse
}



// Refresh Request
function stateRefreshRequest(requestId, devices) {
  let response = { "headers": { "schema": "st-schema", "version": "1.0", "interactionType": "stateRefreshResponse", "requestId": requestId }, "deviceState": [] }
  const deviceStateFormat = require("./responses/deviceStateFormat.json");
  const access_token = login();
  const lightStateJSON = fetchLightState(access_token);
  const acStateJSON = fetchACState(access_token);
  devices.map(({ externalDeviceId, deviceCookie }) => {
    console.log("externalDeviceId: ", externalDeviceId)
    let deviceResponse = deviceStateFormat[externalDeviceId]
    if (externalDeviceId == "refresh") {
      //
    } else if (externalDeviceId == "012811" || externalDeviceId == "012812" || externalDeviceId == "012813") {
      state = getACState(acStateJSON, externalDeviceId)
      deviceResponse.states[0].value = state.power
      deviceResponse.states[1].value = state.currTemp
      deviceResponse.states[2].value = state.setTemp
    } else {
      state = getLightState(lightStateJSON, externalDeviceId)
      deviceResponse.states[0].value = state.power
    }
    response.deviceState.push(deviceResponse)
    console.log("deviceResponse: ", deviceResponse)
  });
  return response;
}



// Command Request
function commandRequest(requestId, devices) {
  let response = { "headers": { "schema": "st-schema", "version": "1.0", "interactionType": "commandResponse", "requestId": requestId }, "deviceState": [] }
  const deviceStateFormat = require("./responses/deviceStateFormat.json");
  const access_token = login();

  devices.map(({ externalDeviceId, deviceCookie, commands }) => {
    let deviceResponse = deviceStateFormat[externalDeviceId]
    console.log(commands);
    if (externalDeviceId == "refresh") {
      sendRefreshCallback([
        {"externalDeviceId": "012511"},
        {"externalDeviceId": "012512"},
        {"externalDeviceId": "012513"},
        {"externalDeviceId": "012521"},
        {"externalDeviceId": "012522"},
        {"externalDeviceId": "012531"},
        {"externalDeviceId": "012532"},
        {"externalDeviceId": "012561"},
        {"externalDeviceId": "012562"},
        {"externalDeviceId": "012563"},
        {"externalDeviceId": "012564"},
        {"externalDeviceId": "012811"},
        {"externalDeviceId": "012812"},
        {"externalDeviceId": "012813"}
      ]);
    } else {
      commands.map(({command, arguments}) => {
        let name, value;
        if (command == 'setCoolingSetpoint') {
          name = "setTemperature"
          value = arguments[0]
          new Promise(resolve => {
            setTimeout(() => {
              sendRefreshCallback([{"externalDeviceId": externalDeviceId}]);
            }, 2000);
          });
        } else {
          name = "power"
          value = command
        }
        const commandResponseJSON = fetchCommandResponse(access_token, externalDeviceId, name, value);
        console.log(commandResponseJSON)
        deviceResponse.states[0].value = commandResponseJSON.devicePropertyList[0].value;
        if (externalDeviceId == "012811" || externalDeviceId == "012812" || externalDeviceId == "012813") {
          deviceResponse.states[1].value = commandResponseJSON.devicePropertyList[4].value * 1;
          deviceResponse.states[2].value = commandResponseJSON.devicePropertyList[3].value * 1;
        }
      });
    }
    response.deviceState.push(deviceResponse)
  });
  return response;
}







// ================= ST Callback Related ==================
const client_id = "CLIENT_ID_FROM_ST_DEVELOPER_PAGE"
const client_secret = "CLIENT_SECRET_FROM_ST_DEVELOPER_PAGE"
const db = new JSONdb('database.json');

function grantCallbackAccess(callbackAuthentication, callbackUrls) {
  if (callbackAuthentication.clientId != client_id) {
    return;
  }
  db.set('grant_type', callbackAuthentication.grantType);
  db.set('auth_code', callbackAuthentication.code);
  db.set('token_url', callbackUrls.oauthToken);
  db.set('callback_url', callbackUrls.stateCallback);
  getAccessToken();
  console.log("Saved callback details");
}


function getAccessToken() {
  let requestBody = {
    "headers": {
      "schema": "st-schema",
      "version": "1.0",
      "interactionType": (db.get('grant_type') == "authorization_code") ? "accessTokenRequest" : "refreshAccessTokens",
      "requestId": "abc-123-456"
    },
    "callbackAuthentication": {
      "grantType": db.get('grant_type'),
      "code": db.get('auth_code'),
      "refreshToken": db.get('refresh_token'),
      "clientId": client_id,
      "clientSecret": client_secret
    }
  }
  console.log(requestBody);
  const accessTokenJSON = fetch(db.get('token_url'), {
    "headers": {
      "accept": "application/json",
      "content-type": "application/json;charset=UTF-8",
    },
    "body": JSON.stringify(requestBody),
    "method": "POST",
  }).json();
  console.log(accessTokenJSON);
  db.set('grant_type', 'refresh_token');
  db.set('access_token', accessTokenJSON.callbackAuthentication.accessToken);
  db.set('refresh_token', accessTokenJSON.callbackAuthentication.refreshToken);
  console.log("Saved token details");
}


function sendRefreshCallback(devices) {
  getAccessToken();
  let requestBody = stateRefreshRequest("abc-123-456", devices);
  requestBody.headers.interactionType = "stateCallback";
  requestBody.authentication = {
    "tokenType": "Bearer",
    "token": db.get('access_token')
  };
  const response = fetch(db.get('callback_url'), {
    "headers": {
      "accept": "application/json",
      "content-type": "application/json;charset=UTF-8",
    },
    "body": JSON.stringify(requestBody),
    "method": "POST",
  });
  console.log(response);
}










// =================== API Endpoints ======================


// Renders the homepage
router.get('/', function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'})
  res.write("Welcome")
  res.end()
});


// [START Action]
router.post('/', function (req, res) {
  console.log('\n\n\n\nRequest received: ' + JSON.stringify(req.body))
  
  let response = {}
  const {headers, authentication, devices, callbackAuthentication, callbackUrls, globalError, deviceState} = req.body
  const {interactionType, requestId} = headers;
  console.log("request type: ", interactionType);
  try {
    switch (interactionType) {
      case "grantCallbackAccess":
        grantCallbackAccess(callbackAuthentication, callbackUrls)
        break
      case "discoveryRequest":
        response = discoveryRequest(requestId)
        break
      case "commandRequest":
        response = commandRequest(requestId, devices)
        break
      case "stateRefreshRequest":
        response = stateRefreshRequest(requestId, devices)
        break
      default:
        console.log("error. not supported interactionType" + interactionType)
        break;
    }
  } catch (ex) {
    console.log("failed with ex", ex)
  }
  console.log('\nResponse sent: ' + JSON.stringify(response))
  res.send(response)

})


module.exports = router;