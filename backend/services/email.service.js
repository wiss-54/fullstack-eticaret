const nodemailer = require('nodemailer');
const { getFrontendUrl } = require('./payments.service');

function getEmailProvider() {
  const explicit = (process.env.EMAIL_PROVIDER || '').trim().toLowerCase();
  if (explicit === 'brevo' || explicit === 'mailersend' || explicit === 'mock') {
    return explicit;
  }

  if (isBrevoConfigured()) return 'brevo';
  if (isMailerSendConfigured()) return 'mailersend';
  return 'mock';
}

function isBrevoConfigured() {
  return Boolean(
    process.env.BREVO_SMTP_USER?.trim() && process.env.BREVO_SMTP_PASS?.trim(),
  );
}

function isMailerSendConfigured() {
  return Boolean(process.env.MAILERSEND_API_TOKEN?.trim());
}

function getFromAddress() {
  return {
    email: process.env.MAIL_FROM_EMAIL || 'noreply@support.hatiraniyarat.com',
    name: process.env.MAIL_FROM_NAME || 'Hatıranı Yarat',
  };
}

function formatPrice(amount) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(Number(amount));
}

function paymentMethodLabel(method) {
  switch (method) {
    case 'paytr':
      return 'Kredi / banka karti';
    case 'cod':
      return 'Kapida odeme';
    case 'manual':
      return 'Havale / EFT';
    default:
      return method;
  }
}

function formatAddress(order) {
  if (order.shippingCity) {
    return `${order.shippingAddressLine ?? ''}, ${order.shippingDistrict} / ${order.shippingCity}`;
  }
  return order.shippingAddress;
}

function buildOrderConfirmationContent(order) {
  const lines = (order.items ?? []).map((item) => {
    const variant = item.variantLabel ? ` (${item.variantLabel})` : '';
    return `- ${item.productName}${variant} x${item.quantity} — ${formatPrice(item.lineTotal)}`;
  });

  const orderUrl = `${getFrontendUrl()}/hesabim/siparis/${order.id}`;
  const paidNote =
    order.paymentMethod === 'paytr' && order.paymentStatus === 'paid'
      ? 'Odemeniz alindi.'
      : order.paymentMethod === 'cod'
        ? 'Kapida odeme ile teslim edilecek.'
        : 'Havale/EFT onayi sonrasi hazirlanacak.';

  const text = [
    `Merhaba ${order.customerName},`,
    '',
    `Siparisiniz alindi. Siparis no: #${order.id}`,
    paidNote,
    '',
    'Urunler:',
    ...lines,
    '',
    `Toplam: ${formatPrice(order.total)}`,
    `Odeme: ${paymentMethodLabel(order.paymentMethod)}`,
    `Adres: ${formatAddress(order)}`,
    order.customerPhone ? `Telefon: ${order.customerPhone}` : null,
    order.orderNote ? `Not: ${order.orderNote}` : null,
    '',
    `Siparis detayi: ${orderUrl}`,
    '',
    'Hatirani Yarat',
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1c1917;max-width:560px">
      <p>Merhaba <strong>${order.customerName}</strong>,</p>
      <p>Siparisiniz alindi. <strong>Siparis #${order.id}</strong></p>
      <p>${paidNote}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tbody>
          ${(order.items ?? [])
            .map(
              (item) => `
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #e7e5e4">
                ${item.productName}${item.variantLabel ? ` (${item.variantLabel})` : ''} x${item.quantity}
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #e7e5e4;text-align:right">
                ${formatPrice(item.lineTotal)}
              </td>
            </tr>`,
            )
            .join('')}
        </tbody>
      </table>
      <p><strong>Toplam:</strong> ${formatPrice(order.total)}</p>
      <p><strong>Odeme:</strong> ${paymentMethodLabel(order.paymentMethod)}</p>
      <p><strong>Adres:</strong> ${formatAddress(order)}</p>
      <p style="margin-top:24px">
        <a href="${orderUrl}" style="display:inline-block;background:#b45309;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">
          Siparisi gor
        </a>
      </p>
      <p style="margin-top:24px;color:#78716c;font-size:12px">Hatirani Yarat</p>
    </div>
  `.trim();

  return {
    subject: `Siparisiniz alindi #${order.id}`,
    text,
    html,
  };
}

