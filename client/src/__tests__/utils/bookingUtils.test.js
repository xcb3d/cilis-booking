import { describe, it, expect, beforeEach, vi, test } from 'vitest'
import {
  formatBookingTime,
  calculateBookingPrice,
  getAvailableTimeSlots,
  validateBookingData,
  formatBookingStatus
} from '../../utils/bookingUtils.js'

describe('Booking Utilities - Core Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('formatBookingTime', () => {
    test('should format booking time correctly', () => {
      const result = formatBookingTime('2024-03-15', '14:30')
      expect(result.date).toBe('15/3/2024')
      expect(result.time).toBe('14:30')
      expect(result.timestamp).toBeDefined()
    })

   test('should handle invalid inputs', () => {
      const result = formatBookingTime('invalid', '')
      expect(result.date).toBe('Invalid Date')
      expect(result.time).toBe('')
    })
  })

  describe('calculateBookingPrice', () => {
    test('should calculate basic price', () => {
      const result = calculateBookingPrice(50, 2)
      expect(result.total).toBe(100)
      expect(result.subtotal).toBe(100)
      expect(result.discount).toBe(0)
    })

    it('should handle discount', () => {
      const result = calculateBookingPrice(100, 1, 10)
      expect(result.subtotal).toBe(100)
      expect(result.discount).toBe(10)
      expect(result.total).toBe(90)
    })
  })

  describe('getAvailableTimeSlots', () => {
    it('should return default available slots', () => {
      const result = getAvailableTimeSlots('2024-03-18', [])
      expect(result).toContain('09:00')
      expect(result).toContain('10:00')
      expect(result).toContain('16:00')
      expect(result.length).toBe(8) // 8 default slots from implementation
    })

    it('should exclude booked slots', () => {
      const bookedSlots = ['10:00', '11:00']
      const result = getAvailableTimeSlots('2024-03-18', bookedSlots)
      expect(result).not.toContain('10:00')
      expect(result).not.toContain('11:00')
      expect(result).toContain('09:00')
    })

    it('should work with expert schedule', () => {
      const expertSchedule = { 
        workingHours: { start: '10:00', end: '15:00' } 
      }
      const result = getAvailableTimeSlots('2024-03-18', [], expertSchedule)
      expect(result).toContain('10:00')
      expect(result).toContain('14:00')
      expect(result).not.toContain('08:00')
      expect(result).not.toContain('16:00')
    })
  })

  describe('validateBookingData', () => {
    const validBooking = {
      expertId: '123',
      date: '2025-12-25', // future date
      timeSlot: '14:00',
      duration: 1,
      clientInfo: {
        name: 'John Doe',
        phone: '0123456789',
        email: 'john@example.com'
      }
    }

    it('should validate correct booking data', () => {
      const result = validateBookingData(validBooking)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should catch missing required fields', () => {
      const invalidBooking = { ...validBooking }
      delete invalidBooking.expertId
      
      const result = validateBookingData(invalidBooking)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Vui lòng chọn chuyên gia')
    })

    it('should validate phone number', () => {
      const invalidBooking = { 
        ...validBooking, 
        clientInfo: { ...validBooking.clientInfo, phone: 'invalid' }
      }
      const result = validateBookingData(invalidBooking)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Số điện thoại không hợp lệ')
    })
  })

  describe('formatBookingStatus', () => {
    it('should format booking statuses correctly', () => {
      expect(formatBookingStatus('pending').text).toBe('Chờ thanh toán')
      expect(formatBookingStatus('confirmed').text).toBe('Đã xác nhận')
      expect(formatBookingStatus('canceled').text).toBe('Đã hủy')
    })

    it('should handle unknown status', () => {
      const result = formatBookingStatus('unknown')
      expect(result.text).toBe('Không xác định')
      expect(result.color).toBe('gray')
    })
  })
})
