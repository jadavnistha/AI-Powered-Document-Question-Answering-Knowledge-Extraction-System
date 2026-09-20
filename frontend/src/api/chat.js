import apiClient from './client'

export const askQuestion = (documentId, question) =>
  apiClient.post(`/chat/${documentId}/ask`, { question })

export const getHistory = (documentId) =>
  apiClient.get(`/chat/${documentId}/history`)
