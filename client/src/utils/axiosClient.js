import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Biến để theo dõi refresh token request đang thực hiện
let refreshTokenPromise = null;

// Flag to track if the page is in the process of loading
let isPageLoading = true;

// Set page as loaded after some time
setTimeout(() => {
  isPageLoading = false;
}, 1000);

// Tạo axios instance
const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Quan trọng: cho phép cookies được gửi trong CORS requests
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
axiosClient.interceptors.request.use(
  (config) => {
    // Log các request quan trọng
    if (config.url === '/auth/me') {
      console.log('🔒 Sending authentication check request to /auth/me');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Hàm để refresh token
const refreshToken = async () => {
  // Nếu đã có một refresh request đang thực hiện, return promise đó
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  console.log('🔄 Refreshing token...');
  
  // Tạo promise mới và lưu lại
  refreshTokenPromise = axios
    .post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
    .finally(() => {
      // Reset để lần sau có thể refresh lại
      refreshTokenPromise = null;
    });

  return refreshTokenPromise;
};

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => {
    // Log response thành công cho request quan trọng
    if (response.config.url === '/auth/me') {
      console.log('✅ Authentication check successful');
    }
    
    // Trả về dữ liệu response nếu thành công
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log lỗi cho request quan trọng
    if (originalRequest.url === '/auth/me') {
      console.log('❌ Authentication check failed', error);
    }
    
    // Nếu lỗi là 401 (Unauthorized) và chưa thử refresh token
    // và không phải là request refresh token (để tránh loop vô hạn)
    if (
      error.response?.status === 401 && 
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      
      try {
        // Thử refresh token
        await refreshToken();
        
        // Nếu refresh thành công, thử lại request ban đầu
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Nếu refresh thất bại, xử lý logout tại frontend
        console.error('Token refresh failed:', refreshError);
        
        // Don't redirect if page is still loading to allow for state hydration
        if (!isPageLoading && !window.location.pathname.includes('/login')) {
          console.log('Redirecting to login due to auth failure');
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    // Nếu không phải lỗi 401 hoặc refresh đã thất bại, trả về lỗi
    return Promise.reject(error.response?.data || error);
  }
);

export default axiosClient; 