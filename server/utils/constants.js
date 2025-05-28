export const ROLES = {
    ADMIN: 'admin',
    EXPERT: 'expert',
    CLIENT: 'client',
};

export const BOOKING_STATUS = {
    PENDING: 'pending',     // Mới tạo booking, đang chờ thanh toán
    CONFIRMED: 'confirmed', // Đã thanh toán thành công, chờ tư vấn
    COMPLETED: 'completed', // Buổi tư vấn đã hoàn thành (chuyên gia xác nhận)
    CANCELED: 'canceled'    // Đã hủy (do thanh toán thất bại hoặc lý do khác)
};

export const VERIFICATION_STATUS = {
    UNVERIFIED: false,
    PENDING: 'pending',
    REJECTED: 'rejected',
    VERIFIED: true,
};

export const DOCUMENT_TYPES = {
    IDENTIFICATION: 'identification',
    CERTIFICATION: 'certification',
    EXPERIENCE: 'experience',
    LICENSE: 'license',
};

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
