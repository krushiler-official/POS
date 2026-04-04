import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, UtensilsCrossed, Package,
  ShoppingBag, BarChart3, LogOut, Users,
  ChevronLeft, ChevronRight, Shield
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const links = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/tables', icon: UtensilsCrossed, label: 'Tables' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/staff', icon: Users, label: 'Staff' },
]

export default function AdminSidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 220 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative flex flex-col py-5 shrink-0 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #1a1040 0%, #0f0a1e 100%)', borderRight: '1px solid #2d1f5e' }}
    >
      <div className="px-4 mb-6 flex items-center gap-3 overflow-hidden">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          <Shield size={16} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <p className="font-bold text-white text-sm">Admin Panel</p>
              <p className="text-xs text-purple-400">{user?.name}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 overflow-hidden
              ${isActive
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`
            }
          >
            <Icon size={18} className="shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      <div className="px-2 mt-2">
        <button onClick={() => { logout(); navigate('/login') }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all w-full text-sm overflow-hidden">
          <LogOut size={18} className="shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      <button onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-surface-2 border border-surface-border flex items-center justify-center text-gray-400 hover:text-white z-10">
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  )
}
