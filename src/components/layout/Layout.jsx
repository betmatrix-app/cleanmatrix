import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/',       icon: '📋', label: 'Auditoría' },
  { to: '/panel',  icon: '📊', label: 'Panel' },
  { to: '/config', icon: '⚙️', label: 'Config' },
];

function useIsMobile() {
  return window.innerWidth < 768;
}

export default function Layout({ children }) {
  const { profile, logout } = useAuth();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 70 }}>
          {children}
        </div>
        <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#161b22', borderTop: '0.5px solid #21262d', display: 'flex', zIndex: 100 }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              style={({ isActive }) => ({
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '10px 0 8px', textDecoration: 'none', gap: 3,
                color: isActive ? '#58a6ff' : '#8b949e',
                borderTop: `2px solid ${isActive ? '#58a6ff' : 'transparent'}`,
              })}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span style={{ fontSize: 10 }}>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex">
      <aside className="w-56 bg-[#161b22] border-r border-[#21262d] flex flex-col">
        <div className="px-5 py-4 border-b border-[#21262d]">
          <div className="font-mono text-[16px] font-semibold text-[#58a6ff]">CleanMatrix</div>
          <div className="text-[11px] text-[#8b949e] mt-0.5">Auditoría de limpiezas</div>
        </div>
        <nav className="flex-1 py-3">
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors ${
                  isActive
                    ? 'text-[#e6edf3] bg-[#21262d]'
                    : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]/50'
                }`
              }>
              <span>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-[#21262d]">
          <div className="text-[12px] text-[#8b949e] mb-1">{profile?.nombre}</div>
          <div className="text-[11px] text-[#484f58] mb-3">{profile?.rol}</div>
          <button onClick={logout} className="text-[12px] text-[#8b949e] hover:text-[#e6edf3] transition-colors">
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}