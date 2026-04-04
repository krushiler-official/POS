import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Trash2, ShoppingCart, Search, Banknote, Smartphone, CheckCircle, X } from 'lucide-react'
import api from '../../services/api'
import { useOrder } from '../../context/OrderContext'
import { formatCurrency } from '../../utils/helpers'
import { notify } from '../../utils/toast'
import Skeleton from '../../components/common/Skeleton'

const CATEGORIES = ['All', 'Coffee', 'Tea', 'Food', 'Snacks', 'Dessert', 'Drinks']
const EMOJI = { Coffee: '☕', Tea: '🍵', Food: '🍽️', Snacks: '🍟', Dessert: '🍰', Drinks: '🥤' }

// Static QR pattern (deterministic, not random)
const QR_PATTERN = [
  1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,
  1,0,0,0,0,0,1,0,0,1,0,1,0,0,1,0,0,0,0,0,1,
  1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1,
  1,0,1,1,1,0,1,0,0,1,1,0,0,0,1,0,1,1,1,0,1,
  1,0,1,1,1,0,1,0,1,1,0,1,1,0,1,0,1,1,1,0,1,
  1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,
  1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,
  0,0,0,0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0,
  1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,
  0,1,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,1,0,0,
  1,1,1,0,1,1,1,1,0,1,0,0,1,1,0,1,1,0,1,1,1,
  0,0,1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0,0,1,0,
  1,1,0,1,1,0,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,
  0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,1,0,0,1,0,0,
  1,1,1,1,1,1,1,0,1,1,0,0,1,0,1,0,1,1,0,1,1,
  1,0,0,0,0,0,1,0,0,0,1,0,0,1,0,1,0,0,1,0,0,
  1,0,1,1,1,0,1,0,1,1,0,1,1,0,1,0,1,1,0,1,1,
  1,0,1,1,1,0,1,0,0,1,0,0,0,1,0,1,0,0,1,0,0,
  1,0,1,1,1,0,1,0,1,0,1,1,0,0,1,0,1,1,0,1,1,
  1,0,0,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,
  1,1,1,1,1,1,1,0,1,0,1,1,0,1,1,0,1,1,0,1,1,
]

