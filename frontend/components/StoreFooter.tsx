import Link from 'next/link';
import { safeMediaUrl } from '@/lib/safe-media-url';

type StoreFooterProps = {
  leftText?: string;
  rightText?: string;
  brandName?: string;
  logoUrl?: string | null;
  navItem2Href?: string;
  contactEmail?: string;
  preview?: boolean;
};

const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H6v4h3v7h4v-7h3.2L17 11h-4V9c0-.6.4-1 1-1Z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
        <circle cx="12" cy="12" r="3.8" />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M16.5 3c.4 2.4 1.9 4.1 4.2 4.4v3c-1.5 0-2.9-.5-4.2-1.3v5.7c0 3.7-3 6.7-6.7 6.7S3 18.5 3 14.8 6 8.1 9.8 8.1c.4 0 .7 0 1.1.1v3.2c-.3-.1-.7-.2-1.1-.2-2 0-3.5 1.6-3.5 3.6s1.6 3.6 3.5 3.6 3.5-1.6 3.5-3.6V3h3.2Z" />
      </svg>
    ),
  },
] as const;

const MENU_LINKS = [
  { label: 'Ana Sayfa', href: '/' },
  { label: 'Tum Urunler', href: '/#urunler' },
  { label: 'Iletisim', href: '/iletisim' },
] as const;

const POLICY_LINKS = [
  { label: 'Gizlilik politikasi', href: '/yasal/gizlilik' },
  { label: 'Para iade politikasi', href: '/yasal/iade' },
  { label: 'Hizmet sartlari', href: '/yasal/hizmet-sartlari' },
  { label: 'Yasal bildirim', href: '/yasal/bildirim' },
  { label: 'Kargo politikasi', href: '/yasal/kargo' },
  { label: 'Iletisim bilgileri', href: '/iletisim' },
  { label: 'Sistem durumu', href: '/status' },
] as const;

function PaymentMarks() {
  const mark =
    'inline-flex h-8 min-w-[3.25rem] items-center justify-center rounded border border-store-border bg-store-bg px-2 text-[10px] font-bold tracking-wide text-store-text';
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className={mark}>VISA</span>
      <span className={mark}>MC</span>
      <span className={mark}>PayPal</span>
      <span className={mark}>Apple Pay</span>
      <span className={mark}>Google Pay</span>
    </div>
  );
}

export default function StoreFooter({
  leftText = 'Sevdiklerine en ozel urunler.',
  rightText = 'Sorulariniz veya yorumlariniz mi var? Bize yazin, yardimci olmak isteriz.',
  brandName = 'EticaretShop',
  logoUrl = null,
  navItem2Href = '/#urunler',
  contactEmail = 'info@eticaretshop.com.tr',
  preview = false,
}: StoreFooterProps) {
  const logoSrc = safeMediaUrl(logoUrl);
  const year = new Date().getFullYear();
  const menu = MENU_LINKS.map((item) =>
    item.label === 'Tum Urunler' ? { ...item, href: navItem2Href || item.href } : item,
  );

  const linkClass = preview
    ? 'text-store-muted'
    : 'text-store-muted transition hover:text-store-primary';

  return (
    <>
      <footer className="mt-auto border-t border-store-border bg-store-surface-low">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-10 md:py-16">
          <div className="grid gap-10 md:grid-cols-3 md:gap-12">
            <div className="space-y-4 text-center md:text-left">
              <div className="flex items-center justify-center gap-3 md:justify-start">
                {logoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoSrc} alt={brandName} className="h-10 w-10 rounded-full object-cover" />
                ) : null}
                <p className="font-[family-name:var(--font-store-display,ui-serif)] text-2xl font-semibold tracking-tight text-store-text">
                  {brandName}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-store-muted">{leftText}</p>
            </div>

            <div className="text-center md:text-left">
              <h2 className="text-base font-bold text-store-text">Menu</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {menu.map((item) => (
                  <li key={item.href + item.label}>
                    {preview ? (
                      <span className={linkClass}>{item.label}</span>
                    ) : (
                      <Link href={item.href} className={linkClass}>
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 text-center md:text-left">
              <h2 className="text-base font-bold text-store-text">Bizimle Iletisime Gec</h2>
              <p className="text-sm leading-relaxed text-store-muted">{rightText}</p>
              {preview ? (
                <span className="inline-block text-sm font-semibold text-store-text underline">
                  Iletisime Gec!
                </span>
              ) : (
                <Link
                  href="/iletisim"
                  className="inline-block text-sm font-semibold text-store-text underline transition hover:text-store-primary"
                >
                  Iletisime Gec!
                </Link>
              )}
              <p className="pt-2 text-sm text-store-text">{contactEmail}</p>
            </div>
          </div>

          <div className="mt-12 flex items-center justify-center gap-5">
            {SOCIAL_LINKS.map((social) =>
              preview ? (
                <span key={social.label} className="text-store-text" aria-hidden>
                  {social.icon}
                </span>
              ) : (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="text-store-text transition hover:text-store-primary"
                >
                  {social.icon}
                </a>
              ),
            )}
          </div>

          <div className="mt-8">
            <PaymentMarks />
          </div>

          <div className="mt-10 space-y-4 border-t border-store-border/70 pt-6 text-center text-xs text-store-muted">
            <p>
              © {year}, {brandName}
            </p>
            <nav className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
              {POLICY_LINKS.map((item, index) => (
                <span key={item.href} className="inline-flex items-center gap-2">
                  {index > 0 ? <span aria-hidden>•</span> : null}
                  {preview ? (
                    <span>{item.label}</span>
                  ) : (
                    <Link href={item.href} className="transition hover:text-store-primary">
                      {item.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
          </div>
        </div>
      </footer>

      {!preview ? (
        <a
          href="https://www.whatsapp.com/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="fixed bottom-5 left-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition hover:brightness-105"
        >
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.95.54 3.78 1.48 5.35L2 22l4.98-1.55a9.9 9.9 0 0 0 5.06 1.37h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2Zm5.47 13.98c-.23.65-1.34 1.2-1.87 1.27-.48.07-1.08.1-1.74-.11-.4-.12-.91-.28-1.57-.55-2.76-1.19-4.55-3.97-4.69-4.15-.14-.18-1.13-1.5-1.13-2.86 0-1.36.71-2.03.96-2.31.25-.28.55-.35.73-.35h.53c.17 0 .4-.06.62.47.23.55.78 1.9.85 2.04.07.14.12.3.02.48-.1.18-.15.3-.3.46-.15.16-.31.35-.44.47-.15.14-.3.29-.13.57.17.28.76 1.25 1.63 2.03 1.12 1 2.07 1.31 2.36 1.46.29.14.46.12.63-.07.17-.2.73-.85.93-1.14.2-.3.4-.24.67-.14.28.1 1.76.83 2.06.98.3.15.5.22.57.34.08.13.08.74-.15 1.39Z" />
          </svg>
        </a>
      ) : null}
    </>
  );
}
