'use client';

import { useState, type DragEvent } from 'react';
import StoreHero from '@/components/StoreHero';
import StoreSectionBlock from '@/components/StoreSectionBlock';
import StoreFooter from '@/components/StoreFooter';
import StoreHeader from '@/components/StoreHeader';
import StoreEditorAddMenu from '@/components/StoreEditorAddMenu';
import type { Category, Product, StoreSection, StoreSettings } from '@/lib/types';
import type { EditorSelection } from '@/lib/editor-selection';
import { getTextLabel, isMultilineTextKey, selectionId, setTextValue, textTarget } from '@/lib/editor-selection';
import { getStoreShellClass } from '@/lib/store-theme';
import { sectionLabel } from '@/lib/store-sections';

type Props = {
  settings: StoreSettings;
  products: Product[];
  categories: Category[];
  selection: EditorSelection | null;
  onSelect: (selection: EditorSelection | null) => void;
  onReorder: (fromId: string, toId: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onInsertSection: (type: StoreSection['type'], afterIndex: number) => void;
  onTextChange: (settings: StoreSettings) => void;
};

function InsertSlot({
  label,
  onPick,
}: {
  label: string;
  onPick: (type: StoreSection['type']) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative z-10 flex justify-center py-1">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className="rounded-full border border-dashed border-stone-400 bg-white/90 px-4 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:border-amber-700 hover:bg-amber-50 hover:text-amber-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-amber-600"
      >
        + Bolum ekle
      </button>
      <StoreEditorAddMenu
        open={open}
        anchorLabel={label}
        onClose={() => setOpen(false)}
        onPick={onPick}
      />
    </div>
  );
}

export default function StoreEditorCanvas({
  settings,
  products,
  categories,
  selection,
  onSelect,
  onReorder,
  onToggle,
  onRemove,
  onInsertSection,
  onTextChange,
}: Props) {
  const selectedId = selectionId(selection);
  const selectedStyleKey = selection?.type === 'text' ? selection.styleKey : null;
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  function handleDrop(targetId: string, event: DragEvent) {
    event.preventDefault();
    const fromId = event.dataTransfer.getData('text/section-id');
    setDraggingId(null);
    setDragOverId(null);
    if (!fromId || fromId === targetId) return;
    onReorder(fromId, targetId);
  }

  const editorProps = {
    selectedStyleKey,
    onSelectStyleKey: (styleKey: string) => {
      onSelect(textTarget(styleKey, getTextLabel(styleKey)));
    },
    onTextChange: (styleKey: string, value: string) => {
      onTextChange(setTextValue(settings, styleKey, value));
    },
    isMultiline: isMultilineTextKey,
    onAddProduct: () => onSelect({ type: 'product' }),
  };

  return (
    <div
      className="min-h-full overflow-auto bg-[linear-gradient(180deg,#e7e5e4_0%,#d6d3d1_100%)] p-4 dark:bg-[linear-gradient(180deg,#1c1917_0%,#0c0a09_100%)]"
      onClick={() => onSelect({ type: 'none' })}
    >
      <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-stone-300 bg-white shadow-[0_24px_60px_rgba(28,25,23,0.18)] dark:border-stone-700 dark:bg-stone-950">
        <div className={`min-h-[70vh] ${getStoreShellClass(settings)}`}>
          <div
            className={`border-b-2 ${
              selection?.type === 'header' || selection?.type === 'style'
                ? 'border-amber-700'
                : 'border-transparent'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect({ type: 'header' });
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

          <InsertSlot
            label="Uste bolum ekle"
            onPick={(type) => onInsertSection(type, -1)}
          />

          {settings.sections.map((section, index) => {
            const selected = selectedId === section.id;
            const isDragging = draggingId === section.id;
            const isDragOver = dragOverId === section.id;
            return (
              <div key={section.id}>
                {isDragOver ? (
                  <div className="mx-4 h-1 rounded-full bg-amber-600 shadow-sm" />
                ) : null}
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOverId(section.id);
                  }}
                  onDragLeave={() => {
                    if (dragOverId === section.id) setDragOverId(null);
                  }}
                  onDrop={(event) => handleDrop(section.id, event)}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect({ type: 'section', sectionId: section.id });
                  }}
                  className={`group relative border-y-2 transition ${
                    selected
                      ? 'border-amber-700 bg-amber-700/[0.04]'
                      : isDragOver
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                        : 'border-transparent hover:border-amber-600/50'
                  } ${section.enabled ? '' : 'opacity-45'} ${isDragging ? 'opacity-40' : ''}`}
                >
                  <div
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/section-id', section.id);
                      event.dataTransfer.effectAllowed = 'move';
                      setDraggingId(section.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOverId(null);
                    }}
                    className="absolute left-2 top-1/2 z-20 flex -translate-y-1/2 cursor-grab flex-col items-center gap-0.5 rounded-md bg-white/95 px-1.5 py-2 text-stone-500 shadow active:cursor-grabbing dark:bg-stone-900"
                    onClick={(event) => event.stopPropagation()}
                    title="Surukle ve birak"
                  >
                    <span className="block h-0.5 w-3 rounded bg-stone-400" />
                    <span className="block h-0.5 w-3 rounded bg-stone-400" />
                    <span className="block h-0.5 w-3 rounded bg-stone-400" />
                  </div>
                  <div className="absolute right-3 top-3 z-20 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                    <button
                      type="button"
                      className="rounded-md bg-white/95 px-2 py-1 text-xs font-medium text-stone-700 shadow dark:bg-stone-900 dark:text-stone-200"
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
                        className="rounded-md bg-white/95 px-2 py-1 text-xs font-medium text-red-600 shadow dark:bg-stone-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(section.id);
                        }}
                      >
                        Sil
                      </button>
                    ) : null}
                  </div>

                  <div className="pointer-events-none absolute left-12 top-3 z-20 rounded-md bg-stone-900/85 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                    {sectionLabel(section.type)}
                  </div>

                  <div className={`pl-8 ${section.type === 'hero' ? '' : 'pointer-events-auto'}`}>
                    {section.type === 'hero' ? (
                      <StoreHero settings={settings} editor={editorProps} />
                    ) : (
                      <StoreSectionBlock
                        section={section}
                        settings={settings}
                        products={products}
                        categories={categories}
                        error={null}
                        editor={editorProps}
                      />
                    )}
                  </div>
                </div>

                <InsertSlot
                  label={`${sectionLabel(section.type)} altina ekle`}
                  onPick={(type) => onInsertSection(type, index)}
                />
              </div>
            );
          })}

          <div
            className={`border-t-2 ${selection?.type === 'footer' ? 'border-amber-700' : 'border-transparent'}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect({ type: 'footer' });
            }}
          >
            <div className="pointer-events-auto px-6 py-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(textTarget('footer.left', 'Alt bilgi sol'));
                  }}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                    selectedStyleKey === 'footer.left'
                      ? 'border-amber-700 bg-amber-50 dark:bg-amber-950/30'
                      : 'border-dashed border-stone-300 hover:border-amber-600 dark:border-stone-700'
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                    Alt bilgi sol
                  </span>
                  <p className="mt-1 line-clamp-2 text-stone-700 dark:text-stone-300">
                    {settings.footerLeft}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(textTarget('footer.right', 'Alt bilgi sag'));
                  }}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                    selectedStyleKey === 'footer.right'
                      ? 'border-amber-700 bg-amber-50 dark:bg-amber-950/30'
                      : 'border-dashed border-stone-300 hover:border-amber-600 dark:border-stone-700'
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                    Alt bilgi sag
                  </span>
                  <p className="mt-1 line-clamp-2 text-stone-700 dark:text-stone-300">
                    {settings.footerRight}
                  </p>
                </button>
              </div>
            </div>
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
      <p className="mx-auto mt-3 max-w-5xl text-center text-xs text-stone-600 dark:text-stone-400">
        Metne tikla → stil · Cift tikla → sayfada yaz · Tutamacdan surukle · + Bolum ekle
      </p>
    </div>
  );
}
