import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ImageGrid } from '../../components/ImageGrid'
import { ImageInfo } from '../../types'

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn(),
})

describe('ImageGrid', () => {
  const mockImages: ImageInfo[] = [
    { filename: '1.jpg', url: '/api/projects/test/images/1.jpg' },
    { filename: '2.jpg', url: '/api/projects/test/images/2.jpg' },
  ]

  it('renders loading state', () => {
    render(<ImageGrid images={[]} onDeleteImage={vi.fn()} loading={true} />)
    
    expect(screen.getByText('加载图片中...')).toBeInTheDocument()
  })

  it('renders empty state', () => {
    render(<ImageGrid images={[]} onDeleteImage={vi.fn()} />)
    
    expect(screen.getByText('暂无图片')).toBeInTheDocument()
    expect(screen.getByText(/在左侧粘贴区域上传/)).toBeInTheDocument()
  })

  it('renders images correctly', () => {
    render(<ImageGrid images={mockImages} onDeleteImage={vi.fn()} />)
    
    // Check images are rendered
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2)
    
    expect(images[0]).toHaveAttribute('src', '/api/projects/test/images/1.jpg')
    expect(images[0]).toHaveAttribute('alt', '1.jpg')
    
    expect(images[1]).toHaveAttribute('src', '/api/projects/test/images/2.jpg')
    expect(images[1]).toHaveAttribute('alt', '2.jpg')
    
    // Check filenames are displayed
    expect(screen.getByText('1.jpg')).toBeInTheDocument()
    expect(screen.getByText('2.jpg')).toBeInTheDocument()
    
    // Check delete buttons exist
    const deleteButtons = screen.getAllByTitle(/删除/)
    expect(deleteButtons).toHaveLength(2)
  })

  it('handles delete confirmation and calls onDeleteImage', () => {
    const onDeleteImage = vi.fn()
    const mockConfirm = vi.mocked(window.confirm)
    mockConfirm.mockReturnValue(true)
    
    render(<ImageGrid images={mockImages} onDeleteImage={onDeleteImage} />)
    
    const deleteButtons = screen.getAllByTitle(/删除/)
    fireEvent.click(deleteButtons[0])
    
    expect(mockConfirm).toHaveBeenCalledWith('确定要删除图片 1.jpg 吗？')
    expect(onDeleteImage).toHaveBeenCalledWith('1.jpg')
  })

  it('does not call onDeleteImage when confirmation is cancelled', () => {
    const onDeleteImage = vi.fn()
    const mockConfirm = vi.mocked(window.confirm)
    mockConfirm.mockReturnValue(false)
    
    render(<ImageGrid images={mockImages} onDeleteImage={onDeleteImage} />)
    
    const deleteButtons = screen.getAllByTitle(/删除/)
    fireEvent.click(deleteButtons[0])
    
    expect(mockConfirm).toHaveBeenCalledWith('确定要删除图片 1.jpg 吗？')
    expect(onDeleteImage).not.toHaveBeenCalled()
  })

  it('stops event propagation on delete button click', () => {
    const onDeleteImage = vi.fn()
    const mockConfirm = vi.mocked(window.confirm)
    mockConfirm.mockReturnValue(true)
    
    render(<ImageGrid images={mockImages} onDeleteImage={onDeleteImage} />)
    
    const deleteButton = screen.getAllByTitle(/删除/)[0]
    fireEvent.click(deleteButton)
    
    expect(mockConfirm).toHaveBeenCalledWith('确定要删除图片 1.jpg 吗？')
    expect(onDeleteImage).toHaveBeenCalledWith('1.jpg')
    
    // No image viewer should be opened since we clicked delete, not the image
    expect(screen.queryByText('点击空白处关闭 • ESC 退出')).not.toBeInTheDocument()
  })

  it('opens image viewer when clicking on image item', () => {
    render(<ImageGrid images={mockImages} onDeleteImage={vi.fn()} />)
    
    const imageItems = screen.getAllByTitle(/点击查看大图/)
    expect(imageItems).toHaveLength(2)
    
    // Click on first image
    fireEvent.click(imageItems[0])
    
    // Check if ImageViewer is rendered - use getAllByAltText since there are now two images with same alt
    const images = screen.getAllByAltText('1.jpg')
    expect(images).toHaveLength(2) // One in grid, one in viewer
    expect(screen.getByText('点击空白处关闭 • ESC 退出')).toBeInTheDocument()
  })

  it('closes image viewer when close is triggered', () => {
    render(<ImageGrid images={mockImages} onDeleteImage={vi.fn()} />)
    
    // Open image viewer
    const imageItems = screen.getAllByTitle(/点击查看大图/)
    fireEvent.click(imageItems[0])
    
    // Check that viewer is open
    expect(screen.getByText('点击空白处关闭 • ESC 退出')).toBeInTheDocument()
    
    // Close viewer
    const closeButton = screen.getByTitle('关闭 (ESC)')
    fireEvent.click(closeButton)
    
    // Check that viewer is closed
    expect(screen.queryByText('点击空白处关闭 • ESC 退出')).not.toBeInTheDocument()
  })
})