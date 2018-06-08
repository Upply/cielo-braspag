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
      payWithToken: params => postInstance.post('/1/sales', {
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
        },
      }),
    },
  };
};