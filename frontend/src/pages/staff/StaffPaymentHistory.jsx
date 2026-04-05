import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Receipt, Banknote, Smartphone, RefreshCw, TrendingUp } from 'lucide-react'
import api from '../../services/api'
import { orderSocket } from '../../services/socket'
import { formatCurrency, formatTime } from '../../utils/helpers'
import Skeleton from '../../components/common/Skeleton'

const METHOD_CONFIG = {
  cash: { icon: Banknote,   label: 'Cash', badge: 'bg-green-500/15 text-green-400 border-green-500/30' },
  upi:  { icon: Smartphone, label: 'UPI',  badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30'   },
}

export default function StaffPaymentHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = useCallback(() => {
    setLoading(true)
    api.get('/orders/')
      .then(r => {
        const done = r.data.filter(o => ['completed', 'paid'].includes(o.status))
        setHistory(done)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchHistory()

    orderSocket.shouldReconnect = true
    orderSocket.connect()

    const unsub = orderSocket.subscribe((msg) => {
      if (msg.type === 'UPDATE_ORDER' && msg.data.status === 'completed') {
        setHistory(prev => {
          if (prev.find(o => o.id === msg.data.id)) return prev
          return [msg.data, ...prev]
        })
      }
    })

    return () => unsub()
  }, [fetchHistory])

  const todayTotal = history.reduce((s, o) => s + (o.total_amount || 0), 0)
  const cashTotal  = history.filter(o => o.payment_method === 'cash').reduce((s, o) => s + o.total_amount, 0)
  const upiTotal   = history.filter(o => o.payment_method === 'upi').reduce((s, o) => s + o.total_amount, 0)

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Revenue', value: todayTotal, icon: TrendingUp, color: 'border-brand/20 bg-brand/5',          text: 'text-brand' },
          { label: 'Cash',          value: cashTotal,  icon: Banknote,   color: 'border-green-500/20 bg-green-500/5',  text: 'text-green-400' },
          { label: 'UPI',           value: upiTotal,   icon: Smartphone, color: 'border-blue-500/20 bg-blue-500/5',    text: 'text-blue-400' },
        ].map(({ label, value, icon: Icon, color, text }, i) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`rounded-2xl border p-4 ${color}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <Icon size={15} className={`${text} opacity-70`} />
            </div>
            <p className={`text-xl font-black ${text}`}>{formatCurrency(value)}</p>
            <p className="text-xs text-gray-600 mt-0.5">
              {label === 'Total Revenue'
                ? history.length
                : history.filter(o => o.payment_method === label.toLowerCase()).length
              } orders
            </p>
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt size={15} className="text-brand" />
          <h3 className="font-semibold text-white text-sm">Payment History</h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 text-gray-400">{history.length}</span>
        </div>
        <button onClick={fetchHistory} className="btn-ghost w-8 h-8 p-0 flex items-center justify-center">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
          <Receipt size={36} className="mb-3 opacity-20" />
          <p className="font-medium text-sm">No payment history</p>
          <p className="text-xs mt-1">Completed orders will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {history.map((o, i) => {
              const method = METHOD_CONFIG[o.payment_method] ?? METHOD_CONFIG.cash
              const MethodIcon = method.icon
              return (
                <motion.div key={o.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 bg-surface-1 border border-surface-border rounded-2xl px-4 py-3 hover:border-gray-600 transition-all">

                  {/* Table */}
                  <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-brand">T{o.table_id?.slice(-2)}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">Table {o.table_id?.slice(-4)}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {o.items?.map(it => `${it.product_name} ×${it.quantity}`).join(' · ')}
                    </p>
                  </div>

                  {/* Time */}
                  <p className="text-xs text-gray-500 shrink-0">{formatTime(o.created_at)}</p>

                  {/* Method badge */}
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl border shrink-0 ${method.badge}`}>
                    <MethodIcon size={11} />
                    {method.label}
                  </span>

                  {/* Amount */}
                  <span className="font-bold text-white text-sm shrink-0 min-w-16 text-right">
                    {formatCurrency(o.total_amount)}
                  </span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
