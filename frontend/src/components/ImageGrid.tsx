import React, { useState } from 'react';
import { ImageInfo } from '../types';
import { ImageViewer } from './ImageViewer';

interface ImageGridProps {
  images: ImageInfo[];
  onDeleteImage: (filename: string) => void;
  loading?: boolean;
}

export const ImageGrid: React.FC<ImageGridProps> = ({ images, onDeleteImage, loading = false }) => {
  const [selectedImage, setSelectedImage] = useState<ImageInfo | null>(null);

  const handleImageClick = (image: ImageInfo) => {
    setSelectedImage(image);
  };

  const handleDeleteClick = (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`确定要删除图片 ${filename} 吗？`)) {
      onDeleteImage(filename);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        加载图片中...
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        color: '#666', 
        padding: '4rem',
        background: 'white',
        borderRadius: '8px'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🖼️</div>
        <div>暂无图片</div>
        <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
          在左侧粘贴区域上传你的第一张图片
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="image-grid">
        {images.map((image) => (
          <div 
            key={image.filename} 
            className="image-item"
            onClick={() => handleImageClick(image)}
            style={{ cursor: 'pointer' }}
            title={`点击查看大图: ${image.filename}`}
          >
            <img 
              src={image.url} 
              alt={image.filename}
              loading="lazy"
            />
            <button
              className="delete-btn"
              onClick={(e) => handleDeleteClick(image.filename, e)}
              title={`删除 ${image.filename}`}
            >
              ×
            </button>
            <div className="image-filename">{image.filename}</div>
          </div>
        ))}
      </div>

      {selectedImage && (
        <ImageViewer
          imageUrl={selectedImage.url}
          imageName={selectedImage.filename}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
};