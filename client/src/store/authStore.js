// authStore.js - Authentication state management with Zustand
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axiosClient from '../utils/axiosClient';
import { setUser } from '../utils/auth';

// Biến để theo dõi request đang thực hiện
let authCheckPromise = null;
let lastAuthCheck = 0;
const AUTH_CHECK_THROTTLE = 2000; // 2 seconds

// Flag để đánh dấu đã kiểm tra xác thực ít nhất một lần
let hasCheckedAuthOnPageLoad = false;

// Get stored user data to initialize the store
const storedData = localStorage.getItem('auth-storage')
  ? JSON.parse(localStorage.getItem('auth-storage'))?.state
  : null;

// Tạo store với middleware persist để lưu trạng thái vào localStorage
const useAuthStore = create(
  persist(
    (set, get) => ({
      // Initialize with stored data if available
      user: storedData?.user || null,
      isAuthenticated: storedData?.isAuthenticated || false,
      loading: false,
      error: null,
      authChecked: false, // Đánh dấu đã kiểm tra xác thực chưa

      // Login user
      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          // Gửi yêu cầu đăng nhập tới API
          const response = await axiosClient.post('/auth/login', { email, password });
          
          console.log('Login response:', response.user);
          
          // Lưu user info trong localStorage để persistence
          setUser(response.user);

          set({ 
            user: response.user, 
            isAuthenticated: true, 
            loading: false,
            authChecked: true
          });
          
          return response.user;
        } catch (error) {
          set({ error: error.message || 'Đăng nhập thất bại', loading: false });
          throw error;
        }
      },

      // Register user (nếu cần)
      register: async (userData) => {
        set({ loading: true, error: null });
        
        try {
          // Gửi yêu cầu đăng ký tới API
          const response = await axiosClient.post('/auth/register', userData);
          
          set({ loading: false });
          return response;
        } catch (err) {
          set({ error: err.message || 'Đăng ký thất bại', loading: false });
          throw err;
        }
      },

      // Logout user
      logout: async () => {
        try {
          // Gọi API logout để xóa cookies
          await axiosClient.post('/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Reset cache
          authCheckPromise = null;
          lastAuthCheck = 0;
          hasCheckedAuthOnPageLoad = false;
          
          // Xóa user khỏi localStorage và state
          setUser(null);
          set({ 
            user: null, 
            isAuthenticated: false,
            authChecked: true
          });
        }
      },

      // Check if user is already authenticated
      checkAuth: async (forceCheck = false) => {
        const now = Date.now();
        const state = get();
        
        // Nếu đang tải trang lần đầu, phải kiểm tra xác thực
        const isInitialPageLoad = !hasCheckedAuthOnPageLoad;
        
        // Luôn kiểm tra auth khi tải trang lần đầu, bất kể có cached state hay không
        if (isInitialPageLoad) {
          console.log('Initial page load detected, forcing auth check');
          forceCheck = true;
        }

        // Nếu đã có một request trong quá trình thực hiện, return promise đó
        if (authCheckPromise && !forceCheck) {
          return authCheckPromise;
        }
        
        // Nếu đã kiểm tra gần đây và không phải là lần tải trang đầu tiên
        // và không yêu cầu kiểm tra bắt buộc, trả về trạng thái hiện tại
        if (now - lastAuthCheck < AUTH_CHECK_THROTTLE && !isInitialPageLoad && !forceCheck) {
          return Promise.resolve(state.isAuthenticated);
        }
        
        try {
          // Đánh dấu thời gian kiểm tra
          lastAuthCheck = now;
          
          console.log('Starting auth check with API...');
          // Tạo promise và lưu lại để các lần gọi tiếp theo có thể tái sử dụng
          authCheckPromise = axiosClient.get('/auth/me')
            .then(user => {
              // Đánh dấu đã kiểm tra trong session này
              hasCheckedAuthOnPageLoad = true;
              
              console.log('Auth check successful, received user data:', user);
              
              // Cập nhật state nếu user đã xác thực
              setUser(user);
              set({ 
                user, 
                isAuthenticated: true,
                authChecked: true
              });
              return true;
            })
            .catch(error => {
              // Đánh dấu đã kiểm tra trong session này
              hasCheckedAuthOnPageLoad = true;
              
              // Nếu API call thất bại, user không được xác thực
              console.error('Auth check failed:', error);
              setUser(null);
              set({ 
                user: null, 
                isAuthenticated: false,
                authChecked: true
              });
              return false;
            })
            .finally(() => {
              // Reset promise để lần sau kiểm tra lại
              setTimeout(() => {
                authCheckPromise = null;
              }, 100);
            });
          
          return authCheckPromise;
        } catch (error) {
          // Đánh dấu đã kiểm tra trong session này
          hasCheckedAuthOnPageLoad = true;
          
          authCheckPromise = null;
          console.error('Auth check unexpected error:', error);
          setUser(null);
          set({ 
            user: null, 
            isAuthenticated: false,
            authChecked: true 
          });
          return false;
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
      
      // Update current user data (for when we need to update specific fields)
      updateUserData: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({ user: updatedUser });
          setUser(updatedUser);
          return true;
        }
        return false;
      }
    }),
    {
      name: 'auth-storage', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // use localStorage
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated
      }), // chỉ lưu trữ thông tin cần thiết
      onRehydrateStorage: () => (state) => {
        // Khi dữ liệu được khôi phục từ localStorage, đánh dấu là chưa được xác thực API
        if (state) {
          // Keep isAuthenticated state but mark as not API-verified
          state.authChecked = false;
          
          console.log('Auth state rehydrated from storage:', {
            user: state.user ? {
              id: state.user.id,
              role: state.user.role,
              verified: state.user.verified,
              hasFullData: !!state.user.name
            } : null,
            isAuthenticated: state.isAuthenticated
          });
          
          // Force auth check on page load immediately after hydration
          if (state.isAuthenticated) {
            setTimeout(() => {
              state.checkAuth(true);
            }, 0);
          }
        }
      }
    }
  )
);

export default useAuthStore; 