import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Lấy thông tin kết nối từ biến môi trường hoặc sử dụng mặc định
const ELASTIC_NODE = process.env.ELASTIC_NODE || 'https://localhost:9200';
const ELASTIC_USERNAME = process.env.ELASTIC_USERNAME || 'elastic';
const ELASTIC_PASSWORD = process.env.ELASTIC_PASSWORD || 'E0Xu3aUb7+tsY8KOKhdG';

// Cấu hình client với phiên bản mới của elasticsearch client
const config = {
  node: ELASTIC_NODE,
  tls: {
    rejectUnauthorized: false
  }
};

// Thêm thông tin xác thực nếu được cung cấp
if (ELASTIC_USERNAME && ELASTIC_PASSWORD) {
  config.auth = {
    username: ELASTIC_USERNAME,
    password: ELASTIC_PASSWORD
  };
}

// Tạo và xuất client
const elasticClient = new Client(config);

// Kiểm tra kết nối khi khởi động
const checkConnection = async () => {
  try {
    const info = await elasticClient.info();
    console.log(`Elasticsearch kết nối thành công: ${info.name} (phiên bản ${info.version.number})`);
    return true;
  } catch (error) {
    console.error('Lỗi kết nối Elasticsearch:', error.message);
    return false;
  }
};

export { elasticClient, checkConnection }; 