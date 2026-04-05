import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Plus, Minus, Trash2, Coffee, CheckCircle, X, Banknote, Smartphone } from 'lucide-react'
import axios from 'axios'
import { QRCodeSVG } from 'qrcode.react'
import { upiLink, UPI_ID } from '../utils/upi'

const api = axios.create({ baseURL: 'http://localhost:8000' })

// Debug: log errors
api.interceptors.response.use(
  res => res,
  err => {
    console.error('API error:', err.response?.status, err.response?.data, err.config?.url)
    return Promise.reject(err)
  }
)

const CATEGORIES = ['All', 'Coffee', 'Tea', 'Food', 'Snacks', 'Dessert', 'Drinks']
const EMOJI = { Coffee: '☕', Tea: '🍵', Food: '🍽️', Snacks: '🍟', Dessert: '🍰', Drinks: '🥤' }

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n || 0)

export default function TableMenu() {
  const { tableId } = useParams()
  const [table, setTable] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cat, setCat] = useState('All')
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)
  const [payMethod, setPayMethod] = useState(null)
  const [showUPI, setShowUPI] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState(null)

  useEffect(() => {
    Promise.allSettled([
      api.get(`/public/table/${tableId}`),
      api.get('/public/products'),
    ]).then(([t, p]) => {
      if (t.status === 'fulfilled') {
        setTable(t.value.data)
      } else {
        const status = t.reason?.response?.status
        if (status === 404) {
          setError('Table not found. Please scan the correct QR code.')
        } else {
          setError(`Could not connect to server (${status || 'network error'}). Make sure the backend is running.`)
        }
      }
      if (p.status === 'fulfilled') setProducts(p.value.data)
      setLoading(false)
    })
  }, [tableId])

  const filtered = products.filter(p => cat === 'All' || p.category === cat)
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  const addToCart = (p) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id)
      if (ex) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...p, quantity: 1 }]
    })
  }

  const updateQty = (id, qty) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i.id !== id))
    else setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i))
  }

  const placeOrder = async (method) => {
    setPlacing(true)
    setShowUPI(false)
    try {
      const res = await api.post('/public/orders', {
        table_id: tableId,
        items: cart.map(i => ({ product_id: i.id, quantity: i.quantity })),
        payment_method: method,
      })
      setOrderId(res.data.id)
      setSuccess(true)
      setCart([])
      setShowCart(false)
      setPayMethod(null)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to place order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  const handleConfirm = () => {
    if (!payMethod) return
    if (payMethod === 'upi') { setShowUPI(true); return }
    placeOrder('cash')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center animate-pulse">
          <Coffee size={22} className="text-white" />
        </div>
        <p className="text-gray-400 text-sm">Loading menu...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-6">
      <div className="text-center">
        <div className="text-5xl mb-4">❌</div>
        <p className="text-white font-bold text-lg mb-2">Invalid QR Code</p>
        <p className="text-gray-400 text-sm">{error}</p>
      </div>
    </div>
  )

  if (success) return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="text-center flex flex-col items-center gap-5 max-w-sm">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center">
          <CheckCircle size={48} className="text-green-400" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-black text-white mb-2">Order Placed!</h2>
          <p className="text-gray-400 text-sm">Your order is being prepared.</p>
          <p className="text-gray-500 text-xs mt-1">Order #{orderId?.slice(-6).toUpperCase()}</p>
        </div>
        <div className="glass-card p-4 w-full text-left space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Table</p>
          <p className="text-white font-bold text-lg">Table {table?.number}</p>
        </div>
        <p className="text-sm text-gray-500">Watch the display screen for your order status.</p>
        <button onClick={() => setSuccess(false)}
          className="btn-primary w-full py-3">
          Order More
        </button>
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-surface-border bg-surface-1/95 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-sm">
            <Coffee size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">CaféPOS</p>
            <p className="text-xs text-brand">Table {table?.number}</p>
          </div>
        </div>
        <button onClick={() => setShowCart(true)}
          className="relative w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center">
          <ShoppingCart size={18} className="text-brand" />
          {cartCount > 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand rounded-full text-white text-[10px] font-black flex items-center justify-center">
              {cartCount}
            </motion.span>
          )}
        </button>
      </header>

      {/* Category tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-surface-border shrink-0">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0
              ${cat === c ? 'bg-brand text-white shadow-glow-sm' : 'bg-surface-2 border border-surface-border text-gray-400'}`}>
            {EMOJI[c] || '✨'} {c}
          </button>
        ))}
      </div>

      {/* Products grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((p, i) => {
            const qty = cart.find(i => i.id === p.id)?.quantity || 0
            return (
              <motion.div key={p.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="glass-card p-3.5 flex flex-col">
                <div className="text-3xl mb-2">{EMOJI[p.category] || '🍽️'}</div>
                <p className="font-semibold text-sm text-white mb-0.5 leading-tight">{p.name}</p>
                <p className="text-xs text-gray-500 mb-3">{p.category}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-brand font-bold text-sm">{formatCurrency(p.price)}</span>
                  {qty === 0 ? (
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => addToCart(p)}
                      className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center shadow-glow-sm">
                      <Plus size={15} className="text-white" />
                    </motion.button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateQty(p.id, qty - 1)}
                        className="w-7 h-7 rounded-lg bg-surface-3 flex items-center justify-center text-gray-300">
                        <Minus size={12} />
                      </motion.button>
                      <span className="text-sm font-bold text-white w-4 text-center">{qty}</span>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => addToCart(p)}
                        className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
                        <Plus size={12} className="text-white" />
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-sm">No items in this category</p>
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      {cartCount > 0 && (
        <motion.div initial={{ y: 80 }} animate={{ y: 0 }}
          className="sticky bottom-0 p-4 border-t border-surface-border bg-surface-1/95 backdrop-blur-xl">
          <button onClick={() => setShowCart(true)}
            className="btn-primary w-full py-3.5 flex items-center justify-between px-5">
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 bg-white/20 rounded-full text-xs font-black flex items-center justify-center">{cartCount}</span>
              View Cart
            </span>
            <span className="font-black">{formatCurrency(cartTotal)}</span>
          </button>
        </motion.div>
      )}

      {/* Cart drawer */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCart(false)} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-surface-1 border-t border-surface-border rounded-t-3xl max-h-[85vh] flex flex-col">

              {/* Drawer handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-surface-border" />
              </div>

              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-3 shrink-0">
                <h3 className="font-bold text-white text-lg">Your Order</h3>
                <button onClick={() => setShowCart(false)}
                  className="w-8 h-8 rounded-xl bg-surface-2 flex items-center justify-center text-gray-400">
                  <X size={15} />
                </button>
              </div>

              {/* Cart items */}
              <div className="flex-1 overflow-y-auto px-5 space-y-2 pb-2">
                <AnimatePresence initial={false}>
                  {cart.map(item => (
                    <motion.div key={item.id}
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3 bg-surface-2 border border-surface-border rounded-2xl p-3 overflow-hidden">
                      <span className="text-xl">{EMOJI[item.category] || '🍽️'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                        <p className="text-xs text-brand">{formatCurrency(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-surface-3 flex items-center justify-center text-gray-300">
                          <Minus size={11} />
                        </button>
                        <span className="text-sm font-bold text-white w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-surface-3 flex items-center justify-center text-gray-300">
                          <Plus size={11} />
                        </button>
                        <button onClick={() => updateQty(item.id, 0)}
                          className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 ml-1">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Payment + total */}
              <div className="px-5 pb-6 pt-3 border-t border-surface-border space-y-4 shrink-0">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Total</span>
                  <span className="text-xl font-black text-brand">{formatCurrency(cartTotal)}</span>
                </div>

                {/* Payment method */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payment Method</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ id: 'cash', icon: Banknote, label: 'Cash' }, { id: 'upi', icon: Smartphone, label: 'UPI' }].map(({ id, icon: Icon, label }) => (
                      <button key={id} onClick={() => setPayMethod(id)}
                        className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-semibold transition-all
                          ${payMethod === id ? 'border-brand/60 bg-brand/15 text-brand' : 'border-surface-border bg-surface-2 text-gray-400'}`}>
                        <Icon size={16} />{label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* UPI QR */}
                <AnimatePresence>
                  {showUPI && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-col items-center gap-3 overflow-hidden">
                      <div className="bg-white p-3 rounded-2xl shadow-lg">
                        <QRCodeSVG
                          value={upiLink(cartTotal, `Table ${table?.number} Order`)}
                          size={160}
                          bgColor="#ffffff"
                          fgColor="#111827"
                          level="M"
                        />
                      </div>
                      <div className="text-center">
                        <p className="font-black text-white text-lg">{formatCurrency(cartTotal)}</p>
                        <p className="text-xs text-gray-400">{UPI_ID}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Scan with GPay, PhonePe, Paytm etc.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={handleConfirm}
                  disabled={!payMethod || placing}
                  className="btn-primary w-full py-4 text-base font-bold disabled:opacity-40 disabled:cursor-not-allowed">
                  {placing ? (
                    <svg className="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : !payMethod ? 'Select Payment Method'
                    : payMethod === 'upi' && !showUPI ? 'Show QR Code'
                    : payMethod === 'upi' ? 'Confirm Payment & Place Order'
                    : `Place Order · ${formatCurrency(cartTotal)}`
                  }
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
