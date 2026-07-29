'use client';

import { useMemo, useState } from 'react';
import type { ProductVariant, VariantAxis, VariantAxisInput, VariantRowInput } from '@/lib/types';
import { adminSaveProductVariants } from '@/lib/admin-api';

type DraftValue = { label: string; colorHex: string };
type DraftAxis = {
  name: string;
  displayStyle: 'list' | 'button' | 'color';
  values: DraftValue[];
};

type DraftRow = {
  valueLabels: string[];
  stock: string;
  sku: string;
  price: string;
  isActive: boolean;
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

const cellFieldClass =
  'rounded-lg border border-admin-border bg-admin-bg px-2 py-1 text-admin-text outline-none ring-admin-primary/30 focus:ring-2';

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

function cartesian<T>(groups: T[][]): T[][] {
  if (groups.length === 0) return [[]];
  return groups.reduce<T[][]>(
    (acc, group) => acc.flatMap((prefix) => group.map((item) => [...prefix, item])),
    [[]],
  );
}

function toDraftAxes(axes: VariantAxis[]): DraftAxis[] {
  return axes.map((axis) => ({
    name: axis.name,
    displayStyle: axis.displayStyle,
    values: axis.values.map((value) => ({
      label: value.label,
      colorHex: value.colorHex ?? '',
    })),
  }));
}

function buildRowsFromAxes(axes: DraftAxis[], existing: ProductVariant[]): DraftRow[] {
  const cleanedAxes = axes
    .map((axis) => ({
      ...axis,
      values: axis.values.filter((value) => value.label.trim()),
    }))
    .filter((axis) => axis.name.trim() && axis.values.length > 0);

  if (cleanedAxes.length === 0) return [];

  const combos = cartesian(cleanedAxes.map((axis) => axis.values.map((value) => value.label)));
  const existingByKey = new Map(
    existing.map((variant) => [
      variant.selections.map((selection) => selection.label.trim().toLowerCase()).join('|'),
      variant,
    ]),
  );

  return combos.map((labels) => {
    const key = labels.map((label) => label.trim().toLowerCase()).join('|');
    const match = existingByKey.get(key);
    return {
      valueLabels: labels,
      stock: String(match?.stock ?? 0),
      sku: match?.sku ?? '',
      price: match?.price != null ? String(match.price) : '',
      isActive: match?.isActive ?? true,
    };
  });
}

function toPayload(axes: DraftAxis[], rows: DraftRow[]) {
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

  const variants: VariantRowInput[] = rows.map((row, index) => ({
    valueLabels: row.valueLabels,
    stock: Number(row.stock || 0),
    sku: row.sku.trim() || null,
    price: row.price.trim() ? Number(row.price) : null,
    isActive: row.isActive,
    sortOrder: index,
  }));

  return { axes: payloadAxes, variants };
}

const emptyAxis = (style: DraftAxis['displayStyle'] = 'button'): DraftAxis => ({
  name: style === 'color' ? 'Renk' : style === 'button' ? 'Beden' : '',
  displayStyle: style,
  values: [{ label: '', colorHex: style === 'color' ? '#111111' : '' }],
});

export default function ProductVariantsEditor({
  productId,
  productName,
  initialAxes,
  initialVariants,
  onSaved,
}: ProductVariantsEditorProps) {
  const [axes, setAxes] = useState<DraftAxis[]>(() => toDraftAxes(initialAxes));
  const [rows, setRows] = useState<DraftRow[]>(() =>
    buildRowsFromAxes(toDraftAxes(initialAxes), initialVariants),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const combinationCount = useMemo(() => rows.length, [rows]);

  function updateAxis(axisIndex: number, nextAxis: DraftAxis) {
    setAxes((current) => {
      const next = [...current];
      next[axisIndex] = nextAxis;
      return next;
    });
  }

  function regenerateRows() {
    setRows(buildRowsFromAxes(axes, []));
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
      values: [...axis.values.filter((value) => value.label.trim()), { label, colorHex }],
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = toPayload(axes, rows);
      if (payload.axes.length === 0) {
        throw new Error('Bir secenek turu sec (Renk veya Beden) ve deger ekle.');
      }
      if (payload.axes.length > 1) {
        throw new Error('Sadece bir secenek turu olabilir. Fazla secenekleri sil.');
      }
      if (payload.variants.length === 0) {
        throw new Error('Once "Stok satirlarini olustur" ile satirlari uret.');
      }
      const saved = await adminSaveProductVariants(productId, payload);
      setMessage('Varyantlar kaydedildi');
      onSaved?.(saved.variantAxes ?? [], saved.variants ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Varyantlar kaydedilemedi');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 space-y-5 border-t border-admin-border pt-6">
      <div className="rounded-2xl border border-admin-primary/30 bg-admin-primary-container/15 p-4 text-sm text-admin-text">
        <p className="font-semibold text-admin-primary">Varyantlar — tek secenek turu</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-admin-muted">
          <li>
            Urun tipine gore bir tur sec: tisort icin <strong className="text-admin-text">Beden</strong>,
            saat icin <strong className="text-admin-text">Renk</strong>
          </li>
          <li>Degerleri yaz (S, M, L veya Siyah, Beyaz...)</li>
          <li>Stok satirlarini olustur, her satira stok gir</li>
          <li>Varyantlari kaydet</li>
        </ol>
        <p className="mt-2 text-xs text-admin-muted">
          Renk x beden kombinasyonu yok. Hem renk hem beden lazimsa ayri urun olarak ac.
        </p>
      </div>

      {axes.length > 1 ? (
        <div className="rounded-xl border border-admin-danger/40 bg-admin-danger/10 px-4 py-3 text-sm text-admin-danger">
          Bu urunde birden fazla secenek turu var. Fazlalari silip tek tur birak (ornegin sadece Beden).
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-admin-text">1) Secenek turu</h3>
          <p className="text-sm text-admin-muted">Urun basina sadece bir tur (Renk veya Beden)</p>
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
                      Secenek {axisIndex + 1}
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
                      placeholder="Orn: Renk, Beden, Materyal"
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

                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-admin-text">Degerler</p>

                  {axis.displayStyle === 'button' ? (
                    <div className="flex flex-wrap gap-2">
                      {SIZE_PRESETS.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => addValuePreset(axisIndex, size)}
                          className="rounded-lg border border-admin-border px-2.5 py-1 text-xs text-admin-muted hover:border-admin-primary hover:text-admin-primary"
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {axis.displayStyle === 'color' ? (
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color.label}
                          type="button"
                          onClick={() => addValuePreset(axisIndex, color.label, color.colorHex)}
                          className="inline-flex items-center gap-2 rounded-lg border border-admin-border px-2.5 py-1 text-xs text-admin-muted hover:border-admin-primary hover:text-admin-primary"
                        >
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-admin-border"
                            style={{ backgroundColor: color.colorHex }}
                          />
                          {color.label}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {axis.values.map((value, valueIndex) => (
                    <div
                      key={`value-${valueIndex}`}
                      className="grid gap-2 sm:grid-cols-[1fr_auto_auto]"
                    >
                      <input
                        className={fieldClass}
                        placeholder={
                          axis.displayStyle === 'color'
                            ? 'Renk adi (Siyah)'
                            : axis.displayStyle === 'button'
                              ? 'Beden (M)'
                              : 'Deger'
                        }
                        value={value.label}
                        onChange={(event) => {
                          const values = [...axis.values];
                          values[valueIndex] = { ...value, label: event.target.value };
                          updateAxis(axisIndex, { ...axis, values });
                        }}
                      />
                      {axis.displayStyle === 'color' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            className="h-10 w-12 cursor-pointer rounded-lg border border-admin-border bg-admin-bg"
                            value={value.colorHex || '#111111'}
                            onChange={(event) => {
                              const values = [...axis.values];
                              values[valueIndex] = { ...value, colorHex: event.target.value };
                              updateAxis(axisIndex, { ...axis, values });
                            }}
                            title="Renk sec"
                          />
                          <input
                            className={`${fieldClass} w-28`}
                            placeholder="#111111"
                            value={value.colorHex}
                            onChange={(event) => {
                              const values = [...axis.values];
                              values[valueIndex] = { ...value, colorHex: event.target.value };
                              updateAxis(axisIndex, { ...axis, values });
                            }}
                          />
                        </div>
                      ) : (
                        <div />
                      )}
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
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      updateAxis(axisIndex, {
                        ...axis,
                        values: [
                          ...axis.values,
                          {
                            label: '',
                            colorHex: axis.displayStyle === 'color' ? '#111111' : '',
                          },
                        ],
                      })
                    }
                    className="rounded-lg border border-admin-border px-3 py-1 text-sm text-admin-text hover:border-admin-primary"
                  >
                    Deger ekle
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-admin-text">2) Stok satirlari</h3>
          <p className="text-sm text-admin-muted">
            Her deger icin ayri stok. Bos fiyat = ana urun fiyati.
          </p>
        </div>
        <button
          type="button"
          onClick={regenerateRows}
          className="rounded-lg border border-admin-border px-3 py-1.5 text-sm text-admin-text hover:border-admin-primary"
        >
          Stok satirlarini olustur / yenile
        </button>
      </div>

      {rows.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-admin-muted">
            {productName || 'Urun'} icin {combinationCount} varyant satiri
          </p>
          <div className="overflow-x-auto rounded-xl border border-admin-border">
            <table className="min-w-full text-sm text-admin-text">
              <thead className="bg-admin-surface-high text-left">
                <tr>
                  {axes.map((axis, index) => (
                    <th key={`${axis.name}-${index}`} className="px-4 py-3 font-medium text-admin-muted">
                      {axis.name || `Secenek ${index + 1}`}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-medium text-admin-muted">Stok</th>
                  <th className="px-4 py-3 font-medium text-admin-muted">SKU</th>
                  <th className="px-4 py-3 font-medium text-admin-muted">Fiyat</th>
                  <th className="px-4 py-3 font-medium text-admin-muted">Aktif</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={row.valueLabels.join('|')} className="border-t border-admin-border">
                    {row.valueLabels.map((label, labelIndex) => (
                      <td key={`${label}-${labelIndex}`} className="px-4 py-3">
                        {label}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        className={`w-24 ${cellFieldClass}`}
                        value={row.stock}
                        onChange={(event) => {
                          const next = [...rows];
                          next[rowIndex] = { ...row, stock: event.target.value };
                          setRows(next);
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className={`w-36 ${cellFieldClass}`}
                        placeholder="SKU"
                        value={row.sku}
                        onChange={(event) => {
                          const next = [...rows];
                          next[rowIndex] = { ...row, sku: event.target.value };
                          setRows(next);
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={`w-28 ${cellFieldClass}`}
                        placeholder="Bos = ana fiyat"
                        value={row.price}
                        onChange={(event) => {
                          const next = [...rows];
                          next[rowIndex] = { ...row, price: event.target.value };
                          setRows(next);
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={row.isActive}
                        onChange={(event) => {
                          const next = [...rows];
                          next[rowIndex] = { ...row, isActive: event.target.checked };
                          setRows(next);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-admin-border bg-admin-bg px-4 py-5 text-sm text-admin-muted">
          Secenek ve degerleri girdikten sonra &quot;Stok satirlarini olustur&quot;a bas.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="rounded-xl bg-admin-primary-container px-4 py-3 text-sm font-medium text-admin-on-primary-container disabled:opacity-60"
        >
          {saving ? 'Kaydediliyor...' : '3) Varyantlari Kaydet'}
        </button>
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
        {error ? <p className="text-sm text-admin-danger">{error}</p> : null}
      </div>
    </div>
  );
}
