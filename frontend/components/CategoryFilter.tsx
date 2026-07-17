import Link from 'next/link';
import type { Category } from '@/lib/types';

type CategoryFilterProps = {
  categories: Category[];
  activeCategoryId?: number;
  /** false = editor onizleme; link calismaz */
  interactive?: boolean;
};

function chipClass(active: boolean) {
  return `rounded-full px-4 py-2 text-sm ${
    active
      ? 'bg-amber-800 text-white dark:bg-amber-500 dark:text-zinc-950'
      : 'border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300'
  }`;
}

export default function CategoryFilter({
  categories,
  activeCategoryId,
  interactive = true,
}: CategoryFilterProps) {
  if (categories.length === 0) return null;

  if (!interactive) {
    return (
      <div className="mb-8 flex flex-wrap gap-2">
        <span className={`${chipClass(!activeCategoryId)} cursor-default`}>Tumu</span>
        {categories.map((category) => (
          <span
            key={category.id}
            className={`${chipClass(activeCategoryId === category.id)} cursor-default`}
          >
            {category.name}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-8 flex flex-wrap gap-2">
      <Link href="/" className={chipClass(!activeCategoryId)}>
        Tumu
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/?category=${category.id}`}
          className={chipClass(activeCategoryId === category.id)}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
