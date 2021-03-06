const axios = require('axios');

const CIELO_SANDBOX_QUERY_URL = 'https://apiquerysandbox.cieloecommerce.cielo.com.br';
const CIELO_SANDBOX_POST_URL = 'https://apisandbox.cieloecommerce.cielo.com.br';

const CIELO_PRODUCTION_QUERY_URL = 'https://apiquery.cieloecommerce.cielo.com.br';
const CIELO_PRODUCTION_POST_URL = 'https://api.cieloecommerce.cielo.com.br';

module.exports = config => {
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
    use: middleware => {
      getInstance.interceptors.request.use(middleware.requestInterceptor);
      getInstance.interceptors.response.use(middleware.responseInterceptor, middleware.responseErrorInterceptor);

      postInstance.interceptors.request.use(middleware.requestInterceptor);
      postInstance.interceptors.response.use(middleware.responseInterceptor, middleware.responseErrorInterceptor);
    },
    cards: {
      tokenizeCard: card =>
        postInstance.post('/1/card', {
          CustomerName: card.customerName,
          CardNumber: card.number,
          Holder: card.holder,
          ExpirationDate: card.expirationDate,
          Brand: card.brand,
        }),
      getCard: token => getInstance.get(`/1/card/${token}`),
    },
    creditCards: {
      payWithToken: (params, fraudAnalysisData) => {
        const paymentParams = {
          RequestId: params.requestId,
          MerchantOrderId: params.merchantOrderId,
          Customer: {
            Name: params.customerName,
            Status: params.customerStatus,
            Identity: params.customerIdentity,
            IdentityType: params.customerIdentityType,
            Email: params.customerEmail,
            IpAddress: params.customerIp,
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

        if (fraudAnalysisData) {
          paymentParams.Payment.FraudAnalysis = fraudAnalysisData;
        }

        return postInstance.post('/1/sales', paymentParams);
      },
      cancelSale: params => {
        const amount = params.amount;
        return postInstance.put(`/1/sales/${params.paymentId}/void${amount ? '?amount=' + amount : ''}`, params.data);
      },
    },
    consulting: {
      sale: ({ paymentId, merchantOrderId } = {}) => {
        if (!paymentId && !merchantOrderId) {
          return Promise.reject(new Error('Either paymentId or merchantOrderId must be passed'));
        }

        if (paymentId) {
          return getInstance.get(`/1/sales/${paymentId}`);
        }

        if (merchantOrderId) {
          return getInstance.get(`/1/sales?merchantOrderId=${merchantOrderId}`);
        }
      },
    },
  };
};
