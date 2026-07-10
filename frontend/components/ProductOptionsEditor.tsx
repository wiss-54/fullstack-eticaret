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
    <div className="mt-6 space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Urun Secenekleri</h3>
        <button
          type="button"
          onClick={() => setDraft((current) => [...current, emptyOption()])}
          className="rounded-lg border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
        >
          Secenek Ekle
        </button>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Kisilestirme alanlari (metin). Beden/renk stoklari icin yukaridaki Varyant Matrisi bolumunu kullan.
      </p>

      {draft.length === 0 ? (
        <p className="text-sm text-zinc-500">Bu urun icin henuz secenek yok.</p>
      ) : (
        <div className="space-y-4">
          {draft.map((option, index) => (
            <div
              key={`option-${index}`}
              className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  placeholder="Secenek adi (or. Beden)"
                  value={option.label}
                  onChange={(event) => updateOption(index, { label: event.target.value })}
                />
                <select
                  className="rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
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

              <label className="mt-3 flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
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
                        className="rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                        placeholder="Deger (or. M)"
                        value={choice.label}
                        onChange={(event) => {
                          const choices = [...option.choices];
                          choices[choiceIndex] = { ...choices[choiceIndex], label: event.target.value };
                          updateOption(index, { choices });
                        }}
                      />
                      <input
                        className="rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
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
                        className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:text-red-300"
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
                    className="rounded-lg border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
                  >
                    Deger Ekle
                  </button>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setDraft((current) => current.filter((_, idx) => idx !== index))}
                className="mt-3 text-sm text-red-600 dark:text-red-300"
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
          className="rounded-xl bg-amber-800 px-4 py-3 text-sm font-medium text-white disabled:opacity-60 dark:bg-amber-500 dark:text-zinc-950"
        >
          {saving ? 'Kaydediliyor...' : 'Secenekleri Kaydet'}
        </button>
        {message ? <p className="text-sm text-green-700 dark:text-green-300">{message}</p> : null}
        {error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}
      </div>
    </div>
  );
}
