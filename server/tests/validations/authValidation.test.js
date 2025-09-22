// tests/validations/authValidation.test.js
import validation from '../../validations/authValidation.js';
import { EXPERT_FIELDS } from '../../utils/constants.js';

describe('🔒 Auth Validation - Unit Tests', () => {

  // Helper function to create mock objects
  const createMocks = () => {
    let statusCode = null;
    let jsonResponse = null;
    let nextCalled = false;
    
    const mockReq = { body: {} };
    const mockRes = {
      status: (code) => {
        statusCode = code;
        return mockRes;
      },
      json: (data) => {
        jsonResponse = data;
        return mockRes;
      },
      getStatus: () => statusCode,
      getJson: () => jsonResponse
    };
    const mockNext = () => { nextCalled = true; };
    mockNext.wasCalled = () => nextCalled;
    
    return { mockReq, mockRes, mockNext };
  };

  describe('Login Validation', () => {
      
      test('should pass with valid email and password', () => {
        const { mockReq, mockRes, mockNext } = createMocks();
        mockReq.body = { email: 'user@example.com', password: '123456' };
        
        validation.validateLogin(mockReq, mockRes, mockNext);
        
        expect(mockNext.wasCalled()).toBe(true);
        expect(mockRes.getStatus()).toBe(null);
      });

      test('should fail with invalid email format', () => {
        const { mockReq, mockRes, mockNext } = createMocks();
        mockReq.body = { email: 'invalid-email', password: '123456' };
        
        validation.validateLogin(mockReq, mockRes, mockNext);
        
        expect(mockRes.getStatus()).toBe(400);
        expect(mockRes.getJson().message).toContain('Email');
        expect(mockNext.wasCalled()).toBe(false);
      });

      test('should fail when email is missing', () => {
        const { mockReq, mockRes, mockNext } = createMocks();
        mockReq.body = { password: '123456' };
        
        validation.validateLogin(mockReq, mockRes, mockNext);
        
        expect(mockRes.getStatus()).toBe(400);
        expect(mockRes.getJson().message).toBe('Email là bắt buộc');
        expect(mockNext.wasCalled()).toBe(false);
      });

      test('should fail with short password', () => {
        const { mockReq, mockRes, mockNext } = createMocks();
        mockReq.body = { email: 'user@example.com', password: '123' };
        
        validation.validateLogin(mockReq, mockRes, mockNext);
        
        expect(mockRes.getStatus()).toBe(400);
        expect(mockRes.getJson().message).toContain('6 ký tự');
        expect(mockNext.wasCalled()).toBe(false);
      });

      test('should fail when password is missing', () => {
        const { mockReq, mockRes, mockNext } = createMocks();
        mockReq.body = { email: 'user@example.com' };
        
        validation.validateLogin(mockReq, mockRes, mockNext);
        
        expect(mockRes.getStatus()).toBe(400);
        expect(mockRes.getJson().message).toBe('Mật khẩu là bắt buộc');
        expect(mockNext.wasCalled()).toBe(false);
      });

  });

  describe('Registration Validation', () => {

      test('should pass with valid client data', () => {
        const { mockReq, mockRes, mockNext } = createMocks();
        mockReq.body = {
          name: 'Nguyen Van A',
          email: 'client@example.com',
          password: '123456',
          phone: '0912345678',
          role: 'client'
        };

        validation.validateRegister(mockReq, mockRes, mockNext);
        
        expect(mockNext.wasCalled()).toBe(true);
        expect(mockRes.getStatus()).toBe(null);
      });

      test('should fail when required client field missing', () => {
        const { mockReq, mockRes, mockNext } = createMocks();
        mockReq.body = {
          // Missing name
          email: 'client@example.com',
          password: '123456',
          phone: '0912345678',
          role: 'client'
        };
        
        validation.validateRegister(mockReq, mockRes, mockNext);
        
        expect(mockRes.getStatus()).toBe(400);
        expect(mockRes.getJson().message).toContain('bắt buộc');
        expect(mockNext.wasCalled()).toBe(false);
      });

      test('should pass with valid expert data', () => {
        const { mockReq, mockRes, mockNext } = createMocks();
        mockReq.body = {
          name: 'Dr. Expert',
          email: 'expert@example.com',
          password: '123456',
          phone: '0912345678',
          role: 'expert',
          field: 'Tư vấn pháp lý',
          expertise: 'Valid expertise description',
          experience: 'Valid experience description',
          price: 200000
        };

        validation.validateRegister(mockReq, mockRes, mockNext);
        
        expect(mockNext.wasCalled()).toBe(true);
        expect(mockRes.getStatus()).toBe(null);
      });

      test('should fail with invalid expert field', () => {
        const { mockReq, mockRes, mockNext } = createMocks();
        mockReq.body = {
          name: 'Dr. Expert',
          email: 'expert@example.com',
          password: '123456',
          phone: '0912345678',
          role: 'expert',
          field: 'Invalid Field',
          expertise: 'Valid expertise',
          experience: 'Valid experience',
          price: 200000
        };

        validation.validateRegister(mockReq, mockRes, mockNext);
        
        expect(mockRes.getStatus()).toBe(400);
        expect(mockRes.getJson().message).toContain('Lĩnh vực chuyên môn');
        expect(mockNext.wasCalled()).toBe(false);
      });

      test('should fail when price below minimum', () => {
        const { mockReq, mockRes, mockNext } = createMocks();
        mockReq.body = {
          name: 'Dr. Expert',
          email: 'expert@example.com',
          password: '123456',
          phone: '0912345678',
          role: 'expert',
          field: 'Tư vấn pháp lý',
          expertise: 'Valid expertise description',
          experience: 'Valid experience description',
          price: 50000 // Below 100000 minimum
        };

        validation.validateRegister(mockReq, mockRes, mockNext);
        
        expect(mockRes.getStatus()).toBe(400);
        expect(mockRes.getJson().message).toContain('ít nhất 100000 VNĐ');
        expect(mockNext.wasCalled()).toBe(false);
      });

  });

});