function buildEmailVerificationContent(user) {
  const verifyUrl = `${getFrontendUrl()}/eposta-dogrula?token=${encodeURIComponent(user.verificationToken)}`;

  const text = [
    `Merhaba ${user.fullName},`,
    '',
    'Hatıranı Yarat hesabınızı oluşturduğunuz için teşekkürler.',
    'Hesabınızı aktifleştirmek için aşağıdaki bağlantıya tıklayın:',
    '',
    verifyUrl,
    '',
    'Bu bağlantı 24 saat geçerlidir.',
    'Eğer bu kaydı siz yapmadıysanız bu e-postayı yok sayabilirsiniz.',
    '',
    'Hatıranı Yarat',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1c1917;max-width:560px">
      <p>Merhaba <strong>${user.fullName}</strong>,</p>
      <p>Hatıranı Yarat hesabınızı oluşturduğunuz için teşekkürler.</p>
      <p>Hesabınızı aktifleştirmek için aşağıdaki butona tıklayın:</p>
      <p style="margin:24px 0">
        <a href="${verifyUrl}" style="display:inline-block;background:#b45309;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
          E-postamı doğrula
        </a>
      </p>
      <p style="color:#78716c;font-size:14px">Bu bağlantı 24 saat geçerlidir.</p>
      <p style="color:#78716c;font-size:14px">Eğer bu kaydı siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>
      <p style="margin-top:24px;color:#78716c;font-size:12px">Hatıranı Yarat</p>
    </div>
  `.trim();

  return {
    subject: 'E-posta adresinizi doğrulayın',
    text,
    html,
  };
}

async function sendViaBrevo({ to, subject, text, html }) {
  const user = process.env.BREVO_SMTP_USER?.trim();
  const pass = process.env.BREVO_SMTP_PASS?.trim();
  if (!user || !pass) {
    const error = new Error('Brevo SMTP bilgileri tanimli degil');
    error.statusCode = 503;
    throw error;
  }

  const from = getFromAddress();
  const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST?.trim() || 'smtp-relay.brevo.com',
    port: Number(process.env.BREVO_SMTP_PORT || 2525),
    secure: false,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: `"${from.name}" <${from.email}>`,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error('Brevo SMTP hatasi:', err.message);
    const error = new Error(`Brevo e-posta gonderilemedi: ${err.message}`);
    error.statusCode = 502;
    error.details = err;
    throw error;
  }

  return { provider: 'brevo', accepted: true };
}

async function sendViaMailerSend({ to, subject, text, html }) {
  const token = process.env.MAILERSEND_API_TOKEN?.trim();
  if (!token) {
    const error = new Error('MailerSend API token tanimli degil');
    error.statusCode = 503;
    throw error;
  }

  const from = getFromAddress();
  const response = await fetch('https://api.mailersend.com/v1/email', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: { email: from.email, name: from.name },
      to: [{ email: to }],
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    let details = null;
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }
    console.error('MailerSend API hatasi:', response.status, details);
    const error = new Error(`MailerSend e-posta gonderilemedi (${response.status})`);
    error.statusCode = response.status;
    error.details = details;
    throw error;
  }

  return { provider: 'mailersend', accepted: true };
}

async function sendEmail({ to, subject, text, html }) {
  if (!to) {
    throw new Error('Alici e-posta adresi gerekli');
  }

  const provider = getEmailProvider();

  if (provider === 'mock') {
    console.info('[email:mock]', { to, subject });
    return { provider: 'mock', accepted: true };
  }

  if (provider === 'brevo') {
    return sendViaBrevo({ to, subject, text, html });
  }

  return sendViaMailerSend({ to, subject, text, html });
}

async function sendEmailVerificationEmail(user) {
  if (!user?.email || !user?.verificationToken) return { skipped: true };

  const content = buildEmailVerificationContent(user);
  return sendEmail({
    to: user.email,
    ...content,
  });
}

function scheduleEmailVerificationEmail(user) {
  void sendEmailVerificationEmail(user).catch((err) => {
    console.error('Dogrulama e-postasi gonderilemedi:', err.message);
  });
}

async function sendOrderConfirmationEmail(order) {
  if (!order?.customerEmail) return { skipped: true };

  const content = buildOrderConfirmationContent(order);
  return sendEmail({
    to: order.customerEmail,
    ...content,
  });
}

function scheduleOrderConfirmationEmail(order) {
  void sendOrderConfirmationEmail(order).catch((err) => {
    console.error('Siparis e-postasi gonderilemedi:', err.message);
  });
}

module.exports = {
  getEmailProvider,
  isBrevoConfigured,
  isMailerSendConfigured,
  buildOrderConfirmationContent,
  buildEmailVerificationContent,
  sendEmail,
  sendEmailVerificationEmail,
  scheduleEmailVerificationEmail,
  sendOrderConfirmationEmail,
  scheduleOrderConfirmationEmail,
};
