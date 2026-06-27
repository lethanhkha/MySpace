import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/common/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import HubDashboard from './pages/HubDashboard'
import MonexaApp from './pages/monexa/MonexaApp'
import NixioApp from './pages/nixio/NixioApp'
import NoteraApp from './pages/notera/NoteraApp'

function App() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route
          path="/hub"
          element={
            <ProtectedRoute>
              <AppLayout>
                <HubDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hub/monexa"
          element={
            <ProtectedRoute>
              <AppLayout>
                <MonexaApp />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hub/nixio"
          element={
            <ProtectedRoute>
              <AppLayout>
                <NixioApp />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hub/notera"
          element={
            <ProtectedRoute>
              <AppLayout>
                <NoteraApp />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Default */}
        <Route path="/" element={<Navigate to="/hub" replace />} />
        <Route path="*" element={<Navigate to="/hub" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App