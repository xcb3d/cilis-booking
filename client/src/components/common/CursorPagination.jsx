import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

/**
 * Component phân trang dựa trên cursor
 * 
 * @param {Object} props
 * @param {boolean} props.hasMore - Có dữ liệu tiếp theo không
 * @param {Function} props.onLoadMore - Callback khi nhấn nút tải thêm dữ liệu
 * @param {Function} props.onPrevious - Callback khi nhấn nút quay lại
 * @param {boolean} props.hasHistory - Có thể quay lại trang trước không
 * @param {number} props.totalItems - Tổng số mục dữ liệu đã tải
 * @param {number} props.pageSize - Số mục trên mỗi trang
 * @param {Function} props.onPageSizeChange - Callback khi thay đổi số mục trên trang
 * @param {boolean} props.showPageSize - Hiển thị dropdown chọn số mục trên trang
 * @param {Array} props.pageSizeOptions - Các tùy chọn số mục trên trang 
 * @param {boolean} props.loading - Đang tải dữ liệu
 * @param {string} props.className - CSS classes bổ sung
 */
const CursorPagination = ({ 
  hasMore = false,
  onLoadMore,
  onPrevious,
  hasHistory = false, 
  totalItems = 0,
  pageSize = 10,
  onPageSizeChange,
  showPageSize = true,
  pageSizeOptions = [10, 20, 50, 100],
  loading = false,
  className = ''
}) => {
  // Xử lý thay đổi số mục trên trang
  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    onPageSizeChange(newSize);
  };

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="mb-4 sm:mb-0">
        <p className="text-sm text-gray-700">
          Đã tải <span className="font-medium">{totalItems}</span> kết quả
          {hasMore && <span className="text-gray-500"> (còn thêm)</span>}
        </p>
      </div>
      
      <div className="flex items-center">
        {showPageSize && (
          <div className="mr-4">
            <label htmlFor="pageSize" className="sr-only">Số mục mỗi trang</label>
            <select
              id="pageSize"
              name="pageSize"
              value={pageSize}
              onChange={handlePageSizeChange}
              className="block w-full rounded-md border-gray-300 py-1.5 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size} / trang
                </option>
              ))}
            </select>
          </div>
        )}
        
        <nav className="isolate inline-flex rounded-md shadow-sm" aria-label="Pagination">
          {/* Nút quay lại */}
          {hasHistory && (
            <button
              onClick={onPrevious}
              disabled={!hasHistory || loading}
              className={`relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-medium ${
                !hasHistory || loading
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 bg-white hover:bg-gray-50'
              } border border-gray-300`}
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" aria-hidden="true" />
              Quay lại
            </button>
          )}
          
          {/* Nút tải thêm */}
          <button
            onClick={onLoadMore}
            disabled={!hasMore || loading}
            className={`relative inline-flex items-center ${hasHistory ? '' : 'rounded-l-md'} rounded-r-md px-3 py-2 text-sm font-medium ${
              !hasMore || loading
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-700 bg-white hover:bg-gray-50'
            } border border-gray-300`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang tải...
              </>
            ) : (
              <>
                Tải thêm
                <ChevronRightIcon className="h-5 w-5 ml-1" aria-hidden="true" />
              </>
            )}
          </button>
        </nav>
      </div>
    </div>
  );
};

export default CursorPagination; 