const querystring = require('querystring');
const url = require('url');

const axios = require('axios');

const BRASPAG_SANDBOX_OAUTH_URL = 'https://authsandbox.braspag.com.br';
const BRASPAG_SANDBOX_SPLIT_URL = 'https://splitsandbox.braspag.com.br';

const BRASPAG_PRODUCTION_OAUTH_URL = 'https://auth.braspag.com.br';
const BRASPAG_PRODUCTION_SPLIT_URL = 'https://split.braspag.com.br';

let oauth2ServerInstance = null;
let token = null;

module.exports = (config) => {
  const encodedAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  oauth2ServerInstance = oauth2ServerInstance || axios.create({
    baseURL: config.sandbox ? BRASPAG_SANDBOX_OAUTH_URL : BRASPAG_PRODUCTION_OAUTH_URL,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${encodedAuth}`,
    },
  });

  const renewToken = () => oauth2ServerInstance
    .post('/oauth2/token', querystring.stringify({ grant_type: 'client_credentials' }))
    .then((response) => {
      token = response.data.access_token;
      return token;
    });

  const mutateConfig = (requestConfig) => {
    requestConfig.headers.common.Authorization = `Bearer ${token}`;

    if (requestConfig.data && requestConfig.data.Payment && requestConfig.data.Payment.Type === 'CreditCard') {
      requestConfig.data.Payment.Type = 'SplittedCreditCard';
    }

    if (requestConfig.data && requestConfig.data.Payment && requestConfig.data.Payment.Type === 'DebitCard') {
      requestConfig.data.Payment.Type = 'SplittedDebitCard';
    }

    if (requestConfig.url.includes('/sales')) {
      let data = requestConfig.data;

      const amount = parseInt(url.parse(requestConfig.url, true).query.amount, 10);

      const missingSplitConfig = !!amount && !data.split;

      if (missingSplitConfig) {
        return Promise.reject(new Error('The split config is needed for partial cancellations'));
      }

      if (data.split) {
        const splitSum = data.split.reduce((sum, config) => sum + config.amount, 0);

        if (!amount || splitSum !== amount) {
          return Promise.reject(new Error('The sum of amounts in each split configuration must equal the amount in the querystring'));
        }

        data.VoidSplitPayments = data.split.map(config => ({
          SubordinateMerchantId: config.merchantId,
          VoidedAmount: config.amount,
        }));

        data = Object.assign({}, data, { amount: undefined, split: undefined });
        requestConfig.data = data;
      }
    }

    return requestConfig;
  };

  return {
    renewToken,
    requestInterceptor: (requestConfig) => {
      if (!token) {
        return renewToken().then(() => mutateConfig(requestConfig));
      }

      return mutateConfig(requestConfig);
    },
    responseInterceptor: response => response,
    responseErrorInterceptor: (error) => {
      const errorResponse = error.response || { data: [] };
      if (Array.isArray(errorResponse.data) && !!errorResponse.data.find(resp => resp.Code === 238)) {
        return renewToken().then((token) => {
          errorResponse.config.headers.Authorization = `Bearer ${token}`;
          return axios(errorResponse.config);
        });
      }

      return Promise.reject(error);
    },
  };
};
