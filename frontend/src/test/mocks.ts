import { vi } from 'vitest'

// Mock fetch for API tests
export const mockFetch = vi.fn()

// Mock clipboard API for paste tests
export const mockClipboard = {
  readText: vi.fn(),
  writeText: vi.fn(),
  read: vi.fn(),
  write: vi.fn(),
}

// Mock file for drag and drop tests
export const createMockFile = (name: string, type: string, content: string = 'test content') => {
  const file = new File([content], name, { type })
  return file
}

// Mock image for paste tests
export const createMockImageFile = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 100
  canvas.height = 100
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = 'red'
    ctx.fillRect(0, 0, 100, 100)
  }
  return canvas.toDataURL('image/png')
}