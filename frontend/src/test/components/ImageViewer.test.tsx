import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ImageViewer } from '../../components/ImageViewer'

// Mock console.log to avoid cluttering test output
const originalLog = console.log
beforeEach(() => {
  console.log = vi.fn()
})

afterEach(() => {
  console.log = originalLog
})

describe('ImageViewer', () => {
  const mockOnClose = vi.fn()
  const mockProps = {
    imageUrl: '/test-image.jpg',
    imageName: 'test-image.jpg',
    onClose: mockOnClose
  }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders image viewer correctly', () => {
    render(<ImageViewer {...mockProps} />)
    
    expect(screen.getByAltText('test-image.jpg')).toBeInTheDocument()
    expect(screen.getByText('test-image.jpg')).toBeInTheDocument()
    expect(screen.getByText('点击空白处关闭 • ESC 退出')).toBeInTheDocument()
  })

  it('renders close button', () => {
    render(<ImageViewer {...mockProps} />)
    
    const closeButton = screen.getByTitle('关闭 (ESC)')
    expect(closeButton).toBeInTheDocument()
    expect(closeButton).toHaveTextContent('×')
  })

  it('calls onClose when close button is clicked', () => {
    render(<ImageViewer {...mockProps} />)
    
    const closeButton = screen.getByTitle('关闭 (ESC)')
    fireEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', () => {
    render(<ImageViewer {...mockProps} />)
    
    const overlay = document.querySelector('.image-viewer-overlay')
    expect(overlay).toBeInTheDocument()
    
    fireEvent.click(overlay!)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when clicking on image', () => {
    render(<ImageViewer {...mockProps} />)
    
    const image = screen.getByAltText('test-image.jpg')
    fireEvent.click(image)
    
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('calls onClose when ESC key is pressed', () => {
    render(<ImageViewer {...mockProps} />)
    
    fireEvent.keyDown(document, { key: 'Escape' })
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose for other keys', () => {
    render(<ImageViewer {...mockProps} />)
    
    fireEvent.keyDown(document, { key: 'Enter' })
    fireEvent.keyDown(document, { key: 'Space' })
    
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('sets body overflow to hidden on mount', () => {
    const originalOverflow = document.body.style.overflow
    
    render(<ImageViewer {...mockProps} />)
    
    expect(document.body.style.overflow).toBe('hidden')
    
    // Cleanup
    document.body.style.overflow = originalOverflow
  })

  it('restores body overflow on unmount', () => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'auto'
    
    const { unmount } = render(<ImageViewer {...mockProps} />)
    
    expect(document.body.style.overflow).toBe('hidden')
    
    unmount()
    
    expect(document.body.style.overflow).toBe('auto')
    
    // Cleanup
    document.body.style.overflow = originalOverflow
  })
})