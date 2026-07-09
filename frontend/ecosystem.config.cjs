module.exports = {
  apps: [
    {
      name: 'eticaret-frontend',
      cwd: '/home/beratav/fullstack-eticaret/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'https://test.hatiraniyarat.com',
      },
    },
  ],
};
