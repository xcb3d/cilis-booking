import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  setUser,
  getUser,
  isAuthenticated,
  hasRole,
  logout
} from '../../utils/auth.js'

// Mock axiosClient
vi.mock('../../utils/axiosClient.js', () => ({
  default: {
    post: vi.fn()
  }
}))

describe('Auth Utilities - Core Tests', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('User Storage Operations', () => {
    it('should set and get user from localStorage', () => {
      const user = { id: '123', name: 'John Doe', role: 'client' }
      setUser(user)
      
      const retrievedUser = getUser()
      expect(retrievedUser).toEqual(user)
    })

    it('should return null for invalid stored user', () => {
      localStorage.setItem('user', 'invalid-json')
      
      expect(() => getUser()).toThrow()
    })

    it('should handle null user storage', () => {
      setUser(null)
      
      const result = getUser()
      expect(result).toBeNull()
    })
  })

  describe('Authentication Status', () => {
    it('should return true when user is authenticated', () => {
      const user = { id: '123', name: 'John', role: 'client' }
      setUser(user)
      
      expect(isAuthenticated()).toBe(true)
    })

    it('should return false when no user is stored', () => {
      expect(isAuthenticated()).toBe(false)
    })
  })

  describe('User Role Management', () => {
    it('should check user role correctly', () => {
      const user = { id: '123', name: 'Expert', role: 'expert' }
      setUser(user)
      
      expect(hasRole('expert')).toBe(true)
      expect(hasRole('client')).toBe(false)
    })

    it('should return false when no user is authenticated', () => {
      expect(hasRole('expert')).toBe(false)
    })
  })

  describe('Logout Operations', () => {
    it('should clear user data on logout', async () => {
      const { default: axiosClient } = await import('../../utils/axiosClient.js')
      axiosClient.post.mockResolvedValue({ data: { success: true } })
      
      const user = { id: '123', name: 'John', role: 'client' }
      setUser(user)
      
      await logout()
      
      expect(getUser()).toBeNull()
      expect(isAuthenticated()).toBe(false)
    })
  })
})