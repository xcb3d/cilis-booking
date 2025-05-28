import crypto from 'crypto';
import querystring from 'querystring';
import moment from 'moment';
import dotenv from 'dotenv';

dotenv.config();

// Cấu hình VNPay
const VNP_TMN_CODE = process.env.VNP_TMN_CODE;
const VNP_HASH_SECRET = process.env.VNP_HASH_SECRET;
const VNP_URL = process.env.VNP_URL;
const VNP_RETURN_URL = process.env.VNP_RETURN_URL;
const VNP_API = process.env.VNP_API;

// Hàm sắp xếp object theo thứ tự
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    // Đảm bảo giá trị là chuỗi trước khi encode
    const value = obj[str[key]];
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    sorted[str[key]] = encodeURIComponent(stringValue).replace(/%20/g, "+");
  }
  return sorted;
}

// Tạo URL thanh toán VNPay
const createPaymentUrl = async (orderId, amount, bankCode, ipAddr, orderInfo = '') => {
  try {
    process.env.TZ = 'Asia/Ho_Chi_Minh';
    
    let date = new Date();
    let createDate = moment(date).format('YYYYMMDDHHmmss');
    
    // Log thông tin đầu vào
    console.log('Starting VNPay URL creation with params:', {
      orderId,
      amount,
      bankCode,
      ipAddr,
      orderInfo,
      createDate
    });
    
    // Tạo các tham số cho VNPay
    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = VNP_TMN_CODE;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = orderInfo || `Thanh toan cho don hang ${orderId}`;
    vnp_Params['vnp_OrderType'] = 'billpayment';
    
    // Đảm bảo amount là số nguyên và nhân với 100 (VNPay yêu cầu đơn vị là xu)
    vnp_Params['vnp_Amount'] = parseInt(amount) * 100;
    
    vnp_Params['vnp_ReturnUrl'] = VNP_RETURN_URL;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    
    // Kiểm tra VNP_HASH_SECRET
    console.log('Using VNP_TMN_CODE:', VNP_TMN_CODE);
    console.log('Using VNP_HASH_SECRET:', VNP_HASH_SECRET ? 'Available (masked)' : 'Missing');
    console.log('Using VNP_URL:', VNP_URL);
    console.log('Using VNP_RETURN_URL:', VNP_RETURN_URL);
    
    // Sắp xếp tham số theo thứ tự
    const sortedKeys = Object.keys(vnp_Params).sort();
    const sortedParams = {};
    sortedKeys.forEach((key) => {
      sortedParams[key] = vnp_Params[key];
    });
    
    // Log để debug
    console.log('Sorted VNP params before signing:', JSON.stringify(sortedParams));
    
    // Tạo chuỗi để ký
    let signData = '';
    const signKeys = Object.keys(sortedParams);
    
    signKeys.forEach((key, index) => {
      const value = sortedParams[key];
      signData += `${key}=${encodeURIComponent(value).replace(/%20/g, '+')}`;
      if (index < signKeys.length - 1) {
        signData += '&';
      }
    });
    
    console.log('Sign data string:', signData);
    
    // Tạo chữ ký số
    let hmac = crypto.createHmac("sha512", VNP_HASH_SECRET);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
    
    console.log('Generated secure hash:', signed);
    
    // Tạo URL thanh toán - Xây dựng URL thủ công thay vì dùng querystring.stringify
    let paymentUrl = `${VNP_URL}?`;
    
    // Thêm tất cả các tham số vào URL
    Object.keys(sortedParams).forEach((key, index) => {
      const value = sortedParams[key];
      paymentUrl += `${key}=${encodeURIComponent(value).replace(/%20/g, '+')}`;
      paymentUrl += '&';
    });
    
    // Thêm chữ ký vào cuối URL
    paymentUrl += `vnp_SecureHash=${signed}`;
    
    console.log('Full VNPay URL generated:', paymentUrl);
    return paymentUrl;
  } catch (error) {
    console.error('Error creating VNPay payment URL:', error);
    throw new Error('Không thể tạo URL thanh toán VNPay: ' + error.message);
  }
};

