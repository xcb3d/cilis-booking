import { useState, useRef } from 'react';
import { PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';

const FileInput = ({ onFileSelect, onFileRemove }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Update selected files
    setSelectedFiles(prevFiles => [...prevFiles, ...files]);
    
    // Process file previews
    files.forEach(file => {
      // Check if it's an image
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviews(prev => [...prev, {
            name: file.name,
            type: 'image',
            src: e.target.result,
            file
          }]);
        };
        reader.readAsDataURL(file);
      } else {
        // For non-image files
        setPreviews(prev => [...prev, {
          name: file.name,
          type: 'file',
          icon: getFileIcon(file.type),
          file
        }]);
      }
    });
    
    // Notify parent component
    onFileSelect(files);
    
    // Reset input
    e.target.value = null;
  };

  const handleRemoveFile = (index) => {
    // Create new arrays without the removed file
    const newFiles = [...selectedFiles];
    const newPreviews = [...previews];
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
    
    // Notify parent component
    onFileRemove(index);
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) {
      return 'pdf';
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return 'doc';
    } else if (fileType.includes('excel') || fileType.includes('sheet')) {
      return 'xls';
    } else if (fileType.includes('zip') || fileType.includes('archive')) {
      return 'zip';
    } else {
      return 'file';
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => fileInputRef.current.click()}
        className="p-2 text-gray-400 hover:text-gray-500 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label="Attach file"
      >
        <PaperClipIcon className="w-5 h-5" />
      </button>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
      />
      
      {previews.length > 0 && (
        <div className="mt-2 space-y-2">
          {previews.map((preview, index) => (
            <div key={index} className="flex items-center p-2 bg-gray-50 rounded-lg">
              {preview.type === 'image' ? (
                <img 
                  src={preview.src} 
                  alt={preview.name}
                  className="h-10 w-10 object-cover rounded"
                />
              ) : (
                <div className="h-10 w-10 bg-gray-200 flex items-center justify-center rounded">
                  <span className="text-xs font-medium uppercase">{preview.icon}</span>
                </div>
              )}
              
              <div className="ml-2 flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{preview.name}</p>
              </div>
              
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                className="ml-1 text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileInput; 