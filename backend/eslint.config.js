const security = require('eslint-plugin-security');

module.exports = [
  {
    files: ['**/*.js'],
    ignores: ['node_modules/**', 'coverage/**'],
    plugins: { security },
    rules: {
      ...security.configs.recommended.rules,
    },
  },
];
