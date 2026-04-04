import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coffee, Clock, Wifi, WifiOff } from 'lucide-react'
import api from '../services/api'
import { orderSocket } from '../services/socket'
import { formatTime, formatCurrency } from '../utils/helpers'

const STATUS_CONFIG = {
  pending:   { label: '⏳ Pending',    bg: 'bg-yellow-500/15', border: 'border-yellow-500/40', text: 'text-yellow-300', dot: 'bg-yellow-400' },
  preparing: { label: '👨‍🍳 Preparing', bg: 'bg-blue-500/15',   border: 'border-blue-500/40',   text: 'text-blue-300',   dot: 'bg-blue-400' },
  completed: { label: '✅ Ready!',      bg: 'bg-green-500/15',  border: 'border-green-500/40',  text: 'text-green-300',  dot: 'bg-green-400' },
}

const ACTIVE_STATUSES = ['pending', 'preparing', 'completed']
const COMPLETED_REMOVE_DELAY = 30_000 // remove "Ready" cards after 30s

export default function CustomerDisplay() {
  const [orders, setOrders] = useState([])
  const [connected, setConnected] = useState(false)
  const [flashIds, setFlashIds] = useState(new Set())
  const [time, setTime] = useState(new Date())
  const removeTimers = useRef({})

  const flash = useCallback((id) => {
    setFlashIds(s => { const n = new Set(s); n.add(id); return n })
    setTimeout(() => setFlashIds(s => { const n = new Set(s); n.delete(id); return n }), 2000)
  }, [])

  const scheduleRemove = useCallback((id) => {
    if (removeTimers.current[id]) clearTimeout(removeTimers.current[id])
    removeTimers.current[id] = setTimeout(() => {
      setOrders(prev => prev.filter(o => o.id !== id))
      delete removeTimers.current[id]
    }, COMPLETED_REMOVE_DELAY)
  }, [])

  useEffect(() => {
    // Live clock
    const tick = setInterval(() => setTime(new Date()), 1000)

    // Initial fetch
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/')
        const today = new Date().toDateString()
        const active = res.data
          .filter(o => ACTIVE_STATUSES.includes(o.status) && new Date(o.created_at).toDateString() === today)
          .slice(0, 12)
        setOrders(active)
        active.filter(o => o.status === 'completed').forEach(o => scheduleRemove(o.id))
      } catch {}
    }
    fetchOrders()

    orderSocket.shouldReconnect = true
    orderSocket.connect()

    const connCheck = setInterval(() => {
      setConnected(orderSocket.ws?.readyState === WebSocket.OPEN)
    }, 1000)

    const unsub = orderSocket.subscribe((msg) => {
      if (msg.type === 'NEW_ORDER') {
        if (!ACTIVE_STATUSES.includes(msg.data.status)) return
        setOrders(prev => {
          if (prev.find(o => o.id === msg.data.id)) return prev
          flash(msg.data.id)
          return [msg.data, ...prev].slice(0, 12)
        })
      } else if (msg.type === 'UPDATE_ORDER') {
        flash(msg.data.id)
        if (!ACTIVE_STATUSES.includes(msg.data.status)) {
          setOrders(prev => prev.filter(o => o.id !== msg.data.id))
          return
        }
        setOrders(prev => prev.map(o => o.id === msg.data.id ? msg.data : o))
        if (msg.data.status === 'completed') scheduleRemove(msg.data.id)
      }
    })

    return () => {
      unsub()
      clearInterval(connCheck)
      clearInterval(tick)
      Object.values(removeTimers.current).forEach(clearTimeout)
    }
  }, [flash, scheduleRemove])

  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen bg-[#080b10] text-white flex flex-col select-none">
      {/* Header */}
      <header className="flex items-center justify-between px-10 py-5 border-b border-white/10 bg-[#0a0d14]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
            <Coffee size={22} className="text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Order Status</h1>
            <p className="text-sm text-gray-500">{dateStr}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            {connected
              ? <><Wifi size={16} className="text-green-400" /><span className="text-green-400 font-medium">Live</span></>
              : <><WifiOff size={16} className="text-red-400" /><span className="text-red-400 font-medium">Reconnecting…</span></>
            }
          </div>
          <p className="text-3xl font-bold text-white tabular-nums">{timeStr}</p>
        </div>
      </header>

      {/* Legend */}
      <div className="flex items-center gap-6 px-10 py-3 border-b border-white/5 bg-white/[0.01]">
        {Object.entries(STATUS_CONFIG).map(([, cfg]) => (
          <div key={cfg.label} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className={`text-sm font-medium ${cfg.text}`}>{cfg.label}</span>
          </div>
        ))}
        <span className="ml-auto text-sm text-gray-600">{orders.length} active order{orders.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Orders grid */}
      <div className="flex-1 p-8 overflow-auto">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-700 gap-4">
            <Coffee size={64} className="opacity-20" />
            <p className="text-2xl font-light">No active orders right now</p>
            <p className="text-base text-gray-600">Orders will appear here in real-time</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence mode="popLayout">
              {orders.map(order => {
                const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
                return (
                  <motion.div key={order.id} layout
                    initial={{ opacity: 0, scale: 0.92, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.88, y: -10 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className={`rounded-3xl border p-6 flex flex-col gap-4 transition-all duration-500
                      ${cfg.bg} ${cfg.border}
                      ${flashIds.has(order.id) ? 'ring-2 ring-white/20 scale-[1.02]' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-4xl font-black text-white leading-none">T-{order.table_id?.slice(-4)}</p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <Clock size={13} className="text-gray-500" />
                          <span className="text-sm text-gray-500">{formatTime(order.created_at)}</span>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${cfg.bg} ${cfg.border}`}>
                        <div className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
                        <span className={`text-sm font-bold ${cfg.text}`}>{cfg.label}</span>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-white/10 pt-4">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-base text-gray-200 font-medium">{item.product_name}</span>
                          <span className="text-sm font-bold bg-white/10 text-gray-300 px-2.5 py-0.5 rounded-lg">×{item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center border-t border-white/10 pt-3 mt-auto">
                      <span className="text-sm text-gray-500">Total</span>
                      <span className="text-lg font-bold text-orange-400">{formatCurrency(order.total_amount)}</span>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <footer className="px-10 py-3 border-t border-white/10 bg-[#0a0d14] flex items-center justify-between">
        <p className="text-sm text-gray-600">Thank you for dining with us 🙏</p>
        <p className="text-sm text-gray-600">Collect your order when status shows <span className="text-green-400 font-medium">✅ Ready!</span></p>
      </footer>
    </div>
  )
}
