import Link from 'next/link';
import type { Category } from '@/lib/types';

type CategoryFilterProps = {
  categories: Category[];
  activeCategoryId?: number;
};

export default function CategoryFilter({ categories, activeCategoryId }: CategoryFilterProps) {
  if (categories.length === 0) return null;

  return (
    <div className="mb-8 flex flex-wrap gap-2">
      <Link
        href="/"
        className={`rounded-full px-4 py-2 text-sm ${
          !activeCategoryId
            ? 'bg-amber-800 text-white dark:bg-amber-500 dark:text-zinc-950'
            : 'border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300'
        }`}
      >
        Tumu
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/?category=${category.id}`}
          className={`rounded-full px-4 py-2 text-sm ${
            activeCategoryId === category.id
              ? 'bg-amber-800 text-white dark:bg-amber-500 dark:text-zinc-950'
              : 'border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300'
          }`}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
