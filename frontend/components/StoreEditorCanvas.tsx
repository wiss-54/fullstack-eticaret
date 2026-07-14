'use client';

import type { DragEvent } from 'react';
import StoreHero from '@/components/StoreHero';
import StoreSectionBlock from '@/components/StoreSectionBlock';
import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import type { Category, Product, StoreSettings } from '@/lib/types';
import { getStoreShellClass } from '@/lib/store-theme';
import { sectionLabel } from '@/lib/store-sections';

type Props = {
  settings: StoreSettings;
  products: Product[];
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onReorder: (fromId: string, toId: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
};

export default function StoreEditorCanvas({
  settings,
  products,
  categories,
  selectedId,
  onSelect,
  onReorder,
  onToggle,
  onRemove,
}: Props) {
  function handleDrop(targetId: string, event: DragEvent) {
    event.preventDefault();
    const fromId = event.dataTransfer.getData('text/section-id');
    if (!fromId || fromId === targetId) return;
    onReorder(fromId, targetId);
  }

  return (
    <div
      className="min-h-full overflow-auto bg-zinc-200/70 p-4 dark:bg-zinc-900"
      onClick={() => onSelect(null)}
    >
      <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-zinc-300 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-950">
        <div className={`min-h-[70vh] ${getStoreShellClass(settings)}`}>
          <div
            className={`border-b-2 ${selectedId === '__header__' ? 'border-amber-500' : 'border-transparent'}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect('__header__');
            }}
          >
            <div className="pointer-events-none">
              <StoreHeader
                title="Magazamiz"
                subtitle={settings.brandName}
                badge={`${products.length} urun`}
                logoUrl={settings.logoUrl}
                accentColor={settings.accentColor}
              />
            </div>
          </div>

          {settings.sections.map((section) => {
            const selected = selectedId === section.id;
            return (
              <div
                key={section.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/section-id', section.id);
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(section.id, event)}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(section.id);
                }}
                className={`group relative cursor-grab border-y-2 active:cursor-grabbing ${
                  selected
                    ? 'border-amber-500 bg-amber-500/5'
                    : 'border-transparent hover:border-amber-300/80'
                } ${section.enabled ? '' : 'opacity-45'}`}
              >
                <div className="absolute right-3 top-3 z-20 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    type="button"
                    className="rounded-md bg-white/95 px-2 py-1 text-xs shadow dark:bg-zinc-900"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle(section.id);
                    }}
                  >
                    {section.enabled ? 'Gizle' : 'Goster'}
                  </button>
                  {section.type !== 'hero' && section.type !== 'products' ? (
                    <button
                      type="button"
                      className="rounded-md bg-white/95 px-2 py-1 text-xs text-red-600 shadow dark:bg-zinc-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(section.id);
                      }}
                    >
                      Sil
                    </button>
                  ) : null}
                </div>

                <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-md bg-zinc-900/80 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-white">
                  {sectionLabel(section.type)} · surukle
                </div>

                <div className="pointer-events-none">
                  {section.type === 'hero' ? (
                    <StoreHero settings={settings} />
                  ) : (
                    <StoreSectionBlock
                      section={section}
                      settings={settings}
                      products={products}
                      categories={categories}
                      error={null}
                    />
                  )}
                </div>
              </div>
            );
          })}

          <div
            className={`border-t-2 ${selectedId === '__footer__' ? 'border-amber-500' : 'border-transparent'}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect('__footer__');
            }}
          >
            <div className="pointer-events-none">
              <StoreFooter
                brandName={settings.brandName}
                leftText={settings.footerLeft}
                rightText={settings.footerRight}
              />
            </div>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-3 max-w-5xl text-center text-xs text-zinc-600 dark:text-zinc-400">
        Bolume tikla → sagdan duzenle · Surukle-birak → yerlestir · Kaydet ile yayinla
      </p>
    </div>
  );
}
