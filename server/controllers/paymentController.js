import paymentService from '../services/paymentService.js';
import clientService from '../services/clientService.js';
import moment from 'moment';

// Tạo URL thanh toán VNPay
const createPaymentUrl = async (req, res) => {
  try {
    const { bookingId, amount, bankCode } = req.body;
    
    console.log('Received payment request:', {
      bookingId, 
      amount, 
      bankCode,
      headers: req.headers
    });
    
    if (!bookingId || !amount) {
      return res.status(400).json({ message: 'Thiếu thông tin đặt lịch hoặc số tiền thanh toán' });
    }

    // Lấy thông tin booking để hiển thị trong thông tin thanh toán
    const booking = await clientService.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin đặt lịch' });
    }
    
    // Lấy IP của client và đảm bảo đúng định dạng
    let ipAddr = req.headers['x-forwarded-for'] || 
                req.connection.remoteAddress || 
                req.socket.remoteAddress;
                
    // Loại bỏ IPv6 prefix nếu có
    if (ipAddr && ipAddr.includes('::ffff:')) {
      ipAddr = ipAddr.split(':').pop();
    }
    
    // Sử dụng IP mặc định nếu không lấy được
    if (!ipAddr || ipAddr === '::1' || ipAddr === 'localhost') {
      ipAddr = '127.0.0.1';
    }
    
    console.log('Client IP address:', ipAddr);
    
    // Tạo mã đơn hàng duy nhất
    const orderId = `${bookingId}-${moment().format('DDHHmmss')}`;
    
    // Tạo thông tin đơn hàng (không chứa ký tự đặc biệt)
    const expertName = booking.expertName || 'khong xac dinh';
    // Loại bỏ tất cả ký tự đặc biệt và dấu tiếng Việt
    const sanitizedExpertName = expertName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '_');
    
    const orderInfo = `Thanh_toan_tu_van_${sanitizedExpertName}`;
    
    console.log('Sanitized order info:', orderInfo);
    
    // Đảm bảo amount là số nguyên
    const paymentAmount = Math.floor(parseFloat(amount));
    
    console.log('Creating VNPay payment URL with params:', {
      orderId,
      amount: paymentAmount,
      ipAddr,
      orderInfo
    });
    
    // Tạo URL thanh toán
    try {
      const paymentUrl = await paymentService.createPaymentUrl(
        orderId, 
        paymentAmount, 
        null, // Bỏ qua bankCode để người dùng chọn trên trang VNPay
        ipAddr,
        orderInfo
      );
      
      // Kiểm tra paymentUrl có hợp lệ không
      if (!paymentUrl || typeof paymentUrl !== 'string' || !paymentUrl.startsWith('http')) {
        console.error('Invalid payment URL generated:', paymentUrl);
        return res.status(500).json({ 
          message: 'URL thanh toán không hợp lệ', 
          error: 'URL thanh toán được tạo không đúng định dạng' 
        });
      }
      
      console.log('Payment URL created successfully:', paymentUrl);
      
      // Cập nhật thông tin thanh toán vào booking
      try {
        await clientService.updateBookingPayment(bookingId, {
          paymentOrderId: orderId,
          paymentAmount: paymentAmount,
          paymentStatus: 'pending',
          paymentMethod: 'vnpay',
          paymentBankCode: bankCode || null
        });
        
        console.log('Booking payment info updated successfully');
        
        // Trả về URL thanh toán
        return res.status(200).json({ paymentUrl });
      } catch (updateError) {
        console.error('Error updating booking payment info:', updateError);
        // Vẫn trả về URL thanh toán ngay cả khi cập nhật thất bại
        return res.status(200).json({ 
          paymentUrl, 
          warning: 'Tạo URL thanh toán thành công nhưng không thể cập nhật thông tin đặt lịch' 
        });
      }
    } catch (paymentUrlError) {
      console.error('Error creating payment URL:', paymentUrlError);
      return res.status(500).json({ 
        message: 'Không thể tạo URL thanh toán',
        error: paymentUrlError.message 
      });
    }
  } catch (error) {
    console.error('Payment URL creation error:', error);
    return res.status(500).json({ 
      message: 'Lỗi khi tạo URL thanh toán', 
      error: error.message || 'Unknown error' 
    });
  }
};

