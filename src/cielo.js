const axios = require('axios');

const CIELO_SANDBOX_QUERY_URL = 'https://apiquerysandbox.cieloecommerce.cielo.com.br';
const CIELO_SANDBOX_POST_URL = 'https://apisandbox.cieloecommerce.cielo.com.br';

const CIELO_PRODUCTION_QUERY_URL = 'https://apiquery.cieloecommerce.cielo.com.br';
const CIELO_PRODUCTION_POST_URL = 'https://api.cieloecommerce.cielo.com.br';

module.exports = (config) => {
  const headers = {
    MerchantId: config.merchantId,
    MerchantKey: config.merchantKey,
  };

  const getInstance = axios.create({
    baseURL: config.sandbox ? CIELO_SANDBOX_QUERY_URL : CIELO_PRODUCTION_QUERY_URL,
    headers,
  });

  const postInstance = axios.create({
    baseURL: config.sandbox ? CIELO_SANDBOX_POST_URL : CIELO_PRODUCTION_POST_URL,
    headers,
  });

  return {
    use: (middleware) => {
      getInstance.interceptors.request.use(middleware.requestInterceptor);
      getInstance.interceptors.response.use(middleware.responseInterceptor, middleware.responseErrorInterceptor);

      postInstance.interceptors.request.use(middleware.requestInterceptor);
      postInstance.interceptors.response.use(middleware.responseInterceptor, middleware.responseErrorInterceptor);
    },
    cards: {
      tokenizeCard: card => postInstance.post('/1/card', {
        CustomerName: card.customerName,
        CardNumber: card.number,
        Holder: card.holder,
        ExpirationDate: card.expirationDate,
        Brand: card.brand,
      }),
      getCard: token => getInstance.get(`/1/card/${token}`),
    },
    creditCards: {
      payWithToken: (params) => {
        const paymentParams = {
          RequestId: params.requestId,
          MerchantOrderId: params.merchantOrderId,
          Customer: {
            Name: params.customerName,
            Status: params.customerStatus,
          },
          Payment: {
            Type: 'CreditCard',
            Amount: params.amount,
            Installments: params.installments,
            SoftDescriptor: params.softDescriptor,
            ReturnUrl: params.returnUrl,
            CreditCard: {
              CardToken: params.cardToken,
              SecurityCode: params.cvv,
              Brand: params.brand,
            },
            Capture: params.capture || false,
          },
        };

        if (params.splitRules) {
          paymentParams.Payment.SplitPayments = params.splitRules.map(rule => ({
            SubordinateMerchantId: rule.merchantId,
            Amount: rule.amount,
            Fares: {
              Mdr: rule.mdrPercentage,
              Fee: rule.fee,
            },
          }));
        }

        return postInstance.post('/1/sales', paymentParams);
      },
      cancelSale: params => postInstance.put(`/1/sales/${params.paymentId}/void?amount=${params.amount}`),
    },
  };
};
