import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Coffee, ArrowRight, Zap, ShieldCheck, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await login(form.username, form.password)
      // Route based on role from database
      if (user.role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate('/staff/tables')
      }
    } catch (err) {
      const msg = err.response?.data?.detail
      if (msg === 'Invalid credentials') {
        setError('Username or password is incorrect.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0f1117' }}>

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1c2333 0%, #0f1117 100%)' }}>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(ellipse at 30% 20%, rgba(249,115,22,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(249,115,22,0.08) 0%, transparent 60%)'
        }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-brand">
              <Coffee size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">CaféPOS</span>
          </div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              The smarter way<br />to run your café
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Manage orders, tables, kitchen, and payments — all in one beautiful dashboard.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 space-y-3">
          {[
            { icon: Zap, text: 'Real-time kitchen display' },
            { icon: Coffee, text: 'Smart table management' },
            { icon: ArrowRight, text: 'Instant payment processing' },
          ].map(({ icon: Icon, text }, i) => (
            <motion.div key={text} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center gap-3 text-gray-400">
              <div className="w-7 h-7 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center">
                <Icon size={14} className="text-brand" />
              </div>
              <span className="text-sm">{text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Coffee size={16} className="text-white" />
            </div>
            <span className="font-bold text-white">CaféPOS</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-8">Sign in with your registered account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error */}
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="input-field"
                placeholder="Enter your username"
                required
                autoFocus
                autoComplete="username"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field pr-11"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </motion.button>
          </form>

          {/* Role info — no hardcoded credentials, just explains the two roles */}
          <div className="mt-6 space-y-2">
            <p className="text-xs text-gray-600 text-center mb-3">Your dashboard is determined by your account role</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-2 border border-surface-border">
                <ShieldCheck size={13} className="text-purple-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-white">Admin</p>
                  <p className="text-[10px] text-gray-500">Full management</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-2 border border-surface-border">
                <Users size={13} className="text-brand shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-white">Staff</p>
                  <p className="text-[10px] text-gray-500">Orders & payments</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-5">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand hover:text-brand-light font-medium transition-colors">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
