import { useState } from 'react';
import { 
  ArrowUpTrayIcon, 
  DocumentIcon, 
  DocumentCheckIcon, 
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import axiosClient from '../../utils/axiosClient';
import { DOCUMENT_TYPES, VERIFICATION_STATUS } from '../../utils/constants';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const VerificationDocuments = () => {
  const [files, setFiles] = useState({
    identification: null,
    certification: null,
    experience: null,
    license: null
  });
  const [verificationStatus, setVerificationStatus] = useState(VERIFICATION_STATUS.UNVERIFIED);
  const [uploading, setUploading] = useState(false);
  const [comment] = useState('');
  const [documents, setDocuments] = useState(null);
  const [reverificationRequested] = useState(false);
  const [reverificationRequestDate] = useState(null);

  // Xử lý khi người dùng chọn file
  const handleFileChange = (e, type) => {
    if (e.target.files && e.target.files[0]) {
      // Kiểm tra kích thước file (5MB)
      if (e.target.files[0].size > 5 * 1024 * 1024) {
        toast.error('File quá lớn. Vui lòng chọn file nhỏ hơn 5MB');
        return;
      }

      setFiles(prev => ({
        ...prev,
        [type]: e.target.files[0]
      }));
    }
  };

  // Xử lý khi upload tài liệu
  const handleUpload = async () => {
    // Kiểm tra xem có file nào được chọn không
    if (!files.identification && !files.certification && !files.experience && !files.license) {
      toast.error('Vui lòng chọn ít nhất một tài liệu để tải lên');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      
      Object.keys(files).forEach(key => {
        if (files[key]) {
          formData.append(key, files[key]);
        }
      });

      const response = await axiosClient.post('/experts/verification', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Tải lên tài liệu xác minh thành công');
      setVerificationStatus(VERIFICATION_STATUS.PENDING);
      setDocuments(response.documents);
      setFiles({
        identification: null,
        certification: null,
        experience: null,
        license: null
      });
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi tải lên tài liệu xác minh');
    } finally {
      setUploading(false);
    }
  };

  // Trả về màu và thông báo trạng thái
  const getStatusInfo = () => {
    // Nếu có yêu cầu xác minh lại, hiển thị thông báo riêng
    if (reverificationRequested) {
      return {
        colorClass: 'text-orange-700 bg-orange-50 border-orange-300',
        title: 'Yêu cầu xác minh lại',
        message: 'Quản trị viên yêu cầu bạn tải lên lại giấy tờ xác minh.'
      };
    }

    switch (verificationStatus) {
      case VERIFICATION_STATUS.VERIFIED:
        return {
          colorClass: 'text-green-700 bg-green-50 border-green-300',
          title: 'Đã xác minh',
          message: 'Tài khoản của bạn đã được xác minh. Bạn có thể bắt đầu nhận các lịch đặt từ khách hàng.'
        };
      case VERIFICATION_STATUS.PENDING:
        return {
          colorClass: 'text-yellow-700 bg-yellow-50 border-yellow-300',
          title: 'Đang chờ xác minh',
          message: 'Tài liệu của bạn đang được quản trị viên xem xét. Chúng tôi sẽ thông báo cho bạn kết quả sớm nhất.'
        };
      case VERIFICATION_STATUS.REJECTED:
        return {
          colorClass: 'text-red-700 bg-red-50 border-red-300',
          title: 'Đã từ chối',
          message: 'Yêu cầu xác minh của bạn đã bị từ chối. Vui lòng xem lý do bên dưới và thử lại.'
        };
      default:
        return {
          colorClass: 'text-gray-700 bg-gray-50 border-gray-300',
          title: 'Chưa xác minh',
          message: 'Vui lòng tải lên các tài liệu cần thiết để xác minh tài khoản của bạn.'
        };
    }
  };

  // Trả về icon dựa vào trạng thái xác minh
  const getStatusIcon = () => {
    if (reverificationRequested) {
      return <ExclamationTriangleIcon className="h-12 w-12 text-orange-500" />;
    }

    switch (verificationStatus) {
      case VERIFICATION_STATUS.VERIFIED:
        return <CheckCircleIcon className="h-12 w-12 text-green-500" />;
      case VERIFICATION_STATUS.PENDING:
        return <ClockIcon className="h-12 w-12 text-yellow-500" />;
      case VERIFICATION_STATUS.REJECTED:
        return <XCircleIcon className="h-12 w-12 text-red-500" />;
      default:
        return <DocumentCheckIcon className="h-12 w-12 text-gray-400" />;
    }
  };

  if (uploading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Xác minh tài khoản</h2>
      
      {/* Status display */}
      <div className={`mb-6 p-4 rounded-lg border ${statusInfo.colorClass}`}>
        <div className="flex items-center">
          {getStatusIcon()}
          <div className="ml-4">
            <h3 className="font-semibold text-lg">{statusInfo.title}</h3>
            <p>{statusInfo.message}</p>
            
            {reverificationRequested && (
              <div className="mt-2">
                <h4 className="font-medium">Lý do yêu cầu xác minh lại:</h4>
                <p className="italic">{comment}</p>
                
                {reverificationRequestDate && (
                  <p className="text-sm text-orange-600 mt-1">
                    Yêu cầu {formatDistanceToNow(new Date(reverificationRequestDate), { addSuffix: true, locale: vi })}
                  </p>
                )}
              </div>
            )}
            
            {!reverificationRequested && verificationStatus === VERIFICATION_STATUS.REJECTED && comment && (
              <div className="mt-2">
                <h4 className="font-medium">Lý do từ chối:</h4>
                <p className="italic">{comment}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Document upload section - only show if not verified or reverification requested */}
      {(verificationStatus !== VERIFICATION_STATUS.VERIFIED || reverificationRequested) && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800">Tải lên tài liệu xác minh</h3>
          <p className="text-gray-600 mb-4">
            Để xác minh tài khoản, vui lòng tải lên các tài liệu sau đây. 
            Tất cả tài liệu phải rõ ràng và đầy đủ thông tin.
          </p>
          
          {/* Document types */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CMND/CCCD */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">CMND/CCCD <span className="text-red-500">*</span></h4>
                {documents?.identification && (
                  <a 
                    href={documents.identification} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Xem tài liệu
                  </a>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-3">Vui lòng tải lên bản scan hoặc ảnh CMND/CCCD</p>
              <label className="block">
                <span className="sr-only">Chọn file</span>
                <input 
                  type="file" 
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleFileChange(e, 'identification')}
                  disabled={uploading || (verificationStatus === VERIFICATION_STATUS.PENDING && !reverificationRequested)}
                />
              </label>
              {files.identification && (
                <p className="mt-2 text-sm text-green-600">
                  Đã chọn: {files.identification.name}
                </p>
              )}
            </div>
            
            {/* Bằng cấp, chứng chỉ */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Bằng cấp, chứng chỉ</h4>
                {documents?.certification && (
                  <a 
                    href={documents.certification} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Xem tài liệu
                  </a>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-3">Tải lên bản scan/ảnh bằng cấp hoặc chứng chỉ chuyên môn</p>
              <label className="block">
                <span className="sr-only">Chọn file</span>
                <input 
                  type="file" 
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleFileChange(e, 'certification')}
                  disabled={uploading || (verificationStatus === VERIFICATION_STATUS.PENDING && !reverificationRequested)}
                />
              </label>
              {files.certification && (
                <p className="mt-2 text-sm text-green-600">
                  Đã chọn: {files.certification.name}
                </p>
              )}
            </div>
            
            {/* Tài liệu kinh nghiệm */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Tài liệu kinh nghiệm</h4>
                {documents?.experience && (
                  <a 
                    href={documents.experience} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Xem tài liệu
                  </a>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-3">CV, portfolio hoặc giấy xác nhận kinh nghiệm làm việc</p>
              <label className="block">
                <span className="sr-only">Chọn file</span>
                <input 
                  type="file" 
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleFileChange(e, 'experience')}
                  disabled={uploading || (verificationStatus === VERIFICATION_STATUS.PENDING && !reverificationRequested)}
                />
              </label>
              {files.experience && (
                <p className="mt-2 text-sm text-green-600">
                  Đã chọn: {files.experience.name}
                </p>
              )}
            </div>
            
            {/* Giấy phép hành nghề */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Giấy phép hành nghề</h4>
                {documents?.license && (
                  <a 
                    href={documents.license} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Xem tài liệu
                  </a>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-3">Tải lên bản scan/ảnh giấy phép hành nghề (nếu có)</p>
              <label className="block">
                <span className="sr-only">Chọn file</span>
                <input 
                  type="file" 
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleFileChange(e, 'license')}
                  disabled={uploading || (verificationStatus === VERIFICATION_STATUS.PENDING && !reverificationRequested)}
                />
              </label>
              {files.license && (
                <p className="mt-2 text-sm text-green-600">
                  Đã chọn: {files.license.name}
                </p>
              )}
            </div>
          </div>
          
          {/* Upload button */}
          <div className="mt-6">
            <button
              type="button"
              className="flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              onClick={handleUpload}
              disabled={uploading || (verificationStatus === VERIFICATION_STATUS.PENDING && !reverificationRequested)}
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Đang tải lên...</span>
                </>
              ) : (
                <>
                  <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                  <span>{reverificationRequested ? 'Tải lên tài liệu cập nhật' : 'Tải lên tài liệu'}</span>
                </>
              )}
            </button>
            
            {verificationStatus === VERIFICATION_STATUS.PENDING && !reverificationRequested && (
              <p className="mt-2 text-sm text-yellow-600">
                Tài liệu của bạn đang được xem xét. Vui lòng chờ phản hồi từ quản trị viên.
              </p>
            )}
            
            {reverificationRequested && (
              <p className="mt-2 text-sm text-orange-600">
                Vui lòng tải lên lại tài liệu theo yêu cầu của quản trị viên.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationDocuments; 