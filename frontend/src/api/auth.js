import apiClient from './client'

export const register = (name, email, password) =>
  apiClient.post('/auth/register', { name, email, password })

export const login = (email, password) =>
  apiClient.post('/auth/login', { email, password })

export const me = () => apiClient.get('/auth/me')
