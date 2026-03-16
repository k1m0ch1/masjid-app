import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './stores/useAuthStore'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Jamaah from './pages/Jamaah'
import Finance from './pages/Finance'
import Events from './pages/Events'
import Ziswaf from './pages/Ziswaf'
import PesanKirim from './pages/PesanKirim'
import Setting from './pages/Setting'
import AccessDenied from './pages/AccessDenied'
import Layout from './components/Layout'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

const ModuleRoute = ({ moduleKey, children }) => {
  const { user } = useAuthStore()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const allowedModules = user.allowed_modules || []
  if (!allowedModules.includes(moduleKey)) {
    return <Navigate to="/access-denied" replace />
  }

  return children
}

function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    const subscription = initialize()
    return () => subscription?.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <ModuleRoute moduleKey="dashboard">
                <Dashboard />
              </ModuleRoute>
            }
          />
          <Route
            path="jamaah"
            element={
              <ModuleRoute moduleKey="jamaah">
                <Jamaah />
              </ModuleRoute>
            }
          />
          <Route
            path="finance"
            element={
              <ModuleRoute moduleKey="finance">
                <Finance />
              </ModuleRoute>
            }
          />
          <Route
            path="events"
            element={
              <ModuleRoute moduleKey="events">
                <Events />
              </ModuleRoute>
            }
          />
          <Route
            path="ziswaf"
            element={
              <ModuleRoute moduleKey="ziswaf">
                <Ziswaf />
              </ModuleRoute>
            }
          />
          <Route
            path="pesan-kirim"
            element={
              <ModuleRoute moduleKey="pesan_kirim">
                <PesanKirim />
              </ModuleRoute>
            }
          />
          <Route
            path="setting"
            element={
              <ModuleRoute moduleKey="setting">
                <Setting />
              </ModuleRoute>
            }
          />
          <Route path="access-denied" element={<AccessDenied />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
