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
        className="rounded-full border border-dashed border-zinc-400 bg-white px-4 py-1.5 text-xs font-semibold text-zinc-600 shadow-sm transition hover:border-sky-500 hover:bg-sky-50 hover:text-sky-800"
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
      className="min-h-0 overflow-auto bg-zinc-200/70 p-4"
      onClick={() => onSelect({ type: 'none' })}
    >
      <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-zinc-300 bg-white shadow-sm">
        <div className={`min-h-[70vh] ${getStoreShellClass(settings)}`}>
          <div
            className={`border-b-2 ${
              selection?.type === 'header' || selection?.type === 'style'
                ? 'border-sky-500'
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
                  <div className="mx-4 h-1 rounded-full bg-sky-500 shadow-sm" />
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
                      ? 'border-sky-500 bg-sky-50/40'
                      : isDragOver
                        ? 'border-sky-400 bg-sky-50/30'
                        : 'border-transparent hover:border-sky-300'
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
                    className="absolute left-2 top-1/2 z-20 flex -translate-y-1/2 cursor-grab flex-col items-center gap-0.5 rounded-md border border-zinc-200 bg-white px-1.5 py-2 text-zinc-400 shadow-sm active:cursor-grabbing"
                    onClick={(event) => event.stopPropagation()}
                    title="Surukle ve birak"
                  >
                    <span className="block h-0.5 w-3 rounded bg-zinc-400" />
                    <span className="block h-0.5 w-3 rounded bg-zinc-400" />
                    <span className="block h-0.5 w-3 rounded bg-zinc-400" />
                  </div>
                  <div className="absolute right-3 top-3 z-20 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                    <button
                      type="button"
                      className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 shadow-sm"
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

                  <div className="pointer-events-none absolute left-12 top-3 z-20 rounded-md bg-zinc-800 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
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
            className={`border-t-2 ${selection?.type === 'footer' ? 'border-sky-500' : 'border-transparent'}`}
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
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-dashed border-zinc-300 hover:border-sky-400'
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    Alt bilgi sol
                  </span>
                  <p className="mt-1 line-clamp-2 text-zinc-700">{settings.footerLeft}</p>
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(textTarget('footer.right', 'Alt bilgi sag'));
                  }}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                    selectedStyleKey === 'footer.right'
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-dashed border-zinc-300 hover:border-sky-400'
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    Alt bilgi sag
                  </span>
                  <p className="mt-1 line-clamp-2 text-zinc-700">{settings.footerRight}</p>
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
      <p className="mx-auto mt-3 max-w-5xl text-center text-xs text-zinc-600">
        Tikla → duzenle · Cift tikla → yaz · Linkler sadece canli sitede calisir
      </p>
    </div>
  );
}
