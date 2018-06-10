const axios = require('axios');

const SERVER_URL = 'https://authsandbox.braspag.com.br';

let oauth2ServerInstance = null;
let token = null;

module.exports = (config) => {
  const encodedAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  oauth2ServerInstance = oauth2ServerInstance || axios.create({
    baseURL: SERVER_URL,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${encodedAuth}`,
    },
  });

  const renewToken = () => oauth2ServerInstance.post('/oauth2/token', { grant_type: 'client_credentials' }).then((response) => {
    token = response.data.access_token;
  });

  const mutateConfig = (requestConfig) => {
    requestConfig.headers.common.Authorization = `Bearer ${token}`;

    if (requestConfig.data && requestConfig.data.Payment && requestConfig.data.Payment.Type === 'CreditCard') {
      requestConfig.data.Payment.Type = 'SplittedCreditCard';
    }

    if (requestConfig.data && requestConfig.data.Payment && requestConfig.data.Payment.Type === 'DebitCard') {
      requestConfig.data.Payment.Type = 'SplittedDebitCard';
    }

    return requestConfig;
  };

  return {
    renewToken,
    intercept: requestConfig => {
      if (!token) {
        return renewToken().then(() => mutateConfig(requestConfig));
      }

      return mutateConfig(requestConfig);
    },
  };
};
