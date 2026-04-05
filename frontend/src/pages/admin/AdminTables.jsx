import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Users, RefreshCw, QrCode, X, ExternalLink } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import api from '../../services/api'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import Skeleton from '../../components/common/Skeleton'
import { notify } from '../../utils/toast'
import { statusColor } from '../../utils/helpers'

const MENU_BASE = `${window.location.origin}/menu`

export default function AdminTables() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ number: '', capacity: 4 })
  const [saving, setSaving] = useState(false)
  const [qrTable, setQrTable] = useState(null)

  const fetch = () => {
    setLoading(true)
    api.get('/tables')
      .then(r => { setTables(r.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetch() }, [])

  const openAdd = () => { setEditing(null); setForm({ number: '', capacity: 4 }); setShowModal(true) }
  const openEdit = (t) => { setEditing(t); setForm({ number: t.number, capacity: t.capacity }); setShowModal(true) }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await api.patch(`/tables/${editing.id}`, { status: editing.status })
        notify.success('Table updated')
      } else {
        await api.post('/tables', { number: parseInt(form.number), capacity: parseInt(form.capacity) })
        notify.success('Table added')
      }
      setShowModal(false)
      fetch()
    } catch (err) {
      notify.error(err.response?.data?.detail || 'Failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this table?')) return
    await api.delete(`/tables/${id}`)
    notify.success('Table deleted')
    fetch()
  }

  const available = tables.filter(t => t.status === 'available').length

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-sm text-gray-400"><span className="text-green-400 font-semibold">{available}</span> available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-sm text-gray-400"><span className="text-red-400 font-semibold">{tables.length - available}</span> occupied</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={fetch} className="w-9 h-9 p-0 flex items-center justify-center">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button onClick={openAdd}><Plus size={15} className="mr-1" />Add Table</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tables.map((table, i) => (
            <motion.div key={table.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`relative rounded-2xl border-2 p-4 group
                ${table.status === 'occupied' ? 'border-red-500/30 bg-red-500/5' : 'border-green-500/30 bg-green-500/5'}`}>
              <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${table.status === 'occupied' ? 'bg-red-400' : 'bg-green-400'}`} />
              <p className="text-2xl font-black text-white mb-1">T{table.number}</p>
              <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
                <Users size={11} /><span>{table.capacity} seats</span>
              </div>
              <span className={`badge ${statusColor[table.status]} capitalize text-xs`}>{table.status}</span>
              <div className="absolute inset-0 rounded-2xl bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button onClick={() => setQrTable(table)}
                  className="w-8 h-8 rounded-lg bg-brand/20 border border-brand/30 flex items-center justify-center text-brand hover:bg-brand/30"
                  title="Show QR">
                  <QrCode size={13} />
                </button>
                <button onClick={() => openEdit(table)}
                  className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 hover:bg-blue-500/30">
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleDelete(table.id)}
                  className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/30">
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* QR Modal */}
      {qrTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setQrTable(null)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-surface-1 border border-surface-border rounded-3xl p-8 flex flex-col items-center gap-5 shadow-card w-80">
            <div className="flex items-center justify-between w-full">
              <div>
                <h3 className="font-bold text-white text-lg">Table {qrTable.number}</h3>
                <p className="text-xs text-gray-500">Scan to order</p>
              </div>
              <button onClick={() => setQrTable(null)}
                className="w-8 h-8 rounded-xl bg-surface-2 flex items-center justify-center text-gray-400 hover:text-white">
                <X size={15} />
              </button>
            </div>

            {/* QR Code */}
            <div className="bg-white p-4 rounded-2xl">
              <QRCodeSVG
                value={`${MENU_BASE}/${qrTable.id}`}
                size={180}
                bgColor="#ffffff"
                fgColor="#111827"
                level="M"
              />
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-400">Customers scan this to order</p>
              <p className="text-xs text-gray-600 mt-1 break-all">{MENU_BASE}/{qrTable.id}</p>
            </div>

            <a href={`${MENU_BASE}/${qrTable.id}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-xs text-brand hover:text-brand-light transition-colors">
              <ExternalLink size={12} /> Open menu link
            </a>
          </motion.div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal title={editing ? 'Edit Table' : 'Add New Table'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Table Number</label>
              <input type="number" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })}
                className="input-field" placeholder="e.g. 5" required min={1} disabled={!!editing} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Capacity</label>
              <input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })}
                className="input-field" min={1} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" type="button" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
              <Button type="submit" loading={saving} className="flex-1">{editing ? 'Update' : 'Add Table'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
