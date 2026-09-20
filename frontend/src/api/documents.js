import apiClient from './client'

export const listDocuments = () => apiClient.get('/documents')

export const getDocument = (id) => apiClient.get(`/documents/${id}`)

export const uploadDocument = (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  return apiClient.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total))
      }
    },
  })
}

export const deleteDocument = (id) => apiClient.delete(`/documents/${id}`)
