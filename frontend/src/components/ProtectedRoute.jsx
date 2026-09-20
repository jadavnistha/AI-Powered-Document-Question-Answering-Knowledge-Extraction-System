import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingUnderline from './LoadingUnderline'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="w-48">
          <LoadingUnderline />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
