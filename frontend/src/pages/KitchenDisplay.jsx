import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, Clock, Wifi, WifiOff } from 'lucide-react'
import api from '../services/api'
import { orderSocket } from '../services/socket'
import { formatTime } from '../utils/helpers'

const STATUS_CONFIG = {
  preparing: { label: 'Preparing', dot: 'bg-blue-400',  text: 'text-blue-400',  card: 'border-blue-500/30 bg-blue-500/5',  badge: 'bg-blue-500/20 text-blue-300' },
  completed: { label: 'Completed', dot: 'bg-green-400', text: 'text-green-400', card: 'border-green-500/30 bg-green-500/5', badge: 'bg-green-500/20 text-green-300' },
}

const COMPLETED_TTL = 60_000

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([])
  const [connected, setConnected] = useState(false)
  const [newIds, setNewIds] = useState(new Set())

  const markNew = useCallback((id) => {
    setNewIds(s => { const n = new Set(s); n.add(id); return n })
    setTimeout(() => setNewIds(s => { const n = new Set(s); n.delete(id); return n }), 8000)
  }, [])

  const scheduleRemove = useCallback((id) => {
    setTimeout(() => setOrders(prev => prev.filter(o => o.id !== id)), COMPLETED_TTL)
  }, [])

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [activeRes, allRes] = await Promise.all([
          api.get('/kitchen/orders'),
          api.get('/orders/'),
        ])
        const today = new Date().toDateString()
        const todayCompleted = allRes.data.filter(o =>
          o.status === 'completed' && new Date(o.created_at).toDateString() === today
        )
        // kitchen/orders returns pending+preparing — keep only preparing
        const preparing = activeRes.data.filter(o => o.status === 'preparing')
        const ids = new Set(preparing.map(o => o.id))
        setOrders([...preparing, ...todayCompleted.filter(o => !ids.has(o.id))])
      } catch {}
    }
    fetchInitial()

    orderSocket.shouldReconnect = true
    orderSocket.connect()

    const connCheck = setInterval(() => {
      setConnected(orderSocket.ws?.readyState === WebSocket.OPEN)
    }, 1000)

    const unsub = orderSocket.subscribe((msg) => {
      if (msg.type === 'NEW_ORDER') {
        // pending orders not shown — ignore
      } else if (msg.type === 'UPDATE_ORDER') {
        if (msg.data.status === 'preparing') {
          setOrders(prev => {
            if (prev.find(o => o.id === msg.data.id)) return prev.map(o => o.id === msg.data.id ? msg.data : o)
            markNew(msg.data.id)
            return [msg.data, ...prev]
          })
        } else if (msg.data.status === 'completed') {
          setOrders(prev => prev.map(o => o.id === msg.data.id ? msg.data : o))
          scheduleRemove(msg.data.id)
        }
      }
    })

    return () => { unsub(); clearInterval(connCheck) }
  }, [markNew, scheduleRemove])

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status })
    } catch {}
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white flex flex-col">
      <header className="flex items-center justify-between px-8 py-4 border-b border-white/10 bg-[#0f1117]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
            <ChefHat size={18} className="text-orange-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Kitchen Display</h1>
            <p className="text-xs text-gray-500">Live order management</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {connected
            ? <><Wifi size={14} className="text-green-400" /><span className="text-green-400">Live</span></>
            : <><WifiOff size={14} className="text-red-400" /><span className="text-red-400">Reconnecting…</span></>
          }
        </div>
      </header>

      <div className="flex-1 grid grid-cols-2 gap-0 overflow-hidden">
        {['preparing', 'completed'].map((status, colIdx) => {
          const cfg = STATUS_CONFIG[status]
          const items = orders.filter(o => o.status === status)
          return (
            <div key={status} className={`flex flex-col overflow-hidden ${colIdx === 0 ? 'border-r border-white/10' : ''}`}>
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/10 bg-white/[0.02]">
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} animate-pulse`} />
                <span className={`font-semibold text-sm ${cfg.text}`}>{cfg.label}</span>
                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 text-gray-400">{items.length}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence mode="popLayout">
                  {items.map(order => (
                    <motion.div key={order.id} layout
                      initial={{ opacity: 0, y: 12, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`rounded-2xl border p-4 space-y-3 transition-all ${cfg.card} ${newIds.has(order.id) ? 'ring-2 ring-orange-500/40' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-base">Table {order.table_id?.slice(-4)}</span>
                            {newIds.has(order.id) && (
                              <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full animate-pulse">New</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock size={11} className="text-gray-500" />
                            <span className="text-xs text-gray-500">{formatTime(order.created_at)}</span>
                          </div>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                      </div>

                      <div className="space-y-1.5 border-t border-white/5 pt-3">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <span className="text-gray-300">{item.product_name}</span>
                            <span className="text-xs font-bold bg-white/5 text-gray-300 px-2 py-0.5 rounded-lg">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {status === 'preparing' && (
                        <motion.button whileTap={{ scale: 0.96 }}
                          onClick={() => updateStatus(order.id, 'completed')}
                          className="w-full text-xs font-semibold py-2 rounded-xl border bg-transparent transition-all border-green-500/40 text-green-400 hover:bg-green-500/20">
                          ✓ Mark Completed
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {items.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-700">
                    <ChefHat size={32} className="mb-2 opacity-30" />
                    <p className="text-sm">No {status} orders</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
