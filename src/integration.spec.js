const nock = require('nock');
const axios = require('axios');
const httpAdapter = require('axios/lib/adapters/http');

const cieloFactory = require('./cielo');
const braspagFactory = require('./braspag');

const host = 'http://localhost';
axios.defaults.host = host;
axios.defaults.adapter = httpAdapter;


describe('Integration tests Cielo - Braspag', () => {
  it('calls cielo.payWithToken and braspag modifies the request headers and body', () => {
    nock('https://authsandbox.braspag.com.br')
      .matchHeader('content-type', 'application/x-www-form-urlencoded')
      .post('/oauth2/token', { grant_type: 'client_credentials' })
      .reply(200, { access_token: '1omg3om23otoken103mg0mgblablablaogm2o3mog' });

    const cieloParams = {
      merchantId: 'my_merchant_id',
      merchantKey: 'my_merchant_key',
      sandbox: true,
    };

    const cielo = cieloFactory(cieloParams);

    const params = {
      requestId: 'some_id',
      merchantOrderId: '1234',
      customerName: 'Biro da Silva',
      customerStatus: 'NEW',
      amount: 12000,
      installments: 2,
      softDescriptor: 'some bullcrap',
      returnUrl: 'http://google.com',
      cardToken: '0e310ad0-622e-4374-92bd-3ed17f1d6709',
      cvv: '456',
      brand: 'Master'
    };

    const scope = nock('https://apisandbox.cieloecommerce.cielo.com.br')
      .matchHeader('Authorization', 'Bearer 1omg3om23otoken103mg0mgblablablaogm2o3mog')
      .post('/1/sales', {
        RequestId: params.requestId,
        MerchantOrderId: params.merchantOrderId,
        Customer: {
          Name: params.customerName,
          Status: params.customerStatus,
        },
        Payment: {
          Type: 'SplittedCreditCard',
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
      })
      .reply(200);

    const braspag = braspagFactory({ clientId: 'id', clientSecret: 'secret', sandbox: true });
    cielo.use(braspag);
    return cielo.creditCards.payWithToken(params).then(() => {
      expect(scope.isDone()).toBe(true);
    });
  });
});
