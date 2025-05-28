import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { VERIFICATION_STATUS } from './constants';

/**
 * VerifiedExpertRoute component restricts expert pages access based on verification status
 * Only verified experts can access all pages, others can only access the dashboard
 */
const VerifiedExpertRoute = ({ element }) => {
  // Lấy thông tin người dùng từ Zustand store (đã được tự động khôi phục)
  const { user, isAuthenticated, authChecked } = useAuthStore();
  
  // If still checking auth, pass through to allow ProtectedRoute to handle loading state
  if (!authChecked) {
    return element;
  }

  // Kiểm tra người dùng đã đăng nhập và là chuyên gia
  if (!isAuthenticated || !user || user.role !== 'expert') {
    return element;
  }

  // Expert is verified, allow access to all pages
  if (user.verified === VERIFICATION_STATUS.VERIFIED) {
    return element;
  }

  // For all other statuses (PENDING, UNVERIFIED, REJECTED), redirect to dashboard
  const currentPath = window.location.pathname;
  if (currentPath !== '/expert/dashboard') {
    return <Navigate to="/expert/dashboard" replace />;
  }

  // If on dashboard, allow rendering the component
  return element;
};

export default VerifiedExpertRoute; 