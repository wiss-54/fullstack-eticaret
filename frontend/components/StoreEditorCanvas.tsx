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

/** High-contrast chrome on top of any store theme (admin tokens can vanish on light canvas). */
const chromeBtn =
  'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs font-medium text-neutral-800 shadow-sm';
const chromeLabel =
  'pointer-events-none absolute left-3 top-3 z-20 rounded-md bg-neutral-900 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white';
const chromeSelect =
  'rounded-lg border border-neutral-300 bg-white px-3 py-2 text-left text-sm text-neutral-800 shadow-sm transition hover:border-amber-600';

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
        className="rounded-full border border-dashed border-neutral-400 bg-white px-4 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm transition hover:border-amber-600 hover:text-amber-800"
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
  const headerSelected = selection?.type === 'header' || selection?.type === 'style';
  const footerSelected =
    selection?.type === 'footer' ||
    selectedStyleKey === 'footer.left' ||
    selectedStyleKey === 'footer.right';
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
      className="min-h-0 overflow-auto bg-admin-bg p-4"
      onClick={() => onSelect({ type: 'none' })}
    >
      <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-admin-border bg-white shadow-sm">
        <div className={`min-h-[70vh] ${getStoreShellClass(settings)}`}>
          <div
            role="button"
            tabIndex={0}
            className={`group relative cursor-pointer border-b-2 outline-none transition ${
              headerSelected
                ? 'border-amber-500 ring-2 ring-inset ring-amber-400/40'
                : 'border-transparent hover:border-amber-300'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect({ type: 'header' });
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onSelect({ type: 'header' });
              }
            }}
          >
            <span className={chromeLabel}>Header · Marka</span>
            <div className="pointer-events-none pt-8">
              <StoreHeader
                preview
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
                  <div className="mx-4 h-1 rounded-full bg-amber-500 shadow-sm" />
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
                      ? 'border-amber-500 bg-amber-50/40'
                      : isDragOver
                        ? 'border-amber-400 bg-amber-50/30'
                        : 'border-transparent hover:border-amber-300'
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
                    className="absolute left-2 top-1/2 z-20 flex -translate-y-1/2 cursor-grab flex-col items-center gap-0.5 rounded-md border border-neutral-200 bg-white px-1.5 py-2 text-neutral-400 shadow-sm active:cursor-grabbing"
                    onClick={(event) => event.stopPropagation()}
                    title="Surukle ve birak"
                  >
                    <span className="block h-0.5 w-3 rounded bg-neutral-400" />
                    <span className="block h-0.5 w-3 rounded bg-neutral-400" />
                    <span className="block h-0.5 w-3 rounded bg-neutral-400" />
                  </div>
                  <div className="absolute right-3 top-3 z-20 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                    <button
                      type="button"
                      className={chromeBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle(section.id);
                      }}
                    >
                      {section.enabled ? 'Gizle' : 'Goster'}
                    </button>
                    {settings.sections.length > 1 ? (
                      <button
                        type="button"
                        className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(section.id);
                        }}
                      >
                        Sil
                      </button>
                    ) : null}
                  </div>

                  <div className={`${chromeLabel} left-12`}>
                    {sectionLabel(section.type)}
                  </div>

                  <div className="pointer-events-auto pl-8">
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
            role="button"
            tabIndex={0}
            className={`relative cursor-pointer border-t-2 outline-none transition ${
              footerSelected
                ? 'border-amber-500 ring-2 ring-inset ring-amber-400/40'
                : 'border-transparent hover:border-amber-300'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect({ type: 'footer' });
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onSelect({ type: 'footer' });
              }
            }}
          >
            <span className={chromeLabel}>Footer · Alt bilgi</span>
            <div
              className="pointer-events-auto space-y-3 px-6 pb-4 pt-10"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(textTarget('footer.left', 'Alt bilgi sol'));
                  }}
                  className={`${chromeSelect} ${
                    selectedStyleKey === 'footer.left'
                      ? 'border-amber-500 ring-2 ring-amber-400/40'
                      : ''
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    Alt bilgi sol
                  </span>
                  <p className="mt-1 line-clamp-2 text-neutral-800">{settings.footerLeft}</p>
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(textTarget('footer.right', 'Alt bilgi sag'));
                  }}
                  className={`${chromeSelect} ${
                    selectedStyleKey === 'footer.right'
                      ? 'border-amber-500 ring-2 ring-amber-400/40'
                      : ''
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    Alt bilgi sag
                  </span>
                  <p className="mt-1 line-clamp-2 text-neutral-800">{settings.footerRight}</p>
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
      <p className="mx-auto mt-3 max-w-5xl text-center text-xs text-admin-muted">
        Header / Footer veya bolume tikla → sag paneli duzenle · Kaydet ile yayinla
      </p>
    </div>
  );
}
