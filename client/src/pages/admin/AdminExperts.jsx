import { useState, Fragment, useMemo, useEffect, useCallback } from 'react';
import { 
  UserIcon, 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon,
  UserPlusIcon,
  AdjustmentsHorizontalIcon,
  CheckBadgeIcon,
  StarIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  DocumentTextIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowsPointingOutIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { EXPERT_FIELDS, VERIFICATION_STATUS } from '../../utils/constants';
import axiosClient from '../../utils/axiosClient';
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import debounce from 'lodash/debounce';

const ITEMS_PER_PAGE = 20;
const SEARCH_DEBOUNCE_DELAY = 500;

const VerificationStatusBadge = ({ status }) => {
  let colors, icon, text;
  
  switch(status) {
    case VERIFICATION_STATUS.VERIFIED:
      colors = 'bg-green-100 text-green-800';
      icon = <CheckBadgeIcon className="h-4 w-4 mr-1" />;
      text = 'Đã xác minh';
      break;
    case VERIFICATION_STATUS.PENDING:
      colors = 'bg-blue-100 text-blue-800';
      icon = <ClockIcon className="h-4 w-4 mr-1" />;
      text = 'Đang xem xét';
      break;
    case VERIFICATION_STATUS.REJECTED:
      colors = 'bg-red-100 text-red-800';
      icon = <XCircleIcon className="h-4 w-4 mr-1" />;
      text = 'Đã từ chối';
      break;
    default:
      colors = 'bg-yellow-100 text-yellow-800';
      icon = <XMarkIcon className="h-4 w-4 mr-1" />;
      text = 'Chưa xác minh';
  }
  
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors}`}>
      {icon}
      {text}
    </span>
  );
};

const AdminExperts = () => {
  const queryClient = useQueryClient();
  const [searchInputText, setSearchInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [documentPreview, setDocumentPreview] = useState(null);
  const [documentPreviewOpen, setDocumentPreviewOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExpert, setEditingExpert] = useState(null);
  const [expertForm, setExpertForm] = useState({
    name: '',
    email: '',
    field: '',
    expertise: '',
    experience: '',
    price: 0,
    phone: ''
  });
  
  const [isReverificationModalOpen, setIsReverificationModalOpen] = useState(false);
  const [reverificationReason, setReverificationReason] = useState('');
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [viewingExpert, setViewingExpert] = useState(null);
  
  const [expertReviews, setExpertReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  
  const debouncedSetSearchQuery = useCallback(
    debounce((value) => {
      setSearchQuery(value);
    }, SEARCH_DEBOUNCE_DELAY),
    []
  );

  const handleSearchInputChange = (e) => {
    const { value } = e.target;
    setSearchInputText(value);
    debouncedSetSearchQuery(value);
  };

  const fetchExpertsAPI = async ({ pageParam }) => {
    const params = {
      limit: ITEMS_PER_PAGE,
      search: searchQuery || undefined,
      field: fieldFilter || undefined,
      verified: verifiedFilter === 'all' ? undefined : verifiedFilter,
    };
    if (pageParam) {
      params.cursor = pageParam;
    }
    const response = await axiosClient.get('/admin/experts', { params });
    return response; 
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    isPreviousData,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['adminExpertsInfinite', searchQuery, fieldFilter, verifiedFilter],
    queryFn: fetchExpertsAPI,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => { 
      const nextCursor = lastPage?.nextCursor;
      return nextCursor || undefined;
    },
    keepPreviousData: true,
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(error?.response?.data?.message || error?.message || 'Lỗi khi tải danh sách chuyên gia');
      console.error('Error fetching experts:', error);
    }
  }, [isError, error]);
  
  const allExpertsFromPages = useMemo(() => {
    const expertsArray = data?.pages?.reduce((acc, page) => {
      if (page && Array.isArray(page.experts)) {
        return acc.concat(page.experts);
      }
      console.warn('Invalid page structure encountered while processing expert pages:', page);
      return acc;
    }, []) || [];
    return expertsArray;
  }, [data]);
  
  const deleteExpertMutation = useMutation({
    mutationFn: async (expertId) => {
      return await axiosClient.delete(`/admin/users/${expertId}`);
    },
    onSuccess: () => {
      toast.success('Đã xóa chuyên gia thành công');
      queryClient.invalidateQueries({ queryKey: ['adminExpertsInfinite'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa chuyên gia');
    }
  });
  
  const verifyExpertMutation = useMutation({
    mutationFn: async ({ expertId, status, comment }) => {
      return await axiosClient.post('/admin/experts/verify', {
        expertId,
        status,
        comment
      });
    },
    onSuccess: (data, variables) => {
      toast.success(
        `Đã ${variables.status === VERIFICATION_STATUS.VERIFIED ? 'xác minh' : variables.status === VERIFICATION_STATUS.REJECTED ? 'từ chối' : 'cập nhật trạng thái'} chuyên gia thành công`
      );
      queryClient.invalidateQueries({ queryKey: ['adminExpertsInfinite'] });
      setIsVerificationModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái chuyên gia');
    }
  });
  
  const updateExpertMutation = useMutation({
    mutationFn: async (expertData) => {
      return await axiosClient.put(`/admin/experts/${expertData.id}`, expertData);
    },
    onSuccess: () => {
      toast.success('Đã cập nhật thông tin chuyên gia thành công');
      queryClient.invalidateQueries({ queryKey: ['adminExpertsInfinite'] });
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật thông tin chuyên gia');
    }
  });
  
  const requestReverificationMutation = useMutation({
    mutationFn: async ({ expertId, reason }) => {
      return await axiosClient.post('/admin/experts/request-reverification', {
        expertId,
        reason
      });
    },
    onSuccess: () => {
      toast.success('Đã gửi yêu cầu xác minh lại giấy tờ thành công');
      queryClient.invalidateQueries({ queryKey: ['adminExpertsInfinite'] });
      setIsReverificationModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi khi yêu cầu xác minh lại giấy tờ');
    }
  });
  
  const fetchExpertReviews = async (expertId) => {
    if (!expertId) return;
    
    setIsLoadingReviews(true);
    try {
      const response = await axiosClient.get(`/admin/experts/${expertId}/reviews`);
      setExpertReviews(response.reviews || []);
    } catch (error) {
      console.error('Error fetching expert reviews:', error);
      toast.error('Không thể tải đánh giá của chuyên gia');
    } finally {
      setIsLoadingReviews(false);
    }
  };
  
  const handleDeleteExpert = (expertId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chuyên gia này không?')) {
      deleteExpertMutation.mutate(expertId);
    }
  };
  
  const handleOpenVerificationModal = (expert) => {
    setSelectedExpert(expert);
    setRejectionReason(expert.verificationComment || '');
    setIsVerificationModalOpen(true);
  };
  
  const handleOpenReverificationModal = (expert) => {
    setSelectedExpert(expert);
    setReverificationReason('');
    setIsReverificationModalOpen(true);
  };
  
  const handleApproveVerification = () => {
    if (!selectedExpert) return;
    
    verifyExpertMutation.mutate({
      expertId: selectedExpert._id,
      status: VERIFICATION_STATUS.VERIFIED,
      comment: ''
    });
  };
  
  const handleRejectVerification = () => {
    if (!selectedExpert || !rejectionReason) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    
    verifyExpertMutation.mutate({
      expertId: selectedExpert._id,
      status: VERIFICATION_STATUS.REJECTED,
      comment: rejectionReason
    });
  };
  
  const handleRequestReverification = () => {
    if (!selectedExpert || !reverificationReason) {
      toast.error('Vui lòng nhập lý do yêu cầu xác minh lại');
      return;
    }
    
    requestReverificationMutation.mutate({
      expertId: selectedExpert._id,
      reason: reverificationReason
    });
  };
  
  const handleOpenDocumentPreview = (url, title) => {
    setDocumentPreview({ url, title });
    setDocumentPreviewOpen(true);
    setImageLoading(true);
  };
  
  const isPDF = (url) => {
    return url.toLowerCase().endsWith('.pdf');
  };
  
  const handleImageLoaded = () => {
    setImageLoading(false);
  };
  
  const handleOpenEditModal = (expert) => {
    setEditingExpert(expert);
    setExpertForm({
      name: expert.name || '',
      email: expert.email || '',
      field: expert.field || '',
      expertise: expert.expertise || '',
      experience: expert.experience || '',
      price: expert.price || 0,
      phone: expert.phone || ''
    });
    setIsEditModalOpen(true);
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setExpertForm(prev => ({
      ...prev,
      [name]: name === 'price' ? Number(value) : value
    }));
  };
  
  const handleUpdateExpert = (e) => {
    e.preventDefault();
    if (!editingExpert || !editingExpert._id) {
        toast.error('Không có thông tin chuyên gia để cập nhật.');
        return;
    }
    updateExpertMutation.mutate({ ...expertForm, id: editingExpert._id });
  };
  
  const handleOpenProfileModal = (expert) => {
    setViewingExpert(expert);
    setIsProfileModalOpen(true);
    fetchExpertReviews(expert._id);
  };
  
  const expertsToDisplay = allExpertsFromPages;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const renderStars = (ratingInput) => {
    const rating = parseFloat(ratingInput) || 0;
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 1; i <= fullStars; i++) {
      stars.push(<StarSolidIcon key={`full-${i}`} className="h-5 w-5 text-yellow-400" />);
    }
    
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
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 1; i <= emptyStars; i++) {
      stars.push(<StarIcon key={`empty-${i}`} className="h-5 w-5 text-gray-300" />);
    }
    
    return stars;
  };

  const renderSmallStars = (ratingInput) => {
    const rating = parseFloat(ratingInput) || 0;
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 1; i <= fullStars; i++) {
      stars.push(<StarSolidIcon key={`full-${i}`} className="h-4 w-4 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative inline-block h-4 w-4">
          <StarIcon className="absolute h-4 w-4 text-gray-300" />
          <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
            <StarSolidIcon className="h-4 w-4 text-yellow-400" />
          </div>
        </div>
      );
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 1; i <= emptyStars; i++) {
      stars.push(<StarIcon key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }
    
    return stars;
  };

  const showInitialLoading = isLoading && !isPreviousData;
  const showFetchingIndicator = isFetching && (isPreviousData || expertsToDisplay.length > 0);

  if (showInitialLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (isError && !isPreviousData && expertsToDisplay.length === 0) {
    return (
      <div className="bg-red-50 p-6 rounded-md shadow-md text-center">
        <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h2 className="mt-4 text-xl font-semibold text-red-800">Đã xảy ra lỗi</h2>
        <p className="mt-2 text-red-700">{error?.response?.data?.message || error?.message || 'Không thể tải dữ liệu chuyên gia. Vui lòng thử lại sau.'}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isPreviousData ? 'opacity-75 transition-opacity duration-300' : ''}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý chuyên gia</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tổng số: {expertsToDisplay.length} chuyên gia
            {showFetchingIndicator && <span className="ml-2 text-sm text-blue-500 italic">(Đang cập nhật...)</span>}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <AdjustmentsHorizontalIcon className="-ml-0.5 mr-2 h-4 w-4" />
            Bộ lọc
          </button>
          <button 
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <UserPlusIcon className="-ml-0.5 mr-2 h-4 w-4" />
            Thêm chuyên gia
          </button>
        </div>
      </div>
      
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="mb-4">
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Tìm kiếm theo tên, email hoặc chuyên môn..."
              value={searchInputText}
              onChange={handleSearchInputChange}
            />
          </div>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="field-filter" className="block text-sm font-medium text-gray-700">
                Lĩnh vực
              </label>
              <select
                id="field-filter"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value)}
              >
                <option value="">Tất cả lĩnh vực</option>
                {EXPERT_FIELDS.map((field, index) => (
                  <option key={index} value={field}>
                    {field}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="verified-filter" className="block text-sm font-medium text-gray-700">
                Trạng thái xác minh
              </label>
              <select
                id="verified-filter"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={verifiedFilter}
                onChange={(e) => setVerifiedFilter(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="verified">Đã xác minh</option>
                <option value="pending">Đang chờ xét duyệt</option>
                <option value="rejected">Đã từ chối</option>
                <option value="unverified">Chưa nộp hồ sơ</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex items-center">
              <button
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => {
                  setSearchQuery('');
                  setFieldFilter('');
                  setVerifiedFilter('all');
                }}
              >
                Đặt lại bộ lọc
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg relative">
                {showFetchingIndicator && (
                  <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                )}
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Chuyên gia
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Lĩnh vực
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Giá/giờ
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Đánh giá
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Trạng thái
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Hành động</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {expertsToDisplay.map((expert) => (
                      <tr key={expert._id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img 
                                className="h-10 w-10 rounded-full" 
                                src={expert.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&background=random`} 
                                alt="" 
                              />
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900">{expert.name}</div>
                              <div className="text-gray-500">{expert.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="text-gray-900">{expert.field}</div>
                          <div className="text-gray-500 truncate max-w-xs">{expert.expertise}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-1" />
                            {formatCurrency(expert.price)}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="flex mr-1">
                              {renderSmallStars(expert.rating)}
                            </div>
                            <span>{(parseFloat(expert.rating) || 0).toFixed(1)}</span>
                            <span className="text-gray-400 ml-1">({expert.reviewCount || 0})</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <VerificationStatusBadge status={expert.verified} />
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {expert.verified === VERIFICATION_STATUS.PENDING && expert.documents && (
                            <button
                              className="text-blue-600 hover:text-blue-900 mr-4"
                              onClick={() => handleOpenVerificationModal(expert)}
                            >
                              <DocumentTextIcon className="h-5 w-5" />
                              <span className="sr-only">Xem xét hồ sơ</span>
                            </button>
                          )}
                          {expert.verified !== VERIFICATION_STATUS.PENDING && (
                            <>
                              <button
                                className="text-green-600 hover:text-green-900 mr-4"
                                onClick={() => handleOpenProfileModal(expert)}
                              >
                                <UserIcon className="h-5 w-5" />
                                <span className="sr-only">Xem profile</span>
                              </button>
                              <button
                                className="text-blue-600 hover:text-blue-900 mr-4"
                                onClick={() => handleOpenEditModal(expert)}
                              >
                                <PencilIcon className="h-5 w-5" />
                                <span className="sr-only">Chỉnh sửa</span>
                              </button>
                              {expert.verified === VERIFICATION_STATUS.VERIFIED && (
                                <button
                                  className="text-orange-600 hover:text-orange-900 mr-4"
                                  onClick={() => handleOpenReverificationModal(expert)}
                                >
                                  <ArrowPathIcon className="h-5 w-5" />
                                  <span className="sr-only">Yêu cầu xác minh lại</span>
                                </button>
                              )}
                              <button
                                className="text-red-600 hover:text-red-900"
                                onClick={() => handleDeleteExpert(expert._id)}
                                disabled={deleteExpertMutation.isPending}
                              >
                                <TrashIcon className="h-5 w-5" />
                                <span className="sr-only">Xóa</span>
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        {!isFetching && !isError && expertsToDisplay.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy chuyên gia</h3>
            <p className="mt-1 text-sm text-gray-500">Không có chuyên gia nào khớp với bộ lọc đã chọn, hoặc chưa có chuyên gia nào.</p>
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => {
                  setSearchQuery('');
                  setFieldFilter('');
                  setVerifiedFilter('all');
                }}
              >
                Đặt lại bộ lọc
              </button>
            </div>
          </div>
        )}
        
        {isError && isPreviousData && (
           <div className="mt-4 bg-red-50 p-3 rounded-md text-center">
             <p className="text-sm text-red-600">Đã có lỗi khi tải dữ liệu mới: {error?.response?.data?.message || error?.message}</p>
           </div>
        )}
      </div>
      
      <Transition.Root show={documentPreviewOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setDocumentPreviewOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
                  <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 relative">
                    <button
                      type="button"
                      className="absolute top-3 right-3 text-gray-400 hover:text-gray-500"
                      onClick={() => setDocumentPreviewOpen(false)}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                    
                    <div className="sm:flex sm:items-start mb-4">
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                          {documentPreview?.title || 'Xem tài liệu'}
                        </Dialog.Title>
                      </div>
                    </div>
                    
                    <div className="flex justify-center items-center overflow-hidden max-h-[70vh] relative">
                      {imageLoading && !isPDF(documentPreview?.url || '') && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                      {documentPreview?.url && (
                        <>
                          {isPDF(documentPreview.url) ? (
                            <div className="w-full h-[70vh]">
                              <object
                                data={documentPreview.url}
                                type="application/pdf"
                                width="100%"
                                height="100%"
                                className="border-0"
                              >
                                <div className="p-4 text-center">
                                  <p className="mb-4">Không thể hiển thị PDF trực tiếp.</p>
                                  <a 
                                    href={documentPreview.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
                                  >
                                    Mở PDF trong tab mới
                                  </a>
                                </div>
                              </object>
                            </div>
                          ) : (
                            <img 
                              src={documentPreview.url} 
                              alt={documentPreview.title}
                              className="max-w-full max-h-[70vh] object-contain"
                              onLoad={handleImageLoaded}
                            />
                          )}
                        </>
                      )}
                    </div>
                    
                    <div className="mt-5 flex justify-between">
                      <a 
                        href={documentPreview?.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <ArrowsPointingOutIcon className="h-5 w-5 mr-1" />
                        Mở liên kết đầy đủ
                      </a>
                      
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:text-sm"
                        onClick={() => setDocumentPreviewOpen(false)}
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
      
      <Transition.Root show={isVerificationModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setIsVerificationModalOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
                  <div>
                    <div className="mt-3 text-center sm:mt-5">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Xem xét hồ sơ chuyên gia
                      </Dialog.Title>
                      
                      {selectedExpert && (
                        <div className="mt-4 text-left">
                          <div className="flex items-center mb-4">
                            <img 
                              src={selectedExpert.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedExpert.name)}&background=random`} 
                              alt={selectedExpert.name} 
                              className="h-16 w-16 rounded-full mr-4"
                            />
                            <div>
                              <h4 className="font-medium text-gray-900">{selectedExpert.name}</h4>
                              <p className="text-gray-500">{selectedExpert.email}</p>
                              <p className="text-gray-500">Lĩnh vực: {selectedExpert.field}</p>
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-200 py-4">
                            <h5 className="font-medium text-gray-900 mb-2">Thông tin chuyên môn</h5>
                            <p className="text-gray-700 mb-2"><span className="font-medium">Chuyên ngành:</span> {selectedExpert.expertise}</p>
                            <p className="text-gray-700 mb-2"><span className="font-medium">Kinh nghiệm:</span> {selectedExpert.experience}</p>
                            <p className="text-gray-700"><span className="font-medium">Giá tư vấn:</span> {formatCurrency(selectedExpert.price)}/giờ</p>
                          </div>
                          
                          <div className="border-t border-gray-200 py-4">
                            <h5 className="font-medium text-gray-900 mb-3">Giấy tờ đã tải lên</h5>
                            <div className="space-y-3">
                              {selectedExpert.documents && (
                                <>
                                  {selectedExpert.documents.identification && (
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                                        <span>CMND/CCCD</span>
                                      </div>
                                      <button 
                                        onClick={() => handleOpenDocumentPreview(
                                          selectedExpert.documents.identification,
                                          "CMND/CCCD"
                                        )}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                      >
                                        Xem tài liệu
                                      </button>
                                    </div>
                                  )}
                                  
                                  {selectedExpert.documents.certification && (
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                                        <span>Bằng cấp, chứng chỉ</span>
                                      </div>
                                      <button 
                                        onClick={() => handleOpenDocumentPreview(
                                          selectedExpert.documents.certification,
                                          "Bằng cấp, chứng chỉ"
                                        )}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                      >
                                        Xem tài liệu
                                      </button>
                                    </div>
                                  )}
                                  
                                  {selectedExpert.documents.experience && (
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                                        <span>Tài liệu kinh nghiệm</span>
                                      </div>
                                      <button 
                                        onClick={() => handleOpenDocumentPreview(
                                          selectedExpert.documents.experience,
                                          "Tài liệu kinh nghiệm"
                                        )}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                      >
                                        Xem tài liệu
                                      </button>
                                    </div>
                                  )}
                                  
                                  {selectedExpert.documents.license && (
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                                        <span>Giấy phép hành nghề</span>
                                      </div>
                                      <button 
                                        onClick={() => handleOpenDocumentPreview(
                                          selectedExpert.documents.license,
                                          "Giấy phép hành nghề"
                                        )}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                      >
                                        Xem tài liệu
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                              {!selectedExpert.documents && (
                                <p className="text-gray-500 italic">Chuyên gia chưa tải lên giấy tờ</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-200 py-4">
                            <h5 className="font-medium text-gray-900 mb-2">Quyết định xét duyệt</h5>
                            <div className="space-y-4">
                              <div>
                                <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700 mb-1">
                                  Lý do từ chối (nếu không chấp nhận)
                                </label>
                                <textarea
                                  id="rejection-reason"
                                  rows={3}
                                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                  placeholder="Nhập lý do từ chối chuyên gia (bắt buộc nếu từ chối)"
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                      onClick={handleApproveVerification}
                      disabled={verifyExpertMutation.isPending}
                    >
                      Chấp nhận và xác minh
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                      onClick={handleRejectVerification}
                      disabled={verifyExpertMutation.isPending}
                    >
                      Từ chối
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
      
      <Transition.Root show={isEditModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setIsEditModalOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div>
                    <div className="mt-3 text-center sm:mt-5">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Chỉnh sửa thông tin chuyên gia
                      </Dialog.Title>
                      
                      <form onSubmit={handleUpdateExpert} className="mt-6 space-y-4 text-left">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                              Họ tên
                            </label>
                            <input
                              type="text"
                              name="name"
                              id="name"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              value={expertForm.name}
                              onChange={handleFormChange}
                              required
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                              Email
                            </label>
                            <input
                              type="email"
                              name="email"
                              id="email"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              value={expertForm.email}
                              onChange={handleFormChange}
                              required
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Số điện thoại
                          </label>
                          <input
                            type="text"
                            name="phone"
                            id="phone"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={expertForm.phone}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="field" className="block text-sm font-medium text-gray-700">
                            Lĩnh vực
                          </label>
                          <select
                            id="field"
                            name="field"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={expertForm.field}
                            onChange={handleFormChange}
                            required
                          >
                            <option value="">Chọn lĩnh vực</option>
                            {EXPERT_FIELDS.map((field, index) => (
                              <option key={index} value={field}>
                                {field}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="expertise" className="block text-sm font-medium text-gray-700">
                            Chuyên ngành cụ thể
                          </label>
                          <textarea
                            id="expertise"
                            name="expertise"
                            rows={2}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={expertForm.expertise}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                            Kinh nghiệm
                          </label>
                          <textarea
                            id="experience"
                            name="experience"
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={expertForm.experience}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                            Giá tư vấn (VNĐ/giờ)
                          </label>
                          <input
                            type="number"
                            name="price"
                            id="price"
                            min="0"
                            step="10000"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={expertForm.price}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                        
                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                          <button
                            type="submit"
                            className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                            disabled={updateExpertMutation.isPending}
                          >
                            {updateExpertMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                          </button>
                          <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                            onClick={() => setIsEditModalOpen(false)}
                          >
                            Hủy
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
      
      <Transition.Root show={isReverificationModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setIsReverificationModalOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div>
                    <div className="mt-3 text-center sm:mt-5">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Yêu cầu xác minh lại giấy tờ
                      </Dialog.Title>
                      
                      {selectedExpert && (
                        <div className="mt-4 text-left">
                          <div className="flex items-center mb-4">
                            <img 
                              src={selectedExpert.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedExpert.name)}&background=random`} 
                              alt={selectedExpert.name} 
                              className="h-16 w-16 rounded-full mr-4"
                            />
                            <div>
                              <h4 className="font-medium text-gray-900">{selectedExpert.name}</h4>
                              <p className="text-gray-500">{selectedExpert.email}</p>
                              <p className="text-gray-500">Lĩnh vực: {selectedExpert.field}</p>
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-200 py-4">
                            <h5 className="font-medium text-gray-900 mb-2">Lý do yêu cầu xác minh lại</h5>
                            <p className="text-sm text-gray-500 mb-3">
                              Chuyên gia sẽ phải tải lên lại tài liệu xác minh. Vui lòng cung cấp lý do cụ thể về việc tại sao cần xác minh lại.
                            </p>
                            <textarea
                              rows={3}
                              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              placeholder="Vui lòng cung cấp lý do cụ thể"
                              value={reverificationReason}
                              onChange={(e) => setReverificationReason(e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                      onClick={handleRequestReverification}
                      disabled={requestReverificationMutation.isPending}
                    >
                      {requestReverificationMutation.isPending ? 'Đang gửi...' : 'Gửi yêu cầu'}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                      onClick={() => setIsReverificationModalOpen(false)}
                    >
                      Hủy
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
      
      <Transition.Root show={isProfileModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setIsProfileModalOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
                  <div className="absolute top-0 right-0 pt-4 pr-4">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() => setIsProfileModalOpen(false)}
                    >
                      <span className="sr-only">Đóng</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  
                  {viewingExpert && (
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                        <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 mb-4 flex items-center">
                          <UserIcon className="h-6 w-6 mr-2 text-blue-500" />
                          Thông tin chi tiết chuyên gia
                        </Dialog.Title>
                        
                        <div className="mt-4 border-b border-gray-200 pb-6">
                          <div className="flex items-center">
                            <img 
                              src={viewingExpert.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewingExpert.name)}&background=random`} 
                              alt={viewingExpert.name}
                              className="h-24 w-24 rounded-full object-cover" 
                            />
                            <div className="ml-6">
                              <h4 className="text-lg font-medium text-gray-900">{viewingExpert.name}</h4>
                              <p className="text-gray-500">{viewingExpert.email}</p>
                              <p className="text-gray-500">{viewingExpert.phone || "Chưa cung cấp số điện thoại"}</p>
                              <div className="mt-2">
                                <VerificationStatusBadge status={viewingExpert.verified} />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                          <div>
                            <h5 className="text-sm font-medium text-gray-500">Lĩnh vực</h5>
                            <p className="mt-1 text-gray-900">{viewingExpert.field || "Chưa cung cấp"}</p>
                          </div>
                          
                          <div>
                            <h5 className="text-sm font-medium text-gray-500">Ngày tham gia</h5>
                            <p className="mt-1 text-gray-900">
                              {viewingExpert.createdAt 
                                ? new Date(viewingExpert.createdAt).toLocaleDateString('vi-VN')
                                : "Không xác định"}
                            </p>
                          </div>
                          
                          <div>
                            <h5 className="text-sm font-medium text-gray-500">Giá tư vấn</h5>
                            <p className="mt-1 text-gray-900">{formatCurrency(viewingExpert.price || 0)}</p>
                          </div>
                          
                          <div>
                            <h5 className="text-sm font-medium text-gray-500">Đánh giá</h5>
                            <p className="mt-1 text-gray-900 flex items-center">
                              <div className="flex mr-1">
                                {renderStars(viewingExpert.rating)}
                              </div>
                              <span>{(parseFloat(viewingExpert.rating) || 0).toFixed(1)} ({viewingExpert.reviewCount || 0} đánh giá)</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <h5 className="text-sm font-medium text-gray-500">Chuyên ngành</h5>
                          <p className="mt-1 text-gray-900 whitespace-pre-wrap">{viewingExpert.expertise || "Chưa cung cấp"}</p>
                        </div>
                        
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-500">Kinh nghiệm</h5>
                          <p className="mt-1 text-gray-900 whitespace-pre-wrap">{viewingExpert.experience || "Chưa cung cấp"}</p>
                        </div>
                        
                        {isLoadingReviews ? (
                          <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                          </div>
                        ) : (
                          <div className="mt-6 border-t border-gray-200 pt-4">
                            <h5 className="text-sm font-medium text-gray-500 mb-3">Đánh giá từ khách hàng</h5>
                            
                            {expertReviews.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-4">Chưa có đánh giá nào</p>
                            ) : (
                              <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                                {expertReviews.map((review) => (
                                  <div key={review._id} className="border border-gray-200 rounded-md p-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <div className="flex mr-2">
                                          {renderSmallStars(review.rating)}
                                        </div>
                                        <span className="text-sm text-gray-600">{review.clientName || 'Khách hàng'}</span>
                                      </div>
                                      <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                    
                                    {review.bookingInfo && (
                                      <div className="mt-2 bg-gray-50 p-2 rounded text-xs text-gray-500">
                                        <div className="flex flex-wrap gap-2">
                                          {review.bookingInfo.date && (
                                            <span>{new Date(review.bookingInfo.date).toLocaleDateString('vi-VN')}</span>
                                          )}
                                          {review.bookingInfo.time && (
                                            <span>{review.bookingInfo.time}</span>
                                          )}
                                          {review.bookingInfo.service && (
                                            <span>{review.bookingInfo.service}</span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    
                                    <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
                                    
                                    {review.reply && (
                                      <div className="mt-2 bg-blue-50 p-2 rounded-md">
                                        <p className="text-xs font-medium text-blue-700">Phản hồi:</p>
                                        <p className="mt-1 text-xs text-gray-700">{review.reply}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {viewingExpert.documents && Object.keys(viewingExpert.documents).length > 0 && (
                          <div className="mt-6 border-t border-gray-200 pt-4">
                            <h5 className="text-sm font-medium text-gray-500 mb-3">Tài liệu xác minh</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {viewingExpert.documents.identification && (
                                <div className="border rounded p-3">
                                  <h6 className="text-xs font-medium mb-2">CMND/CCCD</h6>
                                  <button
                                    onClick={() => handleOpenDocumentPreview(viewingExpert.documents.identification, "CMND/CCCD")}
                                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                                  >
                                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                                    Xem tài liệu
                                  </button>
                                </div>
                              )}
                              
                              {viewingExpert.documents.certification && (
                                <div className="border rounded p-3">
                                  <h6 className="text-xs font-medium mb-2">Bằng cấp/Chứng chỉ</h6>
                                  <button
                                    onClick={() => handleOpenDocumentPreview(viewingExpert.documents.certification, "Bằng cấp/Chứng chỉ")}
                                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                                  >
                                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                                    Xem tài liệu
                                  </button>
                                </div>
                              )}
                              
                              {viewingExpert.documents.experience && (
                                <div className="border rounded p-3">
                                  <h6 className="text-xs font-medium mb-2">Kinh nghiệm</h6>
                                  <button
                                    onClick={() => handleOpenDocumentPreview(viewingExpert.documents.experience, "Kinh nghiệm")}
                                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                                  >
                                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                                    Xem tài liệu
                                  </button>
                                </div>
                              )}
                              
                              {viewingExpert.documents.license && (
                                <div className="border rounded p-3">
                                  <h6 className="text-xs font-medium mb-2">Giấy phép</h6>
                                  <button
                                    onClick={() => handleOpenDocumentPreview(viewingExpert.documents.license, "Giấy phép")}
                                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                                  >
                                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                                    Xem tài liệu
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {viewingExpert.verified === VERIFICATION_STATUS.REJECTED && viewingExpert.verificationComment && (
                          <div className="mt-4 bg-red-50 border border-red-200 p-3 rounded">
                            <h5 className="text-sm font-medium text-red-800">Lý do từ chối xác minh:</h5>
                            <p className="mt-1 text-red-700 text-sm">{viewingExpert.verificationComment}</p>
                          </div>
                        )}
                        
                        {viewingExpert.verified === VERIFICATION_STATUS.VERIFIED && viewingExpert.verificationDate && (
                          <div className="mt-4 bg-green-50 border border-green-200 p-3 rounded">
                            <h5 className="text-sm font-medium text-green-800">Thông tin xác minh:</h5>
                            <p className="mt-1 text-green-700 text-sm">
                              Đã xác minh vào {new Date(viewingExpert.verificationDate).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                    
                  <div className="mt-6 sm:mt-8 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto"
                      onClick={() => setIsProfileModalOpen(false)}
                    >
                      Đóng
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
      
      {!isFetching && expertsToDisplay.length > 0 && (
        <div className="mt-6 text-center">
          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {isFetchingNextPage ? 'Đang tải...' : 'Tải thêm chuyên gia'}
            </button>
          )}
          {!hasNextPage && (
            <p className="text-sm text-gray-500 mt-4">Đã hiển thị tất cả chuyên gia.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminExperts; 