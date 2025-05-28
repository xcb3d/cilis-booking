import { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Auth
import useAuthStore from './store/authStore';
import { ROLES } from './utils/constants';

// Layouts
import MainLayout from './components/layout/MainLayout';
import ClientLayout from './components/layout/ClientLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Dashboard pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ExpertDashboard from './pages/expert/ExpertDashboard';

// Client pages
import HomePage from './pages/client/HomePage';

// Payment pages
import PaymentSuccess from './pages/payment/PaymentSuccess';
import PaymentError from './pages/payment/PaymentError';

// Protected Routes
import ProtectedRoute from './utils/ProtectedRoute';
import VerifiedExpertRoute from './utils/VerifiedExpertRoute';
import ExpertsList from './pages/client/ExpertsList';
import ExpertDetail from './pages/client/ExpertDetail';
import BookingForm from './pages/client/BookingForm';
import Bookings from './pages/client/Bookings';
import BookingDetail from './pages/client/BookingDetail';
import Profile from './pages/client/Profile';
import Support from './pages/client/Support';
import TermsOfService from './pages/client/TermsOfService';
import PrivacyPolicy from './pages/client/PrivacyPolicy';
import AdminUsers from './pages/admin/AdminUsers';
import AdminExperts from './pages/admin/AdminExperts';
import AdminBookings from './pages/admin/AdminBookings';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import ExpertSchedule from './pages/expert/ExpertSchedule';
import ExpertBookingHistory from './pages/expert/ExpertBookingHistory';
import ExpertProfile from './pages/expert/ExpertProfile';
import ExpertReviews from './pages/expert/ExpertReviews';

// Chat Component
import ChatDialog from './components/chat/ChatDialog';

// Error & Utility Pages
const NotFound = () => <div className="p-10 text-center">Trang không tồn tại</div>;
const Unauthorized = () => <div className="p-10 text-center">Bạn không có quyền truy cập trang này</div>;

function App() {
  const { user, checkAuth, isAuthenticated, authChecked } = useAuthStore();

  // Kiểm tra trạng thái xác thực khi ứng dụng khởi động
  useEffect(() => {
    // Luôn thực hiện kiểm tra xác thực khi trang được tải lần đầu
    if (!authChecked) {
      console.log('Checking auth on initial page load...');
      checkAuth();
    }
  }, [checkAuth, authChecked]);

  // Redirect to appropriate page based on role
  const getDefaultRoute = () => {
    if (!user) return '/login';
    
    switch (user.role) {
      case ROLES.ADMIN:
        return '/admin/dashboard';
      case ROLES.EXPERT:
        return '/expert/dashboard';
      case ROLES.CLIENT:
        return '/client/home';
      default:
        return '/login';
    }
  };

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Payment Routes */}
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/error" element={<PaymentError />} />
        
        {/* Root redirect - Based on user role */}
        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
        
        {/* Protected Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute 
              allowedRoles={ROLES.ADMIN} 
              element={<MainLayout />} 
            />
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="experts" element={<AdminExperts />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Route>
        
        {/* Protected Expert Routes */}
        <Route 
          path="/expert" 
          element={
            <ProtectedRoute 
              allowedRoles={ROLES.EXPERT} 
              element={<MainLayout />} 
            />
          }
        >
          <Route index element={<Navigate to="/expert/dashboard" replace />} />
          <Route path="dashboard" element={<ExpertDashboard />} />
          <Route path="schedule" element={
            <VerifiedExpertRoute element={<ExpertSchedule />} />
          } />
          <Route path="bookings" element={
            <VerifiedExpertRoute element={<ExpertBookingHistory />} />
          } />
          <Route path="profile" element={
            <VerifiedExpertRoute element={<ExpertProfile />} />
          } />
          <Route path="reviews" element={
            <VerifiedExpertRoute element={<ExpertReviews />} />
          } />
        </Route>
        
        {/* Client Routes with Client Layout */}
        <Route 
          path="/client" 
          element={
            <ProtectedRoute 
              allowedRoles={ROLES.CLIENT} 
              element={<ClientLayout />} 
            />
          }
        >
          <Route index element={<Navigate to="/client/home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="experts" element={<ExpertsList />} />
          <Route path="experts/:id" element={<ExpertDetail />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="booking/:expertId" element={<BookingForm />} />
          <Route path="bookings/:id" element={<BookingDetail />} />
          <Route path="profile" element={<Profile />} />
          <Route path="support" element={<Support />} />
          <Route path="terms" element={<TermsOfService />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
        </Route>
        
        {/* Error Routes */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Dev Tools - will not show in production */}
      <ReactQueryDevtools initialIsOpen={false} />
      
      {/* Chat dialog (appears when user is authenticated) */}
      {isAuthenticated && user && (user.role === ROLES.CLIENT || user.role === ROLES.EXPERT) && (
        <ChatDialog />
      )}
    </>
  );
}

export default App;
