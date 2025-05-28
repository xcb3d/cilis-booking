import { useState, useEffect } from 'react';
import { EXPERT_FIELDS } from '../../utils/constants';
import { toast } from 'react-hot-toast';
import axiosClient from '../../utils/axiosClient';
import useAuthStore from '../../store/authStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const UpdateExpertInfoForm = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    field: '',
    expertise: '',
    experience: '',
    price: ''
  });

  useEffect(() => {
    // Khởi tạo form với dữ liệu chuyên gia hiện tại
    if (user) {
      setFormData({
        field: user.field || '',
        expertise: user.expertise || '',
        experience: user.experience || '',
        price: user.price ? String(user.price) : ''
      });
    }
  }, [user]);

  // Mutation cập nhật thông tin chuyên gia
  const updateExpertMutation = useMutation({
    mutationFn: async (data) => {
      return await axiosClient.post('/experts/update-info', data);
    },
    onSuccess: (data) => {
      toast.success('Cập nhật thông tin chuyên gia thành công');
      
      // Cập nhật thông tin người dùng trong state toàn cục
      const updateUser = useAuthStore.getState().updateUserData;
      updateUser({
        ...user,
        ...data.user
      });
      
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ queryKey: ['expertDashboard'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật thông tin');
    },
    onSettled: () => {
      setLoading(false);
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate form data
      if (!formData.field || !formData.expertise || !formData.experience || !formData.price) {
        toast.error('Vui lòng điền đầy đủ thông tin');
        setLoading(false);
        return;
      }
      
      // Validate price
      const price = Number(formData.price);
      if (isNaN(price) || price <= 0) {
        toast.error('Giá tư vấn phải là số dương');
        setLoading(false);
        return;
      }
      
      // Gọi API cập nhật thông tin
      await updateExpertMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Update expert info error:', error);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Cập nhật thông tin chuyên gia</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Field selection */}
        <div>
          <label htmlFor="field" className="block text-sm font-medium text-gray-700 mb-1">
            Lĩnh vực chuyên môn <span className="text-red-500">*</span>
          </label>
          <select
            id="field"
            name="field"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={formData.field}
            onChange={handleChange}
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
        
        {/* Expertise */}
        <div>
          <label htmlFor="expertise" className="block text-sm font-medium text-gray-700 mb-1">
            Chuyên ngành cụ thể <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="expertise"
            name="expertise"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="VD: Tư vấn tài chính cá nhân, Luật sư hình sự..."
            value={formData.expertise}
            onChange={handleChange}
            required
          />
        </div>
        
        {/* Experience */}
        <div>
          <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
            Kinh nghiệm <span className="text-red-500">*</span>
          </label>
          <textarea
            id="experience"
            name="experience"
            rows={3}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Mô tả kinh nghiệm làm việc của bạn"
            value={formData.experience}
            onChange={handleChange}
            required
          />
        </div>
        
        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Giá tư vấn (VNĐ/giờ) <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="number"
              id="price"
              name="price"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
              placeholder="0"
              value={formData.price}
              onChange={handleChange}
              required
              min="1000"
              step="1000"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">VNĐ</span>
            </div>
          </div>
        </div>
        
        {/* Submit button */}
        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="mr-2">Đang cập nhật...</span>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </>
            ) : 'Cập nhật thông tin'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateExpertInfoForm; 