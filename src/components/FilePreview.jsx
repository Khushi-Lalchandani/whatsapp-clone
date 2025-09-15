import React, { useState } from 'react';
import { X, Download, FileText, Image, Video, Music, Archive, File } from 'lucide-react';
import { getFileType, formatFileSize } from '../utils/fileUtils';

const FilePreview = ({ fileData, isOwn = false, onDownload, onClose }) => {
  const [imageError, setImageError] = useState(false);
  
  if (!fileData) return null;
  
  const { fileName, fileSize, fileType, fileContent, originalFile } = fileData;
  
  const getIcon = () => {
    switch (fileType) {
      case 'image': return <Image size={20} />;
      case 'video': return <Video size={20} />;
      case 'audio': return <Music size={20} />;
      case 'document': return <FileText size={20} />;
      case 'archive': return <Archive size={20} />;
      default: return <File size={20} />;
    }
  };
  
  const handleDownload = () => {
    if (fileContent) {
      const link = document.createElement('a');
      link.href = fileContent;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (originalFile) {
      // For preview mode before sending
      const url = URL.createObjectURL(originalFile);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };
  
  const renderPreview = () => {
    // Base styling that matches message bubble colors
    const baseContainerClass = isOwn 
      ? "bg-yellow-100 border-yellow-400" 
      : "bg-gray-700 border-gray-600";
    
    const textColorClass = isOwn ? "text-gray-800" : "text-white";
    const iconColorClass = isOwn ? "text-yellow-600" : "text-yellow-400";
    
    switch (fileType) {
      case 'image':
        if (imageError) {
          return (
            <div className={`flex flex-col items-center justify-center h-48 rounded-lg border ${baseContainerClass}`}>
              <Image size={40} className="text-gray-400 mb-2" />
              <span className="text-sm text-gray-400">Image preview unavailable</span>
            </div>
          );
        }
        return (
          <div className="relative">
            <img 
              src={fileContent || (originalFile ? URL.createObjectURL(originalFile) : '')}
              alt={fileName}
              className={`max-w-xs max-h-48 rounded-lg object-cover border ${isOwn ? 'border-yellow-400' : 'border-gray-600'}`}
              onError={() => setImageError(true)}
              onLoad={() => setImageError(false)}
            />
          </div>
        );
        
      case 'video':
        return (
          <div className="relative">
            <video 
              src={fileContent || (originalFile ? URL.createObjectURL(originalFile) : '')}
              className={`max-w-xs max-h-48 rounded-lg border ${isOwn ? 'border-yellow-400' : 'border-gray-600'}`}
              controls
              preload="metadata"
            />
          </div>
        );
        
      case 'audio':
        return (
          <div className={`p-4 rounded-lg border min-w-[250px] ${baseContainerClass}`}>
            <div className="flex items-center gap-3 mb-3">
              <Music size={24} className={iconColorClass} />
              <div className="flex-1">
                <p className={`font-medium truncate ${textColorClass}`}>{fileName}</p>
                <p className="text-gray-400 text-sm">{formatFileSize(fileSize)}</p>
              </div>
            </div>
            <audio 
              src={fileContent || (originalFile ? URL.createObjectURL(originalFile) : '')}
              className="w-full"
              controls
              preload="metadata"
            />
          </div>
        );
        
      default:
        return (
          <div className={`p-4 rounded-lg border min-w-[200px] ${baseContainerClass}`}>
            <div className="flex items-center gap-3">
              <div className={iconColorClass}>
                {getIcon()}
              </div>
              <div className="flex-1">
                <p className={`font-medium truncate ${textColorClass}`}>{fileName}</p>
                <p className="text-gray-400 text-sm">{formatFileSize(fileSize)}</p>
              </div>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="relative">
      {renderPreview()}
      
      {/* File actions */}
      <div className="absolute top-2 right-2 flex gap-1">
        {(fileContent || originalFile) && (
          <button
            onClick={handleDownload}
            className={`p-1 rounded-full transition ${
              isOwn 
                ? 'bg-yellow-600 bg-opacity-80 text-white hover:bg-opacity-100' 
                : 'bg-black bg-opacity-70 text-white hover:bg-opacity-90'
            }`}
            title="Download"
          >
            <Download size={16} />
          </button>
        )}
        
        {onClose && (
          <button
            onClick={onClose}
            className={`p-1 rounded-full transition ${
              isOwn 
                ? 'bg-yellow-600 bg-opacity-80 text-white hover:bg-opacity-100' 
                : 'bg-black bg-opacity-70 text-white hover:bg-opacity-90'
            }`}
            title="Close"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default FilePreview;