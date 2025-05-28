import { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import {
  UserIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import useAuthStore from '../../store/authStore';
import { VERIFICATION_STATUS } from '../../utils/constants';
import UpdateExpertInfoForm from '../../components/expert/UpdateExpertInfoForm';
import VerificationDocuments from '../../components/expert/VerificationDocuments';
import { useMutation } from '@tanstack/react-query';
import axiosClient from '../../utils/axiosClient';
import { toast } from 'react-hot-toast';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const ExpertProfile = () => {
  const { user } = useAuthStore();
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  
  // Kiểm tra trạng thái xác minh của chuyên gia để quyết định tab nào hiển thị
  useEffect(() => {
    if (user?.verified === VERIFICATION_STATUS.UNVERIFIED || 
        user?.verified === VERIFICATION_STATUS.REJECTED) {
      // Nếu chưa xác minh hoặc bị từ chối, hiển thị tab xác minh
      setSelectedTabIndex(1);
    }
  }, [user?.verified]);
  
  // Mutation để xem lại lần xác minh bị từ chối
  const resubmitVerificationMutation = useMutation({
    mutationFn: async () => {
      return await axiosClient.post('/experts/resubmit-verification');
    },
    onSuccess: () => {
      toast.success('Đã gửi lại yêu cầu xác minh');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi khi gửi lại yêu cầu xác minh');
    }
  });

  const tabs = [
    { name: 'Thông tin tư vấn', icon: UserIcon },
    { name: 'Thông tin cá nhân', icon: DocumentTextIcon }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Hồ sơ chuyên gia</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Tab.Group selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
          <Tab.List className="flex bg-gray-50 p-1 border-b border-gray-200">
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                className={({ selected }) =>
                  classNames(
                    'w-full py-3 px-4 text-sm leading-5 font-medium flex items-center justify-center',
                    'focus:outline-none transition-all duration-200',
                    selected
                      ? 'text-blue-700 border-blue-700 border-b-2'
                      : 'text-gray-500 hover:text-gray-700'
                  )
                }
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </Tab>
            ))}
          </Tab.List>
          
          <Tab.Panels className="p-4">
            {/* Tab thông tin tư vấn */}
            <Tab.Panel>
              <UpdateExpertInfoForm />
            </Tab.Panel>
            
            {/* Tab thông tin cá nhân */}
            <Tab.Panel>
              <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Thông tin cá nhân</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="h-16 w-16 flex-shrink-0">
                      <img 
                        className="h-16 w-16 rounded-full" 
                        src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}&background=random`} 
                        alt={user?.name || 'Avatar'} 
                      />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{user?.name || 'Chưa có tên'}</h3>
                      <p className="text-sm text-gray-500">{user?.email || 'Chưa có email'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-200 pt-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Số điện thoại</p>
                      <p className="mt-1 text-sm text-gray-900">{user?.phone || 'Chưa có số điện thoại'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Ngày tham gia</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {user?.createdAt 
                          ? new Date(user.createdAt).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) 
                          : 'Không xác định'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <ArrowPathIcon className="h-4 w-4 mr-2" />
                      Cập nhật thông tin cá nhân
                    </button>
                  </div>
                </div>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default ExpertProfile; 