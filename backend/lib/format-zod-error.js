function formatZodError(issues, fallback = 'Gecersiz istek') {
  if (!Array.isArray(issues) || issues.length === 0) return fallback;

  const issue = issues[0];
  if (issue?.message) return issue.message;

  const field = Array.isArray(issue?.path) ? issue.path.join('.') : '';
  if (field === 'email') return 'Gecerli bir e-posta adresi girin.';
  if (field === 'phone' || field === 'customerPhone') {
    return 'Telefon numarasi 10 veya 11 haneli olmali.';
  }
  if (field === 'password') return 'Sifre en az 8 karakter olmali.';
  if (field === 'fullName' || field === 'customerName' || field === 'shippingFullName') {
    return 'Ad soyad en az 2 karakter olmali.';
  }

  return fallback;
}

module.exports = {
  formatZodError,
};
