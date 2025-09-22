// tests/setup.js - Setup file cho Jest testing environment

// Mock environment variables cho testing
process.env.JWT_SECRET = 'test-jwt-secret-key-for-unit-testing';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-unit-testing';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';
process.env.DEBUG_AUTH = 'false'; // Tắt debug logs trong test

// Global test configuration
global.console = {
  ...console,
  // Tắt console.log trong tests để output sạch hơn (trừ khi cần debug)
  log: process.env.TEST_DEBUG === 'true' ? console.log : () => {},
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: process.env.TEST_DEBUG === 'true' ? console.debug : () => {},
};

// Setup global test utilities nếu cần
global.testHelpers = {
  // Helper function để tạo mock user payload
  createMockUserPayload: (overrides = {}) => ({
    id: 'test-user-id-123',
    email: 'test@example.com',
    role: 'client',
    ...overrides
  }),
  
  // Helper function để tạo mock expert payload  
  createMockExpertPayload: (overrides = {}) => ({
    id: 'test-expert-id-456',
    email: 'expert@example.com',
    role: 'expert',
    field: 'Tư vấn pháp lý',
    ...overrides
  })
};

// Jest global setup
beforeAll(async () => {
  // Setup global configurations nếu cần
});

afterAll(async () => {
  // Cleanup global resources nếu cần
});

beforeEach(() => {
  // Reset mocks before each test - using global jest if available
  if (typeof jest !== 'undefined' && jest.clearAllMocks) {
    jest.clearAllMocks();
  }
});

afterEach(() => {
  // Cleanup after each test nếu cần
});