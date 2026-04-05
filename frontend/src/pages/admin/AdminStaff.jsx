import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Shield, User, ChevronDown } from 'lucide-react'
import api from '../../services/api'
import Skeleton from '../../components/common/Skeleton'
import { notify } from '../../utils/toast'
import { useAuth } from '../../context/AuthContext'

const ROLE_CONFIG = {
  admin: { label: 'Admin', icon: Shield, badge: 'bg-brand/20 text-brand border-brand/30', dot: 'bg-brand' },
  staff: { label: 'Staff', icon: User,   badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30', dot: 'bg-blue-400' },
}

export default function AdminStaff() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [promoting, setPromoting] = useState(null) // userId being updated
  const { user: me } = useAuth()

  const fetchUsers = () => {
    setLoading(true)
    api.get('/analytics/staff')
      .then(r => { setUsers(r.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetchUsers() }, [])

  const handleRoleChange = async (userId, newRole) => {
    if (userId === me?.id) {
      notify.error("You can't change your own role")
      return
    }
    setPromoting(userId)
    try {
      await api.post('/auth/promote', { user_id: userId, role: newRole })
      notify.success(`Role updated to ${newRole}`)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (err) {
      notify.error(err.response?.data?.detail || 'Failed to update role')
    } finally {
      setPromoting(null)
    }
  }

  const admins = users.filter(u => u.role === 'admin')
  const staff  = users.filter(u => u.role === 'staff')

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 bg-surface-2 border border-surface-border px-2.5 py-1 rounded-lg">
              {admins.length} admin{admins.length !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-gray-500 bg-surface-2 border border-surface-border px-2.5 py-1 rounded-lg">
              {staff.length} staff
            </span>
          </div>
        </div>
        <button onClick={fetchUsers} className="btn-ghost w-9 h-9 p-0 flex items-center justify-center">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-brand/5 border border-brand/20 rounded-2xl px-4 py-3 mb-6">
        <Shield size={15} className="text-brand shrink-0 mt-0.5" />
        <p className="text-xs text-gray-400 leading-relaxed">
          Only admins can change user roles. Promote a staff member to admin to grant full system access.
          You cannot change your own role.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {users.map((u, i) => {
              const cfg = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.staff
              const isMe = u.id === me?.id
              const isBusy = promoting === u.id

              return (
                <motion.div key={u.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className={`glass-card p-4 flex items-center gap-4 transition-all
                    ${isMe ? 'border-brand/20 bg-brand/5' : ''}`}>

                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${cfg.badge}`}>
                    <cfg.icon size={16} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                      {isMe && (
                        <span className="text-xs bg-brand/20 text-brand border border-brand/30 px-2 py-0.5 rounded-full shrink-0">You</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">@{u.username}</p>
                  </div>

                  {/* Role badge */}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize shrink-0 ${cfg.badge}`}>
                    {cfg.label}
                  </span>

                  {/* Role toggle — disabled for self */}
                  {!isMe && (
                    <div className="relative shrink-0">
                      <select
                        value={u.role}
                        disabled={isBusy}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        className="appearance-none bg-surface-2 border border-surface-border text-gray-300 text-xs font-medium
                          rounded-xl pl-3 pr-8 py-2 cursor-pointer hover:border-gray-500 focus:outline-none
                          focus:border-brand/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                      <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                        {isBusy
                          ? <svg className="animate-spin h-3 w-3 text-brand" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                          : <ChevronDown size={12} className="text-gray-500" />
                        }
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>

          {users.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <p className="text-4xl mb-2">👥</p>
              <p className="text-sm">No users found</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
