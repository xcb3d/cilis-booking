// auth.js - Utility functions for authentication
import axiosClient from './axiosClient';

// Set user in a dedicated localStorage key (separate from Zustand store)
export const setUser = (user) => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};

// Get user from the dedicated localStorage key
export const getUser = () => {
  const user = localStorage.getItem('user');
  if (user) return JSON.parse(user);
  
  // Fallback to Zustand store data if available
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    const authState = JSON.parse(authStorage);
    return authState?.state?.user || null;
  }
  
  return null;
};

// Check if user is authenticated based on localStorage
export const isAuthenticated = () => {
  // First check the dedicated user key
  if (getUser() !== null) return true;
  
  // Then check the Zustand store
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    const authState = JSON.parse(authStorage);
    return !!authState?.state?.isAuthenticated;
  }
  
  return false;
};

// Check if user has required role
export const hasRole = (requiredRoles) => {
  const user = getUser();
  if (!user) return false;
  
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(user.role);
  }
  
  return user.role === requiredRoles;
};

// Logout user - clear both stores
export const logout = async () => {
  try {
    // Gọi API logout để xóa cookies
    await axiosClient.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Luôn xóa user info khỏi localStorage
    localStorage.removeItem('user');
    // Note: Zustand store will handle its own cleanup
  }
};

// Không còn cần các hàm liên quan đến token vì đã dùng HTTP cookies
// Các hàm getAuthToken, setAuthToken, generateAuthToken, decodeAuthToken đã bị loại bỏ 