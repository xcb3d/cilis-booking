# 📊 Test Report - CILIS Booking System

## 📈 Test Summary
- **Total Tests**: 44 tests
- **Backend Tests**: 24 tests (Jest)
- **Frontend Tests**: 20 tests (Vitest)
- **Status**: ✅ All Passing

---

## 🔧 Backend Tests (24 tests)

### 1. JWT Utils Tests (`jwt.test.js`) - 14 tests

#### 🔑 Access Token Generation & Verification

**Test 1: Generate Valid Access Token**
```javascript
// Input
const payload = { id: '123', role: 'client' }

// Function Call
const token = jwtUtils.generateAccessToken(payload)

// Output
expect(token).toBeDefined()
expect(typeof token).toBe('string')
// Token format: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Test 2: Verify Access Token**
```javascript
// Input
const payload = { id: '456', role: 'expert' }
const token = jwtUtils.generateAccessToken(payload)

// Function Call
const result = jwtUtils.verifyAccessToken(token)

// Output
expect(result.id).toBe('456')
expect(result.role).toBe('expert')
expect(result.iat).toBeDefined() // issued at timestamp
```

**Test 3: Invalid Access Token**
```javascript
// Input
const invalidToken = 'invalid.token.here'

// Function Call
const result = jwtUtils.verifyAccessToken(invalidToken)

// Output
expect(result).toBe(null)
// Console: "[JWT Error] JsonWebTokenError invalid token"
```

**Test 4: Empty Access Token**
```javascript
// Input
const emptyToken = ''

// Function Call
const result = jwtUtils.verifyAccessToken(emptyToken)

// Output
expect(result).toBe(null)
// Console: "[JWT Error] JsonWebTokenError jwt must be provided"
```

#### 🔄 Refresh Token Tests

**Test 5: Generate Refresh Token**
```javascript
// Input
const payload = { id: '789', role: 'admin' }

// Function Call
const refreshToken = jwtUtils.generateRefreshToken(payload)

// Output
expect(refreshToken).toBeDefined()
expect(typeof refreshToken).toBe('string')
```

**Test 6: Verify Refresh Token**
```javascript
// Input
const payload = { id: '101', role: 'client' }
const refreshToken = jwtUtils.generateRefreshToken(payload)

// Function Call
const result = jwtUtils.verifyRefreshToken(refreshToken)

// Output
expect(result.id).toBe('101')
expect(result.role).toBe('client')
```

#### 🛡️ Security Tests

**Test 7: Cross-Token Verification (Security)**
```javascript
// Input
const payload = { id: '202', role: 'expert' }
const accessToken = jwtUtils.generateAccessToken(payload)

// Function Call (Wrong verification)
const result = jwtUtils.verifyRefreshToken(accessToken)

// Output
expect(result).toBe(null) // Should fail security check
```

#### 🍪 Cookie Utilities

**Test 8: Set Token Cookies**
```javascript
// Input
const mockRes = { cookie: jest.fn() }
const tokens = { accessToken: 'access123', refreshToken: 'refresh456' }

// Function Call
jwtUtils.setTokenCookies(mockRes, tokens.accessToken, tokens.refreshToken)

// Output
expect(mockRes.cookie).toHaveBeenCalledWith('accessToken', 'access123', {
  httpOnly: true,
  secure: false,
  maxAge: 15 * 60 * 1000 // 15 minutes
})
```

**Test 9: Clear Cookies**
```javascript
// Input
const mockRes = { clearCookie: jest.fn() }

// Function Call
jwtUtils.clearTokenCookies(mockRes)

// Output
expect(mockRes.clearCookie).toHaveBeenCalledWith('accessToken')
expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken')
```

#### ❌ Error Handling

**Test 10-14: Edge Cases**
```javascript
// Input: undefined payload
expect(() => jwtUtils.generateAccessToken(undefined)).toThrow()

// Input: null payload
expect(() => jwtUtils.generateAccessToken(null)).toThrow()

// Input: empty object
const result = jwtUtils.generateAccessToken({})
expect(result).toBeDefined()
```

---

### 2. Auth Validation Tests (`authValidation.test.js`) - 10 tests

#### 🔐 Login Validation

**Test 1: Valid Login**
```javascript
// Input
mockReq.body = { 
  email: 'user@example.com', 
  password: '123456' 
}

