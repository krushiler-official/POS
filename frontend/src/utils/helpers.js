export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)

export const formatTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

export const statusColor = {
  preparing: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-green-500/20 text-green-400',
  available: 'bg-green-500/20 text-green-400',
  occupied:  'bg-red-500/20 text-red-400',
}
