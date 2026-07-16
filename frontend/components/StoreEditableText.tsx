'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { getTextStyleClasses, getTextStyleInline } from '@/lib/store-text-styles';
import type { StoreTextStyles } from '@/lib/types';

type Props = {
  styleKey: string;
  value: string;
  textStyles?: StoreTextStyles;
  accentColor: string;
  selected: boolean;
  multiline?: boolean;
  onSelect: (styleKey: string) => void;
  onChange?: (value: string) => void;
  className?: string;
  as?: 'p' | 'h2' | 'h3' | 'span';
  children?: ReactNode;
};

const editClass =
  'w-full rounded-md border-2 border-amber-600 bg-white/95 px-2 py-1 text-inherit shadow-sm outline-none dark:bg-stone-950/95';

export default function StoreEditableText({
  styleKey,
  value,
  textStyles,
  accentColor,
  selected,
  multiline = false,
  onSelect,
  onChange,
  className = '',
  as: Tag = 'p',
  children,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const styleClasses = getTextStyleClasses(textStyles, styleKey);
  const inlineStyle = getTextStyleInline(textStyles, styleKey, accentColor);
  const display = children ?? value;

  function commit() {
    onChange?.(draft);
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (editing && onChange) {
    const sharedProps = {
      ref: inputRef as never,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setDraft(e.target.value),
      onBlur: commit,
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
      onKeyDown: (e: React.KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === 'Escape') {
          e.preventDefault();
          cancel();
        }
        if (!multiline && e.key === 'Enter') {
          e.preventDefault();
          commit();
        }
      },
      className: `${editClass} ${styleClasses} ${className}`,
      style: inlineStyle,
    };

    return multiline ? (
      <textarea {...sharedProps} rows={3} />
    ) : (
      <input type="text" {...sharedProps} />
    );
  }

  return (
    <Tag
      role="button"
      tabIndex={0}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(styleKey);
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onSelect(styleKey);
        if (onChange) {
          setDraft(value);
          setEditing(true);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          onSelect(styleKey);
        }
      }}
      className={`relative cursor-pointer rounded-md outline-none transition ${
        selected
          ? 'ring-2 ring-amber-600 ring-offset-2 ring-offset-white dark:ring-offset-stone-950'
          : 'hover:ring-2 hover:ring-amber-500/60 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-stone-950'
      } ${styleClasses} ${className}`}
      style={inlineStyle}
      title="Cift tikla → sayfada duzenle"
    >
      {display}
      {selected ? (
        <span className="pointer-events-none absolute -top-5 left-0 rounded bg-amber-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Metin
        </span>
      ) : null}
    </Tag>
  );
}
