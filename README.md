## cielo-braspag

Client para a API da Cielo + Middleware Braspag em Node.Js

README baseado na lib [banzeh/cielo](https://github.com/banzeh/cielo)

[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)

## Índice

#### [Início](#instalacao)
+ [Instalação](#instalacao)
+ [Como Utilizar](#howtouse)
+ [Paramêtros de criação](#params)

### [API Cielo](#cielo-api)
+ [Tokenização de cartões](#card-tokenization)
+ [Cancelamento de vendas](#sale-cancellation)
+ [Análise de Fraude](#fraud-analysis)

### [API Braspag](#braspag-api)

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

| Campo | Descrição | Obrigatório? | Default |
| ------------- |:-------------:| -----:| -----:|
| MerchantId | Identificador da loja/marketplace na Cielo. | Sim | null |
| MerchantKey | Chave Publica para Autenticação Dupla na Cielo. | Sim | null |
| sandbox | Utilizará o ambientede testes da Cielo? | Não | false |

### Braspag
---

| Campo | Descrição | Obrigatório? | Default |
| ------------- |:-------------:| -----:| -----:|
| ClientId | Identificador da loja/marketplace na Cielo. | Sim | null |
| ClientSecret | Chave Publica para Autenticação Dupla na Cielo. | Sim | null |
| sandbox | Utilizará o ambientede testes da Cielo? | Não | false |

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
const params = {
  paymentId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  amount: 12500,
};

// PUT para /1/sales/{paymentId}/void?amount={amount}
cielo.creditCards.cancelSale(params);
```

### <a name="fraud-analysis"></a> [Análises de Fraude](https://developercielo.github.io/manual/cielo-ecommerce#transa%C3%A7%C3%A3o-com-analise-de-fraude-(af))
Caso deseje utilizar a análise de fraude, passe os dados necessários no segundo parâmetro de qualquer método de pagamento (por exemplo, payWithToken), de acordo com a documentação da Cielo.

## <a name="braspag-api"></a> API Braspag
O código relativo à Braspag serve apenas como um middleware para conformar a chamada aos requisitos da Braspag de forma transparente.

Deve ser usado da seguinte maneira:
```js
cielo.use(braspag)
```
onde o objeto braspag é criado desta forma:
```js
const braspag = cieloBraspag.braspag(paramsBraspag);
```
como mencionado na seção [como utilizar](#howtouse)

### Interceptors
#### requestInterceptor
Verifica se há um oauth token. Caso não haja, chama internamente `renewToken()`. Após isso, modifica a configuração da chamada para a API da Cielo:

- Adiciona o header Authorization com o valor `Bearer [oauth_token]`
- Altera o body.Payment.Type de CreditCard para SplittedCreditCard ou de DebitCard para SplittedDebitCard
#### responseInterceptor
Apenas retorna a response.

#### responseErrorInterceptor
Verifica se o código de erro é 401 e se há no array de erros da resposta algum erro com código 238 (token expirado). Em caso positivo, faz uma chamada interna para `renewToken()` e após a obtenção de novo token, refaz a chamada original.

### Renovar token oauth
#### Use caso você queira renovar explicitamente o token e obtê-lo posteriormente. Normalmente não será necessário chamar este método.
```js
braspag.renewToken().then((token) => {})
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
