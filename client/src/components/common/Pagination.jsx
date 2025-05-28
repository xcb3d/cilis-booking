import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';

/**
 * Component phân trang có thể tái sử dụng
 * 
 * @param {Object} props
 * @param {number} props.currentPage - Trang hiện tại (bắt đầu từ 1)
 * @param {number} props.totalPages - Tổng số trang
 * @param {number} props.totalItems - Tổng số mục dữ liệu
 * @param {number} props.pageSize - Số mục trên mỗi trang
 * @param {Function} props.onPageChange - Callback khi thay đổi trang
 * @param {Function} props.onPageSizeChange - Callback khi thay đổi số mục trên trang
 * @param {boolean} props.showPageSize - Hiển thị dropdown chọn số mục trên trang
 * @param {Array} props.pageSizeOptions - Các tùy chọn số mục trên trang 
 * @param {string} props.className - CSS classes bổ sung
 */
const Pagination = ({ 
  currentPage = 1, 
  totalPages = 1, 
  totalItems = 0,
  pageSize = 10,
  onPageChange, 
  onPageSizeChange,
  showPageSize = true,
  pageSizeOptions = [5, 10, 20, 50],
  className = ''
}) => {
  // Xử lý thay đổi trang
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    onPageChange(newPage);
  };

  // Xử lý thay đổi số mục trên trang
  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    onPageSizeChange(newSize);
  };

  // Tính toán phạm vi hiển thị
  const startItem = Math.min(totalItems, (currentPage - 1) * pageSize + 1);
  const endItem = Math.min(totalItems, currentPage * pageSize);

  // Hiển thị tối đa 5 nút trang chung quanh trang hiện tại
  const generatePageButtons = () => {
    const buttons = [];
    const maxPagesShown = 5; // Số nút trang hiển thị tối đa
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesShown / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesShown - 1);
    
    // Điều chỉnh startPage nếu endPage đã đạt đến totalPages
    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - maxPagesShown + 1);
    }
    
    // Thêm nút "Đầu trang" nếu không ở trang đầu và có nhiều trang
    if (currentPage > 1 && totalPages > maxPagesShown) {
      buttons.push(
        <button
          key="first"
          onClick={() => handlePageChange(1)}
          className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
        >
          <span className="sr-only">Trang đầu</span>
          <ChevronDoubleLeftIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      );
    }
    
    // Thêm nút trang trước
    buttons.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`relative inline-flex items-center px-2 py-2 text-sm font-medium ${
          currentPage === 1 
            ? 'text-gray-300 cursor-not-allowed' 
            : 'text-gray-500 hover:bg-gray-50'
        }`}
      >
        <span className="sr-only">Trang trước</span>
        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
      </button>
    );
    
    // Thêm các nút trang
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
            i === currentPage
              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
          } border`}
        >
          {i}
        </button>
      );
    }
    
    // Thêm nút trang kế tiếp
    buttons.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`relative inline-flex items-center px-2 py-2 text-sm font-medium ${
          currentPage === totalPages 
            ? 'text-gray-300 cursor-not-allowed' 
            : 'text-gray-500 hover:bg-gray-50'
        }`}
      >
        <span className="sr-only">Trang kế tiếp</span>
        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
      </button>
    );
    
    // Thêm nút "Cuối trang" nếu không ở trang cuối và có nhiều trang
    if (currentPage < totalPages && totalPages > maxPagesShown) {
      buttons.push(
        <button
          key="last"
          onClick={() => handlePageChange(totalPages)}
          className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
        >
          <span className="sr-only">Trang cuối</span>
          <ChevronDoubleRightIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      );
    }
    
    return buttons;
  };

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="mb-4 sm:mb-0">
        <p className="text-sm text-gray-700">
          Hiển thị <span className="font-medium">{startItem}</span> đến{' '}
          <span className="font-medium">{endItem}</span> trong{' '}
          <span className="font-medium">{totalItems}</span> kết quả
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
        
        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
          {generatePageButtons()}
        </nav>
      </div>
    </div>
  );
};

export default Pagination; 