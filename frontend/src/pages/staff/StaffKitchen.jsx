import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, Clock, Wifi, WifiOff } from 'lucide-react'
import api from '../../services/api'
import { orderSocket } from '../../services/socket'
import { formatCurrency, formatTime, statusColor } from '../../utils/helpers'
import { notify } from '../../utils/toast'
import Skeleton from '../../components/common/Skeleton'

const NEXT_LABEL = { preparing: '✓ Done' }
const NEXT_COLOR = {
  preparing: 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20',
}

export default function StaffKitchen() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [newIds, setNewIds] = useState(new Set())
  const [connected, setConnected] = useState(false)

  const markNew = useCallback((id) => {
    setNewIds(s => { const n = new Set(s); n.add(id); return n })
    setTimeout(() => setNewIds(s => { const n = new Set(s); n.delete(id); return n }), 8000)
  }, [])

  // Initial fetch — only preparing orders
  useEffect(() => {
    api.get('/kitchen/orders').then(r => {
      setOrders(r.data.filter(o => o.status === 'preparing'))
      setLoading(false)
    })
  }, [])

  // WebSocket real-time updates
  useEffect(() => {
    orderSocket.shouldReconnect = true
    orderSocket.connect()

    const connCheck = setInterval(() => {
      setConnected(orderSocket.ws?.readyState === WebSocket.OPEN)
    }, 1000)

    const unsub = orderSocket.subscribe((msg) => {
      if (msg.type === 'NEW_ORDER') {
        // New orders start as pending — not shown here, ignore
      } else if (msg.type === 'UPDATE_ORDER') {
        setOrders(prev => {
          if (msg.data.status === 'preparing') {
            // Add to view if not already present
            if (prev.find(o => o.id === msg.data.id)) {
              return prev.map(o => o.id === msg.data.id ? msg.data : o)
            }
            markNew(msg.data.id)
            notify.success(`Order ready to prepare — Table ${msg.data.table_id?.slice(-4)}`)
            return [msg.data, ...prev]
          }
          if (msg.data.status === 'completed') {
            return prev.filter(o => o.id !== msg.data.id)
          }
          return prev
        })
      }
    })

    return () => { unsub(); clearInterval(connCheck) }
  }, [markNew])

  const update = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status })
    } catch {
      notify.error('Failed to update status')
    }
  }

  const preparing = orders.filter(o => o.status === 'preparing')

  const OrderCard = ({ o }) => (
    <motion.div key={o.id} layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-2xl border p-4 space-y-3 transition-all border-blue-500/25 bg-blue-500/5
        ${newIds.has(o.id) ? 'ring-2 ring-brand/40 shadow-glow-sm' : ''}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-white">Table {o.table_id?.slice(-4)}</p>
            {newIds.has(o.id) && (
              <span className="text-xs bg-brand/20 text-brand border border-brand/30 px-2 py-0.5 rounded-full animate-pulse-slow">New</span>
            )}
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
        {NEXT_LABEL[o.status] && (
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => update(o.id, 'completed')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${NEXT_COLOR[o.status]}`}>
            {NEXT_LABEL[o.status]}
          </motion.button>
        )}
      </div>
    </motion.div>
  )

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className={`flex items-center gap-2 px-5 py-1.5 text-xs border-b ${connected ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
        {connected
          ? <><Wifi size={12} className="text-green-400" /><span className="text-green-400">Real-time connected</span></>
          : <><WifiOff size={12} className="text-red-400" /><span className="text-red-400">Reconnecting…</span></>
        }
      </div>
      <div className="flex-1 overflow-hidden flex p-5">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
            <h3 className="font-semibold text-sm text-blue-400">In Preparation</h3>
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 text-gray-400">{preparing.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <AnimatePresence mode="popLayout">
              {preparing.map(o => <OrderCard key={o.id} o={o} />)}
            </AnimatePresence>
            {preparing.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                <ChefHat size={28} className="mb-2 opacity-40" />
                <p className="text-sm">Nothing being prepared</p>
              </div>
            )}
            {loading && [...Array(2)].map((_, i) => <Skeleton key={i} className="h-36" />)}
          </div>
        </div>
      </div>
    </div>
  )
}
