import React, { useRef, useState } from 'react';

interface PasteAreaProps {
  onImagePaste: (files: File[]) => void;
  disabled?: boolean;
}

export const PasteArea: React.FC<PasteAreaProps> = ({ onImagePaste, disabled = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const pasteAreaRef = useRef<HTMLDivElement>(null);

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return;

    const items = Array.from(e.clipboardData.items);
    const imageFiles = items
      .filter(item => item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .filter(file => file !== null) as File[];

    if (imageFiles.length > 0) {
      onImagePaste(imageFiles);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      onImagePaste(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleClick = () => {
    if (pasteAreaRef.current && !disabled) {
      pasteAreaRef.current.focus();
    }
  };

  return (
    <div
      ref={pasteAreaRef}
      className={`paste-area ${isDragOver ? 'dragover' : ''}`}
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      tabIndex={0}
      style={{ 
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
      <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
        {disabled ? '请先选择项目' : '粘贴图片到这里'}
      </div>
      <div style={{ color: '#666', fontSize: '0.9rem' }}>
        支持 Ctrl+V / ⌘V 粘贴，或直接拖拽图片文件
      </div>
    </div>
  );
};