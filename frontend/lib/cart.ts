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
  variantId: number | null;
  variantLabel: string;
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
  variantId?: number | null;
  variantLabel?: string;
};

function optionsKey(selectedOptions: SelectedOption[]) {
  return [...selectedOptions]
    .sort((a, b) => a.optionId - b.optionId)
    .map((option) => `${option.optionId}:${option.value}`)
    .join('|');
}

/** Stable unique line key — do not truncate hashes (variant collisions). */
export function buildLineId(
  productId: number,
  selectedOptions: SelectedOption[],
  customerNote: string,
  variantId?: number | null,
): string {
  const variantKey = variantId == null ? 'base' : `v${variantId}`;
  const noteKey = encodeURIComponent(customerNote.trim());
  const optionPart = optionsKey(selectedOptions) || '-';
  return `p${productId}__${variantKey}__${optionPart}__${noteKey || '-'}`;
}

function sameCartIdentity(
  item: Pick<CartItem, 'productId' | 'variantId' | 'selectedOptions' | 'customerNote'>,
  input: Pick<AddCartItemInput, 'productId' | 'variantId' | 'selectedOptions' | 'customerNote'>,
) {
  if (item.productId !== input.productId) return false;
  if ((item.variantId ?? null) !== (input.variantId ?? null)) return false;
  if (item.customerNote.trim() !== input.customerNote.trim()) return false;
  return optionsKey(item.selectedOptions) === optionsKey(input.selectedOptions);
}

function normalizeItem(raw: LegacyCartItem): CartItem {
  const selectedOptions = raw.selectedOptions ?? [];
  const customerNote = raw.customerNote ?? '';
  const basePrice = raw.basePrice ?? raw.price ?? 0;
  const optionDelta = selectedOptions.reduce((sum, option) => sum + option.priceDelta, 0);
  const unitPrice = raw.unitPrice ?? basePrice + optionDelta;
  // Always rebuild so old truncated lineIds cannot collide across variants.
  const lineId = buildLineId(raw.productId, selectedOptions, customerNote, raw.variantId ?? null);

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
    variantId: raw.variantId ?? null,
    variantLabel: raw.variantLabel ?? '',
  };
}

function mergeDuplicateLines(items: CartItem[]): CartItem[] {
  const byLine = new Map<string, CartItem>();

  for (const item of items) {
    const existing = byLine.get(item.lineId);
    if (!existing) {
      byLine.set(item.lineId, item);
      continue;
    }

    const quantity = Math.min(existing.stock, existing.quantity + item.quantity);
    byLine.set(item.lineId, {
      ...existing,
      quantity,
      stock: Math.min(existing.stock, item.stock),
      unitPrice: item.unitPrice || existing.unitPrice,
      variantLabel: existing.variantLabel || item.variantLabel,
    });
  }

  return [...byLine.values()].filter((item) => item.quantity > 0);
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
      items: mergeDuplicateLines(parsed.items.map((item) => normalizeItem(item as LegacyCartItem))),
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

export function getCartQuantityForVariant(
  items: CartItem[],
  productId: number,
  variantId: number | null,
) {
  return items
    .filter((item) =>
      variantId != null
        ? item.variantId === variantId
        : item.productId === productId && item.variantId == null,
    )
    .reduce((sum, item) => sum + item.quantity, 0);
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
  variantId?: number | null;
  variantLabel?: string;
};

export type AddCartResult = {
  items: CartItem[];
  added: number;
  reason?: 'out_of_stock' | 'limit_reached';
};

export function addItemToCart(current: CartItem[], input: AddCartItemInput): AddCartResult {
  const quantityToAdd = Math.max(1, input.quantity ?? 1);
  const availableStock = Math.max(0, Math.floor(input.stock));
  const optionDelta = input.selectedOptions.reduce((sum, option) => sum + option.priceDelta, 0);
  const unitPrice = input.basePrice + optionDelta;
  const variantId = input.variantId ?? null;
  const lineId = buildLineId(
    input.productId,
    input.selectedOptions,
    input.customerNote,
    variantId,
  );

  // Cap against all lines of this variant (notes/options may split lines).
  const alreadyInCart = getCartQuantityForVariant(current, input.productId, variantId);
  const roomTotal = availableStock - alreadyInCart;

  if (availableStock < 1 || roomTotal < 1) {
    return {
      items: current,
      added: 0,
      reason: availableStock < 1 ? 'out_of_stock' : 'limit_reached',
    };
  }

  const existing = current.find(
    (item) => item.lineId === lineId || sameCartIdentity(item, { ...input, variantId }),
  );

  if (existing) {
    const added = Math.min(quantityToAdd, roomTotal);
    if (added < 1) {
      return { items: current, added: 0, reason: 'limit_reached' };
    }
    return {
      items: current.map((item) =>
        item.lineId === existing.lineId
          ? {
              ...item,
              lineId,
              quantity: item.quantity + added,
              stock: availableStock,
              unitPrice,
              variantId,
              variantLabel: input.variantLabel?.trim() ?? item.variantLabel,
            }
          : item,
      ),
      added,
    };
  }

  const added = Math.min(quantityToAdd, roomTotal);
  return {
    items: [
      ...current,
      {
        lineId,
        productId: input.productId,
        name: input.name,
        basePrice: input.basePrice,
        unitPrice,
        imageUrl: input.imageUrl,
        stock: availableStock,
        quantity: added,
        selectedOptions: input.selectedOptions,
        customerNote: input.customerNote.trim(),
        variantId,
        variantLabel: input.variantLabel?.trim() ?? '',
      },
    ],
    added,
  };
}

export function updateItemQuantity(current: CartItem[], lineId: string, quantity: number) {
  return current
    .map((item) => {
      if (item.lineId !== lineId) return item;
      const othersQty = getCartQuantityForVariant(
        current.filter((row) => row.lineId !== lineId),
        item.productId,
        item.variantId,
      );
      const maxForLine = Math.max(0, item.stock - othersQty);
      const nextQuantity = Math.max(0, Math.min(quantity, maxForLine));
      return { ...item, quantity: nextQuantity };
    })
    .filter((item) => item.quantity > 0);
}

export function removeItemFromCart(current: CartItem[], lineId: string) {
  return current.filter((item) => item.lineId !== lineId);
}
