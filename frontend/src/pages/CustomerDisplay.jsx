import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coffee, Clock, Wifi, WifiOff, ChefHat, CheckCircle2 } from 'lucide-react'
import api from '../services/api'
import { orderSocket } from '../services/socket'
import { formatTime } from '../utils/helpers'

const COMPLETED_REMOVE_DELAY = 45_000

export default function CustomerDisplay() {
  const [orders, setOrders] = useState([])
  const [connected, setConnected] = useState(false)
  const [flashIds, setFlashIds] = useState(new Set())
  const [time, setTime] = useState(new Date())
  const removeTimers = useRef({})

  const flash = useCallback((id) => {
    setFlashIds(s => { const n = new Set(s); n.add(id); return n })
    setTimeout(() => setFlashIds(s => { const n = new Set(s); n.delete(id); return n }), 3000)
  }, [])

  const scheduleRemove = useCallback((id) => {
    if (removeTimers.current[id]) clearTimeout(removeTimers.current[id])
    removeTimers.current[id] = setTimeout(() => {
      setOrders(prev => prev.filter(o => o.id !== id))
      delete removeTimers.current[id]
    }, COMPLETED_REMOVE_DELAY)
  }, [])

  useEffect(() => {
    const tick = setInterval(() => setTime(new Date()), 1000)

    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/')
        const active = res.data.filter(o => ['preparing', 'completed'].includes(o.status))
        setOrders(active.slice(0, 16))
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
        if (!['preparing', 'completed'].includes(msg.data.status)) return
        setOrders(prev => {
          if (prev.find(o => o.id === msg.data.id)) return prev
          flash(msg.data.id)
          return [msg.data, ...prev].slice(0, 16)
        })
      } else if (msg.type === 'UPDATE_ORDER') {
        if (!['preparing', 'completed'].includes(msg.data.status)) {
          setOrders(prev => prev.filter(o => o.id !== msg.data.id))
          return
        }
        flash(msg.data.id)
        setOrders(prev => {
          if (prev.find(o => o.id === msg.data.id))
            return prev.map(o => o.id === msg.data.id ? msg.data : o)
          return [msg.data, ...prev].slice(0, 16)
        })
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

  const preparing = orders.filter(o => o.status === 'preparing')
  const completed  = orders.filter(o => o.status === 'completed')

  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-[#06080f] text-white flex flex-col select-none overflow-hidden">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-10 py-5 shrink-0"
        style={{ background: 'linear-gradient(180deg, #0d1117 0%, #06080f 100%)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
            <Coffee size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Order Status</h1>
            <p className="text-sm text-gray-500 mt-0.5">{dateStr}</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            {connected
              ? <><div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" /><span className="text-green-400 font-semibold">Live</span></>
              : <><WifiOff size={16} className="text-red-400" /><span className="text-red-400 font-semibold">Reconnecting...</span></>
            }
          </div>
          <p className="text-4xl font-black text-white tabular-nums tracking-tight">{timeStr}</p>
        </div>
      </header>

      {/* ── Two column layout ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Preparing column */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-white/5">
          {/* Column header */}
          <div className="flex items-center gap-3 px-8 py-4 shrink-0"
            style={{ background: 'rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.15)' }}>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <ChefHat size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-blue-300">Being Prepared</h2>
              <p className="text-xs text-blue-400/60">Your order is in the kitchen</p>
            </div>
            <div className="ml-auto flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-sm font-bold text-blue-300">{preparing.length}</span>
            </div>
          </div>

          {/* Cards */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence mode="popLayout">
              {preparing.map(order => (
                <motion.div key={order.id} layout
                  initial={{ opacity: 0, x: -20, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                  className={`rounded-3xl border p-6 bg-blue-500/8 border-blue-500/25 transition-all duration-500
                    ${flashIds.has(order.id) ? 'ring-2 ring-blue-400/50 bg-blue-500/15' : ''}`}>

                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-5xl font-black text-white leading-none">T{order.table_id?.slice(-2)}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Clock size={13} className="text-gray-500" />
                        <span className="text-sm text-gray-500">{formatTime(order.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      <span className="text-sm font-bold text-blue-300">Preparing</span>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/8 pt-4">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-lg text-gray-200 font-medium">{item.product_name}</span>
                        <span className="text-sm font-bold bg-white/10 text-gray-300 px-3 py-1 rounded-xl">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {preparing.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-20 text-gray-700">
                <ChefHat size={56} className="mb-4 opacity-20" />
                <p className="text-xl font-light">No orders being prepared</p>
              </div>
            )}
          </div>
        </div>

        {/* Ready column */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Column header */}
          <div className="flex items-center gap-3 px-8 py-4 shrink-0"
            style={{ background: 'rgba(34,197,94,0.08)', borderBottom: '1px solid rgba(34,197,94,0.15)' }}>
            <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-green-300">Ready to Collect</h2>
              <p className="text-xs text-green-400/60">Please collect your order</p>
            </div>
            <div className="ml-auto flex items-center gap-2 bg-green-500/20 border border-green-500/30 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-bold text-green-300">{completed.length}</span>
            </div>
          </div>

          {/* Cards */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence mode="popLayout">
              {completed.map(order => (
                <motion.div key={order.id} layout
                  initial={{ opacity: 0, x: 20, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                  className={`rounded-3xl border p-6 bg-green-500/8 border-green-500/25 transition-all duration-500
                    ${flashIds.has(order.id) ? 'ring-2 ring-green-400/50 bg-green-500/15' : ''}`}>

                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-5xl font-black text-white leading-none">T{order.table_id?.slice(-2)}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Clock size={13} className="text-gray-500" />
                        <span className="text-sm text-gray-500">{formatTime(order.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
                      <CheckCircle2 size={14} className="text-green-400" />
                      <span className="text-sm font-bold text-green-300">Ready!</span>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/8 pt-4">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-lg text-gray-200 font-medium">{item.product_name}</span>
                        <span className="text-sm font-bold bg-white/10 text-gray-300 px-3 py-1 rounded-xl">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Collect prompt */}
                  <div className="mt-4 pt-3 border-t border-white/8 flex items-center justify-center gap-2 bg-green-500/10 rounded-2xl py-2">
                    <span className="text-sm font-bold text-green-400">Please collect your order at the counter</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {completed.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-20 text-gray-700">
                <CheckCircle2 size={56} className="mb-4 opacity-20" />
                <p className="text-xl font-light">No orders ready yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="flex items-center justify-between px-10 py-4 shrink-0"
        style={{ background: '#0d1117', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-sm text-gray-600">Thank you for dining with us</p>
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Being Prepared</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span>Ready to Collect</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
