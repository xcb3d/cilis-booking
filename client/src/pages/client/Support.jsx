import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  ChatBubbleLeftRightIcon, 
  QuestionMarkCircleIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  PlusIcon, 
  MinusIcon, 
  CheckCircleIcon,
  ArrowPathIcon,
  BookOpenIcon 
} from '@heroicons/react/24/outline';
import useAuthStore from '../../store/authStore';

// FAQ data
const faqItems = [
  {
    question: 'Làm thế nào để đặt lịch với chuyên gia?',
    answer: 'Để đặt lịch, bạn cần đăng nhập vào tài khoản, sau đó tìm kiếm chuyên gia phù hợp. Khi đã tìm thấy chuyên gia, bạn có thể nhấn vào nút "Đặt lịch ngay" để chọn ngày giờ và hoàn tất đặt lịch.'
  },
  {
    question: 'Làm thế nào để thanh toán cho buổi tư vấn?',
    answer: 'Chúng tôi hỗ trợ thanh toán qua chuyển khoản ngân hàng, ví điện tử, và thẻ tín dụng. Bạn có thể chọn phương thức thanh toán khi tiến hành đặt lịch với chuyên gia.'
  },
  {
    question: 'Tôi có thể hủy lịch hẹn không?',
    answer: 'Có, bạn có thể hủy lịch hẹn trong mục "Lịch hẹn của tôi". Tuy nhiên, việc hủy lịch cần thực hiện ít nhất 24 giờ trước thời gian hẹn để được hoàn tiền đầy đủ.'
  },
  {
    question: 'Làm thế nào để tôi có thể liên lạc với chuyên gia?',
    answer: 'Sau khi đặt lịch thành công, bạn sẽ nhận được thông tin liên lạc của chuyên gia trong email xác nhận. Ngoài ra, bạn cũng có thể trao đổi trực tiếp với chuyên gia trong hệ thống chat của chúng tôi.'
  },
  {
    question: 'Làm thế nào để tìm chuyên gia phù hợp với nhu cầu của tôi?',
    answer: 'Bạn có thể sử dụng tính năng tìm kiếm và bộ lọc trên trang "Tìm chuyên gia" để lọc theo lĩnh vực, giá tiền, đánh giá, và từ khóa cụ thể để tìm chuyên gia phù hợp với nhu cầu của bạn.'
  },
  {
    question: 'Tôi có thể thay đổi thời gian buổi hẹn không?',
    answer: 'Có, bạn có thể yêu cầu thay đổi thời gian buổi hẹn bằng cách liên hệ trực tiếp với chuyên gia hoặc đội ngũ hỗ trợ của chúng tôi. Việc thay đổi cần được thực hiện ít nhất 24 giờ trước thời gian hẹn ban đầu.'
  }
];

