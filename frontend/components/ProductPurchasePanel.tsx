'use client';

import { useMemo, useState } from 'react';
import type { Product, ProductOption, ProductVariant, VariantAxis } from '@/lib/types';
import { useCart } from '@/components/CartProvider';
import type { SelectedOption } from '@/lib/cart';
import { formatStorePrice } from '@/lib/format-price';

type ProductPurchasePanelProps = {
  product: Product;
  currencyCode?: string;
  currencyDecimals?: number;
};

function findVariant(
  variants: ProductVariant[],
  selectedByAxis: Map<number, number>,
  axisCount: number,
) {
  if (selectedByAxis.size !== axisCount) return null;

  return (
    variants.find((variant) => {
      if (!variant.isActive) return false;
      return variant.selections.every(
        (selection) => selectedByAxis.get(selection.axisId) === selection.axisValueId,
      );
    }) ?? null
  );
}

function getAvailableValueIds(
  variants: ProductVariant[],
  axisId: number,
  selectedByAxis: Map<number, number>,
) {
  const available = new Set<number>();

  for (const variant of variants) {
    if (!variant.isActive || variant.stock < 1) continue;

    const matchesOtherAxes = variant.selections.every((selection) => {
      if (selection.axisId === axisId) return true;
      const selected = selectedByAxis.get(selection.axisId);
      return selected === undefined || selected === selection.axisValueId;
    });

    if (!matchesOtherAxes) continue;

    const current = variant.selections.find((selection) => selection.axisId === axisId);
    if (current) available.add(current.axisValueId);
  }

  return available;
}