// Xử lý kết quả thanh toán VNPay
const vnpayReturn = async (req, res) => {
  try {
    // Lấy tất cả các tham số trả về từ VNPay
    const vnpParams = req.query;
    
    console.log('VNPay return params:', vnpParams);
    console.log('CLIENT_URL from env:', process.env.CLIENT_URL);
    
    // Xác thực thông tin trả về
    const verifyResult = paymentService.verifyReturnUrl(vnpParams);
    console.log('VNPay verification result:', verifyResult);
    
    if (!verifyResult.isValid) {
      console.error('Invalid VNPay return data');
      return res.status(400).json({ 
        success: false, 
        message: 'Thông tin thanh toán không hợp lệ' 
      });
    }
    
    // Xử lý theo kết quả thanh toán
    if (verifyResult.isSuccess) {
      // Thanh toán thành công
      const bookingId = verifyResult.orderId.split('-')[0]; // Lấy bookingId từ orderId
      console.log('Extracted booking ID:', bookingId);
      
      // Cập nhật thông tin thanh toán trước
      console.log(`[PAYMENT DEBUG] vnpayReturn - Updating payment info for booking ${bookingId}`);
      await clientService.updateBookingPayment(bookingId, {
        paymentStatus: 'completed',
        paymentTransactionId: verifyResult.transactionId,
        paymentBankCode: verifyResult.bankCode,
        paymentMethod: 'vnpay',
        paymentDate: moment(verifyResult.payDate, 'YYYYMMDDHHmmss').toDate()
      });
      
      // Sau đó cập nhật trạng thái booking riêng để đảm bảo thống kê được cập nhật đúng
      console.log(`[PAYMENT DEBUG] vnpayReturn - Updating booking status to confirmed for booking ${bookingId}`);
      await clientService.updateBookingStatus(bookingId, 'confirmed', 'payment_system');
      
      // Đảm bảo CLIENT_URL được định nghĩa
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const redirectUrl = `${clientUrl}/payment/success?bookingId=${bookingId}`;
      
      console.log('Redirecting to success page:', redirectUrl);
      
      // Chuyển hướng người dùng đến trang thành công
      return res.redirect(redirectUrl);
    } else {
      // Thanh toán thất bại
      const bookingId = verifyResult.orderId.split('-')[0];
      console.log('Payment failed for booking ID:', bookingId);
      
      // Cập nhật thông tin thanh toán trước
      await clientService.updateBookingPayment(bookingId, {
        paymentStatus: 'failed',
        paymentErrorCode: vnpParams['vnp_ResponseCode']
      });
      
      // Sau đó cập nhật trạng thái booking riêng để đảm bảo thống kê được cập nhật đúng
      await clientService.updateBookingStatus(bookingId, 'canceled', 'payment_system');
      
      // Chuyển hướng đến trang thất bại
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const failureUrl = `${clientUrl}/payment/failure?bookingId=${bookingId}`;
      
      console.log('Redirecting to failure page:', failureUrl);
      return res.redirect(failureUrl);
    }
  } catch (error) {
    console.error('VNPay return handler error:', error);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/payment/error?message=${encodeURIComponent(error.message)}`);
  }
};

// Xử lý IPN (Instant Payment Notification) từ VNPay
const vnpayIpn = async (req, res) => {
  try {
    // Lấy tất cả các tham số từ VNPay
    const vnpParams = req.query;
    
    console.log('VNPay IPN params received:', vnpParams);
    
    // Xác thực thông tin IPN
    const verifyResult = paymentService.verifyReturnUrl(vnpParams);
    console.log('VNPay IPN verification result:', verifyResult);
    
    if (!verifyResult.isValid) {
      console.error('Invalid VNPay IPN signature');
      return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
    }
    
    // Lấy bookingId từ orderId
    const orderId = vnpParams['vnp_TxnRef'];
    const bookingId = orderId.split('-')[0];
    console.log('Extracted booking ID from IPN:', bookingId);
    
    // Kiểm tra xem đơn hàng tồn tại không
    const booking = await clientService.getBookingById(bookingId);
    
    if (!booking) {
      console.error('Booking not found in database:', bookingId);
      return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
    }
    
    console.log('Booking found:', booking._id, 'with payment amount:', booking.price);
    
    // Kiểm tra số tiền thanh toán
    const amount = parseInt(vnpParams['vnp_Amount']) / 100;
    
    if (booking.price !== amount) {
      console.error('Payment amount mismatch:', 'Expected:', booking.price, 'Received:', amount);
      return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
    }
    
    // Kiểm tra trạng thái thanh toán hiện tại
    if (booking.paymentStatus === 'completed') {
      console.log('Payment already completed for booking:', bookingId);
      return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
    }
    
    // Xử lý theo kết quả thanh toán
    const responseCode = vnpParams['vnp_ResponseCode'];
    console.log('VNPay response code:', responseCode);
    
    if (responseCode === '00') {
      // Thanh toán thành công
      console.log('Payment successful via IPN for booking:', bookingId);
      
      // Cập nhật thông tin thanh toán trước
      console.log(`[PAYMENT DEBUG] vnpayIpn - Updating payment info for booking ${bookingId}`);
      await clientService.updateBookingPayment(bookingId, {
        paymentStatus: 'completed',
        paymentTransactionId: vnpParams['vnp_TransactionNo'],
        paymentBankCode: vnpParams['vnp_BankCode'],
        paymentMethod: 'vnpay',
        paymentDate: moment(vnpParams['vnp_PayDate'], 'YYYYMMDDHHmmss').toDate()
      });
      
      // Sau đó cập nhật trạng thái booking riêng để đảm bảo thống kê được cập nhật đúng
      console.log(`[PAYMENT DEBUG] vnpayIpn - Updating booking status to confirmed for booking ${bookingId}`);
      await clientService.updateBookingStatus(bookingId, 'confirmed', 'payment_system');
    } else {
      // Thanh toán thất bại
      console.log('Payment failed via IPN for booking:', bookingId, 'with code:', responseCode);
      
      // Cập nhật thông tin thanh toán trước
      await clientService.updateBookingPayment(bookingId, {
        paymentStatus: 'failed',
        paymentErrorCode: responseCode
      });
      
      // Sau đó cập nhật trạng thái booking riêng để đảm bảo thống kê được cập nhật đúng
      await clientService.updateBookingStatus(bookingId, 'canceled', 'payment_system');
    }
    
    // Trả về kết quả thành công cho VNPay
    console.log('IPN processing completed successfully');
    return res.status(200).json({ RspCode: '00', Message: 'Confirmed' });
  } catch (error) {
    console.error('VNPay IPN handling error:', error);
    return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
};

// Truy vấn trạng thái thanh toán
const queryPaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Lấy thông tin thanh toán của booking
    const booking = await clientService.getBookingById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin đặt lịch' });
    }
    
    // Trả về trạng thái thanh toán
    return res.status(200).json({
      bookingId,
      paymentStatus: booking.paymentStatus,
      paymentAmount: booking.paymentAmount,
      paymentDate: booking.paymentDate,
      paymentMethod: booking.paymentMethod
    });
  } catch (error) {
    console.error('Payment status query error:', error);
    return res.status(500).json({ message: 'Lỗi khi truy vấn trạng thái thanh toán' });
  }
};

export default {
  createPaymentUrl,
  vnpayReturn,
  vnpayIpn,
  queryPaymentStatus
}; 