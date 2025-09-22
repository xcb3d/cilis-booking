// tests/utils/jwt.test.js
import jwtUtils from '../../utils/jwt.js';

describe('🔐 JWT Utils - Unit Tests', () => {

  // Test data setup
  const mockUserPayload = {
    id: 'user123',
    email: 'user@example.com',
    role: 'client'
  };

  const mockExpertPayload = {
    id: 'expert456', 
    email: 'expert@example.com',
    role: 'expert'
  };

  describe('Access Token Generation & Verification', () => {
    
    test('should generate valid access token', () => {
      const token = jwtUtils.generateAccessToken(mockUserPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    test('should verify access token and return correct payload', () => {
      const token = jwtUtils.generateAccessToken(mockUserPayload);
      const decoded = jwtUtils.verifyAccessToken(token);
      
      expect(decoded).not.toBeNull();
      expect(decoded.id).toBe(mockUserPayload.id);
      expect(decoded.email).toBe(mockUserPayload.email);
      expect(decoded.role).toBe(mockUserPayload.role);
      expect(decoded.iat).toBeDefined(); // issued at time
      expect(decoded.exp).toBeDefined(); // expiration time
    });

    test('should verify access token roundtrip for expert payload', () => {
      const token = jwtUtils.generateAccessToken(mockExpertPayload);
      const decoded = jwtUtils.verifyAccessToken(token);
      
      expect(decoded).not.toBeNull();
      expect(decoded.id).toBe(mockExpertPayload.id);
      expect(decoded.email).toBe(mockExpertPayload.email);
      expect(decoded.role).toBe(mockExpertPayload.role);
    });

    test('should return null for invalid access token', () => {
      const invalidToken = 'invalid.jwt.token';
      const decoded = jwtUtils.verifyAccessToken(invalidToken);
      
      expect(decoded).toBeNull();
    });

    test('should return null for empty access token', () => {
      const decoded = jwtUtils.verifyAccessToken('');
      
      expect(decoded).toBeNull();
    });

  });

  describe('Refresh Token Generation & Verification', () => {
    
    test('should generate valid refresh token', () => {
      const refreshToken = jwtUtils.generateRefreshToken(mockUserPayload);
      
      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken.split('.')).toHaveLength(3);
    });

    test('should verify refresh token and return correct payload', () => {
      const refreshToken = jwtUtils.generateRefreshToken(mockUserPayload);
      const decoded = jwtUtils.verifyRefreshToken(refreshToken);
      
      expect(decoded).not.toBeNull();
      expect(decoded.id).toBe(mockUserPayload.id);
      expect(decoded.email).toBe(mockUserPayload.email);
      expect(decoded.role).toBe(mockUserPayload.role);
    });

    test('should return null for invalid refresh token', () => {
      const invalidRefreshToken = 'invalid.refresh.token';
      const decoded = jwtUtils.verifyRefreshToken(invalidRefreshToken);
      
      expect(decoded).toBeNull();
    });

  });

  describe('Token Cross-Verification (Security)', () => {
    
    test('access token should not verify as refresh token', () => {
      const accessToken = jwtUtils.generateAccessToken(mockUserPayload);
      const decoded = jwtUtils.verifyRefreshToken(accessToken);
      
      // Access token signed with different secret, should fail refresh verification
      expect(decoded).toBeNull();
    });

  });

  describe('Cookie Utility Functions', () => {
    
    let mockRes;
    
    beforeEach(() => {
      // Mock Express response object
      let cookieCalls = [];
      let clearCookieCalls = [];
      
      mockRes = {
        cookie: (...args) => {
          cookieCalls.push(args);
        },
        clearCookie: (...args) => {
          clearCookieCalls.push(args);
        },
        // Helper methods for testing
        getCookieCalls: () => cookieCalls,
        getClearCookieCalls: () => clearCookieCalls
      };
    });

    test('should set tokens as HTTP cookies', () => {
      const accessToken = jwtUtils.generateAccessToken(mockUserPayload);
      const refreshToken = jwtUtils.generateRefreshToken(mockUserPayload);
      
      jwtUtils.setTokens(mockRes, accessToken, refreshToken);
      
      const cookieCalls = mockRes.getCookieCalls();
      expect(cookieCalls).toHaveLength(2);
      expect(cookieCalls[0][0]).toBe('accessToken');
      expect(cookieCalls[1][0]).toBe('refreshToken');
    });

    test('should clear token cookies', () => {
      jwtUtils.clearTokens(mockRes);
      
      const clearCookieCalls = mockRes.getClearCookieCalls();
      expect(clearCookieCalls).toHaveLength(2);
      expect(clearCookieCalls[0]).toEqual(['accessToken']);
      expect(clearCookieCalls[1]).toEqual(['refreshToken']);
    });

  });

  describe('Edge Cases & Error Handling', () => {
    
    test('should handle undefined payload by throwing error', () => {
      expect(() => jwtUtils.generateAccessToken(undefined)).toThrow('payload is required');
    });

    test('should handle null payload by throwing error', () => {
      expect(() => jwtUtils.generateAccessToken(null)).toThrow('Expected "payload" to be a plain object');
    });

    test('should handle empty payload object', () => {
      const emptyPayload = {};
      const token = jwtUtils.generateAccessToken(emptyPayload);
      const decoded = jwtUtils.verifyAccessToken(token);
      
      expect(decoded).not.toBeNull();
      expect(typeof decoded).toBe('object');
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

  });

});
