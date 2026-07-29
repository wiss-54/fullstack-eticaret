'use client';

import { useState } from 'react';
import type { ProductVariant, VariantAxis, VariantAxisInput, VariantRowInput } from '@/lib/types';
import { adminSaveProductVariants } from '@/lib/admin-api';

type DraftValue = {
  label: string;
  colorHex: string;
  stock: string;
  sku: string;
  price: string;
  isActive: boolean;
};

type DraftAxis = {
  name: string;
  displayStyle: 'list' | 'button' | 'color';
  values: DraftValue[];
};

type ProductVariantsEditorProps = {
  productId: number;
  productName: string;
  initialAxes: VariantAxis[];
  initialVariants: ProductVariant[];
  onSaved?: (axes: VariantAxis[], variants: ProductVariant[]) => void;
};

const fieldClass =
  'rounded-xl border border-admin-border bg-admin-bg px-3 py-2 text-sm text-admin-text outline-none ring-admin-primary/30 placeholder:text-admin-muted focus:ring-2';

const DISPLAY_STYLES: {
  value: DraftAxis['displayStyle'];
  label: string;
  hint: string;
}[] = [
  {
    value: 'color',
    label: 'Renk secimi',
    hint: 'Musteri renk kutusundan secer (ornek: Siyah, Beyaz)',
  },
  {
    value: 'button',
    label: 'Beden / secenek butonu',
    hint: 'Musteri butonlardan secer (ornek: S, M, L)',
  },
  {
    value: 'list',
    label: 'Liste',
    hint: 'Acilir listeden secer',
  },
];

const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLOR_PRESETS: { label: string; colorHex: string }[] = [
  { label: 'Siyah', colorHex: '#111111' },
  { label: 'Beyaz', colorHex: '#FFFFFF' },
  { label: 'Kirmizi', colorHex: '#DC2626' },
  { label: 'Mavi', colorHex: '#2563EB' },
  { label: 'Yesil', colorHex: '#16A34A' },
  { label: 'Gri', colorHex: '#6B7280' },
];

function emptyValue(style: DraftAxis['displayStyle'], label = '', colorHex = ''): DraftValue {
  return {
    label,
    colorHex: colorHex || (style === 'color' ? '#111111' : ''),
    stock: '0',
    sku: '',
    price: '',
    isActive: true,
  };
}

function stockFromVariants(label: string, variants: ProductVariant[]): Partial<DraftValue> {
  const key = label.trim().toLowerCase();
  const match = variants.find((variant) =>
    variant.selections.some((selection) => selection.label.trim().toLowerCase() === key),
  );
  if (!match) return {};
  return {
    stock: String(match.stock ?? 0),
    sku: match.sku ?? '',
    price: match.price != null ? String(match.price) : '',
    isActive: match.isActive ?? true,
  };
}

function toDraftAxes(axes: VariantAxis[], variants: ProductVariant[]): DraftAxis[] {
  return axes.map((axis) => ({
    name: axis.name,
    displayStyle: axis.displayStyle,
    values: axis.values.map((value) => ({
      ...emptyValue(axis.displayStyle, value.label, value.colorHex ?? ''),
      ...stockFromVariants(value.label, variants),
      label: value.label,
      colorHex: value.colorHex ?? (axis.displayStyle === 'color' ? '#111111' : ''),
    })),
  }));
}

function toPayload(axes: DraftAxis[]) {
  const payloadAxes: VariantAxisInput[] = axes
    .filter((axis) => axis.name.trim())
    .map((axis, index) => ({
      name: axis.name.trim(),
      displayStyle: axis.displayStyle,
      sortOrder: index,
      values: axis.values
        .filter((value) => value.label.trim())
        .map((value, valueIndex) => ({
          label: value.label.trim(),
          colorHex: value.colorHex.trim() || null,
          sortOrder: valueIndex,
        })),
    }))
    .filter((axis) => axis.values.length > 0);

  const variants: VariantRowInput[] = [];
  for (const axis of axes) {
    for (const [index, value] of axis.values.entries()) {
      const label = value.label.trim();
      if (!label) continue;
      variants.push({
        valueLabels: [label],
        stock: Math.max(0, Math.floor(Number(value.stock || 0))),
        sku: value.sku.trim() || null,
        price: value.price.trim() ? Number(value.price) : null,
        isActive: value.isActive,
        sortOrder: index,
      });
    }
  }

  return { axes: payloadAxes, variants };
}

