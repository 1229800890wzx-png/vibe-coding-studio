const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function api() {
  const requests = [];
  const source = fs
    .readFileSync(require('node:path').join(__dirname, '../sheep/api/trade/order.js'), 'utf8')
    .replace(/^import .*;\r?\n/gm, '')
    .replace('export default OrderApi;', 'globalThis.OrderApi = OrderApi;');
  const context = vm.createContext({
    request: (request) => {
      requests.push(request);
      return Promise.resolve(request);
    },
    isEmpty: (value) => value == null || value === '',
  });
  vm.runInContext(source, context);
  return { order: context.OrderApi, requests };
}

test('same cohort for two siblings stays two child-bound quote lines', async () => {
  const { order, requests } = api();
  await order.settlementOrder({
    deliveryType: 3,
    items: [
      { skuId: 91, count: 1, studentId: 101, cartId: 501 },
      { skuId: 91, count: 1, studentId: 102, cartId: 502 },
    ],
  });
  const query = new URL(requests[0].url, 'http://localhost').searchParams;
  assert.equal(query.get('items[0].studentId'), '101');
  assert.equal(query.get('items[1].studentId'), '102');
  assert.equal(query.get('items[0].cartId'), '501');
  assert.equal(query.get('items[1].cartId'), '502');
  assert.equal(query.get('items[0].count'), '1');
  assert.equal(query.get('items[1].count'), '1');
  assert.equal(query.get('deliveryType'), '3');
  assert.equal(query.has('addressId'), false);
});

test('existing merchandise quote has no fabricated child ID', async () => {
  const { order, requests } = api();
  await order.settlementOrder({ deliveryType: 1, addressId: 20, items: [{ skuId: 91, count: 3 }] });
  const query = new URL(requests[0].url, 'http://localhost').searchParams;
  assert.equal(query.has('items[0].studentId'), false);
  assert.equal(query.get('items[0].count'), '3');
  assert.equal(query.get('addressId'), '20');
});

test('order creation keeps child identities in original trade request body', async () => {
  const { order, requests } = api();
  const payload = {
    deliveryType: 3,
    items: [
      { skuId: 9, studentId: 10, count: 1 },
      { skuId: 9, studentId: 11, count: 1 },
    ],
  };
  await order.createOrder(payload);
  assert.equal(requests[0].url, '/trade/order/create');
  assert.deepEqual(requests[0].data, payload);
});
