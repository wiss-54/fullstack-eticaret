const ADMIN_HOST = 'admintest.hatiraniyarat.com';

export function getAdminPaths(hostname?: string) {
  const host =
    hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '');

  if (host === ADMIN_HOST) {
    return {
      dashboard: '/',
      login: '/login',
      monitoring: '/monitoring',
      site: 'https://test.hatiraniyarat.com',
    };
  }

  return {
    dashboard: '/admin',
    login: '/admin/login',
    monitoring: '/admin/monitoring',
    site: '/',
  };
}
