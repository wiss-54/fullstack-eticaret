module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  collectCoverageFrom: [
    '*.js',
    '!jest.config.js',
    '!coverage/**',
  ],
};