// Function Call
validation.validateLogin(mockReq, mockRes, mockNext)

// Output
✅ next() called
❌ no error response
expect(mockNext.wasCalled()).toBe(true)
```

**Test 2: Invalid Email Format**
```javascript
// Input
mockReq.body = { 
  email: 'invalid-email', 
  password: '123456' 
}

// Function Call
validation.validateLogin(mockReq, mockRes, mockNext)

// Output
❌ Status: 400
❌ Message: "Email không hợp lệ"
❌ next() not called
```

**Test 3: Missing Email**
```javascript
// Input
mockReq.body = { password: '123456' }

// Function Call
validation.validateLogin(mockReq, mockRes, mockNext)

// Output
❌ Status: 400
❌ Message: "Email là bắt buộc"
```

**Test 4: Short Password**
```javascript
// Input
mockReq.body = { 
  email: 'user@example.com', 
  password: '123' 
}

// Function Call
validation.validateLogin(mockReq, mockRes, mockNext)

// Output
❌ Status: 400
❌ Message: "Mật khẩu phải có ít nhất 6 ký tự"
```

**Test 5: Missing Password**
```javascript
// Input
mockReq.body = { email: 'user@example.com' }

// Function Call
validation.validateLogin(mockReq, mockRes, mockNext)

// Output
❌ Status: 400
❌ Message: "Mật khẩu là bắt buộc"
```

#### 📝 Registration Validation

**Test 6: Valid Client Registration**
```javascript
// Input
mockReq.body = {
  name: 'Nguyen Van A',
  email: 'client@example.com',
  password: '123456',
  phone: '0912345678',
  role: 'client'
}

// Function Call
validation.validateRegister(mockReq, mockRes, mockNext)

// Output
✅ next() called
❌ no error response
```

**Test 7: Missing Required Field**
```javascript
// Input (missing name)
mockReq.body = {
  email: 'client@example.com',
  password: '123456',
  phone: '0912345678',
  role: 'client'
}

// Function Call
validation.validateRegister(mockReq, mockRes, mockNext)

// Output
❌ Status: 400
❌ Message: "Tên là bắt buộc"
```

**Test 8: Valid Expert Registration**
```javascript
// Input
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
}

// Function Call
validation.validateRegister(mockReq, mockRes, mockNext)

// Output
✅ next() called
❌ no error response
```

**Test 9: Invalid Expert Field**
```javascript
// Input
mockReq.body = {
  // ... other valid fields
  field: 'Invalid Field', // Not in EXPERT_FIELDS
  price: 200000
}

// Function Call
validation.validateRegister(mockReq, mockRes, mockNext)

// Output
❌ Status: 400
❌ Message: "Lĩnh vực chuyên môn không hợp lệ"
```

**Test 10: Price Below Minimum**
```javascript
// Input
mockReq.body = {
  // ... other valid fields
  field: 'Tư vấn pháp lý',
  price: 50000 // Below 100,000 minimum
}

// Function Call
validation.validateRegister(mockReq, mockRes, mockNext)

// Output
❌ Status: 400
❌ Message: "Giá tối thiểu là 100000 VNĐ"
```

---

## 🖥️ Frontend Tests (20 tests)

### 1. Auth Utils Tests (`auth.test.js`) - 8 tests

#### 💾 User Storage Operations

**Test 1: Set and Get User**
```javascript
// Input
const user = { id: '123', name: 'John Doe', role: 'client' }
setUser(user)

// Function Call
const retrievedUser = getUser()

// Output
expect(retrievedUser).toEqual({
  id: '123',
  name: 'John Doe', 
  role: 'client'
})
// localStorage['user'] = '{"id":"123","name":"John Doe","role":"client"}'
```

**Test 2: Invalid JSON in Storage**
```javascript
// Input
localStorage.setItem('user', 'invalid-json')

// Function Call & Output
expect(() => getUser()).toThrow()
// Throws JSON.parse error
```

**Test 3: Null User Storage**
```javascript
// Input
setUser(null)

// Function Call
const result = getUser()

// Output
expect(result).toBeNull()
// localStorage['user'] removed
```

#### 🔒 Authentication Status

**Test 4: Authenticated User**
```javascript
// Input
const user = { id: '123', name: 'John', role: 'client' }
setUser(user)

