import { ShieldCheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center">
        <Link to="/client/home" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          <span>Quay lại trang chủ</span>
        </Link>
      </div>
      
      <div className="mb-8 text-center">
        <ShieldCheckIcon className="h-12 w-12 mx-auto text-blue-600" />
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Chính sách bảo mật</h1>
        <p className="mt-2 text-gray-600">Cập nhật lần cuối: 01/11/2023</p>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Cam kết bảo vệ thông tin của bạn</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Tại Cilis Booking, chúng tôi coi trọng sự tin tưởng mà bạn dành cho chúng tôi và cam kết bảo vệ thông tin cá nhân của bạn.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6 prose prose-blue max-w-none">
          <h3>1. Giới thiệu</h3>
          <p>
            Chính sách bảo mật này mô tả cách Cilis Booking thu thập, sử dụng, bảo vệ và chia sẻ thông tin cá nhân của bạn khi bạn sử dụng nền tảng của chúng tôi. Chúng tôi cam kết bảo vệ quyền riêng tư của bạn và chỉ xử lý dữ liệu cá nhân của bạn theo quy định của pháp luật hiện hành về bảo vệ dữ liệu và quyền riêng tư.
          </p>
          
          <h3>2. Thông tin chúng tôi thu thập</h3>
          <p>
            Chúng tôi có thể thu thập các loại thông tin sau đây:
          </p>
          <ul>
            <li>
              <strong>Thông tin cá nhân:</strong> Họ tên, địa chỉ email, số điện thoại, và thông tin liên hệ khác mà bạn cung cấp khi đăng ký tài khoản.
            </li>
            <li>
              <strong>Thông tin hồ sơ:</strong> Thông tin về trình độ học vấn, kinh nghiệm làm việc, chuyên môn (đối với chuyên gia).
            </li>
            <li>
              <strong>Thông tin giao dịch:</strong> Chi tiết về các buổi tư vấn bạn đã đặt, lịch sử thanh toán và thông tin tài khoản ngân hàng (nếu có).
            </li>
            <li>
              <strong>Dữ liệu kỹ thuật:</strong> Địa chỉ IP, loại và phiên bản trình duyệt, múi giờ và vị trí, loại và phiên bản hệ điều hành, và các thông tin về thiết bị bạn sử dụng để truy cập nền tảng.
            </li>
            <li>
              <strong>Dữ liệu sử dụng:</strong> Thông tin về cách bạn sử dụng nền tảng, bao gồm thời gian truy cập, trang bạn đã xem, thời gian phản hồi trang, lỗi tải trang, và cách bạn rời khỏi trang.
            </li>
          </ul>
          
          <h3>3. Cách chúng tôi thu thập thông tin</h3>
          <p>
            Chúng tôi thu thập thông tin từ các nguồn sau:
          </p>
          <ul>
            <li>
              <strong>Thông tin trực tiếp:</strong> Thông tin bạn cung cấp khi đăng ký tài khoản, hoàn thành biểu mẫu, hoặc liên hệ với chúng tôi.
            </li>
            <li>
              <strong>Thông tin tự động:</strong> Khi bạn tương tác với nền tảng của chúng tôi, chúng tôi tự động thu thập dữ liệu kỹ thuật về thiết bị và hành vi duyệt web của bạn. Chúng tôi thu thập dữ liệu này thông qua cookie, nhật ký máy chủ và các công nghệ tương tự khác.
            </li>
            <li>
              <strong>Bên thứ ba:</strong> Chúng tôi có thể nhận thông tin về bạn từ các bên thứ ba và nguồn công khai, bao gồm đối tác kinh doanh, nhà cung cấp dịch vụ thanh toán, và dịch vụ phân tích.
            </li>
          </ul>
          
          <h3>4. Mục đích sử dụng thông tin</h3>
          <p>
            Chúng tôi sử dụng thông tin cá nhân của bạn cho các mục đích sau:
          </p>
          <ul>
            <li>Tạo và quản lý tài khoản của bạn.</li>
            <li>Xử lý đơn đặt lịch tư vấn và thanh toán.</li>
            <li>Cung cấp các dịch vụ bạn yêu cầu.</li>
            <li>Gửi thông báo về các thay đổi đối với dịch vụ của chúng tôi.</li>
            <li>Cải thiện nền tảng và trải nghiệm người dùng.</li>
            <li>Phân tích cách khách hàng sử dụng nền tảng để chúng tôi có thể cải thiện dịch vụ.</li>
            <li>Đề xuất các dịch vụ có thể quan tâm dựa trên lịch sử sử dụng.</li>
            <li>Tuân thủ nghĩa vụ pháp lý và quy định hiện hành.</li>
          </ul>
          
          <h3>5. Cơ sở pháp lý cho việc xử lý thông tin</h3>
          <p>
            Chúng tôi chỉ xử lý thông tin cá nhân của bạn khi chúng tôi có cơ sở pháp lý để làm như vậy. Cơ sở pháp lý bao gồm:
          </p>
          <ul>
            <li>
              <strong>Thực hiện hợp đồng:</strong> Xử lý dữ liệu cần thiết để thực hiện hợp đồng với bạn hoặc thực hiện các bước theo yêu cầu của bạn trước khi ký kết hợp đồng.
            </li>
            <li>
              <strong>Lợi ích hợp pháp:</strong> Xử lý dữ liệu cần thiết cho lợi ích hợp pháp của chúng tôi hoặc của bên thứ ba, trừ khi lợi ích hoặc quyền và tự do cơ bản của bạn quan trọng hơn.
            </li>
            <li>
              <strong>Tuân thủ nghĩa vụ pháp lý:</strong> Xử lý dữ liệu cần thiết để tuân thủ nghĩa vụ pháp lý mà chúng tôi phải tuân theo.
            </li>
            <li>
              <strong>Sự đồng ý:</strong> Bạn đã đồng ý cho chúng tôi xử lý dữ liệu cá nhân của bạn cho một mục đích cụ thể.
            </li>
          </ul>
          
          <h3>6. Chia sẻ thông tin</h3>
          <p>
            Chúng tôi có thể chia sẻ thông tin cá nhân của bạn với:
          </p>
          <ul>
            <li>
              <strong>Chuyên gia:</strong> Khi bạn đặt lịch với chuyên gia, chúng tôi chia sẻ thông tin cần thiết để tổ chức buổi tư vấn.
            </li>
            <li>
              <strong>Nhà cung cấp dịch vụ:</strong> Chúng tôi chia sẻ dữ liệu với các nhà cung cấp dịch vụ thứ ba giúp chúng tôi vận hành nền tảng, chẳng hạn như nhà cung cấp dịch vụ thanh toán, nhà cung cấp dịch vụ lưu trữ, và nhà cung cấp dịch vụ phân tích.
            </li>
            <li>
              <strong>Cơ quan quản lý:</strong> Chúng tôi có thể chia sẻ dữ liệu với cơ quan quản lý và cơ quan thực thi pháp luật khác khi cần thiết để tuân thủ nghĩa vụ pháp lý.
            </li>
            <li>
              <strong>Đối tác kinh doanh:</strong> Chúng tôi có thể chia sẻ dữ liệu với đối tác kinh doanh trong trường hợp sáp nhập, mua lại, hoặc chuyển nhượng tài sản.
            </li>
          </ul>
          <p>
            Chúng tôi yêu cầu tất cả các bên thứ ba tôn trọng tính bảo mật và an toàn của dữ liệu cá nhân của bạn và xử lý nó theo pháp luật hiện hành.
          </p>
          
          <h3>7. Bảo mật dữ liệu</h3>
          <p>
            Chúng tôi đã triển khai các biện pháp bảo mật phù hợp để ngăn chặn dữ liệu cá nhân của bạn bị mất, sử dụng hoặc truy cập trái phép, thay đổi hoặc tiết lộ. Ngoài ra, chúng tôi giới hạn quyền truy cập vào dữ liệu cá nhân của bạn cho nhân viên, đại lý, nhà thầu và các bên thứ ba khác theo nguyên tắc cần biết.
          </p>
          <p>
            Tuy nhiên, truyền thông tin qua internet không hoàn toàn an toàn. Mặc dù chúng tôi sẽ cố gắng hết sức để bảo vệ dữ liệu cá nhân của bạn, chúng tôi không thể đảm bảo an toàn cho dữ liệu của bạn được truyền đến nền tảng của chúng tôi; mọi quá trình truyền đều có rủi ro riêng.
          </p>
          
          <h3>8. Lưu trữ dữ liệu</h3>
          <p>
            Chúng tôi sẽ chỉ lưu giữ dữ liệu cá nhân của bạn trong thời gian cần thiết để đáp ứng các mục đích mà chúng tôi đã thu thập, bao gồm để đáp ứng bất kỳ yêu cầu pháp lý, kế toán hoặc báo cáo nào.
          </p>
          <p>
            Để xác định thời gian lưu trữ dữ liệu thích hợp, chúng tôi xem xét số lượng, bản chất và mức độ nhạy cảm của dữ liệu cá nhân, nguy cơ gây hại từ việc sử dụng hoặc tiết lộ trái phép dữ liệu cá nhân của bạn, các mục đích mà chúng tôi xử lý dữ liệu cá nhân của bạn và liệu chúng tôi có thể đạt được những mục đích đó thông qua các phương tiện khác, và các yêu cầu pháp lý hiện hành.
          </p>
          
          <h3>9. Quyền của bạn</h3>
          <p>
            Tùy thuộc vào luật pháp hiện hành, bạn có thể có các quyền sau liên quan đến dữ liệu cá nhân của mình:
          </p>
          <ul>
            <li>Quyền truy cập dữ liệu cá nhân của bạn.</li>
            <li>Quyền yêu cầu sửa đổi dữ liệu cá nhân không chính xác.</li>
            <li>Quyền yêu cầu xóa dữ liệu cá nhân của bạn.</li>
            <li>Quyền phản đối hoặc hạn chế việc xử lý dữ liệu cá nhân của bạn.</li>
            <li>Quyền yêu cầu chuyển dữ liệu cá nhân của bạn.</li>
            <li>Quyền rút lại sự đồng ý đối với việc xử lý dữ liệu dựa trên sự đồng ý.</li>
            <li>Quyền khiếu nại với cơ quan bảo vệ dữ liệu.</li>
          </ul>
          <p>
            Để thực hiện bất kỳ quyền nào trong số này, vui lòng liên hệ với chúng tôi theo thông tin liên hệ được cung cấp dưới đây.
          </p>
          
          <h3>10. Thay đổi đối với chính sách bảo mật</h3>
          <p>
            Chúng tôi có thể cập nhật chính sách bảo mật này định kỳ bằng cách đăng phiên bản mới trên nền tảng của chúng tôi. Bạn nên kiểm tra trang này đôi khi để đảm bảo bạn hài lòng với bất kỳ thay đổi nào.
          </p>
          
          <h3>11. Liên hệ</h3>
          <p>
            Nếu bạn có bất kỳ câu hỏi nào về chính sách bảo mật này hoặc cách chúng tôi xử lý dữ liệu cá nhân của bạn, vui lòng liên hệ với chúng tôi tại:
          </p>
          <p>
            <strong>Email:</strong> privacy@cilisbooking.com<br />
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

export default PrivacyPolicy; 