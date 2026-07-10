'use client';

import { useState } from 'react';
import { useCart } from '@/components/CartProvider';

type AddToCartButtonProps = {
  productId: number;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
};

export default function AddToCartButton({
  productId,
  name,
  price,
  imageUrl,
  stock,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    addItem({ productId, name, price, imageUrl, stock });
    setMessage('Sepete eklendi');
    window.setTimeout(() => setMessage(null), 2000);
  }

  if (stock < 1) {
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
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        Sepete Ekle
      </button>
      {message ? <p className="text-sm text-green-700 dark:text-green-300">{message}</p> : null}
    </div>
  );
}
