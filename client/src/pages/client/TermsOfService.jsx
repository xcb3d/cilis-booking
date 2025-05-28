import { DocumentTextIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center">
        <Link to="/client/home" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          <span>Quay lại trang chủ</span>
        </Link>
      </div>
      
      <div className="mb-8 text-center">
        <DocumentTextIcon className="h-12 w-12 mx-auto text-blue-600" />
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Điều khoản dịch vụ</h1>
        <p className="mt-2 text-gray-600">Cập nhật lần cuối: 01/11/2023</p>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Vui lòng đọc kỹ điều khoản sử dụng</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Việc sử dụng dịch vụ của chúng tôi đồng nghĩa với việc bạn đã đồng ý với các điều khoản dưới đây.</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6 prose prose-blue max-w-none">
          <h3>1. Giới thiệu</h3>
          <p>
            Chào mừng bạn đến với nền tảng đặt lịch tư vấn trực tuyến Cilis Booking. Những điều khoản dưới đây sẽ điều chỉnh việc sử dụng nền tảng của chúng tôi, bao gồm tất cả các tính năng và dịch vụ được cung cấp.
          </p>
          <p>
            Bằng việc truy cập hoặc sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản này. Nếu bạn không đồng ý với bất kỳ phần nào của điều khoản, vui lòng không sử dụng dịch vụ của chúng tôi.
          </p>
          
          <h3>2. Định nghĩa</h3>
          <ul>
            <li><strong>"Nền tảng"</strong> đề cập đến website và ứng dụng di động Cilis Booking.</li>
            <li><strong>"Dịch vụ"</strong> đề cập đến các dịch vụ được cung cấp thông qua nền tảng, bao gồm đặt lịch tư vấn với chuyên gia.</li>
            <li><strong>"Người dùng"</strong> đề cập đến bất kỳ cá nhân hoặc tổ chức nào sử dụng nền tảng.</li>
            <li><strong>"Chuyên gia"</strong> đề cập đến những người cung cấp dịch vụ tư vấn trên nền tảng.</li>
            <li><strong>"Buổi tư vấn"</strong> đề cập đến các phiên tư vấn được đặt lịch và diễn ra giữa người dùng và chuyên gia.</li>
          </ul>
          
          <h3>3. Đăng ký tài khoản</h3>
          <p>
            Để sử dụng đầy đủ các tính năng của nền tảng, bạn cần đăng ký tài khoản. Khi đăng ký, bạn đồng ý cung cấp thông tin chính xác, đầy đủ và cập nhật. Việc duy trì tính bảo mật của tài khoản, bao gồm mật khẩu, là trách nhiệm của bạn.
          </p>
          <p>
            Bạn phải thông báo cho chúng tôi ngay lập tức về bất kỳ hành vi sử dụng trái phép tài khoản của bạn. Chúng tôi không chịu trách nhiệm cho bất kỳ tổn thất hoặc thiệt hại nào phát sinh từ việc bạn không tuân thủ yêu cầu này.
          </p>
          
          <h3>4. Quy trình đặt lịch và thanh toán</h3>
          <p>
            Nền tảng cho phép bạn tìm kiếm và đặt lịch với các chuyên gia. Khi đặt lịch, bạn cam kết tham gia buổi tư vấn vào thời gian đã chọn.
          </p>
          <p>
            <strong>Quy trình thanh toán:</strong> Chúng tôi cung cấp nhiều phương thức thanh toán khác nhau. Thanh toán có thể được yêu cầu tại thời điểm đặt lịch hoặc sau buổi tư vấn, tùy thuộc vào loại dịch vụ.
          </p>
          <p>
            <strong>Chính sách hủy:</strong> Nếu cần hủy buổi tư vấn, bạn phải thông báo ít nhất 24 giờ trước thời gian hẹn để được hoàn tiền đầy đủ. Hủy muộn hơn có thể dẫn đến phí hủy lịch.
          </p>
          
          <h3>5. Trách nhiệm của người dùng</h3>
          <p>
            Khi sử dụng nền tảng, bạn đồng ý:
          </p>
          <ul>
            <li>Cung cấp thông tin chính xác và đầy đủ.</li>
            <li>Tuân thủ tất cả các luật và quy định hiện hành.</li>
            <li>Không thực hiện các hành vi có thể gây hại cho nền tảng hoặc người dùng khác.</li>
            <li>Đến đúng giờ cho các buổi tư vấn đã đặt lịch.</li>
            <li>Thanh toán đầy đủ cho các dịch vụ sử dụng.</li>
            <li>Tôn trọng bản quyền và quyền sở hữu trí tuệ của chúng tôi và của người khác.</li>
          </ul>
          
          <h3>6. Trách nhiệm của chuyên gia</h3>
          <p>
            Chuyên gia trên nền tảng của chúng tôi đồng ý:
          </p>
          <ul>
            <li>Cung cấp thông tin chính xác về trình độ, kinh nghiệm và chuyên môn của họ.</li>
            <li>Duy trì tính chuyên nghiệp và đạo đức trong tất cả các tương tác với người dùng.</li>
            <li>Tham gia đúng giờ cho các buổi tư vấn đã đặt lịch.</li>
            <li>Cung cấp dịch vụ với chất lượng cao và phù hợp với mô tả.</li>
            <li>Bảo mật thông tin của người dùng.</li>
          </ul>
          
          <h3>7. Chính sách bảo mật</h3>
          <p>
            Việc sử dụng dịch vụ của chúng tôi cũng tuân theo Chính sách Bảo mật, trong đó giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn. Bằng việc sử dụng dịch vụ của chúng tôi, bạn đồng ý với việc thu thập và sử dụng thông tin như được mô tả trong Chính sách Bảo mật.
          </p>
          
          <h3>8. Giới hạn trách nhiệm</h3>
          <p>
            Nền tảng và dịch vụ của chúng tôi được cung cấp "nguyên trạng" và "như có sẵn". Chúng tôi không đảm bảo rằng dịch vụ sẽ không bị gián đoạn, không có lỗi, hoặc hoàn toàn an toàn.
          </p>
          <p>
            Trong phạm vi tối đa được pháp luật cho phép, chúng tôi từ chối tất cả các bảo đảm, bao gồm nhưng không giới hạn ở các bảo đảm về tính thương mại, sự phù hợp cho một mục đích cụ thể, và không vi phạm.
          </p>
          <p>
            Chúng tôi không chịu trách nhiệm cho bất kỳ thiệt hại gián tiếp, ngẫu nhiên, đặc biệt, hậu quả hoặc trừng phạt nào phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ của chúng tôi.
          </p>
          
          <h3>9. Chấm dứt</h3>
          <p>
            Chúng tôi có quyền chấm dứt hoặc tạm ngừng tài khoản của bạn và quyền truy cập vào dịch vụ của chúng tôi bất kỳ lúc nào, vì bất kỳ lý do gì, bao gồm nhưng không giới hạn ở việc vi phạm các Điều khoản này.
          </p>
          
          <h3>10. Thay đổi điều khoản</h3>
          <p>
            Chúng tôi có thể sửa đổi các Điều khoản này vào bất kỳ lúc nào. Những thay đổi sẽ có hiệu lực ngay sau khi được đăng trên nền tảng. Việc bạn tiếp tục sử dụng dịch vụ sau khi các thay đổi được đăng đồng nghĩa với việc bạn chấp nhận các điều khoản mới.
          </p>
          
          <h3>11. Liên hệ</h3>
          <p>
            Nếu bạn có bất kỳ câu hỏi nào về các Điều khoản này, vui lòng liên hệ với chúng tôi tại:
          </p>
          <p>
            <strong>Email:</strong> legal@cilisbooking.com<br />
            <strong>Địa chỉ:</strong> 123 Đường Nguyễn Huệ, Quận 1, TP Hồ Chí Minh, Việt Nam<br />
            <strong>Điện thoại:</strong> (+84) 28 1234 5678
          </p>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          © 2023 Cilis Booking. Tất cả các quyền được bảo lưu.
        </p>
      </div>
    </div>
  );
};

export default TermsOfService; 