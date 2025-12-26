import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PasteArea } from '../../components/PasteArea'

describe('PasteArea', () => {
  it('renders correctly when enabled', () => {
    const onImagePaste = vi.fn()
    render(<PasteArea onImagePaste={onImagePaste} />)
    
    expect(screen.getByText('粘贴图片到这里')).toBeInTheDocument()
    expect(screen.getByText(/支持 Ctrl\+V/)).toBeInTheDocument()
  })

  it('renders correctly when disabled', () => {
    const onImagePaste = vi.fn()
    render(<PasteArea onImagePaste={onImagePaste} disabled={true} />)
    
    expect(screen.getByText('请先选择项目')).toBeInTheDocument()
  })

  it('handles paste events with image files', async () => {
    const onImagePaste = vi.fn()
    const user = userEvent.setup()
    
    render(<PasteArea onImagePaste={onImagePaste} />)
    
    const pasteArea = screen.getByText('粘贴图片到这里').closest('div')!
    
    // Mock clipboard data with image
    const mockFile = new File(['image content'], 'test.png', { type: 'image/png' })
    const clipboardData = {
      items: [
        {
          type: 'image/png',
          getAsFile: () => mockFile
        }
      ]
    }
    
    fireEvent.paste(pasteArea, {
      clipboardData
    })
    
    expect(onImagePaste).toHaveBeenCalledWith([mockFile])
  })

  it('ignores paste events with non-image files', () => {
    const onImagePaste = vi.fn()
    
    render(<PasteArea onImagePaste={onImagePaste} />)
    
    const pasteArea = screen.getByText('粘贴图片到这里').closest('div')!
    
    // Mock clipboard data with text
    const clipboardData = {
      items: [
        {
          type: 'text/plain',
          getAsFile: () => null
        }
      ]
    }
    
    fireEvent.paste(pasteArea, {
      clipboardData
    })
    
    expect(onImagePaste).not.toHaveBeenCalled()
  })

  it('handles drag and drop events', () => {
    const onImagePaste = vi.fn()
    
    render(<PasteArea onImagePaste={onImagePaste} />)
    
    const pasteArea = screen.getByText('粘贴图片到这里').closest('div')!
    
    // Test drag over
    fireEvent.dragOver(pasteArea)
    expect(pasteArea).toHaveClass('dragover')
    
    // Test drag leave
    fireEvent.dragLeave(pasteArea)
    expect(pasteArea).not.toHaveClass('dragover')
    
    // Test drop with image files
    const mockFile = new File(['image content'], 'test.png', { type: 'image/png' })
    const dataTransfer = {
      files: [mockFile]
    }
    
    fireEvent.drop(pasteArea, { dataTransfer })
    
    expect(onImagePaste).toHaveBeenCalledWith([mockFile])
    expect(pasteArea).not.toHaveClass('dragover')
  })

  it('does not handle events when disabled', () => {
    const onImagePaste = vi.fn()
    
    render(<PasteArea onImagePaste={onImagePaste} disabled={true} />)
    
    const pasteArea = screen.getByText('请先选择项目').closest('div')!
    
    // Try to paste
    const mockFile = new File(['image content'], 'test.png', { type: 'image/png' })
    const clipboardData = {
      items: [
        {
          type: 'image/png',
          getAsFile: () => mockFile
        }
      ]
    }
    
    fireEvent.paste(pasteArea, { clipboardData })
    
    expect(onImagePaste).not.toHaveBeenCalled()
    
    // Try to drag over
    fireEvent.dragOver(pasteArea)
    expect(pasteArea).not.toHaveClass('dragover')
  })

  it('focuses on click when enabled', () => {
    const onImagePaste = vi.fn()
    
    render(<PasteArea onImagePaste={onImagePaste} />)
    
    const pasteArea = screen.getByText('粘贴图片到这里').closest('div')!
    
    fireEvent.click(pasteArea)
    
    expect(pasteArea).toHaveFocus()
  })
})