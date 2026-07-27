const ADMIN_HOST = 'admin.eticaretshop.com.tr';

export function getAdminPaths(hostname?: string) {
  const host =
    hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '');

  if (host === ADMIN_HOST) {
    return {
      dashboard: '/',
      login: '/login',
      monitoring: '/monitoring',
      orders: '/siparisler',
      settings: '/ayarlar',
      site: 'https://eticaretshop.com.tr',
    };
  }

  return {
    dashboard: '/admin',
    login: '/admin/login',
    monitoring: '/admin/monitoring',
    orders: '/admin/orders',
    settings: '/admin/settings',
    site: '/',
  };
}
