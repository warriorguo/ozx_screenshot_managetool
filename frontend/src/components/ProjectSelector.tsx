import React, { useState, useEffect } from 'react';
import { api, ApiError } from '../api';

interface ProjectSelectorProps {
  onProjectSelect: (projectName: string) => void;
  onClose: () => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ onProjectSelect, onClose }) => {
  const [projects, setProjects] = useState<string[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.listProjects();
      setProjects(response.projects);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      setCreating(true);
      setError(null);
      await api.createProject(newProjectName.trim());
      onProjectSelect(newProjectName.trim());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>选择项目</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <>
            {/* 创建新项目区域 - 放在顶部更突出 */}
            <div style={{ 
              background: '#f8f9fa', 
              padding: '1.5rem', 
              borderRadius: '8px', 
              marginBottom: '1.5rem',
              border: '2px dashed #007bff'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#007bff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ✨ 创建新项目
              </h3>
              <form className="new-project" onSubmit={handleCreateProject}>
                <input
                  type="text"
                  placeholder="输入项目名称（如：我的截图集、产品设计图等）"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  pattern="[A-Za-z0-9._-]+"
                  title="项目名只能包含字母、数字、点、下划线和短横线"
                  disabled={creating}
                  style={{ flex: 1 }}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={creating || !newProjectName.trim()}
                >
                  {creating ? '创建中...' : '🚀 创建项目'}
                </button>
              </form>
              <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                💡 项目名只能包含字母、数字、点(.)、下划线(_)和短横线(-)
              </div>
            </div>

            {/* 现有项目列表 */}
            {projects.length > 0 && (
              <>
                <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>现有项目</h3>
                <div className="project-list">
                  {projects.map(project => (
                    <div
                      key={project}
                      className="project-item"
                      onClick={() => onProjectSelect(project)}
                      style={{ cursor: 'pointer' }}
                    >
                      📁 {project}
                    </div>
                  ))}
                </div>
              </>
            )}

            {projects.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                color: '#666', 
                padding: '2rem',
                background: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📂</div>
                <div>还没有任何项目</div>
                <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  在上方创建您的第一个项目开始使用
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};