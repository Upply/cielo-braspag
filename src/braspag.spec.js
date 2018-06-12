const nock = require('nock');
const axios = require('axios');
const httpAdapter = require('axios/lib/adapters/http');

const cieloFactory = require('./cielo');
const braspagFactory = require('./braspag');

const host = 'http://localhost';
axios.defaults.host = host;
axios.defaults.adapter = httpAdapter;

describe('Braspag Middleware', () => {
  let authScope = null;

  beforeEach(() => {
    authScope = nock('https://authsandbox.braspag.com.br')
      .matchHeader('content-type', 'application/x-www-form-urlencoded')
      .post('/oauth2/token', { grant_type: 'client_credentials' })
      .reply(200, { access_token: '1omg3om23otoken103mg0mgblablablaogm2o3mog' });
  });

  afterEach(() => {
    nock.cleanAll();
  })

  it('fetches an auth token', () => {
    const braspag = braspagFactory({ clientId: 'id', clientSecret: 'secret', sandbox: true });
    return braspag.renewToken().then(() => {
      expect(authScope.isDone()).toBe(true);
    });
  });

  it('automatically fetches a new token when the token is null', () => {
    const scope = nock('https://myapi.com.br')
      .matchHeader('Authorization', 'Bearer 1omg3om23otoken103mg0mgblablablaogm2o3mog')
      .post('/endpoint', { some_data: 'blablabla' })
      .reply(200);

    const wrapperAxiosInstance = axios.create({ baseURL: 'https://myapi.com.br' });
    const someWrapper = {
      use: middleware => wrapperAxiosInstance.interceptors.request.use(middleware),
      doSomething: () => wrapperAxiosInstance.post('/endpoint', { some_data: 'blablabla' }),
    };

    const braspag = braspagFactory({ clientId: 'id', clientSecret: 'secret', sandbox: true });

    someWrapper.use(braspag.intercept);

    return someWrapper.doSomething().then(() => {
      expect(scope.isDone()).toBe(true);
    });
  });

  it.skip('automatically renews token when the API response shows that the token has expired', () => {});

  describe('changes request body data', () => {
    const braspag = braspagFactory({ clientId: 'id', clientSecret: 'secret', sandbox: true });

    let wrapperAxiosInstance = null;

    beforeEach(() => {
      wrapperAxiosInstance = axios.create({ baseURL: 'https://myapi.com.br' });
    });

    it('changes body data Payment.Type from to SplittedCreditCard', () => {
      const scope = nock('https://myapi.com.br')
        .post('/endpoint', { Payment: { Type: 'SplittedCreditCard' } })
        .reply(200);

      const someWrapper = {
        use: middleware => wrapperAxiosInstance.interceptors.request.use(middleware),
        doSomething: () => wrapperAxiosInstance.post('/endpoint', {
          Payment: {
            Type: 'CreditCard',
          },
        }),
      };

      someWrapper.use(braspag.intercept);

      return someWrapper.doSomething().then(() => {
        expect(scope.isDone()).toBe(true);
      });
    });

    it('changes body data Payment.Type from to SplittedDebitCard', () => {
      const scope = nock('https://myapi.com.br')
        .post('/endpoint', { Payment: { Type: 'SplittedDebitCard' } })
        .reply(200);

      const someWrapper = {
        use: middleware => wrapperAxiosInstance.interceptors.request.use(middleware),
        doSomething: () => wrapperAxiosInstance.post('/endpoint', {
          Payment: {
            Type: 'DebitCard',
          },
        }),
      };

      someWrapper.use(braspag.intercept);

      return someWrapper.doSomething().then(() => {
        expect(scope.isDone()).toBe(true);
      });
    });
  });


});
