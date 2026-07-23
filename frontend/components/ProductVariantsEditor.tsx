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

const emptyAxis = (): DraftAxis => ({
  name: '',
  displayStyle: 'button',
  values: [{ label: '', colorHex: '' }],
});

export default function ProductVariantsEditor({
  productId,
  productName,
  initialAxes,
  initialVariants,
  onSaved,
}: ProductVariantsEditorProps) {
  const [axes, setAxes] = useState<DraftAxis[]>(() => toDraftAxes(initialAxes));
  const [rows, setRows] = useState<DraftRow[]>(() => buildRowsFromAxes(toDraftAxes(initialAxes), initialVariants));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const combinationCount = useMemo(() => rows.length, [rows]);

  function regenerateRows() {
    setRows(buildRowsFromAxes(axes, []));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = toPayload(axes, rows);
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
        <p className="font-semibold text-admin-primary">iKas / Shopify tarzı varyant yönetimi</p>
        <p className="mt-1 text-admin-muted">
          Beden, renk gibi eksenleri tanımla; sistem kombinasyonları otomatik üretir. Her satır için
          ayrı stok, SKU ve fiyat girebilirsin.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-admin-text">Varyant Eksenleri</h3>
        <button
          type="button"
          disabled={axes.length >= 3}
          onClick={() => setAxes((current) => [...current, emptyAxis()])}
          className="rounded-lg border border-admin-border px-3 py-1 text-sm text-admin-text hover:border-admin-primary disabled:opacity-50"
        >
          Eksen Ekle (max 3)
        </button>
      </div>

      {axes.length === 0 ? (
        <p className="text-sm text-admin-muted">
          Bu urun basit urun. Varyant icin en az bir eksen ekle (ornek: Beden).
        </p>
      ) : (
        <div className="space-y-4">
          {axes.map((axis, axisIndex) => (
            <div
              key={`axis-${axisIndex}`}
              className="rounded-xl border border-admin-border bg-admin-surface-low p-4"
            >
              <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto]">
                <input
                  className={fieldClass}
                  placeholder="Eksen adi (Beden, Renk...)"
                  value={axis.name}
                  onChange={(event) => {
                    const next = [...axes];
                    next[axisIndex] = { ...axis, name: event.target.value };
                    setAxes(next);
                  }}
                />
                <select
                  className={fieldClass}
                  value={axis.displayStyle}
                  onChange={(event) => {
                    const next = [...axes];
                    next[axisIndex] = {
                      ...axis,
                      displayStyle: event.target.value as DraftAxis['displayStyle'],
                    };
                    setAxes(next);
                  }}
                >
                  <option value="button">Buton (Shopify beden stili)</option>
                  <option value="color">Renk swatch (iKas renk stili)</option>
                  <option value="list">Liste</option>
                </select>
                <button
                  type="button"
                  onClick={() => setAxes((current) => current.filter((_, idx) => idx !== axisIndex))}
                  className="text-sm text-admin-danger"
                >
                  Kaldir
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {axis.values.map((value, valueIndex) => (
                  <div key={`value-${valueIndex}`} className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
                    <input
                      className={fieldClass}
                      placeholder="Deger (S, M, Siyah...)"
                      value={value.label}
                      onChange={(event) => {
                        const next = [...axes];
                        const values = [...axis.values];
                        values[valueIndex] = { ...value, label: event.target.value };
                        next[axisIndex] = { ...axis, values };
                        setAxes(next);
                      }}
                    />
                    {axis.displayStyle === 'color' ? (
                      <input
                        className={fieldClass}
                        placeholder="#000000"
                        value={value.colorHex}
                        onChange={(event) => {
                          const next = [...axes];
                          const values = [...axis.values];
                          values[valueIndex] = { ...value, colorHex: event.target.value };
                          next[axisIndex] = { ...axis, values };
                          setAxes(next);
                        }}
                      />
                    ) : (
                      <div />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...axes];
                        next[axisIndex] = {
                          ...axis,
                          values: axis.values.filter((_, idx) => idx !== valueIndex),
                        };
                        setAxes(next);
                      }}
                      className="text-sm text-admin-danger"
                    >
                      Sil
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const next = [...axes];
                    next[axisIndex] = {
                      ...axis,
                      values: [...axis.values, { label: '', colorHex: '' }],
                    };
                    setAxes(next);
                  }}
                  className="rounded-lg border border-admin-border px-3 py-1 text-sm text-admin-text hover:border-admin-primary"
                >
                  Deger Ekle
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {rows.length > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold text-admin-text">
                Varyant Matrisi ({combinationCount} kombinasyon)
              </h4>
              <p className="text-sm text-admin-muted">
                {productName} icin her kombinasyona stok gir. Ornek: M + Siyah = 4 adet.
              </p>
            </div>
            <button
              type="button"
              onClick={regenerateRows}
              className="rounded-lg border border-admin-border px-3 py-1 text-sm text-admin-text hover:border-admin-primary"
            >
              Kombinasyonlari Yenile
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-admin-border">
            <table className="min-w-full text-sm text-admin-text">
              <thead className="bg-admin-surface-high text-left">
                <tr>
                  {axes.map((axis) => (
                    <th key={axis.name} className="px-4 py-3 font-medium text-admin-muted">
                      {axis.name || 'Eksen'}
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
                    {row.valueLabels.map((label) => (
                      <td key={label} className="px-4 py-3">
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
      ) : null}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="rounded-xl bg-admin-primary-container px-4 py-3 text-sm font-medium text-admin-on-primary-container disabled:opacity-60"
        >
          {saving ? 'Kaydediliyor...' : 'Varyantlari Kaydet'}
        </button>
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
        {error ? <p className="text-sm text-admin-danger">{error}</p> : null}
      </div>
    </div>
  );
}
