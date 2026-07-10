export type SelectedOption = {
  optionId: number;
  label: string;
  value: string;
  priceDelta: number;
};

export type CartItem = {
  lineId: string;
  productId: number;
  name: string;
  basePrice: number;
  unitPrice: number;
  imageUrl: string | null;
  stock: number;
  quantity: number;
  selectedOptions: SelectedOption[];
  customerNote: string;
};

export type CartState = {
  items: CartItem[];
  updatedAt: string;
};

const CART_KEY = 'hatira_cart';

type LegacyCartItem = {
  productId: number;
  name: string;
  price?: number;
  basePrice?: number;
  unitPrice?: number;
  imageUrl: string | null;
  stock: number;
  quantity: number;
  lineId?: string;
  selectedOptions?: SelectedOption[];
  customerNote?: string;
};

export function buildLineId(
  productId: number,
  selectedOptions: SelectedOption[],
  customerNote: string,
): string {
  const payload = JSON.stringify({
    productId,
    selectedOptions: [...selectedOptions].sort((a, b) => a.optionId - b.optionId),
    customerNote: customerNote.trim(),
  });
  return `${productId}-${btoa(unescape(encodeURIComponent(payload))).slice(0, 24)}`;
}

function normalizeItem(raw: LegacyCartItem): CartItem {
  const selectedOptions = raw.selectedOptions ?? [];
  const customerNote = raw.customerNote ?? '';
  const basePrice = raw.basePrice ?? raw.price ?? 0;
  const optionDelta = selectedOptions.reduce((sum, option) => sum + option.priceDelta, 0);
  const unitPrice = raw.unitPrice ?? basePrice + optionDelta;
  const lineId =
    raw.lineId ?? buildLineId(raw.productId, selectedOptions, customerNote);

  return {
    lineId,
    productId: raw.productId,
    name: raw.name,
    basePrice,
    unitPrice,
    imageUrl: raw.imageUrl,
    stock: raw.stock,
    quantity: raw.quantity,
    selectedOptions,
    customerNote,
  };
}

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
    return {
      ...parsed,
      items: parsed.items.map((item) => normalizeItem(item as LegacyCartItem)),
    };
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
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export type AddCartItemInput = {
  productId: number;
  name: string;
  basePrice: number;
  imageUrl: string | null;
  stock: number;
  quantity?: number;
  selectedOptions: SelectedOption[];
  customerNote: string;
};

export function addItemToCart(current: CartItem[], input: AddCartItemInput): CartItem[] {
  const quantityToAdd = input.quantity ?? 1;
  const optionDelta = input.selectedOptions.reduce((sum, option) => sum + option.priceDelta, 0);
  const unitPrice = input.basePrice + optionDelta;
  const lineId = buildLineId(input.productId, input.selectedOptions, input.customerNote);
  const existing = current.find((item) => item.lineId === lineId);

  if (existing) {
    const nextQuantity = Math.min(existing.quantity + quantityToAdd, input.stock);
    return current.map((item) =>
      item.lineId === lineId
        ? { ...item, quantity: nextQuantity, stock: input.stock, unitPrice }
        : item,
    );
  }

  return [
    ...current,
    {
      lineId,
      productId: input.productId,
      name: input.name,
      basePrice: input.basePrice,
      unitPrice,
      imageUrl: input.imageUrl,
      stock: input.stock,
      quantity: Math.min(quantityToAdd, input.stock),
      selectedOptions: input.selectedOptions,
      customerNote: input.customerNote.trim(),
    },
  ];
}

export function updateItemQuantity(current: CartItem[], lineId: string, quantity: number) {
  return current
    .map((item) => {
      if (item.lineId !== lineId) return item;
      const nextQuantity = Math.max(0, Math.min(quantity, item.stock));
      return { ...item, quantity: nextQuantity };
    })
    .filter((item) => item.quantity > 0);
}

export function removeItemFromCart(current: CartItem[], lineId: string) {
  return current.filter((item) => item.lineId !== lineId);
}