// Xác thực kết quả trả về từ VNPay
const verifyReturnUrl = (vnpParams) => {
  try {
    let secureHash = vnpParams['vnp_SecureHash'];
    
    // Xóa tham số secure hash để tạo lại
    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];
    
    // Sắp xếp tham số theo thứ tự
    const sortedKeys = Object.keys(vnpParams).sort();
    const sortedParams = {};
    sortedKeys.forEach((key) => {
      sortedParams[key] = vnpParams[key];
    });
    
    // Tạo chuỗi để ký
    let signData = '';
    const signKeys = Object.keys(sortedParams);
    
    signKeys.forEach((key, index) => {
      const value = sortedParams[key];
      signData += `${key}=${encodeURIComponent(value).replace(/%20/g, '+')}`;
      if (index < signKeys.length - 1) {
        signData += '&';
      }
    });
    
    // Tạo lại chữ ký số để kiểm tra
    let hmac = crypto.createHmac("sha512", VNP_HASH_SECRET);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
    
    // So sánh chữ ký số
    if(secureHash === signed) {
      const responseCode = vnpParams['vnp_ResponseCode'];
      // Mã 00 là thành công
      return {
        isValid: true,
        isSuccess: responseCode === '00',
        responseCode,
        transactionId: vnpParams['vnp_TransactionNo'],
        orderId: vnpParams['vnp_TxnRef'],
        amount: parseInt(vnpParams['vnp_Amount']) / 100,
        bankCode: vnpParams['vnp_BankCode'],
        bankTranNo: vnpParams['vnp_BankTranNo'],
        cardType: vnpParams['vnp_CardType'],
        payDate: vnpParams['vnp_PayDate'],
        orderInfo: vnpParams['vnp_OrderInfo']
      };
    } else {
      return { isValid: false, message: 'Chữ ký không hợp lệ' };
    }
  } catch (error) {
    console.error('Error verifying VNPay return URL:', error);
    return { isValid: false, message: 'Lỗi xác thực kết quả thanh toán' };
  }
};

// Truy vấn trạng thái giao dịch
const queryTransaction = async (orderId, transactionDate, ipAddr) => {
  try {
    process.env.TZ = 'Asia/Ho_Chi_Minh';
    let date = new Date();
    let vnp_RequestId = moment(date).format('HHmmss');
    let vnp_Version = '2.1.0';
    let vnp_Command = 'querydr';
    let vnp_OrderInfo = `Truy vấn giao dịch mã: ${orderId}`;
    let vnp_CreateDate = moment(date).format('YYYYMMDDHHmmss');
    
    // Tạo chuỗi dữ liệu để ký
    let data = vnp_RequestId + "|" + vnp_Version + "|" + vnp_Command + "|" + VNP_TMN_CODE + "|" + 
               orderId + "|" + transactionDate + "|" + vnp_CreateDate + "|" + ipAddr + "|" + vnp_OrderInfo;
    
    // Tạo chữ ký số
    let hmac = crypto.createHmac("sha512", VNP_HASH_SECRET);
    let vnp_SecureHash = hmac.update(Buffer.from(data, 'utf-8')).digest("hex");
    
    // Tạo object dữ liệu gửi đi
    let dataObj = {
      'vnp_RequestId': vnp_RequestId,
      'vnp_Version': vnp_Version,
      'vnp_Command': vnp_Command,
      'vnp_TmnCode': VNP_TMN_CODE,
      'vnp_TxnRef': orderId,
      'vnp_OrderInfo': vnp_OrderInfo,
      'vnp_TransactionDate': transactionDate,
      'vnp_CreateDate': vnp_CreateDate,
      'vnp_IpAddr': ipAddr,
      'vnp_SecureHash': vnp_SecureHash
    };
    
    // Gửi request đến VNPay API
    // Cần triển khai hàm gọi API thực tế ở đây
    // Có thể sử dụng axios hoặc node-fetch
    
    return dataObj; // Trả về object dữ liệu mẫu cho phần triển khai
  } catch (error) {
    console.error('Error querying VNPay transaction:', error);
    throw new Error('Không thể truy vấn trạng thái giao dịch VNPay');
  }
};

export default {
  createPaymentUrl,
  verifyReturnUrl,
  queryTransaction
}; 