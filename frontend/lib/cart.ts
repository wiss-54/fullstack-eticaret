export type CartItem = {
  productId: number;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  quantity: number;
};

export type CartState = {
  items: CartItem[];
  updatedAt: string;
};

const CART_KEY = 'hatira_cart';

export function readCart(): CartState {
  if (typeof window === 'undefined') {
    return { items: [], updatedAt: new Date().toISOString() };
  }

  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return { items: [], updatedAt: new Date().toISOString() };
    const parsed = JSON.parse(raw) as CartState;
    if (!Array.isArray(parsed.items)) {
      return { items: [], updatedAt: new Date().toISOString() };
    }
    return parsed;
  } catch {
    return { items: [], updatedAt: new Date().toISOString() };
  }
}

export function writeCart(state: CartState) {
  localStorage.setItem(CART_KEY, JSON.stringify(state));
}

export function getCartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function addItemToCart(
  current: CartItem[],
  input: Omit<CartItem, 'quantity'> & { quantity?: number },
): CartItem[] {
  const quantityToAdd = input.quantity ?? 1;
  const existing = current.find((item) => item.productId === input.productId);

  if (existing) {
    const nextQuantity = Math.min(existing.quantity + quantityToAdd, input.stock);
    return current.map((item) =>
      item.productId === input.productId ? { ...item, quantity: nextQuantity, stock: input.stock } : item,
    );
  }

  return [
    ...current,
    {
      productId: input.productId,
      name: input.name,
      price: input.price,
      imageUrl: input.imageUrl,
      stock: input.stock,
      quantity: Math.min(quantityToAdd, input.stock),
    },
  ];
}

export function updateItemQuantity(current: CartItem[], productId: number, quantity: number) {
  return current
    .map((item) => {
      if (item.productId !== productId) return item;
      const nextQuantity = Math.max(0, Math.min(quantity, item.stock));
      return { ...item, quantity: nextQuantity };
    })
    .filter((item) => item.quantity > 0);
}

export function removeItemFromCart(current: CartItem[], productId: number) {
  return current.filter((item) => item.productId !== productId);
}
