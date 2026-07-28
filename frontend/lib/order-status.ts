import type { OrderStatus } from './types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Beklemede',
  confirmed: 'Onaylandi',
  preparing: 'Hazirlaniyor',
  shipped: 'Kargoda',
  cancelled: 'Iptal',
};

export function orderStatusLabel(status: string) {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

export function orderStatusBadgeClass(status: string) {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200';
    case 'preparing':
      return 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200';
    case 'shipped':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
    case 'pending':
    default:
      return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
  }
}
