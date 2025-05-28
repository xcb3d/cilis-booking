import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarIcon, 
  ClockIcon, 
  StarIcon, 
  UserIcon, 
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import useAuthStore from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import axiosClient from '../../utils/axiosClient';
import ExpertCard from '../../components/client/ExpertCard';

const HomePage = () => {
  const { user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Fetch experts from API instead of mockData
  const { data: expertsData, isLoading, error } = useQuery({
    queryKey: ['homePageExperts'],
    queryFn: () => axiosClient.get('/clients/experts')
  });
  
  // Handle loading state and ensure experts is always an array
  const experts = expertsData?.experts || [];
  
  // Categories based on expert fields
  const allCategories = ['all', ...new Set(experts.map(expert => expert.field).filter(Boolean))];
  
  // Nếu không có categories hoặc chỉ có 'all', hiển thị trạng thái mặc định
  const categories = allCategories.length <= 1 ? ['all'] : allCategories;
  
  // Filter experts by category
  const filteredExperts = selectedCategory === 'all' 
    ? experts 
    : experts.filter(expert => expert.field === selectedCategory);

  // Format currency to VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover mix-blend-multiply filter brightness-75"
            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1587&q=80"
            alt="People working"
          />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Đặt lịch tư vấn với chuyên gia
          </h1>
          <p className="mt-6 text-xl text-blue-100 max-w-3xl">
            Kết nối ngay với các chuyên gia hàng đầu trong nhiều lĩnh vực. Tư vấn nhanh chóng, thuận tiện và hiệu quả.
          </p>
          <div className="mt-10 flex flex-col md:flex-row gap-4">
            <Link
              to="/client/experts"
              className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-900 hover:bg-blue-800 md:text-lg"
            >
              Tìm chuyên gia ngay
            </Link>
            <Link
              to={user ? "/client/bookings" : "/login"}
              className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md bg-white text-blue-600 hover:bg-blue-50 md:text-lg"
            >
              {user ? "Lịch hẹn của tôi" : "Đăng nhập"}
            </Link>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="py-16 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">
              Tại sao chọn chúng tôi
            </h2>
            <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
              Giải pháp tư vấn trực tuyến hiệu quả
            </p>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
              Tiết kiệm thời gian, tối ưu chi phí và nhận tư vấn chuyên nghiệp mọi lúc mọi nơi
            </p>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="pt-6">
                <div className="flow-root bg-white rounded-lg px-6 pb-8 shadow-lg">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-md shadow-lg">
                        <ClockIcon className="h-6 w-6 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Tiết kiệm thời gian</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Không cần di chuyển. Gặp chuyên gia trực tuyến mọi lúc mọi nơi, ngay tại nhà hoặc văn phòng của bạn.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-white rounded-lg px-6 pb-8 shadow-lg">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-md shadow-lg">
                        <ShieldCheckIcon className="h-6 w-6 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Chất lượng đảm bảo</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Các chuyên gia được chọn lọc kỹ càng với kinh nghiệm và chuyên môn được xác thực. Đảm bảo chất lượng tư vấn.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-white rounded-lg px-6 pb-8 shadow-lg">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-md shadow-lg">
                        <CurrencyDollarIcon className="h-6 w-6 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Giá cả hợp lý</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Chi phí tư vấn rõ ràng, minh bạch. Tiết kiệm hơn so với phương thức tư vấn truyền thống.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-white rounded-lg px-6 pb-8 shadow-lg">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-md shadow-lg">
                        <CalendarIcon className="h-6 w-6 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Đặt lịch linh hoạt</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Dễ dàng tìm khung giờ phù hợp với lịch trình bận rộn của bạn. Không bị giới hạn về giờ làm việc.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-white rounded-lg px-6 pb-8 shadow-lg">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-md shadow-lg">
                        <UserIcon className="h-6 w-6 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Đa dạng lĩnh vực</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Tư vấn trong nhiều lĩnh vực khác nhau: luật pháp, tài chính, tâm lý, sức khỏe, giáo dục, công nghệ...
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-white rounded-lg px-6 pb-8 shadow-lg">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-md shadow-lg">
                        <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Kết nối trực tuyến</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Hỗ trợ video call chất lượng cao, chia sẻ màn hình và tài liệu. Tương tác trực tiếp với chuyên gia.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expert showcase section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">
              Chuyên gia
            </h2>
            <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
              Gặp gỡ các chuyên gia của chúng tôi
            </p>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
              Đội ngũ chuyên gia hàng đầu, sẵn sàng giải đáp mọi thắc mắc của bạn
            </p>
          </div>

          {/* Category tabs */}
          <div className="mt-8 flex justify-center">
            {!isLoading && !error && categories.length > 1 && (
              <div className="inline-flex rounded-md shadow-sm">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 text-sm font-medium ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } ${
                      category === 'all' ? 'rounded-l-md' : ''
                    } ${
                      category === categories[categories.length - 1] ? 'rounded-r-md' : ''
                    } border border-gray-300`}
                  >
                    {category === 'all' ? 'Tất cả' : category}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center items-center mt-12 h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {/* Error state */}
          {error && (
            <div className="text-center mt-12">
              <p className="text-red-500">Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.</p>
            </div>
          )}
          
          {/* Experts grid */}
          {!isLoading && !error && (
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredExperts.length > 0 ? (
                filteredExperts.map((expert) => (
                  <ExpertCard key={expert._id} expert={expert} />
                ))
              ) : (
                <div className="col-span-3 text-center py-12">
                  <p className="text-gray-500">Không tìm thấy chuyên gia phù hợp với lựa chọn của bạn.</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-10 text-center">
            <Link
              to="/client/experts"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Xem tất cả chuyên gia
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-blue-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Sẵn sàng bắt đầu?</span>
            <span className="block text-blue-200">Đặt lịch tư vấn ngay hôm nay.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/client/experts"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
              >
                Tìm chuyên gia
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                to={user ? "/client/dashboard" : "/login"}
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-800 hover:bg-blue-900"
              >
                {user ? "Bảng điều khiển" : "Đăng nhập"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 