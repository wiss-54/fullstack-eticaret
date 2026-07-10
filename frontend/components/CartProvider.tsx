'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AddCartItemInput, CartItem } from '@/lib/cart';
import {
  addItemToCart,
  getCartCount,
  getCartTotal,
  readCart,
  removeItemFromCart,
  updateItemQuantity,
  writeCart,
} from '@/lib/cart';

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (input: AddCartItemInput) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const cart = readCart();
      if (!cancelled) {
        setItems(cart.items);
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    writeCart({ items, updatedAt: new Date().toISOString() });
  }, [items, ready]);

  const addItem = useCallback((input: AddCartItemInput) => {
    setItems((current) => addItemToCart(current, input));
  }, []);

  const setQuantity = useCallback((lineId: string, quantity: number) => {
    setItems((current) => updateItemQuantity(current, lineId, quantity));
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((current) => removeItemFromCart(current, lineId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo(
    () => ({
      items,
      itemCount: getCartCount(items),
      total: getCartTotal(items),
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    }),
    [items, addItem, setQuantity, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
