'use client';

import { useState } from 'react';
import type { ProductOption, ProductOptionInput } from '@/lib/types';
import { adminSaveProductOptions } from '@/lib/admin-api';

type DraftChoice = {
  label: string;
  priceDelta: string;
};

type DraftOption = {
  label: string;
  optionType: 'select' | 'text';
  required: boolean;
  choices: DraftChoice[];
};

type ProductOptionsEditorProps = {
  productId: number;
  initialOptions: ProductOption[];
  onSaved?: (options: ProductOption[]) => void;
};

const fieldClass =
  'rounded-xl border border-admin-border bg-admin-bg px-3 py-2 text-sm text-admin-text outline-none ring-admin-primary/30 placeholder:text-admin-muted focus:ring-2';

function toDraft(options: ProductOption[]): DraftOption[] {
  return options.map((option) => ({
    label: option.label,
    optionType: option.optionType,
    required: option.required,
    choices: option.choices.map((choice) => ({
      label: choice.label,
      priceDelta: String(choice.priceDelta),
    })),
  }));
}

function toPayload(options: DraftOption[]): ProductOptionInput[] {
  return options.map((option, index) => ({
    label: option.label.trim(),
    optionType: option.optionType,
    required: option.required,
    sortOrder: index,
    choices:
      option.optionType === 'select'
        ? option.choices
            .filter((choice) => choice.label.trim())
            .map((choice, choiceIndex) => ({
              label: choice.label.trim(),
              priceDelta: Number(choice.priceDelta || 0),
              sortOrder: choiceIndex,
            }))
        : undefined,
  }));
}

const emptyOption = (): DraftOption => ({
  label: '',
  optionType: 'select',
  required: false,
  choices: [{ label: '', priceDelta: '0' }],
});

export default function ProductOptionsEditor({
  productId,
  initialOptions,
  onSaved,
}: ProductOptionsEditorProps) {
  const [draft, setDraft] = useState<DraftOption[]>(() => toDraft(initialOptions));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateOption(index: number, patch: Partial<DraftOption>) {
    setDraft((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...patch } : option,
      ),
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = toPayload(draft);
      const saved = await adminSaveProductOptions(productId, payload);
      setDraft(toDraft(saved));
      setMessage('Secenekler kaydedildi');
      onSaved?.(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Secenekler kaydedilemedi');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 space-y-4 border-t border-admin-border pt-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-admin-text">Metin alanlari (opsiyonel)</h3>
        <button
          type="button"
          onClick={() => setDraft((current) => [...current, emptyOption()])}
          className="rounded-lg border border-admin-border px-3 py-1 text-sm text-admin-text hover:border-admin-primary"
        >
          Alan Ekle
        </button>
      </div>

      <p className="text-sm text-admin-muted">
        Beden/renk stogu icin <strong className="text-admin-text">Urun Secenekleri (Varyant)</strong>{' '}
        bolumunu kullan. Burasi sadece ekstra metin alani icindir.
      </p>

      {draft.length === 0 ? (
        <p className="text-sm text-admin-muted">Bu urun icin henuz secenek yok.</p>
      ) : (
        <div className="space-y-4">
          {draft.map((option, index) => (
            <div
              key={`option-${index}`}
              className="rounded-xl border border-admin-border bg-admin-surface-low p-4"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className={fieldClass}
                  placeholder="Secenek adi (or. Beden)"
                  value={option.label}
                  onChange={(event) => updateOption(index, { label: event.target.value })}
                />
                <select
                  className={fieldClass}
                  value={option.optionType}
                  onChange={(event) =>
                    updateOption(index, {
                      optionType: event.target.value as 'select' | 'text',
                      choices:
                        event.target.value === 'select'
                          ? option.choices.length > 0
                            ? option.choices
                            : [{ label: '', priceDelta: '0' }]
                          : [],
                    })
                  }
                >
                  <option value="select">Liste (select)</option>
                  <option value="text">Metin (text)</option>
                </select>
              </div>

              <label className="mt-3 flex items-center gap-2 text-sm text-admin-text">
                <input
                  type="checkbox"
                  checked={option.required}
                  onChange={(event) => updateOption(index, { required: event.target.checked })}
                />
                Zorunlu alan
              </label>

              {option.optionType === 'select' ? (
                <div className="mt-3 space-y-2">
                  {option.choices.map((choice, choiceIndex) => (
                    <div key={`choice-${choiceIndex}`} className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
                      <input
                        className={fieldClass}
                        placeholder="Deger (or. M)"
                        value={choice.label}
                        onChange={(event) => {
                          const choices = [...option.choices];
                          choices[choiceIndex] = { ...choices[choiceIndex], label: event.target.value };
                          updateOption(index, { choices });
                        }}
                      />
                      <input
                        className={fieldClass}
                        placeholder="Fiyat +"
                        type="number"
                        step="0.01"
                        value={choice.priceDelta}
                        onChange={(event) => {
                          const choices = [...option.choices];
                          choices[choiceIndex] = {
                            ...choices[choiceIndex],
                            priceDelta: event.target.value,
                          };
                          updateOption(index, { choices });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateOption(index, {
                            choices: option.choices.filter((_, idx) => idx !== choiceIndex),
                          })
                        }
                        className="rounded-lg border border-admin-danger/50 px-3 py-2 text-sm text-admin-danger"
                      >
                        Sil
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      updateOption(index, {
                        choices: [...option.choices, { label: '', priceDelta: '0' }],
                      })
                    }
                    className="rounded-lg border border-admin-border px-3 py-1 text-sm text-admin-text hover:border-admin-primary"
                  >
                    Deger Ekle
                  </button>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setDraft((current) => current.filter((_, idx) => idx !== index))}
                className="mt-3 text-sm text-admin-danger"
              >
                Bu secenegi kaldir
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="rounded-xl bg-admin-primary-container px-4 py-3 text-sm font-medium text-admin-on-primary-container disabled:opacity-60"
        >
          {saving ? 'Kaydediliyor...' : 'Secenekleri Kaydet'}
        </button>
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
        {error ? <p className="text-sm text-admin-danger">{error}</p> : null}
      </div>
    </div>
  );
}
