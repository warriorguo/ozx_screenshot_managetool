import React, { useState, useEffect } from 'react';
import { ProjectSelector } from './components/ProjectSelector';
import { PasteArea } from './components/PasteArea';
import { ReadmeEditor } from './components/ReadmeEditor';
import { ImageGrid } from './components/ImageGrid';
import { api, ApiError } from './api';
import { ProjectDetail } from './types';

function App() {
  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentProject) {
      loadProjectDetail();
    } else {
      setProjectDetail(null);
    }
  }, [currentProject]);

  const loadProjectDetail = async () => {
    if (!currentProject) return;

    try {
      setLoading(true);
      setError(null);
      const detail = await api.getProjectDetail(currentProject);
      setProjectDetail(detail);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (projectName: string) => {
    setCurrentProject(projectName);
    setShowProjectSelector(false);
  };

  const handleImagePaste = async (files: File[]) => {
    if (!currentProject || uploading) return;

    setUploading(true);
    setError(null);

    try {
      // Upload files sequentially to maintain order
      for (const file of files) {
        await api.uploadImage(currentProject, file);
      }
      // Refresh project detail to show new images
      await loadProjectDetail();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (filename: string) => {
    if (!currentProject) return;

    try {
      setError(null);
      await api.deleteImage(currentProject, filename);
      // Refresh project detail to remove deleted image
      await loadProjectDetail();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete image');
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>📸 截图管理工具</h1>
        <div className="header-actions">
          {currentProject && (
            <span style={{ marginRight: '1rem', color: '#666' }}>
              当前项目: <strong>{currentProject}</strong>
            </span>
          )}
          <button 
            className="btn btn-secondary"
            onClick={() => setShowProjectSelector(true)}
          >
            {currentProject ? '切换项目' : '选择项目'}
          </button>
        </div>
      </header>

      <div className="main-content">
        <div className="left-panel">
          <PasteArea 
            onImagePaste={handleImagePaste}
            disabled={!currentProject || uploading}
          />
          
          {uploading && (
            <div style={{ 
              background: '#fff3cd', 
              color: '#856404', 
              padding: '1rem', 
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              上传中...
            </div>
          )}

          <ReadmeEditor 
            projectName={currentProject}
            initialContent={projectDetail?.readme || ''}
            key={currentProject} // Force re-mount when project changes
          />
        </div>

        <div className="right-panel">
          {error && (
            <div className="error" style={{ marginBottom: '1rem' }}>
              {error}
              <button 
                onClick={() => setError(null)}
                style={{ 
                  marginLeft: '1rem', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer' 
                }}
              >
                ×
              </button>
            </div>
          )}

          {currentProject ? (
            <ImageGrid
              images={projectDetail?.images || []}
              onDeleteImage={handleDeleteImage}
              loading={loading}
            />
          ) : (
            <div style={{ 
              textAlign: 'center', 
              color: '#666', 
              padding: '4rem',
              background: 'white',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
              <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>欢迎使用截图管理工具</div>
              <div style={{ marginBottom: '2rem', color: '#999' }}>
                选择现有项目或创建新项目开始管理您的截图
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => setShowProjectSelector(true)}
                style={{ fontSize: '1.1rem', padding: '0.75rem 1.5rem' }}
              >
                🚀 选择/创建项目
              </button>
            </div>
          )}
        </div>
      </div>

      {showProjectSelector && (
        <ProjectSelector
          onProjectSelect={handleProjectSelect}
          onClose={() => setShowProjectSelector(false)}
        />
      )}
    </div>
  );
}

export default App;