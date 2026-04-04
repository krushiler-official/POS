import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, RefreshCw, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import Skeleton from '../../components/common/Skeleton'
import { useOrder } from '../../context/OrderContext'
import { notify } from '../../utils/toast'
import { statusColor } from '../../utils/helpers'

export default function StaffDashboard() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const { setSelectedTable } = useOrder()
  const navigate = useNavigate()

  const fetch = () => {
    setLoading(true)
    api.get('/tables').then(r => { setTables(r.data); setLoading(false) })
  }
  useEffect(() => { fetch() }, [])

  const handleClick = (table) => {
    setSelectedTable(table)
    notify.success(`Table ${table.number} selected`)
    navigate('/staff/order')
  }

  const available = tables.filter(t => t.status === 'available').length

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-white text-lg">Select a Table</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            <span className="text-green-400 font-medium">{available}</span> available ·{' '}
            <span className="text-red-400 font-medium">{tables.length - available}</span> occupied
          </p>
        </div>
        <button onClick={fetch} className="btn-ghost w-9 h-9 p-0 flex items-center justify-center">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {tables.map((table, i) => (
            <motion.div key={table.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={() => handleClick(table)}
              className={`relative cursor-pointer rounded-2xl border-2 p-4 select-none transition-all
                ${table.status === 'occupied'
                  ? 'border-red-500/40 bg-red-500/5 hover:border-red-500/60'
                  : 'border-green-500/40 bg-green-500/5 hover:border-green-500/60 hover:shadow-[0_0_20px_rgba(34,197,94,0.1)]'}`}>
              <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${table.status === 'occupied' ? 'bg-red-400' : 'bg-green-400 animate-pulse'}`} />
              <p className="text-3xl font-black text-white mb-1">T{table.number}</p>
              <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
                <Users size={11} /><span>{table.capacity} seats</span>
              </div>
              <span className={`badge ${statusColor[table.status]} capitalize text-xs`}>{table.status}</span>
            </motion.div>
          ))}
        </div>
      )}
      {!loading && tables.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <div className="text-5xl mb-3">🪑</div>
          <p className="font-medium">No tables available</p>
          <p className="text-sm mt-1">Ask admin to add tables</p>
        </div>
      )}
    </div>
  )
}
