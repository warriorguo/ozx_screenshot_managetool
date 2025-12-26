import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectSelector } from '../../components/ProjectSelector'
import * as api from '../../api'

// Mock the API
vi.mock('../../api')

describe('ProjectSelector', () => {
  const mockOnProjectSelect = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders correctly with loading state', () => {
    vi.mocked(api.api.listProjects).mockReturnValue(new Promise(() => {})) // Never resolves
    
    render(
      <ProjectSelector 
        onProjectSelect={mockOnProjectSelect} 
        onClose={mockOnClose} 
      />
    )
    
    expect(screen.getByText('选择项目')).toBeInTheDocument()
    expect(screen.getByText('加载中...')).toBeInTheDocument()
  })

  it('renders project list when loaded', async () => {
    vi.mocked(api.api.listProjects).mockResolvedValue({
      projects: ['project1', 'project2']
    })
    
    render(
      <ProjectSelector 
        onProjectSelect={mockOnProjectSelect} 
        onClose={mockOnClose} 
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText('project1')).toBeInTheDocument()
      expect(screen.getByText('project2')).toBeInTheDocument()
    })
  })

  it('renders empty state when no projects', async () => {
    vi.mocked(api.api.listProjects).mockResolvedValue({
      projects: []
    })
    
    render(
      <ProjectSelector 
        onProjectSelect={mockOnProjectSelect} 
        onClose={mockOnClose} 
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText('暂无项目，请创建新项目')).toBeInTheDocument()
    })
  })

  it('handles project selection', async () => {
    vi.mocked(api.api.listProjects).mockResolvedValue({
      projects: ['project1', 'project2']
    })
    
    render(
      <ProjectSelector 
        onProjectSelect={mockOnProjectSelect} 
        onClose={mockOnClose} 
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText('project1')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('project1'))
    
    expect(mockOnProjectSelect).toHaveBeenCalledWith('project1')
  })

  it('handles close button', () => {
    vi.mocked(api.api.listProjects).mockResolvedValue({
      projects: []
    })
    
    render(
      <ProjectSelector 
        onProjectSelect={mockOnProjectSelect} 
        onClose={mockOnClose} 
      />
    )
    
    fireEvent.click(screen.getByText('×'))
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('handles new project creation', async () => {
    const user = userEvent.setup()
    
    vi.mocked(api.api.listProjects).mockResolvedValue({
      projects: []
    })
    vi.mocked(api.api.createProject).mockResolvedValue({
      name: 'new-project',
      created: true
    })
    
    render(
      <ProjectSelector 
        onProjectSelect={mockOnProjectSelect} 
        onClose={mockOnClose} 
      />
    )
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('输入新项目名...')).toBeInTheDocument()
    })
    
    const input = screen.getByPlaceholderText('输入新项目名...')
    const createButton = screen.getByText('创建')
    
    await user.type(input, 'new-project')
    await user.click(createButton)
    
    expect(api.api.createProject).toHaveBeenCalledWith('new-project')
    await waitFor(() => {
      expect(mockOnProjectSelect).toHaveBeenCalledWith('new-project')
    })
  })

  it('validates project name pattern', async () => {
    const user = userEvent.setup()
    
    vi.mocked(api.api.listProjects).mockResolvedValue({
      projects: []
    })
    
    render(
      <ProjectSelector 
        onProjectSelect={mockOnProjectSelect} 
        onClose={mockOnClose} 
      />
    )
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('输入新项目名...')).toBeInTheDocument()
    })
    
    const input = screen.getByPlaceholderText('输入新项目名...')
    const createButton = screen.getByText('创建')
    
    // Test invalid characters
    await user.type(input, 'invalid/project')
    
    // Form validation should prevent submission
    expect(createButton).toBeDisabled()
  })

  it('handles API errors', async () => {
    vi.mocked(api.api.listProjects).mockRejectedValue(
      new api.ApiError('Network error', 500)
    )
    
    render(
      <ProjectSelector 
        onProjectSelect={mockOnProjectSelect} 
        onClose={mockOnClose} 
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('handles create project errors', async () => {
    const user = userEvent.setup()
    
    vi.mocked(api.api.listProjects).mockResolvedValue({
      projects: []
    })
    vi.mocked(api.api.createProject).mockRejectedValue(
      new api.ApiError('Invalid project name', 400)
    )
    
    render(
      <ProjectSelector 
        onProjectSelect={mockOnProjectSelect} 
        onClose={mockOnClose} 
      />
    )
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('输入新项目名...')).toBeInTheDocument()
    })
    
    const input = screen.getByPlaceholderText('输入新项目名...')
    const createButton = screen.getByText('创建')
    
    await user.type(input, 'test-project')
    await user.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('Invalid project name')).toBeInTheDocument()
    })
    expect(mockOnProjectSelect).not.toHaveBeenCalled()
  })
})