export default function ProductPurchasePanel({
  product,
  currencyCode = 'TRY',
  currencyDecimals = 2,
}: ProductPurchasePanelProps) {
  const { addItem } = useCart();
  const variantAxes = useMemo(() => product.variantAxes ?? [], [product.variantAxes]);
  const variants = useMemo(() => product.variants ?? [], [product.variants]);
  const hasVariants = product.productType === 'variant' && variantAxes.length > 0 && variants.length > 0;
  const textOptions = (product.options ?? []).filter((option) => option.optionType === 'text');

  const [selectedByAxis, setSelectedByAxis] = useState<Record<number, number>>({});
  const [textValues, setTextValues] = useState<Record<number, string>>({});
  const [customerNote, setCustomerNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedMap = useMemo(() => new Map(Object.entries(selectedByAxis).map(([k, v]) => [Number(k), v])), [selectedByAxis]);

  const selectedVariant = useMemo(
    () => (hasVariants ? findVariant(variants, selectedMap, variantAxes.length) : null),
    [hasVariants, variants, selectedMap, variantAxes.length],
  );

  const selectedOptions = useMemo(() => {
    const result: SelectedOption[] = [];
    for (const option of textOptions) {
      const value = textValues[option.id]?.trim();
      if (!value) continue;
      result.push({
        optionId: option.id,
        label: option.label,
        value,
        priceDelta: 0,
      });
    }
    return result;
  }, [textOptions, textValues]);

  const unitPrice = selectedVariant?.price ?? product.price;
  const availableStock = selectedVariant?.stock ?? product.stock;

  function validateForm(): string | null {
    if (hasVariants) {
      for (const axis of variantAxes) {
        if (!selectedByAxis[axis.id]) {
          return `"${axis.name}" secimi zorunlu`;
        }
      }
      if (!selectedVariant) return 'Gecerli bir varyant sec';
      if (selectedVariant.stock < 1) return 'Secilen varyant stokta yok';
    } else if (product.stock < 1) {
      return 'Urun stokta yok';
    }

    for (const option of textOptions) {
      if (option.required && !textValues[option.id]?.trim()) {
        return `"${option.label}" alani zorunlu`;
      }
    }

    return null;
  }

  function handleAddToCart() {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    addItem({
      productId: product.id,
      name: product.name,
      basePrice: unitPrice,
      imageUrl: product.imageUrl,
      stock: availableStock,
      selectedOptions,
      customerNote,
      variantId: selectedVariant?.id ?? null,
      variantLabel: selectedVariant
        ? selectedVariant.selections.map((selection) => selection.label).join(' / ')
        : '',
    });
    setMessage('Sepete eklendi');
    window.setTimeout(() => setMessage(null), 2000);
  }

  if (!hasVariants && product.stock < 1) {
    return (
      <button
        type="button"
        disabled
        className="rounded-lg bg-store-surface-low px-5 py-3 text-sm font-medium text-store-muted"
      >
        Stokta Yok
      </button>
    );
  }

  return (
    <div className="space-y-5">
      {hasVariants ? (
        <div className="space-y-4">
          {variantAxes.map((axis) => (
            <VariantAxisPicker
              key={axis.id}
              axis={axis}
              variants={variants}
              selectedValueId={selectedByAxis[axis.id]}
              selectedByAxis={selectedMap}
              onSelect={(valueId) =>
                setSelectedByAxis((current) => ({ ...current, [axis.id]: valueId }))
              }
            />
          ))}
        </div>
      ) : null}

      {textOptions.length > 0 ? (
        <div className="space-y-4">
          {textOptions.map((option) => (
            <TextOptionField
              key={option.id}
              option={option}
              value={textValues[option.id] ?? ''}
              onChange={(value) => setTextValues((current) => ({ ...current, [option.id]: value }))}
            />
          ))}
        </div>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-store-text">Siparis notu (opsiyonel)</span>
        <textarea
          className="min-h-24 w-full rounded-lg border border-store-border px-4 py-3 text-sm text-store-text outline-none transition focus:border-store-primary-container focus:ring-2 focus:ring-store-primary-container/20"
          placeholder="Ornek: Hediye paketi olsun"
          value={customerNote}
          onChange={(event) => setCustomerNote(event.target.value)}
          maxLength={500}
        />
      </label>

      <p className="text-2xl font-bold text-store-primary-container">
        {formatStorePrice(unitPrice, { currencyCode, currencyDecimals })}
      </p>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleAddToCart}
          className="rounded-lg bg-store-primary-container px-5 py-3 text-sm font-semibold text-store-on-primary transition hover:bg-store-primary"
        >
          Sepete Ekle
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      </div>
    </div>
  );
}

function VariantAxisPicker({
  axis,
  variants,
  selectedValueId,
  selectedByAxis,
  onSelect,
}: {
  axis: VariantAxis;
  variants: ProductVariant[];
  selectedValueId?: number;
  selectedByAxis: Map<number, number>;
  onSelect: (valueId: number) => void;
}) {
  const availableIds = getAvailableValueIds(variants, axis.id, selectedByAxis);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-store-text">{axis.name}</p>
      <div className="flex flex-wrap gap-2">
        {axis.values.map((value) => {
          const isAvailable = availableIds.has(value.id);
          const isSelected = selectedValueId === value.id;

          if (axis.displayStyle === 'color' && value.colorHex) {
            return (
              <button
                key={value.id}
                type="button"
                disabled={!isAvailable}
                onClick={() => onSelect(value.id)}
                title={value.label}
                className={`h-10 w-10 rounded-full border-2 disabled:opacity-30 ${
                  isSelected ? 'border-store-primary' : 'border-transparent'
                }`}
                style={{ backgroundColor: value.colorHex }}
              />
            );
          }

          return (
            <button
              key={value.id}
              type="button"
              disabled={!isAvailable}
              onClick={() => onSelect(value.id)}
              className={`rounded-lg border px-4 py-2 text-sm disabled:opacity-40 ${
                isSelected
                  ? 'border-store-primary bg-store-surface-low text-store-primary'
                  : 'border-store-border text-store-muted'
              }`}
            >
              {value.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TextOptionField({
  option,
  value,
  onChange,
}: {
  option: ProductOption;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-store-text">
        {option.label}
        {option.required ? ' *' : ''}
      </span>
      <input
        className="w-full rounded-lg border border-store-border px-4 py-3 text-sm text-store-text outline-none transition focus:border-store-primary-container focus:ring-2 focus:ring-store-primary-container/20"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={200}
      />
    </label>
  );
}
