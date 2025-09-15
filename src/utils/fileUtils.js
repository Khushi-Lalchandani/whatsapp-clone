// File utility functions for handling file operations and previews

export const getFileType = (file) => {
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.split('.').pop();
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
  const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'];
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
  const spreadsheetExtensions = ['xls', 'xlsx', 'csv'];
  const presentationExtensions = ['ppt', 'pptx'];
  const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz'];
  
  if (imageExtensions.includes(fileExtension)) return 'image';
  if (videoExtensions.includes(fileExtension)) return 'video';
  if (audioExtensions.includes(fileExtension)) return 'audio';
  if (documentExtensions.includes(fileExtension)) return 'document';
  if (spreadsheetExtensions.includes(fileExtension)) return 'spreadsheet';
  if (presentationExtensions.includes(fileExtension)) return 'presentation';
  if (archiveExtensions.includes(fileExtension)) return 'archive';
  
  return 'other';
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (fileType) => {
  const icons = {
    image: '🖼️',
    video: '🎥',
    audio: '🎵',
    document: '📄',
    spreadsheet: '📊',
    presentation: '📋',
    archive: '📦',
    other: '📎'
  };
  
  return icons[fileType] || icons.other;
};

export const createFilePreview = (file) => {
  return new Promise((resolve) => {
    const fileType = getFileType(file);
    
    if (fileType === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          type: 'image',
          url: e.target.result,
          file
        });
      };
      reader.readAsDataURL(file);
    } else {
      resolve({
        type: fileType,
        url: null,
        file
      });
    }
  });
};

// Convert file to base64 for storing in Firebase
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};