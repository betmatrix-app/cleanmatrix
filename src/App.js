import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import NuevaAuditoria from './pages/auditoria/NuevaAuditoria';
import Panel from './pages/panel/Panel';
import Configuracion from './pages/configuracion/Configuracion';
import Layout from './components/layout/Layout';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-slate-400 text-[13px]">Cargando...</div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<NuevaAuditoria />} />
                  <Route path="/panel" element={<Panel />} />
                  <Route path="/config" element={<Configuracion />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}