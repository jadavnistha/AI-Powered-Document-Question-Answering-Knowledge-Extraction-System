import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('documind_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Every backend response is {success, data, error}. Unwrap it here so
// callers can just `await apiClient.get(...)` and get `data` back, or
// catch a plain Error with a readable message.
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error || error.message || 'Something went wrong'
    if (error.response?.status === 401) {
      localStorage.removeItem('documind_token')
      localStorage.removeItem('documind_user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(new Error(message))
  },
)

export default apiClient
