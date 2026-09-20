import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Logo from '../components/Logo'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { register } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await register(name, email, password)
      navigate('/dashboard')
    } catch (err) {
      showToast(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="md:w-1/2 bg-paper-alt border-b md:border-b-0 md:border-r border-rule flex flex-col justify-center px-8 py-16 md:px-16">
        <Logo size={28} />
        <h1 className="mt-8 text-4xl md:text-5xl leading-tight text-ink">
          Every answer,
          <br />
          annotated.
        </h1>
        <p className="mt-4 text-ink-soft max-w-sm">
          Create an account to start extracting summaries, keywords and
          study notes from your PDFs in seconds.
        </p>
      </div>

      <div className="md:w-1/2 flex items-center justify-center px-8 py-16">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <h2 className="text-2xl font-serif text-ink mb-1">Create your account</h2>
          <p className="text-sm text-ink-soft mb-6">
            It only takes a moment.
          </p>

          <label className="block text-sm text-ink-soft mb-1">Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field mb-4"
            placeholder="Ada Lovelace"
          />

          <label className="block text-sm text-ink-soft mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field mb-4"
            placeholder="you@example.com"
          />

          <label className="block text-sm text-ink-soft mb-1">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field mb-6"
            placeholder="At least 6 characters"
          />

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Creating account…' : 'Create account'}
          </button>

          <p className="mt-6 text-sm text-ink-soft text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-annotation hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
