import apiClient from './client'

export const getSummary = (documentId) =>
  apiClient.post(`/tools/${documentId}/summary`)

export const getKeywords = (documentId) =>
  apiClient.post(`/tools/${documentId}/keywords`)

export const getNotes = (documentId) =>
  apiClient.post(`/tools/${documentId}/notes`)
