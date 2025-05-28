import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon,
  StarIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { useInfiniteQuery } from '@tanstack/react-query';
import { debounce } from 'lodash';
import axiosClient from '../../utils/axiosClient';
import { EXPERT_FIELDS } from '../../utils/constants';
import ExpertCard from '../../components/client/ExpertCard';

const ExpertsList = () => {
  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
  const [ratingFilter, setRatingFilter] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  
  // Ref for intersection observer
  const observer = useRef();
  
  // Tối ưu hóa debounce cho các bộ lọc
  const debouncedSetField = useRef(
    debounce((value) => {
      setSelectedField(value);
    }, 500)
  ).current;
  
  const debouncedSetPriceRange = useRef(
    debounce((value) => {
      setPriceRange(value);
    }, 500)
  ).current;
  
  const debouncedSetRatingFilter = useRef(
    debounce((value) => {
      setRatingFilter(value);
    }, 500)
  ).current;
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    debouncedSetField('');
    debouncedSetPriceRange({ min: 0, max: 1000000 });
    debouncedSetRatingFilter(0);
  };

  // Debounce search query changes
  useEffect(() => {
    const debouncedSearch = debounce(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    
    debouncedSearch();
    
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery]);

  // Cleanup debounced functions on component unmount
  useEffect(() => {
    return () => {
      debouncedSetField.cancel();
      debouncedSetPriceRange.cancel();
      debouncedSetRatingFilter.cancel();
    };
  }, [debouncedSetField, debouncedSetPriceRange, debouncedSetRatingFilter]);

  // Fetch experts data using useInfiniteQuery
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['experts', debouncedSearchQuery, selectedField, priceRange, ratingFilter],
    queryFn: async ({ pageParam = null }) => {
      // Xây dựng params cho request
      const params = {
        cursor: pageParam,
        limit: 12,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        minRating: ratingFilter > 0 ? ratingFilter : undefined
      };
      
      // Thêm search và field params nếu có
      if (debouncedSearchQuery) {
        params.search = debouncedSearchQuery;
      }
      
      if (selectedField) {
        params.field = selectedField;
      }
      
      // Gọi API endpoint
      const response = await axiosClient.get('/clients/experts', { params });
      return response;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor
  });
  
  // Setup intersection observer for infinite scroll
  const lastExpertRef = useCallback(node => {
    if (isLoading) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  // Reload data when filters change
  useEffect(() => {
    refetch();
  }, [debouncedSearchQuery, selectedField, priceRange, ratingFilter, refetch]);
  
  // Render all experts from all pages
  const experts = data ? data.pages.flatMap(page => page.experts) : [];

  // Handlers for input changes
  const handleFieldChange = (e) => {
    debouncedSetField(e.target.value);
  };

  const handlePriceMinChange = (e) => {
    const min = parseInt(e.target.value) || 0;
    debouncedSetPriceRange({ ...priceRange, min });
  };

  const handlePriceMaxChange = (e) => {
    const max = parseInt(e.target.value) || 0;
    debouncedSetPriceRange({ ...priceRange, max });
  };

  const handleRatingChange = (rating) => {
    debouncedSetRatingFilter(rating);
  };

  // Render custom footer actions for ExpertCard
  const renderFooterActions = (expert) => (
    <>
      <button className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
        <MapPinIcon className="h-4 w-4 mr-1" />
        Xem vị trí
      </button>
      <Link
        to={`/client/booking/${expert._id}`}
        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
      >
        <CalendarIcon className="h-4 w-4 mr-1" />
        Đặt lịch ngay
      </Link>
    </>
  );

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tìm chuyên gia</h1>
          <p className="mt-2 text-sm text-gray-600">
            {isLoading ? 'Đang tải...' : `${experts.length} chuyên gia phù hợp với tìm kiếm của bạn`}
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2 text-gray-500" />
          Bộ lọc
        </button>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm chuyên gia theo tên, lĩnh vực hoặc chuyên môn..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {searchQuery && (
                <div className="absolute right-0 top-0 bottom-0 flex items-center">
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            {isLoading && searchQuery && (
              <p className="mt-1 text-xs text-gray-500">Đang tìm kiếm...</p>
            )}
          </div>
          <div>
            <select
              onChange={handleFieldChange}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">Tất cả lĩnh vực</option>
              {EXPERT_FIELDS.map(field => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Advanced filters - collapsed by default */}
        {showFilters && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khoảng giá (VNĐ mỗi giờ)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    defaultValue={priceRange.min}
                    onChange={handlePriceMinChange}
                    className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    placeholder="Min"
                  />
                  <span className="text-gray-500">đến</span>
                  <input
                    type="number"
                    defaultValue={priceRange.max}
                    onChange={handlePriceMaxChange}
                    className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    placeholder="Max"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đánh giá từ
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingChange(star)}
                      className={`p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        ratingFilter >= star ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      <StarIcon className="h-6 w-6 fill-current" />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">và cao hơn</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Loading state */}
      {isLoading && !isFetchingNextPage && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-500">Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.</p>
        </div>
      )}
      
      {/* Experts list with infinite scroll */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {experts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-xl text-gray-500">Không tìm thấy chuyên gia phù hợp.</p>
              <p className="mt-2 text-gray-400">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <>
              {experts.map((expert, index) => {
                // Nếu là expert cuối cùng, thêm ref để theo dõi intersection
                if (index === experts.length - 1) {
                  return (
                    <div ref={lastExpertRef} key={expert._id}>
                      <ExpertCard 
                        expert={expert}
                        className="hover:shadow-lg transition-shadow duration-300"
                        footerActions={renderFooterActions(expert)}
                      />
                    </div>
                  );
                } else {
                  return (
                    <div key={expert._id}>
                      <ExpertCard 
                        expert={expert}
                        className="hover:shadow-lg transition-shadow duration-300"
                        footerActions={renderFooterActions(expert)}
                      />
                    </div>
                  );
                }
              })}
            </>
          )}
        </div>
      )}
      
      {/* Load more indicator */}
      {isFetchingNextPage && (
        <div className="flex justify-center items-center py-6 mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Đang tải thêm...</span>
        </div>
      )}
    </div>
  );
};

export default ExpertsList; 