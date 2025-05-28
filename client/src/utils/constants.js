// Constants cho toàn bộ ứng dụng

// User Roles
export const ROLES = {
  ADMIN: 'admin',
  EXPERT: 'expert',
  CLIENT: 'client',
};

// Booking Statuses
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELED: 'canceled',
};

// Booking Status Details
export const BOOKING_STATUS_DETAILS = {
  [BOOKING_STATUS.PENDING]: {
    name: 'Chờ thanh toán',
    color: 'yellow',
    description: 'Người dùng đang trong quá trình thanh toán'
  },
  [BOOKING_STATUS.CONFIRMED]: {
    name: 'Đã xác nhận',
    color: 'indigo',
    description: 'Đã thanh toán thành công, chờ tư vấn'
  },
  [BOOKING_STATUS.COMPLETED]: {
    name: 'Đã hoàn thành',
    color: 'blue',
    description: 'Buổi tư vấn đã kết thúc'
  },
  [BOOKING_STATUS.CANCELED]: {
    name: 'Đã hủy',
    color: 'red',
    description: 'Buổi tư vấn đã bị hủy'
  }
};

// Verification Statuses
export const VERIFICATION_STATUS = {
  UNVERIFIED: 'unverified',
  PENDING: 'pending',
  REJECTED: 'rejected',
  VERIFIED: 'verified',
};

// Document Types
export const DOCUMENT_TYPES = {
  IDENTIFICATION: 'identification',
  CERTIFICATION: 'certification',
  EXPERIENCE: 'experience',
  LICENSE: 'license',
};

// Expert Fields
export const EXPERT_FIELDS = [
  'Tư vấn pháp lý',
  'Tư vấn tài chính',
  'Tư vấn tâm lý',
  'Tư vấn sức khỏe',
  'Gia sư',
  'Tư vấn công nghệ',
  'Tư vấn marketing',
  'Tư vấn kinh doanh'
]; 