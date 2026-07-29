type ValidationIssue = {
  path?: Array<string | number>;
  message?: string;
};

export function formatApiValidationError(details: unknown): string | null {
  if (!Array.isArray(details) || details.length === 0) return null;

  const issue = details[0] as ValidationIssue;
  if (issue.message) return issue.message;

  const field = issue.path?.join('.') ?? '';
  if (field === 'email') return 'Gecerli bir e-posta adresi girin.';
  if (field === 'phone') return 'Telefon numarasi 10 veya 11 haneli olmali.';
  if (field === 'password') return 'Sifre en az 8 karakter olmali.';
  if (field === 'fullName') return 'Ad soyad en az 2 karakter olmali.';

  return null;
}
