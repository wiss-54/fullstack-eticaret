'use client';

import { useMemo, useState } from 'react';
import type { Product, ProductOption } from '@/lib/types';
import { useCart } from '@/components/CartProvider';
import type { SelectedOption } from '@/lib/cart';

type ProductPurchasePanelProps = {
  product: Product;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(price);
}

export default function ProductPurchasePanel({ product }: ProductPurchasePanelProps) {
  const { addItem } = useCart();
  const options = product.options ?? [];

  const [selectValues, setSelectValues] = useState<Record<number, string>>({});
  const [textValues, setTextValues] = useState<Record<number, string>>({});
  const [customerNote, setCustomerNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedOptions = useMemo(() => {
    const result: SelectedOption[] = [];

    for (const option of options) {
      if (option.optionType === 'select') {
        const value = selectValues[option.id];
        if (!value) continue;
        const choice = option.choices.find((item) => item.label === value);
        if (!choice) continue;
        result.push({
          optionId: option.id,
          label: option.label,
          value: choice.label,
          priceDelta: choice.priceDelta,
        });
      } else {
        const value = textValues[option.id]?.trim();
        if (!value) continue;
        result.push({
          optionId: option.id,
          label: option.label,
          value,
          priceDelta: 0,
        });
      }
    }

    return result;
  }, [options, selectValues, textValues]);

  const optionDelta = selectedOptions.reduce((sum, option) => sum + option.priceDelta, 0);
  const unitPrice = product.price + optionDelta;

  function validateOptions(): string | null {
    for (const option of options) {
      if (!option.required) continue;

      if (option.optionType === 'select' && !selectValues[option.id]) {
        return `"${option.label}" secimi zorunlu`;
      }

      if (option.optionType === 'text' && !textValues[option.id]?.trim()) {
        return `"${option.label}" alani zorunlu`;
      }
    }

    return null;
  }

  function handleAddToCart() {
    const validationError = validateOptions();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    addItem({
      productId: product.id,
      name: product.name,
      basePrice: product.price,
      imageUrl: product.imageUrl,
      stock: product.stock,
      selectedOptions,
      customerNote,
    });
    setMessage('Sepete eklendi');
    window.setTimeout(() => setMessage(null), 2000);
  }

  if (product.stock < 1) {
    return (
      <button
        type="button"
        disabled
        className="rounded-xl bg-zinc-300 px-5 py-3 text-sm font-medium text-zinc-600"
      >
        Stokta Yok
      </button>
    );
  }

  return (
    <div className="space-y-5">
      {options.length > 0 ? (
        <div className="space-y-4 rounded-2xl border border-amber-100 bg-amber-50/60 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Urun Secenekleri
          </p>
          {options.map((option) => (
            <OptionField
              key={option.id}
              option={option}
              selectValue={selectValues[option.id] ?? ''}
              textValue={textValues[option.id] ?? ''}
              onSelectChange={(value) =>
                setSelectValues((current) => ({ ...current, [option.id]: value }))
              }
              onTextChange={(value) =>
                setTextValues((current) => ({ ...current, [option.id]: value }))
              }
            />
          ))}
        </div>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Siparis notu (opsiyonel)
        </span>
        <textarea
          className="min-h-24 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Ornek: Lutfen paket uzerine isim yazin"
          value={customerNote}
          onChange={(event) => setCustomerNote(event.target.value)}
          maxLength={500}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {formatPrice(unitPrice)}
        </p>
        {optionDelta > 0 ? (
          <span className="text-sm text-amber-700 dark:text-amber-300">
            (+{formatPrice(optionDelta)} secenek)
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleAddToCart}
          className="rounded-xl bg-amber-800 px-5 py-3 text-sm font-medium text-white hover:bg-amber-900 dark:bg-amber-500 dark:text-zinc-950"
        >
          Sepete Ekle
        </button>
        {error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}
        {message ? <p className="text-sm text-green-700 dark:text-green-300">{message}</p> : null}
      </div>
    </div>
  );
}

function OptionField({
  option,
  selectValue,
  textValue,
  onSelectChange,
  onTextChange,
}: {
  option: ProductOption;
  selectValue: string;
  textValue: string;
  onSelectChange: (value: string) => void;
  onTextChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {option.label}
        {option.required ? ' *' : ''}
      </span>
      {option.optionType === 'select' ? (
        <select
          className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={selectValue}
          onChange={(event) => onSelectChange(event.target.value)}
        >
          <option value="">Seciniz</option>
          {option.choices.map((choice) => (
            <option key={choice.id} value={choice.label}>
              {choice.label}
              {choice.priceDelta > 0
                ? ` (+${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(choice.priceDelta)})`
                : ''}
            </option>
          ))}
        </select>
      ) : (
        <input
          className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={textValue}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder={option.label}
          maxLength={200}
        />
      )}
    </label>
  );
}
