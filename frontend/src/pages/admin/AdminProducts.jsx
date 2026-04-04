import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Search, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '../../services/api'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import Skeleton from '../../components/common/Skeleton'
import { notify } from '../../utils/toast'
import { formatCurrency } from '../../utils/helpers'

const CATEGORIES = ['Coffee', 'Tea', 'Food', 'Snacks', 'Dessert', 'Drinks']
const EMOJI = { Coffee: '☕', Tea: '🍵', Food: '🍽️', Snacks: '🍟', Dessert: '🍰', Drinks: '🥤' }

const empty = { name: '', category: 'Coffee', price: '', is_available: true }

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  const fetch = () => {
    setLoading(true)
    api.get('/products').then(r => { setProducts(r.data); setLoading(false) })
  }
  useEffect(() => { fetch() }, [])

  const filtered = products
    .filter(p => catFilter === 'All' || p.category === catFilter)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  const openAdd = () => { setEditing(null); setForm(empty); setShowModal(true) }
  const openEdit = (p) => { setEditing(p); setForm({ name: p.name, category: p.category, price: p.price, is_available: p.is_available }); setShowModal(true) }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, price: parseFloat(form.price) }
      if (editing) {
        await api.patch(`/products/${editing.id}`, payload)
        notify.success('Product updated')
      } else {
        await api.post('/products', payload)
        notify.success('Product added')
      }
      setShowModal(false)
      fetch()
    } catch (err) {
      notify.error(err.response?.data?.detail || 'Failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    await api.delete(`/products/${id}`)
    notify.success('Product deleted')
    fetch()
  }

  const toggleAvailable = async (p) => {
    await api.patch(`/products/${p.id}`, { is_available: !p.is_available })
    fetch()
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9 py-2" placeholder="Search products..." />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {['All', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all
                ${catFilter === c ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-surface-2 border border-surface-border text-gray-400 hover:border-gray-500'}`}>
              {c}
            </button>
          ))}
        </div>
        <Button onClick={openAdd}><Plus size={14} className="mr-1" />Add Product</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`glass-card p-4 group relative ${!p.is_available ? 'opacity-50' : ''}`}>
              <div className="text-3xl mb-2">{EMOJI[p.category] || '🍽️'}</div>
              <p className="font-semibold text-sm text-white truncate mb-0.5">{p.name}</p>
              <p className="text-xs text-gray-500 mb-2">{p.category}</p>
              <div className="flex items-center justify-between">
                <span className="text-brand font-bold text-sm">{formatCurrency(p.price)}</span>
                <button onClick={() => toggleAvailable(p)} className="text-gray-500 hover:text-white transition-colors">
                  {p.is_available ? <ToggleRight size={18} className="text-green-400" /> : <ToggleLeft size={18} />}
                </button>
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(p)} className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 hover:bg-blue-500/30">
                  <Pencil size={12} />
                </button>
                <button onClick={() => handleDelete(p.id)} className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30">
                  <Trash2 size={12} />
                </button>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && <p className="col-span-4 text-gray-500 text-sm text-center py-12">No products found</p>}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Product' : 'Add Product'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="e.g. Espresso" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="input-field">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Price (₹)</label>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="input-field" placeholder="120" required min={0} step="0.01" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="avail" checked={form.is_available} onChange={e => setForm({ ...form, is_available: e.target.checked })} className="w-4 h-4 accent-brand" />
              <label htmlFor="avail" className="text-sm text-gray-300">Available on menu</label>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" type="button" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
              <Button type="submit" loading={saving} className="flex-1">{editing ? 'Update' : 'Add'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