function UPIModal({ amount, onConfirm, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-surface-1 border border-surface-border rounded-3xl p-8 w-80 flex flex-col items-center gap-5 shadow-card"
      >
        <div className="flex items-center justify-between w-full">
          <h3 className="font-bold text-white text-lg">Scan & Pay</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-surface-2 flex items-center justify-center text-gray-400 hover:text-white transition-all">
            <X size={15} />
          </button>
        </div>

        {/* QR Code */}
        <div className="bg-white p-3 rounded-2xl">
          <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(21, 1fr)', width: 168 }}>
            {QR_PATTERN.map((cell, i) => (
              <div key={i} className={`w-2 h-2 ${cell ? 'bg-gray-900' : 'bg-white'}`} />
            ))}
          </div>
        </div>

        <div className="text-center">
          <p className="text-2xl font-black text-white">{formatCurrency(amount)}</p>
          <p className="text-sm text-gray-400 mt-1">cafe@upi · CaféPOS</p>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onConfirm}
          className="btn-primary w-full py-3 text-sm"
        >
          ✓ Confirm Payment Received
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

export default function StaffOrder() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('All')
  const [search, setSearch] = useState('')
  const [payMethod, setPayMethod] = useState(null)   // null | 'cash' | 'upi'
  const [showUPI, setShowUPI] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [success, setSuccess] = useState(false)
  const { cart, selectedTable, addToCart, updateQuantity, removeFromCart, clearCart, cartTotal } = useOrder()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/products').then(r => { setProducts(r.data); setLoading(false) })
  }, [])

  const filtered = products
    .filter(p => p.is_available)
    .filter(p => cat === 'All' || p.category === cat)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  const cartQty = id => cart.find(i => i.id === id)?.quantity || 0

  const submitOrder = async (method) => {
    if (!selectedTable || cart.length === 0 || !method) return
    setPlacing(true)
    try {
      await api.post('/orders/', {
        table_id: selectedTable.id,
        items: cart.map(i => ({ product_id: i.id, quantity: i.quantity })),
        payment_method: method,
      })
      setSuccess(true)
      notify.success(`Order placed for Table ${selectedTable.number}!`)
      clearCart()
      setTimeout(() => navigate('/staff/kitchen'), 1500)
    } catch (err) {
      notify.error(err.response?.data?.detail || 'Failed to place order')
      setPlacing(false)
    }
  }

  const handlePlaceOrder = () => {
    if (!payMethod) return
    if (payMethod === 'upi') { setShowUPI(true); return }
    submitOrder('cash')
  }

  const canPlace = selectedTable && cart.length > 0 && payMethod !== null

  return (
    <>
      <AnimatePresence>
        {showUPI && (
          <UPIModal
            amount={cartTotal}
            onConfirm={() => { setShowUPI(false); submitOrder('upi') }}
            onClose={() => setShowUPI(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center">
                <CheckCircle size={48} className="text-green-400" />
              </div>
              <p className="text-xl font-bold text-white">Order Placed!</p>
              <p className="text-sm text-gray-400">Redirecting to kitchen…</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex overflow-hidden">
        {/* ── Products panel ── */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 py-2.5" placeholder="Search menu…"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all
                  ${cat === c ? 'bg-brand text-white shadow-glow-sm' : 'bg-surface-2 border border-surface-border text-gray-400 hover:border-gray-500'}`}>
                {EMOJI[c] || '✨'} {c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto flex-1 pb-2">
            <AnimatePresence mode="popLayout">
              {filtered.map((p, i) => {
                const qty = cartQty(p.id)
                return (
                  <motion.div key={p.id}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.02 }}
                    onClick={() => addToCart(p)}
                    className="glass-card p-3.5 cursor-pointer hover:border-brand/30 hover:shadow-glow-sm transition-all group">
                    <div className="text-3xl mb-2">{EMOJI[p.category] || '🍽️'}</div>
                    <p className="font-semibold text-sm text-white truncate mb-0.5">{p.name}</p>
                    <p className="text-xs text-gray-500 mb-3">{p.category}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-brand font-bold text-sm">{formatCurrency(p.price)}</span>
                      <div className="flex items-center gap-1.5">
                        {qty > 0 && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="text-xs font-bold text-brand bg-brand/10 border border-brand/20 rounded-lg px-2 py-0.5">
                            {qty}
                          </motion.span>
                        )}
                        <div className="w-7 h-7 rounded-lg bg-brand/10 border border-brand/20 group-hover:bg-brand group-hover:border-brand flex items-center justify-center transition-all">
                          <Plus size={13} className="text-brand group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            {filtered.length === 0 && !loading && (
              <div className="col-span-3 flex flex-col items-center justify-center py-12 text-gray-500">
                <div className="text-4xl mb-2">🔍</div><p className="text-sm">No items found</p>
              </div>
            )}
            {loading && [...Array(6)].map((_, i) => <Skeleton key={i} className="h-36" />)}
          </div>
        </div>

        {/* ── Right panel: Cart + Payment ── */}
        <div className="w-72 border-l border-surface-border flex flex-col bg-surface-1/40">

          {/* Cart header */}
          <div className="flex items-center gap-2 px-4 pt-4 pb-2 shrink-0">
            <ShoppingCart size={16} className="text-brand" />
            <h3 className="font-semibold text-white text-sm">
              {selectedTable ? `Table ${selectedTable.number}` : 'Cart'}
            </h3>
            {cart.length > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="ml-auto text-xs font-bold bg-brand text-white rounded-full w-5 h-5 flex items-center justify-center">
                {cart.length}
              </motion.span>
            )}
          </div>

          {/* Cart items */}
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-2 px-4">
              <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center">
                <ShoppingCart size={22} className="text-gray-600" />
              </div>
              <p className="text-sm text-gray-500">Cart is empty</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 space-y-2 py-2">
              <AnimatePresence initial={false}>
                {cart.map(item => (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, x: 20, height: 0 }} animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    className="flex items-center gap-2 bg-surface-2 border border-surface-border rounded-xl p-2.5 overflow-hidden">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{item.name}</p>
                      <p className="text-xs text-brand">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-surface-3 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                        <Minus size={10} />
                      </button>
                      <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-surface-3 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                        <Plus size={10} />
                      </button>
                      <button onClick={() => removeFromCart(item.id)}
                        className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all ml-0.5">
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Payment + Total section */}
          <div className="border-t border-surface-border p-4 space-y-3 shrink-0">
            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Total</span>
              <span className="text-lg font-bold text-brand">{formatCurrency(cartTotal)}</span>
            </div>

            {/* Payment method selector */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'cash', icon: Banknote, label: 'Cash' },
                  { id: 'upi',  icon: Smartphone, label: 'UPI' },
                ].map(({ id, icon: Icon, label }) => (
                  <button key={id} onClick={() => setPayMethod(id)}
                    disabled={cart.length === 0}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all
                      ${payMethod === id
                        ? 'border-brand/60 bg-brand/15 text-brand shadow-glow-sm'
                        : 'border-surface-border bg-surface-2 text-gray-400 hover:border-gray-500 hover:text-gray-200'}
                      disabled:opacity-40 disabled:cursor-not-allowed`}>
                    <Icon size={15} />{label}
                  </button>
                ))}
              </div>
            </div>

            {/* Place order button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handlePlaceOrder}
              disabled={!canPlace || placing}
              className="btn-primary w-full py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {placing ? (
                <svg className="animate-spin h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : !selectedTable
                ? 'Select a Table First'
                : !payMethod
                  ? 'Select Payment Method'
                  : `Place Order · ${formatCurrency(cartTotal)}`
              }
            </motion.button>
          </div>
        </div>
      </div>
    </>
  )
}