const emptyAxis = (style: DraftAxis['displayStyle'] = 'button'): DraftAxis => ({
  name: style === 'color' ? 'Renk' : style === 'button' ? 'Beden' : '',
  displayStyle: style,
  values: [emptyValue(style)],
});

export default function ProductVariantsEditor({
  productId,
  productName,
  initialAxes,
  initialVariants,
  onSaved,
}: ProductVariantsEditorProps) {
  const [axes, setAxes] = useState<DraftAxis[]>(() => toDraftAxes(initialAxes, initialVariants));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateAxis(axisIndex: number, nextAxis: DraftAxis) {
    setAxes((current) => {
      const next = [...current];
      next[axisIndex] = nextAxis;
      return next;
    });
  }

  function updateValue(axisIndex: number, valueIndex: number, patch: Partial<DraftValue>) {
    const axis = axes[axisIndex];
    if (!axis) return;
    const values = [...axis.values];
    values[valueIndex] = { ...values[valueIndex], ...patch };
    updateAxis(axisIndex, { ...axis, values });
  }

  function addPresetAxis(style: DraftAxis['displayStyle']) {
    if (axes.length >= 1) {
      setError('Urun basina tek secenek turu. Once mevcut secenegi sil, sonra digerini ekle.');
      return;
    }
    setError(null);
    setAxes([emptyAxis(style)]);
  }

  function addCustomAxis() {
    if (axes.length >= 1) {
      setError('Urun basina tek secenek turu. Once mevcut secenegi sil, sonra digerini ekle.');
      return;
    }
    setError(null);
    setAxes([emptyAxis('list')]);
  }

  function addValuePreset(axisIndex: number, label: string, colorHex = '') {
    const axis = axes[axisIndex];
    if (!axis) return;
    if (axis.values.some((value) => value.label.trim().toLowerCase() === label.toLowerCase())) {
      return;
    }
    updateAxis(axisIndex, {
      ...axis,
      values: [
        ...axis.values.filter((value) => value.label.trim()),
        emptyValue(axis.displayStyle, label, colorHex),
      ],
    });
  }

  function moveValue(axisIndex: number, valueIndex: number, direction: -1 | 1) {
    const axis = axes[axisIndex];
    if (!axis) return;
    const target = valueIndex + direction;
    if (target < 0 || target >= axis.values.length) return;
    const values = [...axis.values];
    const [item] = values.splice(valueIndex, 1);
    values.splice(target, 0, item);
    updateAxis(axisIndex, { ...axis, values });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = toPayload(axes);
      if (payload.axes.length === 0) {
        throw new Error('Bir secenek turu sec (Renk veya Beden) ve en az bir deger ekle.');
      }
      if (payload.axes.length > 1) {
        throw new Error('Sadece bir secenek turu olabilir. Fazla secenekleri sil.');
      }
      if (payload.variants.length === 0) {
        throw new Error('En az bir deger yaz (ornegin S, M) ve stok gir.');
      }

      const labels = payload.variants.map((row) => row.valueLabels[0]?.toLowerCase());
      if (new Set(labels).size !== labels.length) {
        throw new Error('Ayni deger iki kez eklenemez (ornegin iki tane M).');
      }

      const saved = await adminSaveProductVariants(productId, payload);
      setAxes(toDraftAxes(saved.variantAxes ?? [], saved.variants ?? []));
      setMessage(
        `${productName || 'Urun'} icin ${saved.variants?.length ?? 0} varyant kaydedildi. Her beden/renk ayri stokta.`,
      );
      onSaved?.(saved.variantAxes ?? [], saved.variants ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Varyantlar kaydedilemedi');
    } finally {
      setSaving(false);
    }
  }

  const filledCount = axes.reduce(
    (sum, axis) => sum + axis.values.filter((value) => value.label.trim()).length,
    0,
  );

  return (
    <div className="mt-6 space-y-5 border-t border-admin-border pt-6">
      <div className="rounded-2xl border border-admin-primary/30 bg-admin-primary-container/15 p-4 text-sm text-admin-text">
        <p className="font-semibold text-admin-primary">Urun Secenekleri (Varyant)</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-admin-muted">
          <li>
            Tek tur sec: tisort → <strong className="text-admin-text">Beden</strong>, saat →{' '}
            <strong className="text-admin-text">Renk</strong>
          </li>
          <li>
            Her degerin yanina <strong className="text-admin-text">ayri stok</strong> yaz (M=10, S=10
            gibi)
          </li>
          <li>
            <strong className="text-admin-text">Varyantlari Kaydet</strong> — tek tikla kaydolur
          </li>
        </ol>
      </div>

      {axes.length > 1 ? (
        <div className="rounded-xl border border-admin-danger/40 bg-admin-danger/10 px-4 py-3 text-sm text-admin-danger">
          Bu urunde birden fazla secenek turu var. Fazlalari silip tek tur birak.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-admin-text">Secenek turu</h3>
          <p className="text-sm text-admin-muted">Urun basina sadece bir tur</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={axes.length >= 1}
            onClick={() => addPresetAxis('color')}
            className="rounded-lg border border-admin-border px-3 py-1.5 text-sm text-admin-text hover:border-admin-primary disabled:opacity-50"
          >
            + Renk
          </button>
          <button
            type="button"
            disabled={axes.length >= 1}
            onClick={() => addPresetAxis('button')}
            className="rounded-lg border border-admin-border px-3 py-1.5 text-sm text-admin-text hover:border-admin-primary disabled:opacity-50"
          >
            + Beden
          </button>
          <button
            type="button"
            disabled={axes.length >= 1}
            onClick={addCustomAxis}
            className="rounded-lg border border-admin-border px-3 py-1.5 text-sm text-admin-muted hover:border-admin-primary disabled:opacity-50"
          >
            + Ozel
          </button>
        </div>
      </div>

      {axes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-admin-border bg-admin-bg px-4 py-6 text-center">
          <p className="text-sm text-admin-muted">
            Ornek: tisort → <strong className="text-admin-text">Beden</strong>, saat →{' '}
            <strong className="text-admin-text">Renk</strong>.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {axes.map((axis, axisIndex) => {
            const styleMeta =
              DISPLAY_STYLES.find((item) => item.value === axis.displayStyle) ?? DISPLAY_STYLES[1];
            return (
              <div
                key={`axis-${axisIndex}`}
                className="rounded-xl border border-admin-border bg-admin-surface-low p-4"
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-admin-muted">
                      {axis.name || 'Secenek'}
                    </p>
                    <p className="mt-1 text-sm text-admin-muted">{styleMeta.hint}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAxes((current) => current.filter((_, idx) => idx !== axisIndex))}
                    className="text-sm text-admin-danger"
                  >
                    Kaldir
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-sm text-admin-muted">Secenek adi</span>
                    <input
                      className={fieldClass}
                      placeholder="Orn: Renk, Beden"
                      value={axis.name}
                      onChange={(event) =>
                        updateAxis(axisIndex, { ...axis, name: event.target.value })
                      }
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-sm text-admin-muted">Musteriye nasil gosterilsin?</span>
                    <select
                      className={fieldClass}
                      value={axis.displayStyle}
                      onChange={(event) => {
                        const displayStyle = event.target.value as DraftAxis['displayStyle'];
                        updateAxis(axisIndex, {
                          ...axis,
                          displayStyle,
                          name:
                            axis.name.trim() ||
                            (displayStyle === 'color'
                              ? 'Renk'
                              : displayStyle === 'button'
                                ? 'Beden'
                                : axis.name),
                        });
                      }}
                    >
                      {DISPLAY_STYLES.map((style) => (
                        <option key={style.value} value={style.value}>
                          {style.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-admin-text">
                      Degerler + stok ({axis.values.filter((v) => v.label.trim()).length})
                    </p>
                    {axis.displayStyle === 'button' ? (
                      <div className="flex flex-wrap gap-1.5">
                        {SIZE_PRESETS.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => addValuePreset(axisIndex, size)}
                            className="rounded-lg border border-admin-border px-2 py-0.5 text-xs text-admin-muted hover:border-admin-primary hover:text-admin-primary"
                          >
                            +{size}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {axis.displayStyle === 'color' ? (
                      <div className="flex flex-wrap gap-1.5">
                        {COLOR_PRESETS.map((color) => (
                          <button
                            key={color.label}
                            type="button"
                            onClick={() =>
                              addValuePreset(axisIndex, color.label, color.colorHex)
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-admin-border px-2 py-0.5 text-xs text-admin-muted hover:border-admin-primary hover:text-admin-primary"
                          >
                            <span
                              className="h-3 w-3 rounded-full border border-admin-border"
                              style={{ backgroundColor: color.colorHex }}
                            />
                            +{color.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-admin-border">
                    <table className="min-w-full text-sm text-admin-text">
                      <thead className="bg-admin-surface-high text-left">
                        <tr>
                          <th className="px-3 py-2 font-medium text-admin-muted">Deger</th>
                          {axis.displayStyle === 'color' ? (
                            <th className="px-3 py-2 font-medium text-admin-muted">Renk</th>
                          ) : null}
                          <th className="px-3 py-2 font-medium text-admin-muted">Stok</th>
                          <th className="px-3 py-2 font-medium text-admin-muted">SKU</th>
                          <th className="px-3 py-2 font-medium text-admin-muted">Fiyat</th>
                          <th className="px-3 py-2 font-medium text-admin-muted">Aktif</th>
                          <th className="px-3 py-2 font-medium text-admin-muted">Sira</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {axis.values.map((value, valueIndex) => (
                          <tr key={`value-${valueIndex}`} className="border-t border-admin-border">
                            <td className="px-3 py-2">
                              <input
                                className={`${fieldClass} min-w-[5rem]`}
                                placeholder={
                                  axis.displayStyle === 'color'
                                    ? 'Siyah'
                                    : axis.displayStyle === 'button'
                                      ? 'M'
                                      : 'Deger'
                                }
                                value={value.label}
                                onChange={(event) =>
                                  updateValue(axisIndex, valueIndex, { label: event.target.value })
                                }
                              />
                            </td>
                            {axis.displayStyle === 'color' ? (
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    className="h-9 w-10 cursor-pointer rounded-lg border border-admin-border bg-admin-bg"
                                    value={value.colorHex || '#111111'}
                                    onChange={(event) =>
                                      updateValue(axisIndex, valueIndex, {
                                        colorHex: event.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </td>
                            ) : null}
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="0"
                                className={`${fieldClass} w-24`}
                                value={value.stock}
                                onChange={(event) =>
                                  updateValue(axisIndex, valueIndex, { stock: event.target.value })
                                }
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                className={`${fieldClass} w-28`}
                                placeholder="SKU"
                                value={value.sku}
                                onChange={(event) =>
                                  updateValue(axisIndex, valueIndex, { sku: event.target.value })
                                }
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className={`${fieldClass} w-28`}
                                placeholder="Ana fiyat"
                                value={value.price}
                                onChange={(event) =>
                                  updateValue(axisIndex, valueIndex, { price: event.target.value })
                                }
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={value.isActive}
                                onChange={(event) =>
                                  updateValue(axisIndex, valueIndex, {
                                    isActive: event.target.checked,
                                  })
                                }
                              />
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  disabled={valueIndex === 0}
                                  onClick={() => moveValue(axisIndex, valueIndex, -1)}
                                  className="rounded border border-admin-border px-2 text-xs text-admin-muted hover:text-admin-text disabled:opacity-30"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  disabled={valueIndex === axis.values.length - 1}
                                  onClick={() => moveValue(axisIndex, valueIndex, 1)}
                                  className="rounded border border-admin-border px-2 text-xs text-admin-muted hover:text-admin-text disabled:opacity-30"
                                >
                                  ↓
                                </button>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateAxis(axisIndex, {
                                    ...axis,
                                    values: axis.values.filter((_, idx) => idx !== valueIndex),
                                  })
                                }
                                className="text-sm text-admin-danger"
                              >
                                Sil
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      updateAxis(axisIndex, {
                        ...axis,
                        values: [...axis.values, emptyValue(axis.displayStyle)],
                      })
                    }
                    className="rounded-lg border border-admin-border px-3 py-1.5 text-sm text-admin-text hover:border-admin-primary"
                  >
                    Deger satiri ekle
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={saving || filledCount === 0}
          onClick={() => void handleSave()}
          className="rounded-xl bg-admin-primary-container px-4 py-3 text-sm font-medium text-admin-on-primary-container disabled:opacity-60"
        >
          {saving ? 'Kaydediliyor...' : `Varyantlari Kaydet (${filledCount} deger)`}
        </button>
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
        {error ? <p className="text-sm text-admin-danger">{error}</p> : null}
      </div>
    </div>
  );
}
