import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import useAuthStore from '../store/authStore';
import { toast } from 'react-hot-toast';
import { ROLES } from '../utils/constants';
const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState(null);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    setValue
  } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // Function to set demo credentials based on selected role
  const setDemoCredentials = (role) => {
    setSelectedRole(role);
    clearError();
    
    if (role === ROLES.ADMIN) {
      setValue('email', 'admin@example.com');
      setValue('password', 'admin123');
    } else if (role === ROLES.EXPERT) {
      setValue('email', 'expert2@example.com');
      setValue('password', 'expert123');
    } else if (role === ROLES.CLIENT) {
      setValue('email', 'client1@example.com');
      setValue('password', 'client123');
    }
  };

  const onSubmit = async (data) => {
    try {
      const user = await login(data.email, data.password);
      
      toast.success('Đăng nhập thành công!');
      
      // Redirect based on user role
      if (user.role === ROLES.ADMIN) {
        navigate('/admin/dashboard');
      } else if (user.role === ROLES.EXPERT) {
        navigate('/expert/dashboard');
      } else if (user.role === ROLES.CLIENT) {
        navigate('/client/home');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Đăng nhập</h2>
          <p className="mt-2 text-sm text-gray-600">
            Đăng nhập để sử dụng dịch vụ đặt lịch chuyên gia
          </p>
        </div>
        
        {/* Role Selection */}
        <div className="mt-6">
          <label className="text-sm font-medium text-gray-700">Chọn vai trò để đăng nhập demo</label>
          <div className="mt-2 grid grid-cols-3 gap-3">
            <button
              type="button"
              className={`py-3 px-4 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                selectedRole === ROLES.ADMIN
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setDemoCredentials(ROLES.ADMIN)}
            >
              Admin
            </button>
            <button
              type="button"
              className={`py-3 px-4 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                selectedRole === ROLES.EXPERT
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setDemoCredentials(ROLES.EXPERT)}
            >
              Chuyên gia
            </button>
            <button
              type="button"
              className={`py-3 px-4 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                selectedRole === ROLES.CLIENT
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setDemoCredentials(ROLES.CLIENT)}
            >
              Khách hàng
            </button>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Email"
                {...register('email', { 
                  required: 'Email là bắt buộc',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email không hợp lệ'
                  }
                })}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Mật khẩu"
                {...register('password', { required: 'Mật khẩu là bắt buộc' })}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>
          
          <div className="text-sm text-center">
            <p className="text-gray-600">
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
              >
                Đăng ký ngay
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login; 