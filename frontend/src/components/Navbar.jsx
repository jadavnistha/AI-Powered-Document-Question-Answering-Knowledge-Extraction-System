import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="border-b border-rule bg-paper-alt">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <button onClick={() => navigate('/dashboard')}>
          <Logo />
        </button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-ink-soft hidden sm:inline">{user?.name}</span>
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="text-ink-soft hover:text-ink transition-colors"
            aria-label="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
