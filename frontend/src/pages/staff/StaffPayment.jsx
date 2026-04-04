import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Banknote, Smartphone, Receipt } from 'lucide-react'
import api from '../../services/api'
import { formatCurrency, formatTime, statusColor } from '../../utils/helpers'
import { notify } from '../../utils/toast'
import Skeleton from '../../components/common/Skeleton'

export default function StaffPayment() {
  const [orders, setOrders] = useState([])
  const [selected, setSelected] = useState(null)
  const [method, setMethod] = useState('cash')
  const [paid, setPaid] = useState(false)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  const fetchOrders = () => {
    setLoading(true)
    api.get('/orders').then(r => {
      setOrders(r.data.filter(o => ['pending', 'preparing', 'completed'].includes(o.status)))
      setLoading(false)
    })
  }
  useEffect(() => { fetchOrders() }, [])

  const handlePay = async () => {
    if (!selected) return
    setPaying(true)
    try {
      await api.post(`/orders/${selected.id}/pay`, { payment_method: method })
      setPaid(true)
      notify.success('Payment successful!')
      setTimeout(() => { setPaid(false); setSelected(null); fetchOrders() }, 2500)
    } catch { notify.error('Payment failed') }
    finally { setPaying(false) }
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Order list */}
      <div className="flex-1 p-4 overflow-y-auto">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Select Order to Pay</p>
        {loading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        ) : (
          <div className="space-y-2">
            {orders.map((o, i) => (
              <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setSelected(o)}
                className={`cursor-pointer rounded-2xl border p-4 transition-all
                  ${selected?.id === o.id ? 'border-brand/50 bg-brand/5 shadow-glow-sm' : 'border-surface-border bg-surface-1 hover:border-gray-600 hover:bg-surface-2'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-surface-3 flex items-center justify-center">
                      <Receipt size={16} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">Table {o.table_id?.slice(-4)}</p>
                      <p className="text-xs text-gray-500">{o.items?.length} items · {formatTime(o.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{formatCurrency(o.total_amount)}</p>
                    <span className={`badge ${statusColor[o.status]} capitalize mt-1 inline-block`}>{o.status}</span>
                  </div>
                </div>
              </motion.div>
            ))}
            {orders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <div className="text-4xl mb-2">💳</div>
                <p className="text-sm font-medium">No pending payments</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment panel */}
      <div className="w-80 border-l border-surface-border p-4 flex flex-col gap-4 bg-surface-1/40">
        <AnimatePresence mode="wait">
          {paid ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full gap-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center">
                <CheckCircle size={40} className="text-green-400" />
              </motion.div>
              <div className="text-center">
                <p className="font-bold text-white text-lg">Payment Successful!</p>
                <p className="text-sm text-gray-400 mt-1">Table is now available</p>
              </div>
            </motion.div>
          ) : selected ? (
            <motion.div key="payment" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4 h-full">
              <div className="glass-card p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Order Summary</p>
                <div className="space-y-2 mb-3">
                  {selected.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-300">{item.product_name} <span className="text-gray-500">×{item.quantity}</span></span>
                      <span className="text-white font-medium">{formatCurrency(item.unit_price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-surface-border pt-2 flex justify-between">
                  <span className="font-semibold text-white">Total</span>
                  <span className="font-bold text-brand text-lg">{formatCurrency(selected.total_amount)}</span>
                </div>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Payment Method</p>
                <div className="grid grid-cols-2 gap-2">
                  {[{ id: 'cash', icon: Banknote, label: 'Cash' }, { id: 'upi', icon: Smartphone, label: 'UPI' }].map(({ id, icon: Icon, label }) => (
                    <button key={id} onClick={() => setMethod(id)}
                      className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all
                        ${method === id ? 'border-brand/50 bg-brand/10 text-brand shadow-glow-sm' : 'border-surface-border bg-surface-2 text-gray-400 hover:border-gray-500'}`}>
                      <Icon size={20} /><span className="text-xs font-semibold">{label}</span>
                    </button>
                  ))}
                </div>
                {method === 'upi' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 p-3 bg-surface-3 rounded-xl text-center">
                    <div className="w-24 h-24 bg-white rounded-lg mx-auto mb-2 grid grid-cols-5 gap-0.5 p-1">
                      {[...Array(25)].map((_, i) => (
                        <div key={i} className={`rounded-sm ${[0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24].includes(i) ? 'bg-gray-900' : 'bg-white'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">Scan to pay</p>
                    <p className="text-xs text-brand font-medium mt-0.5">cafe@upi</p>
                  </motion.div>
                )}
              </div>
              <motion.button whileTap={{ scale: 0.98 }} onClick={handlePay} disabled={paying}
                className="btn-primary w-full py-3.5 mt-auto">
                {paying ? (
                  <svg className="animate-spin h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : `Confirm · ${formatCurrency(selected.total_amount)}`}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key="empty" className="flex flex-col items-center justify-center h-full text-gray-600 gap-2">
              <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center">
                <Receipt size={22} className="text-gray-600" />
              </div>
              <p className="text-sm text-gray-500 text-center">Select an order<br />to process payment</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
