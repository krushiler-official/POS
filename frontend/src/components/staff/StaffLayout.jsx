import { NavLink, useNavigate } from 'react-router-dom'
import { UtensilsCrossed, ShoppingCart, ChefHat, CreditCard, LogOut, Coffee } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useOrder } from '../../context/OrderContext'

const links = [
  { to: '/staff/tables', icon: UtensilsCrossed, label: 'Tables' },
  { to: '/staff/order', icon: ShoppingCart, label: 'Order' },
  { to: '/staff/kitchen', icon: ChefHat, label: 'Kitchen' },
  { to: '/staff/payment', icon: CreditCard, label: 'Payment' },
]

export default function StaffLayout({ children }) {
  const { user, logout } = useAuth()
  const { cart } = useOrder()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Compact sidebar */}
      <aside className="w-16 flex flex-col items-center py-4 gap-2 shrink-0"
        style={{ background: '#111827', borderRight: '1px solid #1f2937' }}>
        <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center mb-4 shadow-glow-sm">
          <Coffee size={16} className="text-white" />
        </div>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} title={label}
            className={({ isActive }) =>
              `relative w-10 h-10 rounded-xl flex items-center justify-center transition-all
              ${isActive ? 'bg-brand/20 text-brand' : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'}`
            }
          >
            <Icon size={18} />
            {to === '/staff/order' && cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </NavLink>
        ))}
        <div className="flex-1" />
        <button onClick={() => { logout(); navigate('/login') }} title="Logout"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all">
          <LogOut size={18} />
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-12 glass border-b border-surface-border/60 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-400">Staff Portal</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span className="text-xs text-brand font-medium">{user?.name}</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-brand/10 border border-brand/20">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-brand font-medium">Online</span>
          </div>
        </header>
        <main className="flex-1 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}