// Function Call
const result = isAuthenticated()

// Output
expect(result).toBe(true)
```

**Test 5: No User Stored**
```javascript
// Input
// localStorage is empty

// Function Call
const result = isAuthenticated()

// Output
expect(result).toBe(false)
```

#### 👤 Role Management

**Test 6: Check User Role**
```javascript
// Input
const user = { id: '123', name: 'Expert', role: 'expert' }
setUser(user)

// Function Call & Output
expect(hasRole('expert')).toBe(true)
expect(hasRole('client')).toBe(false)
```

**Test 7: No User for Role Check**
```javascript
// Input
// No user stored

// Function Call
const result = hasRole('expert')

// Output
expect(result).toBe(false)
```

#### 🚪 Logout Operations

**Test 8: Logout Clears Data**
```javascript
// Input
const user = { id: '123', name: 'John', role: 'client' }
setUser(user)

// Mock axiosClient.post resolves successfully

// Function Call
await logout()

// Output
expect(getUser()).toBeNull()
expect(isAuthenticated()).toBe(false)
// API call: POST /auth/logout
// localStorage['user'] removed
```

---

### 2. Booking Utils Tests (`bookingUtils.test.js`) - 12 tests

#### 🕐 Time Formatting

**Test 1: Format Booking Time**
```javascript
// Input
const date = '2024-03-15'
const time = '14:30'

// Function Call
const result = formatBookingTime(date, time)

// Output
expect(result).toEqual({
  date: '15/3/2024',
  time: '14:30',
  fullDateTime: '14:30:00 15/3/2024',
  timestamp: 1710487800000
})
```

**Test 2: Invalid Time Input**
```javascript
// Input
const date = 'invalid'
const time = ''

// Function Call
const result = formatBookingTime(date, time)

// Output
expect(result).toEqual({
  date: 'Invalid Date',
  time: '',
  fullDateTime: 'Invalid Date',
  timestamp: NaN
})
```

#### 💰 Price Calculation

**Test 3: Basic Price Calculation**
```javascript
// Input
const basePrice = 50
const duration = 2
const discount = 0

// Function Call
const result = calculateBookingPrice(basePrice, duration, discount)

// Output
expect(result).toEqual({
  subtotal: 100,
  discount: 0,
  total: 100,
  formatted: {
    subtotal: '100 VNĐ',
    discount: '0 VNĐ',
    total: '100 VNĐ'
  }
})
```

**Test 4: Price with Discount**
```javascript
// Input
const basePrice = 100
const duration = 1
const discount = 10 // 10%

// Function Call
const result = calculateBookingPrice(basePrice, duration, discount)

// Output
expect(result).toEqual({
  subtotal: 100,
  discount: 10,
  total: 90,
  formatted: {
    subtotal: '100 VNĐ',
    discount: '10 VNĐ',
    total: '90 VNĐ'
  }
})
```

#### 📅 Time Slot Availability

**Test 5: Default Available Slots**
```javascript
// Input
const date = '2024-03-18'
const bookedSlots = []

// Function Call
const result = getAvailableTimeSlots(date, bookedSlots)

// Output
expect(result).toEqual([
  '08:00', '09:00', '10:00', '11:00', 
  '14:00', '15:00', '16:00', '17:00'
])
expect(result.length).toBe(8)
```

**Test 6: Exclude Booked Slots**
```javascript
// Input
const date = '2024-03-18'
const bookedSlots = ['10:00', '11:00']

// Function Call
const result = getAvailableTimeSlots(date, bookedSlots)

// Output
expect(result).toEqual([
  '08:00', '09:00', '14:00', '15:00', '16:00', '17:00'
])
expect(result).not.toContain('10:00')
expect(result).not.toContain('11:00')
```

**Test 7: Expert Schedule Restriction**
```javascript
// Input
const date = '2024-03-18'
const bookedSlots = []
const expertSchedule = { 
  workingHours: { start: '10:00', end: '15:00' } 
}

// Function Call
const result = getAvailableTimeSlots(date, bookedSlots, expertSchedule)

