describe('email service', () => {
  const originalToken = process.env.MAILERSEND_API_TOKEN;
  const originalFrontend = process.env.FRONTEND_URL;
  const originalProvider = process.env.EMAIL_PROVIDER;
  const originalBrevoUser = process.env.BREVO_SMTP_USER;
  const originalBrevoPass = process.env.BREVO_SMTP_PASS;

  beforeAll(() => {
    process.env.FRONTEND_URL = 'https://eticaretshop.com.tr';
  });

  afterAll(() => {
    process.env.MAILERSEND_API_TOKEN = originalToken;
    process.env.FRONTEND_URL = originalFrontend;
    process.env.EMAIL_PROVIDER = originalProvider;
    process.env.BREVO_SMTP_USER = originalBrevoUser;
    process.env.BREVO_SMTP_PASS = originalBrevoPass;
  });

  afterEach(() => {
    delete process.env.MAILERSEND_API_TOKEN;
    delete process.env.EMAIL_PROVIDER;
    delete process.env.BREVO_SMTP_USER;
    delete process.env.BREVO_SMTP_PASS;
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it('buildOrderConfirmationContent siparis ozetini olusturur', () => {
    const { buildOrderConfirmationContent } = require('../services/email.service');
    const content = buildOrderConfirmationContent({
      id: 42,
      publicCode: 'ES-A7K9M2QX',
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      customerPhone: '05000000000',
      paymentMethod: 'paytr',
      paymentStatus: 'paid',
      shippingCity: 'Istanbul',
      shippingDistrict: 'Kadikoy',
      shippingAddressLine: 'Moda Cad. No:1',
      total: 150,
      items: [
        {
          productName: 'Urun A',
          variantLabel: null,
          quantity: 1,
          lineTotal: 150,
        },
      ],
    });

    expect(content.subject).toContain('ES-A7K9M2QX');
    expect(content.text).toContain('Test User');
    expect(content.html).toContain('Siparis ES-A7K9M2QX');
    expect(content.html).not.toContain('Siparis #42');
  });

  it('buildEmailVerificationContent dogrulama linki olusturur', () => {
    const { buildEmailVerificationContent } = require('../services/email.service');
    const content = buildEmailVerificationContent({
      fullName: 'Test User',
      email: 'test@example.com',
      verificationToken: 'abc123',
    });

    expect(content.subject).toContain('doğrula');
    expect(content.text).toContain('/eposta-dogrula?token=abc123');
    expect(content.html).toContain('E-postamı doğrula');
  });

  it('sendEmail mock modda token olmadan calisir', async () => {
    process.env.EMAIL_PROVIDER = 'mock';
    const logSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const { sendEmail } = require('../services/email.service');

    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      text: 'Merhaba',
      html: '<p>Merhaba</p>',
    });

    expect(result.provider).toBe('mock');
    expect(logSpy).toHaveBeenCalled();
  });
});
