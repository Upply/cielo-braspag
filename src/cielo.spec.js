const nock = require('nock');
const axios = require('axios');
const httpAdapter = require('axios/lib/adapters/http');

const factory = require('./cielo');

const host = 'http://localhost';
axios.defaults.host = host;
axios.defaults.adapter = httpAdapter;

describe('Cielo API Wrapper', () => {
  describe('Card Tokenization', () => {
    const params = {
      merchantId: 'my_merchant_id',
      merchantKey: 'my_merchant_key',
      sandbox: true,
    };

    let cielo = null;

    beforeEach(() => {
      cielo = factory(params);
    });

    describe('cielo.cards', () => {
      it('tokenizeCard: makes a POST request to /1/card passing correct parameters', () => {
        const card = {
          customerName: 'Biro de Biro',
          number: '4123555598761234',
          holder: 'BIRO BIRO',
          expirationDate: '07/2027',
          brand: 'Visa',
        };

        nock('https://apisandbox.cieloecommerce.cielo.com.br')
          .post('/1/card', {
            CustomerName: card.customerName,
            CardNumber: card.number,
            Holder: card.holder,
            ExpirationDate: card.expirationDate,
            Brand: card.brand,
          })
          .reply(200);

        return expect(cielo.cards.tokenizeCard(card)).resolves.toBeDefined();
      });

      it('getCard: makes a GET request to /1/card passing token', () => {
        const token = '0e310ad0-622e-4374-92bd-3ed17f1d6709';

        nock('https://apiquerysandbox.cieloecommerce.cielo.com.br')
          .get(`/1/card/${token}`)
          .reply(200);

        return expect(cielo.cards.getCard(token)).resolves.toBeDefined();
      });
    });

    describe('cielo.creditCard', () => {
      it('payWithToken: calls /1/sales to make a purchase with a tokenized card', () => {
        const params = {
          requestId: 'some_id',
          merchantOrderId: '1234',
          customerName: 'Biro da Silva',
          customerStatus: 'NEW',
          customerEmail: 'lero@lero.com',
          customerIdentity: '11225468954',
          customerIdentityType: 'CPF',
          customerIp: '123:123:123:255',
          amount: 12000,
          installments: 2,
          softDescriptor: 'some bullcrap',
          returnUrl: 'http://google.com',
          cardToken: '0e310ad0-622e-4374-92bd-3ed17f1d6709',
          cvv: '456',
          brand: 'Master',
          capture: true,
          splitRules: [
            {
              amount: 12000,
              merchantId: 'restaurant_merchant_id',
              mdrPercentage: 3,
              fee: 50,
            },
          ],
        };

        nock('https://apisandbox.cieloecommerce.cielo.com.br')
          .post('/1/sales', {
            RequestId: params.requestId,
            MerchantOrderId: params.merchantOrderId,
            Customer: {
              Name: params.customerName,
              Status: params.customerStatus,
              Email: 'lero@lero.com',
              Identity: '11225468954',
              IdentityType: 'CPF',
              IpAddress: '123:123:123:255',
            },
            Payment: {
              Type: 'CreditCard',
              Amount: params.amount,
              Installments: params.installments,
              SoftDescriptor: params.softDescriptor,
              ReturnUrl: params.returnUrl,
              Capture: true,
              CreditCard: {
                CardToken: params.cardToken,
                SecurityCode: params.cvv,
                Brand: params.brand,
              },
              SplitPayments: [
                {
                  SubordinateMerchantId: 'restaurant_merchant_id',
                  Amount: 12000,
                  Fares: {
                    Mdr: 3,
                    Fee: 50,
                  },
                },
              ],
            },
          })
          .reply(200);

        return expect(cielo.creditCards.payWithToken(params)).resolves.toBeDefined();
      });

      it('cancelSale: calls /1/sales/{paymentId}/void to cancel a sale', () => {
        const params = {
          paymentId: '123456',
        };

        const firstScope = nock('https://apisandbox.cieloecommerce.cielo.com.br')
          .put(`/1/sales/${params.paymentId}/void`)
          .reply(200);

        const secondScope = nock('https://apisandbox.cieloecommerce.cielo.com.br')
          .put(`/1/sales/${params.paymentId}/void?amount=1500`)
          .reply(200);

        let firstCallPromise = cielo.creditCards.cancelSale(params);

        params.amount = 1500;

        let secondCallPromise = cielo.creditCards.cancelSale(params);

        const promises = [firstCallPromise, secondCallPromise];

        return Promise.all(promises).then(() => {
          expect(firstScope.isDone()).toBe(true);
          expect(secondScope.isDone()).toBe(true);
        });
      });
    });

    describe('cielo.consulting', () => {
      it('sale: returns a rejected Promise if neither paymentId nor merchantOrderId are passed', () => {
        return cielo.consulting.sale({}).catch(error => {
          expect(error).toBeDefined();
          expect(error.message).toEqual('Either paymentId or merchantOrderId must be passed');
        });
      });

      it('sale: calls /1/sales/{paymentId} to GET payment data', () => {
        const params = { paymentId: '123456' };
        const firstScope = nock('https://apiquerysandbox.cieloecommerce.cielo.com.br')
          .get(`/1/sales/${params.paymentId}`)
          .reply(200);

        return cielo.consulting.sale(params).then(() => expect(firstScope.isDone()).toBe(true));
      });

      it('sale: calls /1/sales/?merchantOrderId={merchantOrderId} to GET payment data', () => {
        const params = { merchantOrderId: '123456' };
        const firstScope = nock('https://apiquerysandbox.cieloecommerce.cielo.com.br')
          .get(`/1/sales?merchantOrderId=${params.merchantOrderId}`)
          .reply(200);

        return cielo.consulting.sale(params).then(() => expect(firstScope.isDone()).toBe(true));
      });
    });
  });
});