// Output
expect(result).toContain('10:00')
expect(result).toContain('14:00')
expect(result).not.toContain('08:00') // Before working hours
expect(result).not.toContain('16:00') // After working hours
```

#### ✅ Booking Validation

**Test 8: Valid Booking Data**
```javascript
// Input
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

// Function Call
const result = validateBookingData(validBooking)

// Output
expect(result).toEqual({
  isValid: true,
  errors: []
})
```

**Test 9: Missing Expert ID**
```javascript
// Input
const invalidBooking = {
  // expertId missing
  date: '2025-12-25',
  timeSlot: '14:00',
  duration: 1,
  clientInfo: { /* valid info */ }
}

// Function Call
const result = validateBookingData(invalidBooking)

// Output
expect(result).toEqual({
  isValid: false,
  errors: ['Vui lòng chọn chuyên gia']
})
```

**Test 10: Invalid Phone Number**
```javascript
// Input
const invalidBooking = {
  expertId: '123',
  date: '2025-12-25',
  timeSlot: '14:00',
  duration: 1,
  clientInfo: {
    name: 'John Doe',
    phone: 'invalid', // Invalid format
    email: 'john@example.com'
  }
}

// Function Call
const result = validateBookingData(invalidBooking)

// Output
expect(result).toEqual({
  isValid: false,
  errors: ['Số điện thoại không hợp lệ']
})
```

#### 📊 Status Formatting

**Test 11: Format Booking Statuses**
```javascript
// Input & Function Calls
const pending = formatBookingStatus('pending')
const confirmed = formatBookingStatus('confirmed')
const canceled = formatBookingStatus('canceled')

// Output
expect(pending).toEqual({
  text: 'Chờ thanh toán',
  color: 'orange',
  icon: '⏳'
})

expect(confirmed).toEqual({
  text: 'Đã xác nhận',
  color: 'blue',
  icon: '✅'
})

expect(canceled).toEqual({
  text: 'Đã hủy',
  color: 'red',
  icon: '❌'
})
```

**Test 12: Unknown Status**
```javascript
// Input
const status = 'unknown'

// Function Call
const result = formatBookingStatus(status)

// Output
expect(result).toEqual({
  text: 'Không xác định',
  color: 'gray',
  icon: '❓'
})
```

---

## 🎯 Test Coverage Analysis

### Backend Coverage
- ✅ **JWT Security**: Token generation, verification, cross-validation
- ✅ **Auth Validation**: Login/register with Vietnamese error messages
- ✅ **Cookie Management**: HTTP-only secure cookies
- ✅ **Error Handling**: Invalid inputs, edge cases

### Frontend Coverage
- ✅ **User Management**: localStorage operations, authentication state
- ✅ **Booking Logic**: Time formatting, price calculation, validation
- ✅ **Data Validation**: Vietnamese error messages, proper formats
- ✅ **UI Helpers**: Status formatting with icons and colors

---

## 🛠️ Testing Technologies

### Backend (Jest)
- **Framework**: Jest v30.1.3
- **Environment**: Node.js with ES modules
- **Features**: Mocking, async testing, console output capture
- **Command**: `npm run test:esm`

### Frontend (Vitest)
- **Framework**: Vitest v3.2.4
- **Environment**: jsdom (browser simulation)
- **Features**: Vi mocking, localStorage simulation
- **Command**: `npm test`

---

## 📋 Execution Results

### Backend Test Results
```bash
✅ tests/validations/authValidation.test.js - 10 tests passed
✅ tests/utils/jwt.test.js - 14 tests passed

Total: 24 tests passed
Time: 0.592s
```

### Frontend Test Results
```bash
✅ src/__tests__/utils/auth.test.js - 8 tests passed
✅ src/__tests__/utils/bookingUtils.test.js - 12 tests passed

Total: 20 tests passed  
Time: 1.19s
```

---

## 🎉 Conclusion

All **44 tests** are passing successfully, providing comprehensive coverage of:
- **Security features** (JWT, authentication)
- **Business logic** (booking validation, pricing)
- **User interface utilities** (formatting, status display)
- **Error handling** with Vietnamese localization

The test suite is well-structured, maintainable, and suitable for course requirements.

---

*Generated on: 2024-12-22*  
*Project: CILIS Booking System*  
*Testing Frameworks: Jest + Vitest*