const Support = () => {
  const { user } = useAuthStore();
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    reset 
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      subject: '',
      message: ''
    }
  });
  
  const toggleFaq = (index) => {
    if (expandedFaq === index) {
      setExpandedFaq(null);
    } else {
      setExpandedFaq(index);
    }
  };
  
  const onSubmitContactForm = (data) => {
    // In a real app, this would submit to an API
    console.log('Contact form submitted:', data);
    
    // Show success message
    toast.success('Yêu cầu hỗ trợ đã được gửi thành công!');
    setContactSubmitted(true);
    
    // Reset form
    reset();
  };
  
  const resetContactForm = () => {
    setContactSubmitted(false);
    reset({
      name: user?.name || '',
      email: user?.email || '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Trung tâm hỗ trợ</h1>
        <p className="mt-2 text-gray-600">Chúng tôi luôn sẵn sàng giúp đỡ bạn</p>
      </div>
      
      {/* Support options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <PhoneIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="ml-4 text-lg font-medium text-gray-900">Gọi cho chúng tôi</h3>
          </div>
          <p className="text-gray-600 mb-4">Gọi để được tư vấn và trợ giúp ngay lập tức từ đội ngũ hỗ trợ của chúng tôi</p>
          <p className="text-lg font-medium text-gray-900">+84 28 1234 5678</p>
          <p className="text-sm text-gray-500">Thứ 2 - Thứ 6, 8:00 - 17:00</p>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <EnvelopeIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="ml-4 text-lg font-medium text-gray-900">Email hỗ trợ</h3>
          </div>
          <p className="text-gray-600 mb-4">Gửi email cho đội ngũ hỗ trợ của chúng tôi, phản hồi trong vòng 24 giờ</p>
          <p className="text-lg font-medium text-gray-900">support@cilisbooking.com</p>
          <p className="text-sm text-gray-500">Hỗ trợ 24/7</p>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="ml-4 text-lg font-medium text-gray-900">Chat trực tuyến</h3>
          </div>
          <p className="text-gray-600 mb-4">Chat trực tiếp với đội ngũ hỗ trợ để nhận trợ giúp ngay lập tức</p>
          <button className="mt-2 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Bắt đầu chat
          </button>
        </div>
      </div>
      
      {/* FAQs section */}
      <div className="mb-12">
        <div className="flex items-center mb-6">
          <QuestionMarkCircleIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Câu hỏi thường gặp</h2>
        </div>
        
        <div className="bg-white shadow-sm overflow-hidden rounded-md divide-y divide-gray-200">
          {faqItems.map((faq, index) => (
            <div key={index} className="p-4">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex justify-between items-start text-left"
              >
                <span className="text-base font-medium text-gray-900">{faq.question}</span>
                <span className="ml-6 flex-shrink-0">
                  {expandedFaq === index ? (
                    <MinusIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <PlusIcon className="h-5 w-5 text-gray-500" />
                  )}
                </span>
              </button>
              {expandedFaq === index && (
                <div className="mt-2 pr-12">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* User guide section */}
      <div className="mb-12">
        <div className="flex items-center mb-6">
          <BookOpenIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Hướng dẫn sử dụng</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href="#" className="block bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Hướng dẫn đặt lịch</h3>
            <p className="text-gray-600">Chi tiết các bước để đặt lịch hẹn với chuyên gia</p>
          </a>
          
          <a href="#" className="block bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Cách thức thanh toán</h3>
            <p className="text-gray-600">Thông tin về các phương thức thanh toán được hỗ trợ</p>
          </a>
          
          <a href="#" className="block bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chính sách hoàn tiền</h3>
            <p className="text-gray-600">Tìm hiểu về chính sách hoàn tiền của chúng tôi</p>
          </a>
        </div>
      </div>
      
      {/* Contact form */}
      <div>
        <div className="flex items-center mb-6">
          <EnvelopeIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Liên hệ với chúng tôi</h2>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {contactSubmitted ? (
            <div className="p-8 text-center">
              <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Yêu cầu hỗ trợ đã được gửi!</h3>
              <p className="text-gray-600 mb-6">
                Chúng tôi đã nhận được yêu cầu hỗ trợ của bạn và sẽ phản hồi trong thời gian sớm nhất.
              </p>
              <button
                onClick={resetContactForm}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Gửi yêu cầu mới
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmitContactForm)} className="p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Họ và tên
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="name"
                      {...register('name', { required: 'Vui lòng nhập họ và tên' })}
                      className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      id="email"
                      {...register('email', { 
                        required: 'Vui lòng nhập email',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Email không hợp lệ'
                        }
                      })}
                      className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                    Tiêu đề
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="subject"
                      {...register('subject', { required: 'Vui lòng nhập tiêu đề' })}
                      className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.subject && (
                      <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Nội dung
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="message"
                      rows={4}
                      {...register('message', { required: 'Vui lòng nhập nội dung' })}
                      className="block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md"
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Gửi yêu cầu hỗ trợ
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Support; 