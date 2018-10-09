const nock = require('nock');
const axios = require('axios');
const httpAdapter = require('axios/lib/adapters/http');

const cieloFactory = require('./cielo');
const braspagFactory = require('./braspag');

const host = 'http://localhost';
axios.defaults.host = host;
axios.defaults.adapter = httpAdapter;

describe('Braspag Middleware', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('fetches an auth token', () => {
    const authScope = nock('https://authsandbox.braspag.com.br')
      .matchHeader('content-type', 'application/x-www-form-urlencoded')
      .post('/oauth2/token', { grant_type: 'client_credentials' })
      .reply(200, { access_token: '1omg3om23otoken103mg0mgblablablaogm2o3mog' });

    const braspag = braspagFactory({ clientId: 'id', clientSecret: 'secret', sandbox: true });
    return braspag.renewToken().then(() => {
      expect(authScope.isDone()).toBe(true);
    });
  });

  it('automatically fetches a new token when the token is null', () => {
    nock('https://authsandbox.braspag.com.br')
      .matchHeader('content-type', 'application/x-www-form-urlencoded')
      .post('/oauth2/token', { grant_type: 'client_credentials' })
      .reply(200, { access_token: '1omg3om23otoken103mg0mgblablablaogm2o3mog' });

    const scope = nock('https://myapi.com.br')
      .matchHeader('Authorization', 'Bearer 1omg3om23otoken103mg0mgblablablaogm2o3mog')
      .post('/endpoint', { some_data: 'blablabla' })
      .reply(200);

    const wrapperAxiosInstance = axios.create({ baseURL: 'https://myapi.com.br' });
    const someWrapper = {
      use: middleware => wrapperAxiosInstance.interceptors.request.use(middleware.requestInterceptor),
      doSomething: () => wrapperAxiosInstance.post('/endpoint', { some_data: 'blablabla' }),
    };

    const braspag = braspagFactory({ clientId: 'id', clientSecret: 'secret', sandbox: true });

    someWrapper.use(braspag);

    return someWrapper.doSomething().then(() => {
      expect(scope.isDone()).toBe(true);
    });
  });

  it('automatically renews token when the API response shows that the token has expired', () => {
    nock('https://authsandbox.braspag.com.br')
      .matchHeader('content-type', 'application/x-www-form-urlencoded')
      .post('/oauth2/token', { grant_type: 'client_credentials' })
      .reply(200, { access_token: 'oktoken12312412thisisookey102mv30m' })

    const replyHandler = jest.fn(function() {
      if (this.req.headers.authorization === 'Bearer 1omg3om23otoken103mg0mgblablablaogm2o3mog') {
        return [
          401,
          [{ Code: 238, Message: 'This Token is invalid ' }],
        ];
      }

      return [200, {}];
    });

    const apiNock = nock('https://myapi.com.br')
      .post('/endpoint')
      .reply(replyHandler)
      .post('/endpoint')
      .reply(replyHandler);

    // calls the endpoint once, gets an error
    const wrapperAxiosInstance = axios.create({ baseURL: 'https://myapi.com.br' });
    const someWrapper = {
      use: (middleware) => {
        wrapperAxiosInstance.interceptors.request.use(middleware.requestInterceptor)
        wrapperAxiosInstance.interceptors.response.use(middleware.responseInterceptor, middleware.responseErrorInterceptor);
      },
      doSomething: jest.fn(() => wrapperAxiosInstance.post('/endpoint', { some_data: 'blablabla' })),
    };

    const braspag = braspagFactory({ clientId: 'id', clientSecret: 'secret', sandbox: true });

    someWrapper.use(braspag);

    return someWrapper.doSomething().then((data) => {
      expect(data).toBeDefined();
      expect(replyHandler).toHaveBeenCalledTimes(2);
      expect(apiNock.isDone()).toBe(true);
    });
  });

  describe('changes request body data', () => {
    const braspag = braspagFactory({ clientId: 'id', clientSecret: 'secret', sandbox: true });

    let wrapperAxiosInstance = null;

    beforeEach(() => {
      wrapperAxiosInstance = axios.create({ baseURL: 'https://myapi.com.br' });
      nock('https://authsandbox.braspag.com.br')
        .post('/oauth2/token', { grant_type: 'client_credentials' })
        .reply(200, { access_token: '1omg3om23otoken103mg0mgblablablaogm2o3mog' });
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('changes body data Payment.Type from to SplittedCreditCard', () => {
      const scope = nock('https://myapi.com.br')
        .post('/endpoint', { Payment: { Type: 'SplittedCreditCard' } })
        .reply(200);

      const someWrapper = {
        use: middleware => wrapperAxiosInstance.interceptors.request.use(middleware.requestInterceptor),
        doSomething: () => wrapperAxiosInstance.post('/endpoint', {
          Payment: {
            Type: 'CreditCard',
          },
        }),
      };

      someWrapper.use(braspag);

      return someWrapper.doSomething().then(() => {
        expect(scope.isDone()).toBe(true);
      });
    });

    it('changes body data Payment.Type from to SplittedDebitCard', () => {
      const scope = nock('https://myapi.com.br')
        .post('/endpoint', { Payment: { Type: 'SplittedDebitCard' } })
        .reply(200);

      const someWrapper = {
        use: middleware => wrapperAxiosInstance.interceptors.request.use(middleware.requestInterceptor),
        doSomething: () => wrapperAxiosInstance.post('/endpoint', {
          Payment: {
            Type: 'DebitCard',
          },
        }),
      };

      someWrapper.use(braspag);

      return someWrapper.doSomething().then(() => {
        expect(scope.isDone()).toBe(true);
      });
    });

    it('throws an error if the split config is not passed for a partial cancellation', () => {
      const someWrapper = {
        use: middleware => wrapperAxiosInstance.interceptors.request.use(middleware.requestInterceptor),
        doSomething: () => wrapperAxiosInstance.put('/sales/0123456789/void?amount=1500', {
          amount: 1500,
        }),
      };

      someWrapper.use(braspag);

      return someWrapper.doSomething().catch((error) => {
        expect(error).toBeDefined();
        expect(error.message).toEqual('The split config is needed for partial cancellations');
      });
    });

    it('throws an error if the sum of the amounts in each split object is different than the amount in the querystring', () => {
      const someWrapper = {
        use: middleware => wrapperAxiosInstance.interceptors.request.use(middleware.requestInterceptor),
        doSomething: () => wrapperAxiosInstance.put('/sales/0123456789/void?amount=1500', {
          amount: 1500,
          split: [{
            amount: 500,
            merchantId: '01234',
          }, {
            amount: 200,
            merchantId: '56789',
          }],
        }),
      };

      someWrapper.use(braspag);

      return someWrapper.doSomething().catch((error) => {
        expect(error).toBeDefined();
        expect(error.message).toEqual('The sum of amounts in each split configuration must equal the amount in the querystring');
      });
    });

    it('changes body data when partially cancelling a purchase', () => {
      const scope = nock('https://myapi.com.br')
        .put('/sales/0123456789/void?amount=1500', {
          VoidSplitPayments: [{
            SubordinateMerchantId: '01234',
            VoidedAmount: 1200,
          }, {
            SubordinateMerchantId: '56789',
            VoidedAmount: 300,
          }],
        })
        .reply(200);

      const someWrapper = {
        use: middleware => wrapperAxiosInstance.interceptors.request.use(middleware.requestInterceptor),
        doSomething: () => wrapperAxiosInstance.put('/sales/0123456789/void?amount=1500', {
          amount: 1500,
          split: [{
            amount: 1200,
            merchantId: '01234',
          }, {
            amount: 300,
            merchantId: '56789',
          }],
        }),
      };

      someWrapper.use(braspag);

      return someWrapper.doSomething().then(() => {
        expect(scope.isDone()).toBe(true);
      });
    });
  });
});
