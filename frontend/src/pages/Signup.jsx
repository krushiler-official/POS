import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Coffee, ArrowRight, CheckCircle } from 'lucide-react'
import api from '../services/api'

const passwordStrength = (p) => {
  let score = 0
  if (p.length >= 6) score++
  if (p.length >= 10) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  return score
}
const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500']
const strengthText  = ['', 'text-red-400', 'text-orange-400', 'text-yellow-400', 'text-green-400', 'text-emerald-400']

export default function Signup() {
  const [form, setForm] = useState({ name: '', username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()
  const strength = passwordStrength(form.password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/register', form)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2200)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0f1117' }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.1) 0%, transparent 60%)'
      }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="relative w-full max-w-md">

        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-brand">
            <Coffee size={18} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg">CaféPOS</span>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div key="success"
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-12 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-green-500/15 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={36} className="text-green-400" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">Account Created!</h3>
              <p className="text-gray-400 text-sm">Redirecting to login…</p>
            </motion.div>
          ) : (
            <motion.div key="form" className="glass-card p-7">
              <h2 className="text-2xl font-bold text-white mb-1">Create account</h2>
              <p className="text-gray-500 text-sm mb-6">Join your team on CaféPOS as staff</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
                  <input type="text" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="input-field" placeholder="Your full name" required />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Username</label>
                  <input type="text" value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    className="input-field" placeholder="Choose a username" required />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      className="input-field pr-11" placeholder="Create a password" required minLength={6} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="space-y-1 pt-0.5">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300
                            ${i <= strength ? strengthColor[strength] : 'bg-surface-3'}`} />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${strengthText[strength]}`}>{strengthLabel[strength]}</p>
                    </div>
                  )}
                </div>

                <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
                  className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 mt-1">
                  {loading ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <>Create Staff Account <ArrowRight size={16} /></>
                  )}
                </motion.button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-5">
                Already have an account?{' '}
                <Link to="/login" className="text-brand hover:text-brand-light font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
