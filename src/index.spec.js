const nock = require('nock');
const axios = require('axios');
const httpAdapter = require('axios/lib/adapters/http');

const factory = require('./index');

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

      return expect(cielo.tokenizeCard(card)).resolves.toBeDefined();
    });

    it('getCardData: makes a GET request to /1/card passing token', () => {
      const token = '0e310ad0-622e-4374-92bd-3ed17f1d6709';

      nock('https://apiquerysandbox.cieloecommerce.cielo.com.br')
        .get(`/1/card/${token}`)
        .reply(200);

      return expect(cielo.getCardData(token)).resolves.toBeDefined();
    });
  });
});