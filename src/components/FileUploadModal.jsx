import React, { useState, useRef } from 'react';
import { X, Send, Paperclip } from 'lucide-react';
import FilePreview from './FilePreview';
import { createFilePreview, getFileType, formatFileSize, fileToBase64 } from '../utils/fileUtils';

const FileUploadModal = ({ isOpen, onClose, onSend }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file size (limit to 25MB)
    if (file.size > 25 * 1024 * 1024) {
      alert('File size must be less than 25MB');
      return;
    }
    
    setSelectedFile(file);
    
    try {
      const preview = await createFilePreview(file);
      setFilePreview(preview);
    } catch (error) {
      console.error('Error creating file preview:', error);
      setFilePreview({
        type: getFileType(file),
        url: null,
        file
      });
    }
  };
  
  const handleSend = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    try {
      // Convert file to base64
      const fileContent = await fileToBase64(selectedFile);
      
      const fileData = {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: getFileType(selectedFile),
        fileContent: fileContent,
        message: message.trim()
      };
      
      await onSend(fileData);
      
      // Reset form
      setSelectedFile(null);
      setFilePreview(null);
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Error sending file:', error);
      alert('Failed to send file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleClose = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setMessage('');
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-yellow-600 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-yellow-600">
          <h3 className="text-lg font-semibold text-yellow-400">Share File</h3>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-800 rounded transition text-gray-400"
            disabled={isUploading}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          {!selectedFile ? (
            /* File Selection */
            <div className="text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="*/*"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-yellow-600 rounded-lg hover:border-yellow-400 transition text-yellow-400 hover:text-yellow-300"
              >
                <Paperclip size={32} className="mb-2" />
                <span className="text-lg font-medium">Choose File</span>
                <span className="text-sm text-gray-400 mt-1">Max file size: 25MB</span>
              </button>
            </div>
          ) : (
            /* File Preview and Send */
            <div className="space-y-4">
              {/* File Preview */}
              <div className="flex justify-center">
                <FilePreview
                  fileData={{
                    fileName: selectedFile.name,
                    fileSize: selectedFile.size,
                    fileType: getFileType(selectedFile),
                    originalFile: selectedFile
                  }}
                  isOwn={true}
                />
              </div>
              
              {/* File Info */}
              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-white font-medium truncate">{selectedFile.name}</p>
                <p className="text-gray-400 text-sm">{formatFileSize(selectedFile.size)}</p>
              </div>
              
              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Add a message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full p-3 bg-gray-800 border border-yellow-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 resize-none"
                  rows={3}
                  disabled={isUploading}
                />
              </div>
              
              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setFilePreview(null);
                  }}
                  className="flex-1 py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                  disabled={isUploading}
                >
                  Choose Different File
                </button>
                <button
                  onClick={handleSend}
                  disabled={isUploading}
                  className="flex-1 py-2 px-4 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;