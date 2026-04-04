import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, Clock } from 'lucide-react'
import api from '../../services/api'
import { useSocket } from '../../hooks/useSocket'
import { formatCurrency, formatTime, statusColor } from '../../utils/helpers'
import { notify } from '../../utils/toast'
import Skeleton from '../../components/common/Skeleton'

const NEXT = { pending: 'preparing', preparing: 'completed' }
const NEXT_LABEL = { pending: '▶ Start', preparing: '✓ Done' }
const NEXT_COLOR = {
  pending: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20',
  preparing: 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20',
}

export default function StaffKitchen() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [newIds, setNewIds] = useState(new Set())
  const prevIds = useRef(new Set())

  const fetchOrders = useCallback(() => {
    api.get('/kitchen/orders').then(r => {
      const incoming = r.data
      const ids = new Set(incoming.map(o => o.id))
      const fresh = new Set([...ids].filter(id => !prevIds.current.has(id)))
      if (fresh.size > 0 && prevIds.current.size > 0) {
        setNewIds(fresh)
        notify.success(`${fresh.size} new order${fresh.size > 1 ? 's' : ''}!`)
        setTimeout(() => setNewIds(new Set()), 8000)
      }
      prevIds.current = ids
      setOrders(incoming)
      setLoading(false)
    })
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])
  useSocket(useCallback(msg => {
    if (msg.event === 'new_order' || msg.event === 'order_updated') fetchOrders()
  }, [fetchOrders]))

  const update = async (id, status) => {
    await api.patch(`/orders/${id}/status`, { status })
    fetchOrders()
  }

  const pending = orders.filter(o => o.status === 'pending')
  const preparing = orders.filter(o => o.status === 'preparing')

  const Column = ({ title, items, color, dotColor, emptyMsg }) => (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className={`w-2.5 h-2.5 rounded-full ${dotColor} animate-pulse`} />
        <h3 className={`font-semibold text-sm ${color}`}>{title}</h3>
        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 text-gray-400">{items.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        <AnimatePresence mode="popLayout">
          {items.map(o => (
            <motion.div key={o.id} layout
              initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`rounded-2xl border p-4 space-y-3 transition-all
                ${o.status === 'pending' ? 'border-yellow-500/25 bg-yellow-500/5' : 'border-blue-500/25 bg-blue-500/5'}
                ${newIds.has(o.id) ? 'ring-2 ring-brand/40 shadow-glow-sm' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white">Table {o.table_id?.slice(-4)}</p>
                    {newIds.has(o.id) && <span className="text-xs bg-brand/20 text-brand border border-brand/30 px-2 py-0.5 rounded-full animate-pulse-slow">New</span>}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock size={11} className="text-gray-500" />
                    <p className="text-xs text-gray-500">{formatTime(o.created_at)}</p>
                  </div>
                </div>
                <span className={`badge ${statusColor[o.status]} capitalize`}>{o.status}</span>
              </div>
              <div className="space-y-1.5 border-t border-white/5 pt-3">
                {o.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-300">{item.product_name}</span>
                    <span className="text-xs font-bold bg-surface-3 text-gray-300 px-2 py-0.5 rounded-lg">×{item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="font-bold text-brand">{formatCurrency(o.total_amount)}</span>
                {NEXT[o.status] && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => update(o.id, NEXT[o.status])}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${NEXT_COLOR[o.status]}`}>
                    {NEXT_LABEL[o.status]}
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {items.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-600">
            <ChefHat size={28} className="mb-2 opacity-40" />
            <p className="text-sm">{emptyMsg}</p>
          </div>
        )}
        {loading && [...Array(2)].map((_, i) => <Skeleton key={i} className="h-36" />)}
      </div>
    </div>
  )

  return (
    <div className="flex-1 overflow-hidden flex p-5 gap-0">
      <div className="flex-1 flex flex-col overflow-hidden pr-4 border-r border-surface-border">
        <Column title="Pending Orders" items={pending} color="text-yellow-400" dotColor="bg-yellow-400" emptyMsg="No pending orders" />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden pl-4">
        <Column title="In Preparation" items={preparing} color="text-blue-400" dotColor="bg-blue-400" emptyMsg="Nothing being prepared" />
      </div>
    </div>
  )
}
