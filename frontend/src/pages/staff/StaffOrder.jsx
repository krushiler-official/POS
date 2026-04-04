import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Trash2, ShoppingCart, Search } from 'lucide-react'
import api from '../../services/api'
import { useOrder } from '../../context/OrderContext'
import { formatCurrency } from '../../utils/helpers'
import { notify } from '../../utils/toast'
import Skeleton from '../../components/common/Skeleton'

const CATEGORIES = ['All', 'Coffee', 'Tea', 'Food', 'Snacks', 'Dessert', 'Drinks']
const EMOJI = { Coffee: '☕', Tea: '🍵', Food: '🍽️', Snacks: '🍟', Dessert: '🍰', Drinks: '🥤' }

export default function StaffOrder() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('All')
  const [search, setSearch] = useState('')
  const [placing, setPlacing] = useState(false)
  const { cart, selectedTable, addToCart, updateQuantity, removeFromCart, clearCart, cartTotal } = useOrder()
  const navigate = useNavigate()

  useEffect(() => { api.get('/products').then(r => { setProducts(r.data); setLoading(false) }) }, [])

  const filtered = products.filter(p => p.is_available)
    .filter(p => cat === 'All' || p.category === cat)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  const cartQty = (id) => cart.find(i => i.id === id)?.quantity || 0

  const handleCheckout = async () => {
    if (!selectedTable || cart.length === 0) return
    setPlacing(true)
    try {
      await api.post('/orders', {
        table_id: selectedTable.id,
        items: cart.map(i => ({ product_id: i.id, quantity: i.quantity })),
      })
      notify.success(`Order placed for Table ${selectedTable.number}!`)
      clearCart()
      navigate('/staff/kitchen')
    } catch (err) {
      notify.error(err.response?.data?.detail || 'Failed to place order')
    } finally { setPlacing(false) }
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Products */}
      <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9 py-2.5" placeholder="Search menu..." />
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
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
                <motion.div key={p.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
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

      {/* Cart */}
      <div className="w-72 border-l border-surface-border flex flex-col bg-surface-1/40 p-4">
        <div className="flex items-center gap-2 mb-4">
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

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-2">
            <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center">
              <ShoppingCart size={22} className="text-gray-600" />
            </div>
            <p className="text-sm text-gray-500">Cart is empty</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
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
            <div className="border-t border-surface-border pt-3 mt-3 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Total</span>
                <span className="text-lg font-bold text-brand">{formatCurrency(cartTotal)}</span>
              </div>
              <motion.button whileTap={{ scale: 0.98 }} onClick={handleCheckout}
                disabled={!selectedTable || placing}
                className="btn-primary w-full py-3 text-sm">
                {placing ? (
                  <svg className="animate-spin h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : selectedTable ? `Place Order — T${selectedTable.number}` : 'Select a Table First'}
              </motion.button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
