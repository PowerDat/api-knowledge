require("dotenv").config();
const axios = require("axios");

const { ISSUER, CLIENT_ID, CLIENT_SECRET, SCOPE } = process.env;

console.log({ ISSUER, CLIENT_ID, CLIENT_SECRET, SCOPE });

const [, , url, method, body] = process.argv;

console.log(url, method, body);
if (!url) {
  console.log("Usage: node client {url} [{method}] [{jsonData}]");
  process.exit(1);
}

const sendAPIRequest = async () => {
  try {
    const auth = await axios({
      url: `${ISSUER}/v1/token`,
      method: "post",
      auth: {
        username: CLIENT_ID,
        password: CLIENT_SECRET,
      },
      params: {
        grant_type: "client_credentials",
        scope: SCOPE,
      },
    });

    console.log(auth.data);

    const response = await axios({
      url,
      method: method ?? "get",
      data: body ? JSON.parse(body) : null,
      headers: {
        // "Content-Type": "application/x-www-form-urlencoded",
        authorization: `${auth.data.token_type} ${auth.data.access_token}`,
      },
    });

    console.log(response.data);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
};

sendAPIRequest();
