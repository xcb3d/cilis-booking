// src/__tests__/setup.js - Setup file cho Vitest frontend testing

// Mock localStorage cho jsdom environment
const localStorageMock = (() => {
  let store = {};
  
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    }
  };
})();

// Set localStorage mock trong global scope
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock console.error để tránh noise trong test output
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  log: process.env.TEST_DEBUG === 'true' ? console.log : vi.fn(),
};

// Helper functions cho testing
global.testHelpers = {
  // Clear localStorage trước mỗi test
  clearStorage: () => {
    localStorage.clear();
  },
  
  // Tạo mock user data
  createMockUser: (overrides = {}) => ({
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'client',
    ...overrides
  }),
  
  // Tạo mock expert data
  createMockExpert: (overrides = {}) => ({
    id: 'expert-456',
    name: 'Dr. Test Expert',
    email: 'expert@example.com',
    role: 'expert',
    field: 'Tư vấn pháp lý',
    price: 500000,
    ...overrides
  }),
  
  // Tạo mock booking data
  createMockBooking: (overrides = {}) => ({
    expertId: 'expert-456',
    date: '2025-12-25',
    timeSlot: '09:00',
    duration: 1,
    clientInfo: {
      name: 'Test Client',
      phone: '0912345678',
      email: 'client@example.com'
    },
    ...overrides
  })
};

// Setup before each test
beforeEach(() => {
  // Clear localStorage
  localStorage.clear();
  
  // Clear all mocks
  vi.clearAllMocks();
});

// Setup after each test
afterEach(() => {
  // Cleanup if needed
});