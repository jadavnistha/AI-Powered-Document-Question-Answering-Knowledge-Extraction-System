import { createContext, useContext, useEffect, useState } from 'react'
import * as authApi from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('documind_user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('documind_token')
    if (!token) {
      setLoading(false)
      return
    }
    authApi
      .me()
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('documind_token')
        localStorage.removeItem('documind_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const persistSession = (token, user) => {
    localStorage.setItem('documind_token', token)
    localStorage.setItem('documind_user', JSON.stringify(user))
    setUser(user)
  }

  const login = async (email, password) => {
    const res = await authApi.login(email, password)
    persistSession(res.data.token, res.data.user)
  }

  const register = async (name, email, password) => {
    const res = await authApi.register(name, email, password)
    persistSession(res.data.token, res.data.user)
  }

  const logout = () => {
    localStorage.removeItem('documind_token')
    localStorage.removeItem('documind_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
