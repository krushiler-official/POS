import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, Clock, Wifi, WifiOff } from 'lucide-react'
import api from '../services/api'
import { orderSocket } from '../services/socket'
import { formatTime, formatCurrency } from '../utils/helpers'
import { notify } from '../utils/toast'

export default function StaffDisplay() {
  const [orders, setOrders] = useState([])
  const [connected, setConnected] = useState(false)
  const [newIds, setNewIds] = useState(new Set())
  const [time, setTime] = useState(new Date())

  const markNew = useCallback((id) => {
    setNewIds(s => { const n = new Set(s); n.add(id); return n })
    setTimeout(() => setNewIds(s => { const n = new Set(s); n.delete(id); return n }), 8000)
  }, [])

  useEffect(() => {
    const tick = setInterval(() => setTime(new Date()), 1000)

    // Initial fetch
    api.get('/kitchen/orders')
      .then(r => setOrders(r.data.filter(o => o.status === 'preparing')))
      .catch(() => {})

    orderSocket.shouldReconnect = true
    orderSocket.connect()

    const connCheck = setInterval(() => {
      setConnected(orderSocket.ws?.readyState === WebSocket.OPEN)
    }, 1000)

    const unsub = orderSocket.subscribe((msg) => {
      if (msg.type === 'NEW_ORDER') {
        setOrders(prev => {
          if (prev.find(o => o.id === msg.data.id)) return prev
          markNew(msg.data.id)
          return [msg.data, ...prev]
        })
      } else if (msg.type === 'UPDATE_ORDER') {
        if (msg.data.status === 'completed') {
          setOrders(prev => prev.filter(o => o.id !== msg.data.id))
        } else if (msg.data.status === 'preparing') {
          setOrders(prev => {
            if (prev.find(o => o.id === msg.data.id))
              return prev.map(o => o.id === msg.data.id ? msg.data : o)
            markNew(msg.data.id)
            return [msg.data, ...prev]
          })
        }
      }
    })

    return () => {
      unsub()
      clearInterval(connCheck)
      clearInterval(tick)
    }
  }, [markNew])

  const markDone = async (id) => {
    try {
      await api.patch(`/orders/${id}/status`, { status: 'completed' })
    } catch {
      notify.error('Failed to update order')
    }
  }

  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen bg-[#080b10] text-white flex flex-col select-none">

      {/* Header */}
      <header className="flex items-center justify-between px-10 py-5 border-b border-white/10 bg-[#0a0d14] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <ChefHat size={22} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">In Preparation</h1>
            <p className="text-sm text-gray-500">{dateStr}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            {connected
              ? <><Wifi size={16} className="text-green-400" /><span className="text-green-400 font-medium">Live</span></>
              : <><WifiOff size={16} className="text-red-400" /><span className="text-red-400 font-medium">Reconnecting...</span></>
            }
          </div>
          <p className="text-3xl font-bold text-white tabular-nums">{timeStr}</p>
        </div>
      </header>

      {/* Count bar */}
      <div className="flex items-center gap-3 px-10 py-3 border-b border-white/5 bg-white/[0.01] shrink-0">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        <span className="text-sm font-medium text-blue-400">Orders Being Prepared</span>
        <span className="ml-2 text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
          {orders.length}
        </span>
      </div>

      {/* Orders grid */}
      <div className="flex-1 p-8 overflow-auto">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-700 gap-4">
            <ChefHat size={64} className="opacity-20" />
            <p className="text-2xl font-light">No orders in preparation</p>
            <p className="text-base text-gray-600">Orders will appear here in real-time</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence mode="popLayout">
              {orders.map(order => (
                <motion.div key={order.id} layout
                  initial={{ opacity: 0, scale: 0.92, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.88, y: -10 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className={`rounded-3xl border p-6 flex flex-col gap-4
                    bg-blue-500/10 border-blue-500/30
                    ${newIds.has(order.id) ? 'ring-2 ring-blue-400/40' : ''}`}>

                  {/* Table + time */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-4xl font-black text-white leading-none">
                        T-{order.table_id?.slice(-4)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Clock size={13} className="text-gray-500" />
                        <span className="text-sm text-gray-500">{formatTime(order.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-blue-500/15 border-blue-500/40">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        <span className="text-sm font-bold text-blue-300">Preparing</span>
                      </div>
                      {newIds.has(order.id) && (
                        <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2.5 py-1 rounded-full animate-pulse">
                          New
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2 border-t border-white/10 pt-4">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-base text-gray-200 font-medium">{item.product_name}</span>
                        <span className="text-sm font-bold bg-white/10 text-gray-300 px-2.5 py-0.5 rounded-lg">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total + Done button */}
                  <div className="flex justify-between items-center border-t border-white/10 pt-3 mt-auto">
                    <span className="text-lg font-bold text-orange-400">{formatCurrency(order.total_amount)}</span>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => markDone(order.id)}
                      className="text-sm font-semibold px-4 py-2 rounded-xl border border-green-500/40 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all">
                      ✓ Done
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="px-10 py-3 border-t border-white/10 bg-[#0a0d14] flex items-center justify-between shrink-0">
        <p className="text-sm text-gray-600">CaféPOS — Staff Display</p>
        <p className="text-sm text-gray-600">
          Orders update automatically in real-time
        </p>
      </footer>
    </div>
  )
}
