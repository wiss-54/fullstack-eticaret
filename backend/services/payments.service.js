const crypto = require('crypto');

function getProvider() {
  const value = (process.env.PAYMENT_PROVIDER || 'mock').trim().toLowerCase();
  if (value === 'paytr') return 'paytr';
  return 'mock';
}

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function getBackendPublicUrl() {
  return (process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`).replace(
    /\/$/,
    '',
  );
}

function isPaytrConfigured() {
  return Boolean(
    process.env.PAYTR_MERCHANT_ID &&
      process.env.PAYTR_MERCHANT_KEY &&
      process.env.PAYTR_MERCHANT_SALT,
  );
}

function formatPaytrAddress(order) {
  const parts = [
    order.shippingAddressLine || order.shippingAddress,
    order.shippingDistrict,
    order.shippingCity,
  ].filter(Boolean);
  return parts.join(', ').slice(0, 400);
}

function buildBasket(order) {
  const items = (order.items ?? []).map((item) => [
    item.productName.slice(0, 100),
    Number(item.unitPrice).toFixed(2),
    item.quantity,
  ]);

  if (items.length === 0) {
    items.push([`Siparis #${order.id}`, Number(order.total).toFixed(2), 1]);
  }

  return Buffer.from(JSON.stringify(items)).toString('base64');
}

function buildPaytrToken({
  merchantId,
  userIp,
  merchantOid,
  email,
  paymentAmount,
  userBasket,
  noInstallment,
  maxInstallment,
  currency,
  testMode,
  merchantKey,
  merchantSalt,
}) {
  const hashStr =
    merchantId +
    userIp +
    merchantOid +
    email +
    paymentAmount +
    userBasket +
    noInstallment +
    maxInstallment +
    currency +
    testMode;

  return crypto.createHmac('sha256', merchantKey).update(hashStr + merchantSalt).digest('base64');
}

async function initMockCheckout(order) {
  const token = crypto.randomBytes(16).toString('hex');
  return {
    provider: 'mock',
    token,
    paymentPageUrl: `${getFrontendUrl()}/odeme/kart?orderId=${order.id}&token=${token}`,
    conversationId: `ORD${order.id}`,
    iframeToken: null,
  };
}

async function initPaytrCheckout(order, userIp) {
  if (!isPaytrConfigured()) {
    const error = new Error('PayTR API bilgileri tanimli degil');
    error.statusCode = 503;
    throw error;
  }

  const merchantId = process.env.PAYTR_MERCHANT_ID;
  const merchantKey = process.env.PAYTR_MERCHANT_KEY;
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT;
  const merchantOid = `ORD${order.id}T${Date.now()}`.replace(/[^a-zA-Z0-9]/g, '').slice(0, 64);
  const email = String(order.customerEmail || '').slice(0, 100);
  const paymentAmount = String(Math.round(Number(order.total) * 100));
  const userBasket = buildBasket(order);
  const noInstallment = '0';
  const maxInstallment = '0';
  const currency = 'TL';
  const testMode = process.env.PAYTR_TEST_MODE === '0' ? '0' : '1';
  const ip = (userIp || '85.34.78.112').split(',')[0].trim().slice(0, 39);

  const paytrToken = buildPaytrToken({
    merchantId,
    userIp: ip,
    merchantOid,
    email,
    paymentAmount,
    userBasket,
    noInstallment,
    maxInstallment,
    currency,
    testMode,
    merchantKey,
    merchantSalt,
  });

  const body = new URLSearchParams({
    merchant_id: merchantId,
    user_ip: ip,
    merchant_oid: merchantOid,
    email,
    payment_amount: paymentAmount,
    paytr_token: paytrToken,
    user_basket: userBasket,
    debug_on: process.env.PAYTR_DEBUG === '0' ? '0' : '1',
    no_installment: noInstallment,
    max_installment: maxInstallment,
    user_name: String(order.customerName || 'Musteri').slice(0, 60),
    user_address: formatPaytrAddress(order),
    user_phone: String(order.customerPhone || '05000000000').slice(0, 20),
    merchant_ok_url: `${getFrontendUrl()}/odeme/basarili?orderId=${order.id}`,
    merchant_fail_url: `${getFrontendUrl()}/odeme/basarisiz?orderId=${order.id}`,
    timeout_limit: '30',
    currency,
    test_mode: testMode,
    iframe_v2: '1',
  });

  const response = await fetch('https://www.paytr.com/odeme/api/get-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const result = await response.json();
  if (result.status !== 'success' || !result.token) {
    const error = new Error(result.reason || 'PayTR token alinamadi');
    error.statusCode = 502;
    error.details = result;
    throw error;
  }

  return {
    provider: 'paytr',
    token: result.token,
    paymentPageUrl: `${getFrontendUrl()}/odeme/kart?orderId=${order.id}&token=${encodeURIComponent(result.token)}&provider=paytr`,
    conversationId: merchantOid,
    iframeToken: result.token,
  };
}

async function initCheckout(order, { userIp } = {}) {
  const provider = getProvider();
  if (provider === 'paytr') {
    return initPaytrCheckout(order, userIp);
  }
  return initMockCheckout(order);
}

function verifyPaytrNotification(payload) {
  const merchantKey = process.env.PAYTR_MERCHANT_KEY;
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT;
  if (!merchantKey || !merchantSalt) return false;

  const merchantOid = payload.merchant_oid || '';
  const status = payload.status || '';
  const totalAmount = payload.total_amount || '';
  const hash = payload.hash || '';

  const expected = crypto
    .createHmac('sha256', merchantKey)
    .update(merchantOid + merchantSalt + status + totalAmount)
    .digest('base64');

  return expected === hash;
}

module.exports = {
  getProvider,
  getFrontendUrl,
  getBackendPublicUrl,
  initCheckout,
  isPaytrConfigured,
  verifyPaytrNotification,
  formatPaytrAddress,
};
