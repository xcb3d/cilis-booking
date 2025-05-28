import { useState, Fragment } from 'react';
import { 
  UserIcon, 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon,
  UserPlusIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { ROLES } from '../../utils/constants';
import { toast } from 'react-hot-toast';
import axiosClient from '../../utils/axiosClient';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ITEMS_PER_PAGE = 15; // Hoặc một giá trị bạn muốn

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // State cho modal xem profile đầy đủ
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  
  // Sử dụng useInfiniteQuery thay cho useQuery
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['adminUsers', searchQuery, roleFilter], // queryKey vẫn giữ nguyên
    queryFn: async ({ pageParam }) => { // pageParam ở đây sẽ là cursor
      const params = {
        search: searchQuery || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
        limit: ITEMS_PER_PAGE,
        cursor: pageParam, // Gửi cursor (pageParam) lên API
      };
      const response = await axiosClient.get('/admin/users', { params });
      return response; // API nên trả về { users: [], nextCursor: "..." }
                       // Hoặc { data: { users: [], nextCursor: "..." } } tùy axiosClient
    },
    initialPageParam: undefined, // Cursor ban đầu là undefined (cho trang đầu tiên)
    // eslint-disable-next-line no-unused-vars
    getNextPageParam: (lastPage, allPages) => {
      // lastPage là response từ queryFn của trang cuối cùng
      // Kiểm tra cấu trúc của lastPage.data nếu axiosClient không tự động unwrap
      const lastPageData = lastPage?.data || lastPage; 
      return lastPageData?.nextCursor || undefined; // Trả về nextCursor để làm pageParam cho lần fetch tiếp theo
    },
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      return await axiosClient.delete(`/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast.success('Đã xóa người dùng thành công');
      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa người dùng');
    }
  });
  
  // Handle user deletion
  const handleDeleteUser = (userId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này không?')) {
      deleteUserMutation.mutate(userId);
    }
  };
  
  // Handle opening profile modal
  const handleOpenProfileModal = (user) => {
    setViewingUser(user);
    setIsProfileModalOpen(true);
  };
  
  // Lấy danh sách users từ data.pages của useInfiniteQuery
  const usersFromApi = data?.pages.reduce((acc, page) => {
    const pageData = page?.data || page; // Xử lý nếu axiosClient không unwrap data
    return acc.concat(pageData?.users || []);
  }, []) || [];

  // Apply filters
  const filteredUsers = usersFromApi.filter(user => {
    // Search filter ở client (có thể bỏ nếu search server đã đủ tốt)
    const matchesSearch = searchQuery === '' || 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply role filter
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });
  
  // Get role badge color and text
  const getRoleBadge = (role) => {
    switch(role) {
      case ROLES.ADMIN:
        return { color: 'bg-purple-100 text-purple-800', text: 'Admin' };
      case ROLES.EXPERT:
        return { color: 'bg-blue-100 text-blue-800', text: 'Chuyên gia' };
      case ROLES.CLIENT:
        return { color: 'bg-green-100 text-green-800', text: 'Khách hàng' };
      default:
        return { color: 'bg-gray-100 text-gray-800', text: role };
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <h2 className="text-lg font-medium text-red-800 mb-2">Đã xảy ra lỗi</h2>
        <p className="text-red-700">{error.message || 'Không thể tải dữ liệu người dùng. Vui lòng thử lại sau.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tổng số: {filteredUsers.length} người dùng
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
            Thêm người dùng
          </button>
        </div>
      </div>
      
      {/* Search and filters */}
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="mb-4">
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700">
                Vai trò
              </label>
              <select
                id="role-filter"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">Tất cả vai trò</option>
                <option value={ROLES.ADMIN}>Admin</option>
                <option value={ROLES.EXPERT}>Chuyên gia</option>
                <option value={ROLES.CLIENT}>Khách hàng</option>
              </select>
            </div>
            <div className="sm:col-span-3 flex items-end">
              <button
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                }}
              >
                Đặt lại bộ lọc
              </button>
            </div>
          </div>
        )}
        
        {/* Users table */}
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Tên
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Email
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Vai trò
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
                    {filteredUsers.map((user) => {
                      const roleBadge = getRoleBadge(user.role);
                      return (
                        <tr key={user._id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                <img 
                                  className="h-10 w-10 rounded-full" 
                                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
                                  alt="" 
                                />
                              </div>
                              <div className="ml-4">
                                <div className="font-medium text-gray-900">{user.name}</div>
                                {user.phone && (
                                  <div className="text-gray-500">{user.phone}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div className="text-gray-900">{user.email}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${roleBadge.color}`}>
                              {roleBadge.text}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                              Hoạt động
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              className="text-green-600 hover:text-green-900 mr-4"
                              onClick={() => handleOpenProfileModal(user)}
                            >
                              <UserIcon className="h-5 w-5" />
                              <span className="sr-only">Xem profile</span>
                            </button>
                            <button
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              <PencilIcon className="h-5 w-5" />
                              <span className="sr-only">Chỉnh sửa</span>
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleDeleteUser(user._id)}
                              disabled={deleteUserMutation.isPending}
                            >
                              <TrashIcon className="h-5 w-5" />
                              <span className="sr-only">Xóa</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        {/* Empty state */}
        {filteredUsers.length === 0 && !isLoading && !isFetchingNextPage && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy người dùng</h3>
            <p className="mt-1 text-sm text-gray-500">Không có người dùng nào khớp với bộ lọc đã chọn.</p>
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                }}
              >
                Đặt lại bộ lọc
              </button>
            </div>
          </div>
        )}

        {/* Load More Button */}
        {hasNextPage && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isFetchingNextPage ? 'Đang tải...' : 'Tải thêm'}
            </button>
          </div>
        )}
      </div>
      
      {/* User Profile Modal */}
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
                  
                  {viewingUser && (
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                        <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 mb-4 flex items-center">
                          <UserIcon className="h-6 w-6 mr-2 text-blue-500" />
                          Thông tin chi tiết người dùng
                        </Dialog.Title>
                        
                        <div className="mt-4 border-b border-gray-200 pb-6">
                          <div className="flex items-center">
                            <img 
                              src={viewingUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewingUser.name)}&background=random`} 
                              alt={viewingUser.name}
                              className="h-24 w-24 rounded-full object-cover" 
                            />
                            <div className="ml-6">
                              <h4 className="text-lg font-medium text-gray-900">{viewingUser.name}</h4>
                              <div className="mt-1 flex items-center text-gray-500">
                                <EnvelopeIcon className="h-5 w-5 mr-2" />
                                {viewingUser.email}
                              </div>
                              {viewingUser.phone && (
                                <div className="mt-1 flex items-center text-gray-500">
                                  <PhoneIcon className="h-5 w-5 mr-2" />
                                  {viewingUser.phone}
                                </div>
                              )}
                              <div className="mt-2">
                                {(() => {
                                  const roleBadge = getRoleBadge(viewingUser.role);
                                  return (
                                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${roleBadge.color}`}>
                                      {roleBadge.text}
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                          <div>
                            <h5 className="text-sm font-medium text-gray-500">Trạng thái</h5>
                            <p className="mt-1 text-gray-900 flex items-center">
                              <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                                Hoạt động
                              </span>
                            </p>
                          </div>
                          
                          <div>
                            <h5 className="text-sm font-medium text-gray-500">Ngày tham gia</h5>
                            <p className="mt-1 text-gray-900 flex items-center">
                              <CalendarIcon className="h-5 w-5 mr-1 text-gray-400" />
                              <span>
                                {viewingUser.createdAt 
                                  ? new Date(viewingUser.createdAt).toLocaleDateString('vi-VN')
                                  : "Không xác định"}
                              </span>
                            </p>
                          </div>
                        </div>
                        
                        {/* Thông tin dựa vào role */}
                        {viewingUser.role === ROLES.EXPERT && (
                          <div className="mt-6 space-y-4">
                            <div className="border-t border-gray-200 pt-4">
                              <h5 className="text-lg font-medium text-gray-800">Thông tin chuyên gia</h5>
                              
                              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div>
                                  <h5 className="text-sm font-medium text-gray-500">Lĩnh vực</h5>
                                  <p className="mt-1 text-gray-900">{viewingUser.field || "Chưa cung cấp"}</p>
                                </div>
                                
                                <div>
                                  <h5 className="text-sm font-medium text-gray-500">Giá tư vấn</h5>
                                  <p className="mt-1 text-gray-900">
                                    {viewingUser.price 
                                      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(viewingUser.price)
                                      : "Chưa cung cấp"}
                                  </p>
                                </div>
                                
                                <div>
                                  <h5 className="text-sm font-medium text-gray-500">Trạng thái xác minh</h5>
                                  <p className="mt-1 text-gray-900">
                                    {viewingUser.verified === "verified" && (
                                      <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                                        Đã xác minh
                                      </span>
                                    )}
                                    {viewingUser.verified === "pending" && (
                                      <span className="inline-flex rounded-full bg-yellow-100 px-2 text-xs font-semibold leading-5 text-yellow-800">
                                        Đang chờ xác minh
                                      </span>
                                    )}
                                    {viewingUser.verified === "rejected" && (
                                      <span className="inline-flex rounded-full bg-red-100 px-2 text-xs font-semibold leading-5 text-red-800">
                                        Đã từ chối xác minh
                                      </span>
                                    )}
                                    {(!viewingUser.verified || viewingUser.verified === "unverified") && (
                                      <span className="inline-flex rounded-full bg-gray-100 px-2 text-xs font-semibold leading-5 text-gray-800">
                                        Chưa xác minh
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="mt-4">
                                <h5 className="text-sm font-medium text-gray-500">Chuyên ngành</h5>
                                <p className="mt-1 text-gray-900 whitespace-pre-wrap">{viewingUser.expertise || "Chưa cung cấp"}</p>
                              </div>
                              
                              <div className="mt-4">
                                <h5 className="text-sm font-medium text-gray-500">Kinh nghiệm</h5>
                                <p className="mt-1 text-gray-900 whitespace-pre-wrap">{viewingUser.experience || "Chưa cung cấp"}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {viewingUser.role === ROLES.CLIENT && (
                          <div className="mt-6 space-y-4">
                            <div className="border-t border-gray-200 pt-4">
                              <h5 className="text-lg font-medium text-gray-800">Thông tin khách hàng</h5>
                              
                              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div>
                                  <h5 className="text-sm font-medium text-gray-500">Số lần đặt lịch</h5>
                                  <p className="mt-1 text-gray-900">{viewingUser.bookingCount || 0}</p>
                                </div>
                                
                                <div>
                                  <h5 className="text-sm font-medium text-gray-500">Tổng chi tiêu</h5>
                                  <p className="mt-1 text-gray-900">
                                    {viewingUser.totalSpent 
                                      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(viewingUser.totalSpent)
                                      : "0 ₫"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                    
                  <div className="mt-6 sm:mt-8 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
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
    </div>
  );
};

export default AdminUsers; 