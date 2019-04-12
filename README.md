## cielo-braspag

Client para a API da Cielo + Middleware Braspag em Node.Js

README baseado na lib [banzeh/cielo](https://github.com/banzeh/cielo)

[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)

## Índice

#### [Início](#instalacao)

- [Instalação](#instalacao)
- [Como Utilizar](#howtouse)
- [Paramêtros de criação](#params)

### [API Cielo](#cielo-api)

- [Tokenização de cartões](#card-tokenization)
- [Cancelamento de vendas](#sale-cancellation)
- [Análise de Fraude](#fraud-analysis)
- [Consulta de transações](#sale-consult)

### [API Braspag](#braspag-api)

- [Agenda Financeira](#financial-agenda)

#### [Referência da API](#apiReference)

#### [Testes](#testes)

#### [Autor](#autor)

#### [Contribua](#contribua)

#### [Licença](#license)

## <a name="instalacao"></a> Installation

```js
npm install --save cielo-braspag
// ou
yarn add cielo-braspag
```

## <a name="howtouse"></a> Como utilizar?

### Iniciando

```js
const paramsCielo = {
    MerchantId: 'xxxxxxxxxxxxxxxxxxxxxxx',
    MerchantKey: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
    sandbox: true, // Opcional - Ambiente de Testes
};

const cieloBraspag = require('cielo-braspag');
const cielo = cieloBraspag.cielo(paramsCielo);

// Caso precise integrar com a Braspag para utilizar o split de pagamentos
const paramsBraspag = {
  clientId: 'xxxxxxxxxxxxxxxxxxxxxxx', // merchantId
  clientSecret: 'xxxxxxxxxxxxxxxxxxxxxxxxxx', // merchantKey
  sandbox: true, // Opcional - Ambiente de Testes
};

const braspag = cieloBraspag.braspag(paramsBraspag);
cielo.use(braspag); // IMPORTANTE!
```

### <a name="params"></a> Paramêtros de criação

### Cielo

---

| Campo       |                    Descrição                    | Obrigatório? | Default |
| ----------- | :---------------------------------------------: | -----------: | ------: |
| MerchantId  |   Identificador da loja/marketplace na Cielo.   |          Sim |    null |
| MerchantKey | Chave Publica para Autenticação Dupla na Cielo. |          Sim |    null |
| sandbox     |     Utilizará o ambientede testes da Cielo?     |          Não |   false |

### Braspag

---

| Campo        |                    Descrição                    | Obrigatório? | Default |
| ------------ | :---------------------------------------------: | -----------: | ------: |
| ClientId     |   Identificador da loja/marketplace na Cielo.   |          Sim |    null |
| ClientSecret | Chave Publica para Autenticação Dupla na Cielo. |          Sim |    null |
| sandbox      |     Utilizará o ambientede testes da Cielo?     |          Não |   false |

## <a name="cielo-api"></a> API Cielo

### <a name="card-tokenization"></a> Tokenização de cartões

#### [Criando um cartão tokenizado](https://developercielo.github.io/manual/cielo-ecommerce#criando-um-cart%C3%A3o-tokenizado)

```js
const card = {
  customerName: 'Biro de Biro',
  number: '4123555598761234',
  holder: 'BIRO BIRO',
  expirationDate: '07/2027',
  brand: 'Visa',
};

// POST para /1/card
cielo.cards.tokenizeCard(card, [fraudAnalysisData]);
```

#### Consultando um cartão pelo token gerado

```js
const token = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

// GET para /1/card/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
cielo.cards.tokenizeCard(card);
```

#### [Criando uma venda com cartão tokenizado](https://developercielo.github.io/manual/cielo-ecommerce#criando-uma-venda-com-cart%C3%A3o-tokenizado)

```js
const params = {
  requestId: 'some_id',
  merchantOrderId: '1234',
  customerName: 'Biro da Silva',
  customerStatus: 'NEW',
  customerIdentity: '11225468954',
  customerIdentityType: 'CPF', // ou 'CNPJ'
  amount: 12000,
  installments: 2,
  softDescriptor: 'some bullcrap',
  returnUrl: 'http://google.com',
  cardToken: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  cvv: 'xxx',
  brand: 'Master',
  capture: false, // ou true para autorizar E capturar a venda
};

// POST para /1/sales
cielo.creditCards.payWithToken(params);
```

### <a name="sale-cancellation"></a> [Cancelamento de vendas](https://developercielo.github.io/manual/cielo-ecommerce#cancelamento-total)

```js
// cancelamento total

const params = {
  paymentId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
};

// PUT para /1/sales/{paymentId}/void
cielo.creditCards.cancelSale(params);

// ou cancelamento parcial

const params = {
  paymentId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  amount: 12500,
};

// PUT para /1/sales/{paymentId}/void?amount=12500
cielo.creditCards.cancelSale(params);
```

### <a name="sale-consult"></a> [Consulta de transações](https://developercielo.github.io/manual/cielo-ecommerce#consulta-paymentid)

```js
// consulta por paymentId

const params = {
  paymentId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
};

// GET para /1/sales/{paymentId}
cielo.consulting.sale(params);

// ou consulta por merchantOrderId

const params = {
  merchantOrderId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
};

// GET para /1/sales?merchantOrderId={merchantOrderId}
cielo.consulting.sale(params);
```

### <a name="fraud-analysis"></a> [Análises de Fraude](<https://developercielo.github.io/manual/cielo-ecommerce#transa%C3%A7%C3%A3o-com-analise-de-fraude-(af)>)

Caso deseje utilizar a análise de fraude, passe os dados necessários no segundo parâmetro de qualquer método de pagamento (por exemplo, payWithToken), de acordo com a documentação da Cielo.

## <a name="braspag-api"></a> API Braspag

O código relativo à Braspag serve tanto como um middleware para conformar a chamada aos requisitos da Braspag de forma transparente, quanto para fazer operações específicas da API da Braspag (por exemplo, ajustes em transações com split).

Para utilizá-la como middleware, você deve configurar o objeto `cielo` assim:

```js
cielo.use(braspag);
```

onde o objeto braspag é criado desta forma:

```js
const braspag = cieloBraspag.braspag(paramsBraspag);
```

como mencionado na seção [como utilizar](#howtouse)

Além disso, há operações específicas da plataforma da Braspag:

### <a name="financial-agenda"></a> Agenda Financeira

#### [Ajustando de uma transação com split](https://braspag.github.io//manual/split-pagamentos-braspag#ajustes)

Importante: ambos os merchantIds devem ter participado da transação. Não é possível ajustar uma transação para incluir um novo merchant id.

```js
const params = {
  merchantIdToDebit: 'EA4DB25A-F981-4849-87FF-026897E006C6',
  merchantIdToCredit: '44F68284-27CF-43CB-9D14-1B1EE3F36838',
  adjustDate: new Date(2018, 8, 17),
  amount: 1200,
  description: 'Lorem Ipsum Dolor Sit Amet',
  transactionId: '717A0BD0-3D92-43DB-9D1E-9B82DFAFA392',
};

// POST para /adjustment-api/adjustments/
braspag.financialAgenda.adjustTransaction(params);
```

#### Consultando um ajuste

```js
const transactionId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

// GET para /adjustment-api/adjustments/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
braspag.financialAgenda.getAdjustment(transactionId);
```

### Interceptors

#### requestInterceptor

Verifica se há um oauth token. Caso não haja, chama internamente `renewToken()`. Após isso, modifica a configuração da chamada para a API da Cielo:

- Adiciona o header Authorization com o valor `Bearer [oauth_token]`
- Altera o body.Payment.Type de CreditCard para SplittedCreditCard ou de DebitCard para SplittedDebitCard
- Na chamada de cancelSale, para cancelamentos **parciais**, torna **obrigatório** passar a configuração de split, cuja soma do campo "amount" deve ser **igual** a params.amount, como no exemplo abaixo:

```js
// cancelamento total (sem alterações)

const params = {
  paymentId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
};

// PUT para /1/sales/{paymentId}/void
cielo.creditCards.cancelSale(params);

// ou cancelamento parcial

const params = {
  paymentId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  amount: 12500,
  split: [
    {
      merchantId: 'first-merchant-id',
      amount: 10000,
    },
    {
      merchantId: 'second-merchant-id',
      amount: 2500,
    },
  ],
};

// PUT para /1/sales/{paymentId}/void?amount=12500
cielo.creditCards.cancelSale(params);
```

#### responseInterceptor

Apenas retorna a response.

#### responseErrorInterceptor

Verifica se o código de erro é 401 e se há no array de erros da resposta algum erro com código 238 (token expirado). Em caso positivo, faz uma chamada interna para `renewToken()` e após a obtenção de novo token, refaz a chamada original.

### Renovar token oauth

#### Use caso você queira renovar explicitamente o token e obtê-lo posteriormente. Normalmente não será necessário chamar este método.

```js
braspag.renewToken().then(token => {});
```

## <a name="apiReference"></a> Referência da API

Consulte os campos necessários na documentação da Cielo

[PT-Br](http://developercielo.github.io/Webservice-3.0/?shell#integração-api-3.0)

[En](http://developercielo.github.io/Webservice-3.0/english.html#api-integration-3.0)

Consulte os campos necessários para Split de Pagamentos na documentação da Braspag

[PT-Br](https://braspag.github.io/manual/split-pagamentos-braspag)

## <a name="testes"></a> Testes

Para rodar os testes automatizados, apenas execute o seguinte comando

```js
npm test
// ou
yarn test
```

## <a name="autor"></a> Autor

André Mazoni

[Github](https://github.com/andremw)

## <a name="contribua"></a> Contribua

Recursos da API estão sendo implementados conforme a necessidade. Caso precise de alguma, não hesite em solicitar ou em adicioná-la à lib.
Contribuições são bem vindas.

## <a name="license"></a> Licença

MIT License
