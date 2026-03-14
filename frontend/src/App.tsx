import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import { api } from './api';
import type { Me } from './types';
import Gallery from './pages/Gallery';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';

// ── Auth context ────────────────────────────────────────────────────────────

interface AuthCtx { me: Me | null; loading: boolean; refresh: () => void; }
const AuthContext = createContext<AuthCtx>({ me: null, loading: true, refresh: () => {} });
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    api.me()
      .then(setMe)
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  return (
    <AuthContext.Provider value={{ me, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

function RequireAuth({ children, role }: { children: React.ReactNode; role?: string }) {
  const { me, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner spinner-dark" /></div>;
  if (!me) return <Navigate to="/login" replace />;
  if (role && me.role !== role && me.role !== 'superadmin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"                element={<Navigate to="/login" replace />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/gallery/:slug"   element={<Gallery />} />
          <Route path="/dashboard"       element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/admin"           element={<RequireAuth role="superadmin"><AdminPanel /></RequireAuth>} />
          <Route path="*"               element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
