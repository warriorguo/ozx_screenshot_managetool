import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '../api';

interface ReadmeEditorProps {
  projectName: string | null;
  initialContent?: string;
}

type SaveStatus = 'saved' | 'saving' | 'error' | 'unsaved';

export const ReadmeEditor: React.FC<ReadmeEditorProps> = ({ projectName, initialContent = '' }) => {
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setContent(initialContent);
    setSaveStatus('saved');
  }, [initialContent]);

  const saveContent = useCallback(async (contentToSave: string) => {
    if (!projectName) return;

    try {
      setSaveStatus('saving');
      setError(null);
      await api.updateReadme(projectName, contentToSave);
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
      setError(err instanceof ApiError ? err.message : 'Failed to save README');
    }
  }, [projectName]);

  useEffect(() => {
    if (content !== initialContent && projectName) {
      setSaveStatus('unsaved');
      const timeoutId = setTimeout(() => {
        saveContent(content);
      }, 800);
      return () => clearTimeout(timeoutId);
    }
  }, [content, initialContent, projectName, saveContent]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const getStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return '保存中...';
      case 'saved':
        return '已保存';
      case 'error':
        return error || '保存失败';
      case 'unsaved':
        return '未保存';
      default:
        return '';
    }
  };

  return (
    <div className="readme-editor">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>项目说明 (README.md)</h3>
        <span className={`save-status ${saveStatus}`}>
          {getStatusText()}
        </span>
      </div>
      
      <textarea
        value={content}
        onChange={handleContentChange}
        placeholder="在这里编写项目说明，支持 Markdown 格式..."
        disabled={!projectName}
      />
      
      {!projectName && (
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          请先选择或创建项目
        </div>
      )}
    </div>
  );
};