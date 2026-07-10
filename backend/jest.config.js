module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary', 'html'],
  collectCoverageFrom: [
    '*.js',
    '!jest.config.js',
    '!coverage/**',
  ],
};
