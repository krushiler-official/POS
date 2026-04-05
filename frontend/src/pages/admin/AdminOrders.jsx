import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, RefreshCw } from 'lucide-react'
import api from '../../services/api'
import Skeleton from '../../components/common/Skeleton'
import { formatCurrency, formatTime, statusColor } from '../../utils/helpers'

const STATUSES = ['all', 'pending', 'preparing', 'completed']

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const fetch = () => {
    setLoading(true)
    api.get('/orders')
      .then(r => { setOrders(r.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetch() }, [])

  const filtered = orders
    .filter(o => filter === 'all' || o.status === filter)
    .filter(o => o.id?.toLowerCase().includes(search.toLowerCase()) || o.table_id?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9 py-2" placeholder="Search by order ID or table..." />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize whitespace-nowrap transition-all
                ${filter === s ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-surface-2 border border-surface-border text-gray-400 hover:border-gray-500'}`}>
              {s}
            </button>
          ))}
        </div>
        <button onClick={fetch} className="btn-ghost w-9 h-9 p-0 flex items-center justify-center">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((o, i) => (
            <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="glass-card p-4 hover:border-purple-500/20 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-gray-400"
                    style={{ background: '#1a1040' }}>
                    #{o.id?.slice(-4)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Table {o.table_id?.slice(-4)}</p>
                    <p className="text-xs text-gray-500">{o.items?.length} items · {formatTime(o.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden md:block">
                    <p className="text-xs text-gray-500 mb-1">Items</p>
                    <p className="text-xs text-gray-300">{o.items?.map(it => it.product_name).join(', ').slice(0, 40)}{o.items?.length > 2 ? '...' : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{formatCurrency(o.total_amount)}</p>
                    {o.payment_method && <p className="text-xs text-gray-500 capitalize">{o.payment_method}</p>}
                  </div>
                  <span className={`badge ${statusColor[o.status]} capitalize`}>{o.status}</span>
                </div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-sm">No orders found</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
