import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import api from '../../services/api'
import { formatCurrency } from '../../utils/helpers'
import Skeleton from '../../components/common/Skeleton'

const COLORS = ['#7c3aed', '#4f46e5', '#2563eb', '#0891b2', '#059669', '#d97706']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length)
    return (
      <div className="px-3 py-2 text-xs rounded-xl border" style={{ background: '#1a1040', borderColor: '#2d1f5e' }}>
        <p className="text-gray-400">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name === 'revenue' ? formatCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    )
  return null
}

export default function AdminAnalytics() {
  const [daily, setDaily] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/analytics/daily-revenue'),
      api.get('/analytics/top-products'),
      api.get('/analytics/overview'),
    ]).then(([d, t, o]) => {
      setDaily(d.data)
      setTopProducts(t.data)
      setOverview(o.data)
      setLoading(false)
    })
  }, [])

  const pieData = overview ? [
    { name: 'Pending', value: overview.pending },
    { name: 'Preparing', value: overview.preparing },
    { name: 'Completed', value: overview.completed },
  ].filter(d => d.value > 0) : []

  const totalRevenue = daily.reduce((s, d) => s + d.revenue, 0)
  const totalOrdersWeek = daily.reduce((s, d) => s + d.orders, 0)
  const avgOrder = totalOrdersWeek > 0 ? totalRevenue / totalOrdersWeek : 0

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: '7-Day Revenue', value: formatCurrency(totalRevenue), sub: 'From paid orders' },
          { label: 'Orders This Week', value: totalOrdersWeek, sub: 'Total placed' },
          { label: 'Avg Order Value', value: formatCurrency(avgOrder), sub: 'Per transaction' },
        ].map(({ label, value, sub }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="rounded-2xl border p-5" style={{ background: 'rgba(26,16,64,0.6)', borderColor: '#2d1f5e' }}>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-2xl font-bold text-white">{loading ? '—' : value}</p>
            <p className="text-xs text-gray-500 mt-1">{sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue bar chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl border p-5" style={{ background: 'rgba(26,16,64,0.6)', borderColor: '#2d1f5e' }}>
          <h3 className="font-semibold text-white mb-1">Daily Revenue</h3>
          <p className="text-xs text-gray-500 mb-4">Last 7 days</p>
          {loading ? <Skeleton className="h-48" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={daily} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d1f5e" vertical={false} />
                <XAxis dataKey="date" stroke="#4b5563" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#4b5563" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,58,237,0.05)' }} />
                <Bar dataKey="revenue" name="revenue" fill="url(#purpleGrad2)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="purpleGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Orders line chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl border p-5" style={{ background: 'rgba(26,16,64,0.6)', borderColor: '#2d1f5e' }}>
          <h3 className="font-semibold text-white mb-1">Daily Orders</h3>
          <p className="text-xs text-gray-500 mb-4">Order count per day</p>
          {loading ? <Skeleton className="h-48" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d1f5e" vertical={false} />
                <XAxis dataKey="date" stroke="#4b5563" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#4b5563" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#7c3aed', strokeWidth: 1 }} />
                <Line type="monotone" dataKey="orders" name="orders" stroke="#7c3aed" strokeWidth={2.5} dot={{ fill: '#7c3aed', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Top products */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl border p-5" style={{ background: 'rgba(26,16,64,0.6)', borderColor: '#2d1f5e' }}>
          <h3 className="font-semibold text-white mb-4">Top Products by Sales</h3>
          {loading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div> : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: COLORS[i % COLORS.length] }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{p.name}</span>
                      <span className="text-gray-400">{p.quantity} sold · {formatCurrency(p.revenue)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${(p.quantity / (topProducts[0]?.quantity || 1)) * 100}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && <p className="text-gray-500 text-sm">No sales data yet. Run seed.py to add sample data.</p>}
            </div>
          )}
        </motion.div>

        {/* Pie chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="rounded-2xl border p-5" style={{ background: 'rgba(26,16,64,0.6)', borderColor: '#2d1f5e' }}>
          <h3 className="font-semibold text-white mb-4">Order Status Distribution</h3>
          {loading ? <Skeleton className="h-48" /> : pieData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-gray-300">{d.name}</span>
                    <span className="text-sm font-bold text-white ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-gray-500 text-sm">No order data yet</p>}
        </motion.div>
      </div>
    </div>
  )
}
