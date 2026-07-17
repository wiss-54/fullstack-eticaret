const request = require('supertest');

jest.mock('../db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

jest.mock('../middleware/auth.middleware', () => ({
  requireAdmin: (_req, _res, next) => next(),
  requireCustomer: (req, _res, next) => {
    req.user = { id: 1, role: 'customer', email: 'test@example.com' };
    next();
  },
}));

jest.mock('../services/orders.service', () => ({
  OrderError: class OrderError extends Error {
    constructor(message, statusCode = 400) {
      super(message);
      this.statusCode = statusCode;
    }
  },
  getOrderById: jest.fn(),
  attachPaymentSession: jest.fn(),
  markOrderPaid: jest.fn(),
  markOrderPaymentFailed: jest.fn(),
  findOrderByProviderPaymentId: jest.fn(),
  findOrderByProviderConversationId: jest.fn(),
  isOnlinePaymentMethod: (method) => method === 'paytr',
}));

jest.mock('../services/payments.service', () => ({
  getProvider: jest.fn(() => 'mock'),
  getFrontendUrl: jest.fn(() => 'http://localhost:3000'),
  initCheckout: jest.fn(),
  verifyPaytrNotification: jest.fn(() => true),
}));

const {
  getOrderById,
  attachPaymentSession,
  markOrderPaid,
  markOrderPaymentFailed,
  findOrderByProviderConversationId,
} = require('../services/orders.service');
const { getProvider, initCheckout, verifyPaytrNotification } = require('../services/payments.service');
const app = require('../app');

const unpaidOrder = {
  id: 10,
  userId: 1,
  status: 'pending',
  paymentMethod: 'paytr',
  paymentStatus: 'unpaid',
  total: 150,
  shippingCity: 'İstanbul',
  shippingDistrict: 'Kadıköy',
  shippingAddressLine: 'Moda Cad. No:1',
  items: [],
};

describe('payments routes', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  afterEach(() => {
    jest.clearAllMocks();
    getProvider.mockReturnValue('mock');
  });

  it('POST /api/payments/init mock odeme oturumu baslatir', async () => {
    getOrderById.mockResolvedValueOnce(unpaidOrder);
    initCheckout.mockResolvedValueOnce({
      provider: 'mock',
      token: 'tok-12345678',
      paymentPageUrl: 'http://localhost:3000/odeme/kart?orderId=10&token=tok-12345678',
      conversationId: 'ORD10',
      iframeToken: null,
    });
    attachPaymentSession.mockResolvedValueOnce({
      ...unpaidOrder,
      paymentStatus: 'pending',
      providerPaymentId: 'tok-12345678',
    });

    const response = await request(app).post('/api/payments/init').send({ orderId: 10 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.provider).toBe('mock');
    expect(response.body.data.paymentPageUrl).toContain('/odeme/kart');
  });

  it('POST /api/payments/mock/complete basarili odemeyi isler', async () => {
    getOrderById.mockResolvedValueOnce({
      ...unpaidOrder,
      paymentStatus: 'pending',
      providerPaymentId: 'tok-12345678',
    });
    markOrderPaid.mockResolvedValueOnce({
      ...unpaidOrder,
      paymentStatus: 'paid',
      status: 'confirmed',
    });

    const response = await request(app)
      .post('/api/payments/mock/complete')
      .send({ orderId: 10, token: 'tok-12345678', success: true });

    expect(response.status).toBe(200);
    expect(response.body.data.paymentStatus).toBe('paid');
    expect(markOrderPaid).toHaveBeenCalledWith(10, { providerPaymentId: 'tok-12345678' });
  });

  it('POST /api/payments/mock/complete basarisiz odemeyi isler', async () => {
    getOrderById.mockResolvedValueOnce({
      ...unpaidOrder,
      paymentStatus: 'pending',
      providerPaymentId: 'tok-12345678',
    });
    markOrderPaymentFailed.mockResolvedValueOnce({
      ...unpaidOrder,
      paymentStatus: 'failed',
    });

    const response = await request(app)
      .post('/api/payments/mock/complete')
      .send({ orderId: 10, token: 'tok-12345678', success: false });

    expect(response.status).toBe(200);
    expect(response.body.data.paymentStatus).toBe('failed');
  });

  it('COD siparisi icin init reddeder', async () => {
    getOrderById.mockResolvedValueOnce({
      ...unpaidOrder,
      paymentMethod: 'cod',
    });

    const response = await request(app).post('/api/payments/init').send({ orderId: 10 });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('POST /api/payments/paytr/notification basarili odemeyi isler', async () => {
    verifyPaytrNotification.mockReturnValueOnce(true);
    findOrderByProviderConversationId.mockResolvedValueOnce({
      ...unpaidOrder,
      providerConversationId: 'ORD10T1',
      providerPaymentId: 'iframe-token',
    });
    markOrderPaid.mockResolvedValueOnce({
      ...unpaidOrder,
      paymentStatus: 'paid',
    });

    const response = await request(app).post('/api/payments/paytr/notification').send({
      merchant_oid: 'ORD10T1',
      status: 'success',
      total_amount: '15000',
      hash: 'x',
    });

    expect(response.status).toBe(200);
    expect(response.text).toBe('OK');
    expect(markOrderPaid).toHaveBeenCalled();
  });
});
