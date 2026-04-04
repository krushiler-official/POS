import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, TrendingUp, UtensilsCrossed, Package, Clock, CheckCircle2, Users } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import CountUp from 'react-countup'
import api from '../../services/api'
import { formatCurrency, formatTime, statusColor } from '../../utils/helpers'
import Skeleton from '../../components/common/Skeleton'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length)
    return (
      <div className="px-3 py-2 text-xs rounded-xl border" style={{ background: '#1a1040', borderColor: '#2d1f5e' }}>
        <p className="text-gray-400">{label}</p>
        <p className="text-purple-300 font-semibold">{formatCurrency(payload[0].value)}</p>
      </div>
    )
  return null
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null)
  const [daily, setDaily] = useState([])
  const [orders, setOrders] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/daily-revenue'),
      api.get('/orders'),
      api.get('/analytics/top-products'),
    ]).then(([ov, dv, or, tp]) => {
      setOverview(ov.data)
      setDaily(dv.data)
      setOrders(or.data.slice(0, 6))
      setTopProducts(tp.data)
      setLoading(false)
    })
  }, [])

  const stats = overview ? [
    { label: 'Total Revenue', value: overview.total_revenue, icon: TrendingUp, color: 'from-purple-500/20 to-purple-600/5', border: 'border-purple-500/20', text: 'text-purple-400', isCurrency: true },
    { label: 'Total Orders', value: overview.total_orders, icon: ShoppingBag, color: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-500/20', text: 'text-blue-400' },
    { label: 'Active Tables', value: `${overview.occupied_tables}/${overview.total_tables}`, icon: UtensilsCrossed, color: 'from-orange-500/20 to-orange-600/5', border: 'border-orange-500/20', text: 'text-orange-400', isString: true },
    { label: 'Menu Items', value: overview.total_products, icon: Package, color: 'from-green-500/20 to-green-600/5', border: 'border-green-500/20', text: 'text-green-400' },
  ] : []

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />) :
          stats.map(({ label, value, icon: Icon, color, border, text, isCurrency, isString }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={`rounded-2xl border p-5 bg-gradient-to-br ${color} ${border}`}
              style={{ backdropFilter: 'blur(12px)' }}>
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
                <Icon size={18} className={`${text} opacity-70`} />
              </div>
              <p className="text-2xl font-bold text-white">
                {isString ? value : isCurrency ? formatCurrency(value) : <CountUp end={value} duration={1.5} />}
              </p>
            </motion.div>
          ))
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="lg:col-span-2 rounded-2xl border p-5"
          style={{ background: 'rgba(26,16,64,0.6)', borderColor: '#2d1f5e', backdropFilter: 'blur(12px)' }}>
          <h3 className="font-semibold text-white mb-1">Revenue — Last 7 Days</h3>
          <p className="text-xs text-gray-500 mb-4">Daily revenue from paid orders</p>
          {loading ? <Skeleton className="h-44" /> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={daily} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d1f5e" vertical={false} />
                <XAxis dataKey="date" stroke="#4b5563" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#4b5563" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,58,237,0.05)' }} />
                <Bar dataKey="revenue" fill="url(#purpleGrad)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Order status */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl border p-5"
          style={{ background: 'rgba(26,16,64,0.6)', borderColor: '#2d1f5e', backdropFilter: 'blur(12px)' }}>
          <h3 className="font-semibold text-white mb-4">Order Status</h3>
          {loading ? <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div> : (
            <div className="space-y-3">
              {[
                { label: 'Pending', value: overview?.pending || 0, color: 'bg-yellow-500', bg: 'bg-yellow-500/10' },
                { label: 'Preparing', value: overview?.preparing || 0, color: 'bg-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Completed', value: overview?.completed || 0, color: 'bg-green-500', bg: 'bg-green-500/10' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${bg}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${color}`} />
                    <span className="text-sm text-gray-300">{label}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{value}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="rounded-2xl border p-5"
          style={{ background: 'rgba(26,16,64,0.6)', borderColor: '#2d1f5e', backdropFilter: 'blur(12px)' }}>
          <h3 className="font-semibold text-white mb-4">Recent Orders</h3>
          <div className="space-y-2">
            {loading ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />) :
              orders.map((o, i) => (
                <motion.div key={o.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-gray-400"
                      style={{ background: '#1f1040' }}>
                      #{o.id?.slice(-3)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{o.items?.length} items</p>
                      <p className="text-xs text-gray-500">{formatTime(o.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{formatCurrency(o.total_amount)}</span>
                    <span className={`badge ${statusColor[o.status]}`}>{o.status}</span>
                  </div>
                </motion.div>
              ))
            }
          </div>
        </motion.div>

        {/* Top products */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-2xl border p-5"
          style={{ background: 'rgba(26,16,64,0.6)', borderColor: '#2d1f5e', backdropFilter: 'blur(12px)' }}>
          <h3 className="font-semibold text-white mb-4">Top Selling Items</h3>
          <div className="space-y-3">
            {loading ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />) :
              topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-500 w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{p.name}</span>
                      <span className="text-purple-400 font-medium">{p.quantity} sold</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5">
                      <div className="h-full rounded-full" style={{
                        width: `${Math.min(100, (p.quantity / (topProducts[0]?.quantity || 1)) * 100)}%`,
                        background: 'linear-gradient(90deg, #7c3aed, #4f46e5)'
                      }} />
                    </div>
                  </div>
                </div>
              ))
            }
            {!loading && topProducts.length === 0 && <p className="text-gray-500 text-sm">No sales data yet</p>}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
