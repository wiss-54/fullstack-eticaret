import type { Order } from '@/lib/types';

/** Customer-facing order reference (opaque; not the sequential DB id). */
export function orderRef(order: Pick<Order, 'id' | 'publicCode'> | { id: number; publicCode?: string }) {
  return order.publicCode || String(order.id);
}

export function orderDetailPath(order: Pick<Order, 'id' | 'publicCode'> | string) {
  const code = typeof order === 'string' ? order : orderRef(order);
  return `/hesabim/siparis/${encodeURIComponent(code)}`;
}
