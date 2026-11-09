import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { ToastProvider } from './context/ToastContext'
import AuthGate from './components/AuthGate'
import Layout from './components/Layout'
import Agenda from './pages/Agenda'
import Equipamentos from './pages/Equipamentos'
import Historico from './pages/Historico'

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AuthGate>
          <DataProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<Layout />}>
                  <Route index element={<Agenda />} />
                  <Route path="equipamentos" element={<Equipamentos />} />
                  <Route path="historico" element={<Historico />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </DataProvider>
        </AuthGate>
      </AuthProvider>
    </ToastProvider>
  )
}
