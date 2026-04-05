import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Bell, Shield } from 'lucide-react'

const titles = {
  '/admin/dashboard': 'Dashboard',
  '/admin/tables': 'Table Management',
  '/admin/products': 'Product Management',
  '/admin/orders':   'Order Monitoring',
  '/admin/analytics': 'Analytics',
  '/admin/staff':     'Staff Management',
}

export default function AdminNavbar() {
  const { user } = useAuth()
  const { pathname } = useLocation()

  return (
    <header className="h-14 flex items-center justify-between px-6 shrink-0 border-b"
      style={{ background: 'rgba(26,16,64,0.8)', borderColor: '#2d1f5e', backdropFilter: 'blur(12px)' }}>
      <h2 className="font-semibold text-white">{titles[pathname] || 'Admin'}</h2>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
          <Shield size={13} className="text-purple-400" />
          <span className="text-xs font-medium text-purple-300">Admin</span>
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <span className="text-sm text-gray-300 hidden md:block">{user?.name}</span>
      </div>
    </header>
  )
}
