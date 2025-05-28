import React from 'react';
import { XMarkIcon, DocumentIcon } from '@heroicons/react/24/outline';

/**
 * Component xử lý việc upload tệp đính kèm
 * @param {Object} props
 * @param {Array} props.attachments - Danh sách các tệp đã tải lên
 * @param {Function} props.handleFileChange - Hàm xử lý khi người dùng chọn tệp
 * @param {Function} props.removeAttachment - Hàm xử lý khi người dùng xoá một tệp
 */
const FileUpload = ({ attachments, handleFileChange, removeAttachment }) => {
  // Hàm để tạo tên tệp hiển thị (cắt ngắn nếu quá dài)
  const getTruncatedFileName = (name) => {
    if (name.length > 20) {
      return name.substring(0, 17) + '...';
    }
    return name;
  };

  return (
    <div className="mt-4">
      <div className="flex items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700">Tài liệu đính kèm</h3>
        <span className="ml-1 text-gray-500 text-xs">(không bắt buộc)</span>
      </div>
      
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
        <div className="space-y-1 text-center">
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="flex text-sm text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
            >
              <span>Tải lên tệp</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                multiple
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
            <p className="pl-1">hoặc kéo thả vào đây</p>
          </div>
          <p className="text-xs text-gray-500">
            PDF, DOC, DOCX, XLS, XLSX, JPG, PNG dưới 5MB
          </p>
        </div>
      </div>
      
      {attachments && attachments.length > 0 && (
        <div className="mt-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Đã đính kèm ({attachments.length}):</h4>
          <ul className="border rounded-md divide-y divide-gray-200">
            {attachments.map((file, index) => (
              <li key={index} className="px-3 py-2 flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <DocumentIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="truncate">{getTruncatedFileName(file.name)}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload; 