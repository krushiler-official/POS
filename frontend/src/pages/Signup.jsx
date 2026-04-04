import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Coffee, ArrowRight, CheckCircle, Shield, User, KeyRound, Info } from 'lucide-react'
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

const ROLES = [
  {
    id: 'staff',
    icon: User,
    label: 'Staff',
    description: 'Take orders, manage tables, process payments',
    color: 'border-blue-500/40 bg-blue-500/8 text-blue-400',
    activeRing: 'ring-blue-500/30',
  },
  {
    id: 'admin',
    icon: Shield,
    label: 'Admin',
    description: 'Full access — manage menu, staff, and analytics',
    color: 'border-brand/40 bg-brand/8 text-brand',
    activeRing: 'ring-brand/30',
  },
]

export default function Signup() {
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'staff', admin_key: '' })
  const [showPass, setShowPass] = useState(false)
  const [showKey, setShowKey] = useState(false)
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
      const payload = { ...form }
      if (form.role !== 'admin') delete payload.admin_key
      await api.post('/auth/register', payload)
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

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-brand">
            <Coffee size={18} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg">CaféPOS</span>
        </div>

        <AnimatePresence mode="wait">
          {/* ── Success state ── */}
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
              <p className="text-gray-400 text-sm">
                Signed up as <span className="text-white font-medium capitalize">{form.role}</span>.
                Redirecting to login…
              </p>
            </motion.div>

          ) : (
            /* ── Form state ── */
            <motion.div key="form" className="glass-card p-7">
              <h2 className="text-2xl font-bold text-white mb-1">Create account</h2>
              <p className="text-gray-500 text-sm mb-6">Join your team on CaféPOS</p>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Error banner */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Role selector ── */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    {ROLES.map(({ id, icon: Icon, label, description, color, activeRing }) => (
                      <button key={id} type="button" onClick={() => setForm({ ...form, role: id, admin_key: '' })}
                        className={`relative flex flex-col items-start gap-1.5 p-4 rounded-2xl border-2 text-left transition-all duration-200
                          ${form.role === id
                            ? `${color} ring-2 ${activeRing} shadow-lg`
                            : 'border-surface-border bg-surface-2 text-gray-500 hover:border-gray-500 hover:text-gray-300'}`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1
                          ${form.role === id ? 'bg-current/15' : 'bg-surface-3'}`}>
                          <Icon size={16} className={form.role === id ? '' : 'text-gray-500'} />
                        </div>
                        <span className="font-semibold text-sm">{label}</span>
                        <span className="text-xs leading-snug opacity-70">{description}</span>
                        {form.role === id && (
                          <motion.div layoutId="roleCheck"
                            className="absolute top-3 right-3 w-4 h-4 rounded-full bg-current/20 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-current" />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Admin key field (only when admin selected) ── */}
                <AnimatePresence>
                  {form.role === 'admin' && (
                    <motion.div key="admin-key"
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin Secret Key</label>
                          <div className="group relative">
                            <Info size={12} className="text-gray-600 cursor-help" />
                            <div className="absolute left-5 -top-1 w-52 bg-surface-3 border border-surface-border text-xs text-gray-400 px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                              Ask your manager for the admin registration key
                            </div>
                          </div>
                        </div>
                        <div className="relative">
                          <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand/60" />
                          <input
                            type={showKey ? 'text' : 'password'}
                            value={form.admin_key}
                            onChange={(e) => setForm({ ...form, admin_key: e.target.value })}
                            className="input-field pl-10 pr-11 border-brand/30 focus:border-brand/60 bg-brand/5"
                            placeholder="Enter admin secret key"
                            required={form.role === 'admin'}
                          />
                          <button type="button" onClick={() => setShowKey(!showKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                            {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                        <p className="text-xs text-brand/60 flex items-center gap-1.5">
                          <Shield size={11} />
                          Admin accounts have full system access
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Name ── */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
                  <input type="text" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field" placeholder="Your full name" required />
                </div>

                {/* ── Username ── */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Username</label>
                  <input type="text" value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="input-field" placeholder="Choose a username" required />
                </div>

                {/* ── Password ── */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="input-field pr-11" placeholder="Create a password" required minLength={6} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="space-y-1 pt-0.5">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300
                            ${i <= strength ? strengthColor[strength] : 'bg-surface-3'}`} />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${strengthText[strength]}`}>{strengthLabel[strength]}</p>
                    </div>
                  )}
                </div>

                {/* ── Submit ── */}
                <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
                  className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 mt-1">
                  {loading ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <>
                      Create {form.role === 'admin' ? 'Admin' : 'Staff'} Account
                      <ArrowRight size={16} />
                    </>
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
