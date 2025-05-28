import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  UserIcon, 
  EnvelopeIcon, 
  KeyIcon, 
  PhoneIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';
import { ROLES, EXPERT_FIELDS } from '../utils/constants';
import useAuthStore from '../store/authStore';

const Register = () => {
  const navigate = useNavigate();
  const { register: registerUser, loading, error } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState(ROLES.CLIENT);
  const [step, setStep] = useState(1); // Step 1: Basic info, Step 2: Role specific info
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    watch,
    trigger
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      field: '',
      expertise: '',
      experience: '',
      price: 500000
    }
  });
  
  const password = watch('password');
  
  const handleRoleChange = (role) => {
    setSelectedRole(role);
  };
  
  const handleNextStep = async () => {
    // Validate first step fields
    const isValid = await trigger(['name', 'email', 'password', 'confirmPassword', 'phone']);
    if (isValid) {
      setStep(2);
      window.scrollTo(0, 0);
    }
  };
  
  const handlePrevStep = () => {
    setStep(1);
    window.scrollTo(0, 0);
  };
  
  const onSubmit = async (data) => {
    try {
      // Prepare user data
      const userData = {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: selectedRole
      };
      
      // Add expert specific fields if role is expert
      if (selectedRole === ROLES.EXPERT) {
        userData.field = data.field;
        userData.expertise = data.expertise;
        userData.experience = data.experience;
        userData.price = parseInt(data.price, 10); // Đảm bảo price là số nguyên
      }
      
      // Register user
      await registerUser(userData);
      
      if (selectedRole === ROLES.EXPERT) {
        toast.success('Đăng ký thành công! Vui lòng đăng nhập và tải lên giấy tờ xác minh để hoàn tất quá trình đăng ký.');
      } else {
        toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      }
      
      // Chuyển hướng đến trang đăng nhập
      navigate('/login');
    } catch (error) {
      toast.error(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Đăng ký tài khoản</h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1 
              ? 'Điền thông tin cơ bản để bắt đầu' 
              : selectedRole === ROLES.EXPERT 
                ? 'Hoàn thiện thông tin chuyên môn của bạn'
                : 'Hoàn thiện thông tin cá nhân của bạn'}
          </p>
          
          {/* Step indicator */}
          <div className="mt-6 flex justify-center">
            <ol className="flex items-center w-full max-w-md">
              <li className={`flex w-full items-center after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-200 after:mx-4 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <span className={`flex items-center justify-center w-8 h-8 rounded-full border ${step >= 1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 border-gray-200'}`}>
                  1
                </span>
              </li>
              <li className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <span className={`flex items-center justify-center w-8 h-8 rounded-full border ${step >= 2 ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 border-gray-200'}`}>
                  2
                </span>
              </li>
            </ol>
          </div>
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Lỗi đăng ký</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {step === 1 ? (
            <>
              {/* Role Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700">Bạn muốn đăng ký với vai trò</label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className={`py-3 px-4 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      selectedRole === ROLES.CLIENT
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleRoleChange(ROLES.CLIENT)}
                  >
                    <div className="flex items-center justify-center">
                      <UserGroupIcon className="w-5 h-5 mr-2" />
                      <span>Khách hàng</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`py-3 px-4 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      selectedRole === ROLES.EXPERT
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleRoleChange(ROLES.EXPERT)}
                  >
                    <div className="flex items-center justify-center">
                      <BriefcaseIcon className="w-5 h-5 mr-2" />
                      <span>Chuyên gia</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Basic Information */}
              <div className="rounded-md shadow-sm -space-y-px">
                <div className="grid gap-6">
                  {/* Full Name */}
                  <div className="col-span-12">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Họ và tên
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="name"
                        type="text"
                        {...register('name', { required: 'Họ và tên là bắt buộc' })}
                        className={`pl-10 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md ${
                          errors.name ? 'border-red-300' : ''
                        }`}
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="col-span-12">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        {...register('email', {
                          required: 'Email là bắt buộc',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Email không hợp lệ'
                          }
                        })}
                        className={`pl-10 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md ${
                          errors.email ? 'border-red-300' : ''
                        }`}
                        placeholder="example@gmail.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="col-span-12">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Số điện thoại
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <PhoneIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="phone"
                        type="text"
                        {...register('phone', {
                          required: 'Số điện thoại là bắt buộc',
                          pattern: {
                            value: /^[0-9]{10,11}$/,
                            message: 'Số điện thoại không hợp lệ'
                          }
                        })}
                        className={`pl-10 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md ${
                          errors.phone ? 'border-red-300' : ''
                        }`}
                        placeholder="0901234567"
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="col-span-12">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Mật khẩu
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        type="password"
                        {...register('password', {
                          required: 'Mật khẩu là bắt buộc',
                          minLength: {
                            value: 6,
                            message: 'Mật khẩu phải có ít nhất 6 ký tự'
                          }
                        })}
                        className={`pl-10 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md ${
                          errors.password ? 'border-red-300' : ''
                        }`}
                        placeholder="••••••"
                      />
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="col-span-12">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Xác nhận mật khẩu
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        type="password"
                        {...register('confirmPassword', {
                          required: 'Vui lòng xác nhận mật khẩu',
                          validate: value => value === password || 'Mật khẩu không khớp'
                        })}
                        className={`pl-10 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md ${
                          errors.confirmPassword ? 'border-red-300' : ''
                        }`}
                        placeholder="••••••"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Tiếp theo
                </button>
              </div>
            </>
          ) : (
            <>
              {selectedRole === ROLES.EXPERT ? (
                // Expert specific fields
                <div className="space-y-6">
                  {/* Verification Notice */}
                  <div className="p-4 rounded-md bg-yellow-50 border border-yellow-200">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Thông báo về quy trình xác minh</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>
                            Để đảm bảo chất lượng dịch vụ, tất cả chuyên gia cần qua bước xác minh trước khi có thể nhận tư vấn:
                          </p>
                          <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li>Sau khi đăng ký, bạn cần đăng nhập và tải lên các giấy tờ xác minh chuyên môn trong mục Dashboard</li>
                            <li>Admin sẽ xem xét và phê duyệt hồ sơ của bạn</li>
                            <li>Khi được phê duyệt, bạn sẽ có thể bắt đầu nhận các yêu cầu tư vấn</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Field of expertise */}
                  <div>
                    <label htmlFor="field" className="block text-sm font-medium text-gray-700">
                      Lĩnh vực chuyên môn
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="field"
                        {...register('field', { required: 'Vui lòng chọn lĩnh vực chuyên môn' })}
                        className={`pl-10 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md ${
                          errors.field ? 'border-red-300' : ''
                        }`}
                      >
                        <option value="">-- Chọn lĩnh vực --</option>
                        {EXPERT_FIELDS.map((field, index) => (
                          <option key={index} value={field}>
                            {field}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.field && (
                      <p className="mt-1 text-sm text-red-600">{errors.field.message}</p>
                    )}
                  </div>
                
                  {/* Expertise */}
                  <div>
                    <label htmlFor="expertise" className="block text-sm font-medium text-gray-700">
                      Chuyên ngành cụ thể
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <textarea
                        id="expertise"
                        {...register('expertise', { 
                          required: 'Vui lòng nhập chuyên ngành cụ thể',
                          minLength: {
                            value: 10,
                            message: 'Chuyên ngành cụ thể phải có ít nhất 10 ký tự'
                          },
                          maxLength: {
                            value: 200,
                            message: 'Chuyên ngành cụ thể không được vượt quá 200 ký tự' 
                          }
                        })}
                        rows={3}
                        className={`block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md ${
                          errors.expertise ? 'border-red-300' : ''
                        }`}
                        placeholder="Ví dụ: Chuyên tư vấn pháp lý doanh nghiệp, hợp đồng thương mại"
                      />
                    </div>
                    {errors.expertise && (
                      <p className="mt-1 text-sm text-red-600">{errors.expertise.message}</p>
                    )}
                  </div>
                
                  {/* Experience */}
                  <div>
                    <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                      Kinh nghiệm
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <textarea
                        id="experience"
                        {...register('experience', { 
                          required: 'Vui lòng nhập kinh nghiệm của bạn',
                          minLength: {
                            value: 10,
                            message: 'Kinh nghiệm phải có ít nhất 10 ký tự'
                          },
                          maxLength: {
                            value: 500,
                            message: 'Kinh nghiệm không được vượt quá 500 ký tự'
                          } 
                        })}
                        rows={3}
                        className={`block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md ${
                          errors.experience ? 'border-red-300' : ''
                        }`}
                        placeholder="Ví dụ: 5 năm kinh nghiệm tư vấn pháp lý cho doanh nghiệp vừa và nhỏ"
                      />
                    </div>
                    {errors.experience && (
                      <p className="mt-1 text-sm text-red-600">{errors.experience.message}</p>
                    )}
                  </div>
                
                  {/* Price per hour */}
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                      Giá tư vấn mỗi giờ (VNĐ)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="price"
                        type="number"
                        {...register('price', {
                          required: 'Vui lòng nhập giá tư vấn',
                          min: {
                            value: 100000,
                            message: 'Giá tư vấn tối thiểu là 100,000 VNĐ'
                          }
                        })}
                        className={`pl-10 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md ${
                          errors.price ? 'border-red-300' : ''
                        }`}
                        placeholder="500000"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Giá tư vấn thông thường dao động từ 300,000 VNĐ đến 2,000,000 VNĐ mỗi giờ tùy vào lĩnh vực và kinh nghiệm
                    </p>
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                    )}
                  </div>
                  
                  {/* Required Documents Notice */}
                  <div className="p-4 rounded-md bg-blue-50 border border-blue-200">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <DocumentCheckIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Giấy tờ cần chuẩn bị</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>Sau khi đăng ký, bạn sẽ cần tải lên các giấy tờ sau:</p>
                          <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li>CMND/CCCD (mặt trước và sau)</li>
                            <li>Bằng cấp, chứng chỉ liên quan đến lĩnh vực chuyên môn</li>
                            <li>Giấy phép hành nghề (nếu có)</li>
                            <li>Tài liệu xác minh kinh nghiệm làm việc (CV, hợp đồng làm việc, thư giới thiệu...)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Client specific info (could be empty or add additional fields)
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    Bạn đã hoàn thành tất cả thông tin cần thiết để đăng ký tài khoản khách hàng. Nhấn nút đăng ký để hoàn tất.
                  </p>
                </div>
              )}
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="group relative w-1/2 flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-1/2 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Đang xử lý...' : 'Đăng ký tài khoản'}
                </button>
              </div>
            </>
          )}
          
          <div className="text-sm text-center mt-4">
            <p className="text-gray-600">
              Đã có tài khoản?{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register; 