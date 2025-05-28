import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { ROLES, VERIFICATION_STATUS } from '../../utils/constants';
import { cn } from '../../utils/cn';

// Import icons from Heroicons
import { 
  HomeIcon, 
  CalendarIcon, 
  UserIcon,
  ClockIcon,
  CogIcon,
  ChartBarIcon,
  UserGroupIcon,
  BriefcaseIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon
} from '@heroicons/react/24/outline';

const MainLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadNotifications] = useState(2); // Mock unread notifications count
  
  // Get stored user from localStorage when the main user is not yet available
  const storedUser = !user && localStorage.getItem('auth-storage') 
    ? JSON.parse(localStorage.getItem('auth-storage'))?.state?.user 
    : null;
    
  // Use either the authenticated user or the stored user from localStorage
  const currentUser = user || storedUser;
  
  useEffect(() => {
    if (currentUser) {
      console.log('Current user in MainLayout:', currentUser);
    }
  }, [currentUser]);

  // Close mobile menu when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Define sidebar navigation items based on user role
  const getNavigationItems = () => {
    if (currentUser?.role === ROLES.ADMIN) {
      return [
        { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
        { name: 'Người dùng', href: '/admin/users', icon: UserGroupIcon },
        { name: 'Chuyên gia', href: '/admin/experts', icon: BriefcaseIcon },
        { name: 'Lịch đặt', href: '/admin/bookings', icon: CalendarIcon },
        { name: 'Thống kê', href: '/admin/analytics', icon: ChartBarIcon },
        { name: 'Cài đặt', href: '/admin/settings', icon: CogIcon },
      ];
    } else if (currentUser?.role === ROLES.EXPERT) {
      // Kiểm tra trạng thái xác minh của chuyên gia
      const isVerified = currentUser.verified === VERIFICATION_STATUS.VERIFIED;
      // const isPending = currentUser.verified === VERIFICATION_STATUS.PENDING; // Không cần biến này nữa

      // Nếu chuyên gia đã xác minh, hiển thị đầy đủ menu
      if (isVerified) {
        return [
          { name: 'Dashboard', href: '/expert/dashboard', icon: HomeIcon },
          { name: 'Lịch của tôi', href: '/expert/schedule', icon: CalendarIcon },
          { name: 'Lịch sử tư vấn', href: '/expert/bookings', icon: ClockIcon },
          { name: 'Hồ sơ', href: '/expert/profile', icon: UserIcon },
          { name: 'Đánh giá', href: '/expert/reviews', icon: ChartBarIcon },
          { name: 'Cài đặt', href: '/expert/settings', icon: CogIcon },
        ];
      } else {
        // Nếu chưa xác minh, đang chờ hoặc bị từ chối, chỉ hiển thị Dashboard
        return [
          { name: 'Dashboard', href: '/expert/dashboard', icon: HomeIcon },
        ];
      }
    }

    // Fallback
    return [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    ];
  };

  const navigation = getNavigationItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu */}
      <div className={cn(
        "fixed inset-0 flex z-40 lg:hidden",
        isMobileMenuOpen ? "block" : "hidden"
      )} role="dialog" aria-modal="true">
        {/* Overlay */}
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)}></div>
        
        {/* Sidebar */}
        <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center px-4">
            <span className="text-2xl font-bold text-blue-600">Booking Expert</span>
          </div>
          
          {/* Nav */}
          <div className="mt-5 flex-1 h-0 overflow-y-auto">
            <nav className="px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group flex items-center px-2 py-2 text-base font-medium rounded-md',
                    location.pathname === item.href
                      ? 'bg-gray-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-4 flex-shrink-0 h-6 w-6',
                      location.pathname === item.href
                        ? 'text-blue-600'
                        : 'text-gray-400 group-hover:text-gray-500'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <span className="text-2xl font-bold text-blue-600">Booking Expert</span>
            </div>
            <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                    location.pathname === item.href
                      ? 'bg-gray-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 flex-shrink-0 h-6 w-6',
                      location.pathname === item.href
                        ? 'text-blue-600'
                        : 'text-gray-400 group-hover:text-gray-500'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top header */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              <h1 className="text-2xl font-semibold text-gray-900">
                {navigation.find((item) => item.href === location.pathname)?.name || 'Dashboard'}
              </h1>
              
              {/* Hiển thị thông báo trạng thái xác minh */}
              {currentUser?.role === ROLES.EXPERT && 
               (currentUser?.verified === VERIFICATION_STATUS.UNVERIFIED || 
                currentUser?.verified === VERIFICATION_STATUS.REJECTED) && (
                <div className="ml-4 px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-md">
                  {currentUser?.verified === VERIFICATION_STATUS.UNVERIFIED 
                    ? "Chưa xác minh: Hãy tải lên giấy tờ để được phê duyệt"
                    : "Đã bị từ chối: Vui lòng cập nhật giấy tờ"
                  }
                </div>
              )}
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              {/* Notification bell */}
              <button className="relative p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
                )}
              </button>

              {/* Profile dropdown */}
              <div className="ml-3 relative flex items-center">
                <div className="flex items-center">
                  <div className="hidden md:block">
                    <div className="text-base font-medium text-gray-800">{currentUser?.name}</div>
                    <div className="text-sm font-medium text-gray-500">
                      {currentUser?.role === ROLES.ADMIN && 'Admin'}
                      {currentUser?.role === ROLES.EXPERT && 'Chuyên gia'}
                      {currentUser?.role === ROLES.CLIENT && 'Khách hàng'}
                    </div>
                  </div>
                  <img
                    className="ml-3 h-8 w-8 rounded-full"
                    src={currentUser?.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'}
                    alt=""
                  />
                </div>
                <button 
                  className="ml-3 text-sm text-gray-700 hover:text-blue-600"
                  onClick={handleLogout}
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 