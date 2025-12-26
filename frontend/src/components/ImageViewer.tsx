import React, { useEffect } from 'react';

interface ImageViewerProps {
  imageUrl: string;
  imageName: string;
  onClose: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl, imageName, onClose }) => {
  useEffect(() => {
    // 阻止背景滚动
    document.body.style.overflow = 'hidden';
    
    // ESC键关闭
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.overflow = 'auto';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    // 只有点击背景时才关闭，点击图片本身不关闭
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="image-viewer-overlay"
      onClick={handleBackdropClick}
    >
      <div className="image-viewer-container">
        <button 
          className="image-viewer-close"
          onClick={onClose}
          title="关闭 (ESC)"
        >
          ×
        </button>
        
        <div className="image-viewer-content">
          <img 
            src={imageUrl} 
            alt={imageName}
            className="image-viewer-image"
          />
          
          <div className="image-viewer-info">
            <span className="image-filename">{imageName}</span>
            <span className="image-viewer-hint">点击空白处关闭 • ESC 退出</span>
          </div>
        </div>
      </div>
    </div>
  );
};