import Link from 'next/link';

type Step = 'cart' | 'checkout' | 'confirm';

const STEPS: { id: Step; label: string; href?: string }[] = [
  { id: 'cart', label: 'Sepetim', href: '/sepet' },
  { id: 'checkout', label: 'Odeme', href: '/odeme' },
  { id: 'confirm', label: 'Onay' },
];

export default function CheckoutProgress({ active }: { active: Step }) {
  return (
    <nav className="mb-8 hidden items-center gap-6 md:flex" aria-label="Odeme adimlari">
      {STEPS.map((step) => {
        const isActive = step.id === active;
        const className = isActive
          ? 'border-b-2 border-store-primary pb-1 font-semibold text-store-primary'
          : 'text-store-muted transition hover:text-store-primary';

        if (step.href && !isActive) {
          return (
            <Link key={step.id} href={step.href} className={className}>
              {step.label}
            </Link>
          );
        }

        return (
          <span key={step.id} className={className}>
            {step.label}
          </span>
        );
      })}
    </nav>
  );
}
