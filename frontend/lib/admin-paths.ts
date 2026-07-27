const ADMIN_HOST = 'admin.eticaretshop.com.tr';

export function getAdminPaths(hostname?: string) {
  const host =
    hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '');

  if (host === ADMIN_HOST) {
    return {
      dashboard: '/',
      products: '/urunler',
      login: '/login',
      monitoring: '/monitoring',
      orders: '/siparisler',
      settings: '/ayarlar',
      site: 'https://eticaretshop.com.tr',
    };
  }

  return {
    dashboard: '/admin',
    products: '/admin/products',
    login: '/admin/login',
    monitoring: '/admin/monitoring',
    orders: '/admin/orders',
    settings: '/admin/settings',
    site: '/',
  };
}
