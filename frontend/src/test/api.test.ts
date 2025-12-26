import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api, ApiError } from '../api'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('listProjects', () => {
    it('should fetch project list successfully', async () => {
      const mockResponse = { projects: ['project1', 'project2'] }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.listProjects()
      
      expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
        headers: { 'Content-Type': 'application/json' },
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ detail: 'Server error' }),
      })

      await expect(api.listProjects()).rejects.toThrow(ApiError)
    })
  })

  describe('createProject', () => {
    it('should create project successfully', async () => {
      const mockResponse = { name: 'test-project', created: true }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.createProject('test-project')
      
      expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'test-project' }),
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('uploadImage', () => {
    it('should upload image successfully', async () => {
      const mockFile = new File(['image content'], 'test.png', { type: 'image/png' })
      const mockResponse = { filename: '1.jpg', url: '/api/projects/test/images/1.jpg' }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.uploadImage('test-project', mockFile)
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects/test-project/images',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle upload error', async () => {
      const mockFile = new File(['image content'], 'test.png', { type: 'image/png' })
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 413,
        json: () => Promise.resolve({ detail: 'File too large' }),
      })

      await expect(api.uploadImage('test-project', mockFile)).rejects.toThrow('File too large')
    })
  })

  describe('getProjectDetail', () => {
    it('should get project details successfully', async () => {
      const mockResponse = {
        name: 'test-project',
        images: [{ filename: '1.jpg', url: '/api/projects/test-project/images/1.jpg' }],
        readme: '# Test Project'
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.getProjectDetail('test-project')
      
      expect(mockFetch).toHaveBeenCalledWith('/api/projects/test-project', {
        headers: { 'Content-Type': 'application/json' },
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateReadme', () => {
    it('should update README successfully', async () => {
      const content = '# Updated README'
      const mockResponse = { content }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.updateReadme('test-project', content)
      
      expect(mockFetch).toHaveBeenCalledWith('/api/projects/test-project/readme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      const mockResponse = { deleted: true }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.deleteImage('test-project', '1.jpg')
      
      expect(mockFetch).toHaveBeenCalledWith('/api/projects/test-project/images/1.jpg', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      expect(result).toEqual(mockResponse)
    })
  })
})