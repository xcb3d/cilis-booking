import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { hasRole } from './auth';

/**
 * ProtectedRoute component for role-based access control
 * @param {Object} props
 * @param {JSX.Element} props.element - The element to render if authorized
 * @param {string|string[]} [props.allowedRoles] - The roles allowed to access this route
 * @param {string} [props.redirectTo='/login'] - Where to redirect if not authorized
 */
const ProtectedRoute = ({ element, allowedRoles, redirectTo = '/login' }) => {
  const { isAuthenticated, user, checkAuth, authChecked } = useAuthStore();
  const [isChecking, setIsChecking] = useState(!authChecked);
  
  // Retrieve stored user from localStorage for initial state before auth check completes
  const storedUser = localStorage.getItem('auth-storage') 
    ? JSON.parse(localStorage.getItem('auth-storage'))?.state?.user 
    : null;

  // Determine if path should be accessible based on stored user role
  const hasStoredUserRequiredRole = storedUser && allowedRoles && (
    Array.isArray(allowedRoles) 
      ? allowedRoles.includes(storedUser.role)
      : storedUser.role === allowedRoles
  );

  // Kiểm tra trạng thái xác thực khi component được mount
  useEffect(() => {
    let isMounted = true;
    
    const verifyAuth = async () => {
      // Nếu đã xác thực và có user, và đã kiểm tra xác thực, không cần check lại
      if (authChecked && isAuthenticated && user) {
        setIsChecking(false);
        return;
      }
      
      // Chỉ gọi API nếu chưa kiểm tra xác thực
      if (!authChecked) {
        await checkAuth();
      }
      
      // Check if component is still mounted before updating state
      if (isMounted) {
        setIsChecking(false);
      }
    };
    
    verifyAuth();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [checkAuth, isAuthenticated, user, authChecked]);

  // If we're still checking authentication but have a stored user with the right role,
  // render the layout with a loading indicator in the content area
  if (isChecking && storedUser && hasStoredUserRequiredRole) {
    // Render the layout with loading content
    // If element is a Layout component that should contain an Outlet
    if (React.isValidElement(element) && element.type.name && 
        (element.type.name === 'ClientLayout' || 
         element.type.name === 'MainLayout' || 
         element.type.displayName === 'ClientLayout' || 
         element.type.displayName === 'MainLayout')) {
      // Return the layout element (MainLayout or ClientLayout)
      // The Outlet in the layout will render the loading content defined in App.jsx
      return React.cloneElement(element, { children: <Outlet /> });
    }
  }

  // Standard loading spinner for non-layout components or when no stored user
  if (isChecking && (!storedUser || !hasStoredUserRequiredRole)) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  // Check if route is authenticated
  if (!isAuthenticated || !user) {
    // Redirect to login if not authenticated
    return <Navigate to={redirectTo} replace />;
  }

  // If there are role restrictions, check if user has required role
  if (allowedRoles && !hasRole(allowedRoles)) {
    // Redirect to unauthorized if authenticated but not authorized
    return <Navigate to="/unauthorized" replace />;
  }

  // If element is a Layout component that should contain an Outlet
  if (React.isValidElement(element) && element.type.name && 
      (element.type.name === 'ClientLayout' || 
       element.type.name === 'MainLayout' || 
       element.type.displayName === 'ClientLayout' || 
       element.type.displayName === 'MainLayout')) {
    return React.cloneElement(element, { children: <Outlet /> });
  }

  // User is authenticated and authorized
  return element;
};

export default ProtectedRoute; 