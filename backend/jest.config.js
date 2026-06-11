/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'services/**/*.js',
    'controllers/**/*.js',
    'middlewares/**/*.js',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'html'],
}
