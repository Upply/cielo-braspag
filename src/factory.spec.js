const axios = require('axios');

const factory = require('./index');

jest.mock('axios');

describe('Cielo API Wrapper', () => {
  describe('Wrapper Factory', () => {
    describe('Sandbox Mode', () => {
      let params = null;

      beforeEach(() => {
        params = {
          merchantId: 'my_merchant_id',
          merchantKey: 'my_merchant_key',
          sandbox: true,
        };
      });

      it('creates an instance of axios for GET requests with correct params', () => {
        jest.doMock('axios', () => ({ create: jest.fn(() => true) }));
        factory(params);
        expect(axios.create).toHaveBeenCalledWith({
          baseURL: 'https://apiquerysandbox.cieloecommerce.cielo.com.br',
          headers: {
            MerchantId: 'my_merchant_id',
            MerchantKey: 'my_merchant_key',
          },
        });
      });

      it('creates an instance of axios for POST requests with correct params', () => {
        factory(params);
        expect(axios.create).toHaveBeenLastCalledWith({
          baseURL: 'https://apisandbox.cieloecommerce.cielo.com.br',
          headers: {
            MerchantId: 'my_merchant_id',
            MerchantKey: 'my_merchant_key',
          },
        });
      });
    });

    describe('Production Mode', () => {
      let params = null;

      beforeEach(() => {
        params = {
          merchantId: 'my_merchant_id',
          merchantKey: 'my_merchant_key',
          sandbox: false,
        };
      });

      it('creates an instance of axios for GET requests with correct params', () => {
        factory(params);
        expect(axios.create).toHaveBeenCalledWith({
          baseURL: 'https://apiquery.cieloecommerce.cielo.com.br',
          headers: {
            MerchantId: 'my_merchant_id',
            MerchantKey: 'my_merchant_key',
          },
        });
      });

      it('creates an instance of axios for POST requests with correct params', () => {
        factory(params);
        expect(axios.create).toHaveBeenLastCalledWith({
          baseURL: 'https://api.cieloecommerce.cielo.com.br',
          headers: {
            MerchantId: 'my_merchant_id',
            MerchantKey: 'my_merchant_key',
          },
        });
      });
    });
  });
});