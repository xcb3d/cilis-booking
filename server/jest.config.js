export default {
  // Test environment
  testEnvironment: 'node',
  
  // Use ES modules
  preset: null,
  transform: {},
  
  // Test file patterns
  testMatch: [
    '<rootDir>/__tests__/**/*.test.js',
    '<rootDir>/tests/**/*.test.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'utils/**/*.js',
    'services/**/*.js',
    'models/**/*.js',
    'controllers/**/*.js',
    '!**/node_modules/**',
    '!server.js'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output for reporting
  verbose: true,
  
  // Reporters for detailed output
  reporters: ['default']
};