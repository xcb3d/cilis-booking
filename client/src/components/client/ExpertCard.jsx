import { Link } from 'react-router-dom';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

/**
 * Component ExpertCard hiển thị thông tin của một chuyên gia
 * 
 * @param {Object} props
 * @param {Object} props.expert - Thông tin chuyên gia
 * @param {string} props.linkPrefix - Tiền tố của đường dẫn (mặc định: '/client/experts/')
 * @param {boolean} props.hideButton - Ẩn nút "Xem chi tiết" nếu cần
 * @param {function} props.onClick - Hàm callback khi click vào card (tùy chọn)
 * @param {React.ReactNode} props.footerActions - Các actions tùy chỉnh hiển thị ở footer
 * @param {string} props.buttonText - Văn bản hiển thị trên nút xem chi tiết (mặc định: "Xem chi tiết")
 * @param {string} props.className - CSS classes tùy chỉnh cho component
 */
const ExpertCard = ({ 
  expert, 
  linkPrefix = '/client/experts/', 
  hideButton = false, 
  onClick,
  footerActions,
  buttonText = "Xem chi tiết",
  className = ""
}) => {
  // Format currency to VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Hiển thị đánh giá sao với hỗ trợ nửa sao
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    // Add full stars
    for (let i = 1; i <= fullStars; i++) {
      stars.push(<StarSolidIcon key={`full-${i}`} className="h-5 w-5 text-yellow-400" />);
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative inline-block h-5 w-5">
          <StarIcon className="absolute h-5 w-5 text-gray-300" />
          <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
            <StarSolidIcon className="h-5 w-5 text-yellow-400" />
          </div>
        </div>
      );
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 1; i <= emptyStars; i++) {
      stars.push(<StarIcon key={`empty-${i}`} className="h-5 w-5 text-gray-300" />);
    }
    
    return stars;
  };

  // Kiểm tra và đảm bảo các giá trị tồn tại
  const expertAvatar = expert.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name || '')}&background=random`;
  const expertRating = expert.rating ? parseFloat(expert.rating) : 0;
  const reviewCount = expert.reviewCount || 0;
  const price = expert.price || 0;

  return (
    <div 
      className={`bg-white overflow-hidden shadow rounded-lg flex flex-col h-full ${className}`}
      onClick={onClick ? () => onClick(expert) : undefined}
    >
      <div className="px-4 py-5 sm:px-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <img className="h-12 w-12 rounded-full" src={expertAvatar} alt={expert.name} />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">{expert.name}</h3>
            <p className="text-sm text-gray-500">{expert.field}</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-4 sm:px-6 flex-grow">
        <p className="text-sm text-gray-500 line-clamp-2">{expert.expertise}</p>
        <p className="mt-2 text-sm text-gray-500 line-clamp-2">{expert.experience}</p>
        <div className="mt-2 flex items-center">
          <div className="flex">
            {renderStars(expertRating)}
          </div>
          <span className="ml-1 text-sm text-gray-600">{expertRating.toFixed(1)}</span>
          <span className="mx-1 text-sm text-gray-500">•</span>
          <span className="text-sm text-gray-500">{reviewCount} đánh giá</span>
        </div>
        <p className="mt-2 text-sm font-medium text-gray-900">{formatCurrency(price)}/giờ</p>
      </div>
      
      {/* Main action button or custom footer actions */}
      {(!hideButton || footerActions) && (
        <div className="px-4 py-4 sm:px-6 mt-auto border-t border-gray-200">
          {!hideButton && (
            <Link
              to={`${linkPrefix}${expert._id}`}
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {buttonText}
            </Link>
          )}
          
          {/* Optional custom footer actions */}
          {footerActions && (
            <div className={`${!hideButton ? 'mt-3' : ''} flex justify-between items-center`}>
              {footerActions}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpertCard; 