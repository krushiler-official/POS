import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { OrderProvider } from './context/OrderContext'

// Auth pages
import Login from './pages/Login'
import Signup from './pages/Signup'

// Admin
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminTables from './pages/admin/AdminTables'
import AdminProducts from './pages/admin/AdminProducts'
import AdminOrders from './pages/admin/AdminOrders'
import AdminAnalytics from './pages/admin/AdminAnalytics'

// Staff
import StaffLayout from './components/staff/StaffLayout'
import StaffDashboard from './pages/staff/StaffDashboard'
import StaffOrder from './pages/staff/StaffOrder'
import StaffKitchen from './pages/staff/StaffKitchen'
import StaffPayment from './pages/staff/StaffPayment'

function RoleRouter() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  return <Navigate to="/staff/tables" replace />
}

function AdminGuard() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/staff/tables" replace />
  return <AdminLayout><Outlet /></AdminLayout>
}

function StaffGuard() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  return <StaffLayout><Outlet /></StaffLayout>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrderProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#1c2333', color: '#f1f5f9', border: '1px solid #2a3347', borderRadius: '12px', fontSize: '14px' },
              success: { iconTheme: { primary: '#f97316', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<RoleRouter />} />

            {/* Admin routes */}
            <Route element={<AdminGuard />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/tables" element={<AdminTables />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
            </Route>

            {/* Staff routes */}
            <Route element={<StaffGuard />}>
              <Route path="/staff/tables" element={<StaffDashboard />} />
              <Route path="/staff/order" element={<StaffOrder />} />
              <Route path="/staff/kitchen" element={<StaffKitchen />} />
              <Route path="/staff/payment" element={<StaffPayment />} />
            </Route>

            <Route path="*" element={<RoleRouter />} />
          </Routes>
        </OrderProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
