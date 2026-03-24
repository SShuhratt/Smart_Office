import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const allNav = [
  { to: '/dashboard', label: '📊 Dashboard',    roles: ['ADMIN', 'AUDITOR'] },
  { to: '/assets',    label: '🖥️ Assets',        roles: ['ADMIN', 'AUDITOR', 'USER'] },
  { to: '/employees', label: '👤 Employees',     roles: ['ADMIN', 'AUDITOR'] },
  { to: '/assign',    label: '🔗 Assign Asset',  roles: ['ADMIN'] },
  { to: '/auditors',  label: '🔍 Auditors',      roles: ['ADMIN'] },
  { to: '/audit',     label: '📋 Audit Log',     roles: ['ADMIN', 'AUDITOR'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const nav = allNav
    .filter(item => item.roles.includes(user?.role))
    .map(item =>
      user?.role === 'USER' && item.to === '/assets'
        ? { ...item, label: '🖥️ My Assets' }
        : item
    );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 220, background: '#1e293b', color: '#f1f5f9',
        display: 'flex', flexDirection: 'column', padding: '1.5rem 0',
        position: 'fixed', top: 0, left: 0, bottom: 0,
      }}>
        <div style={{ padding: '0 1.25rem 1.5rem', borderBottom: '1px solid #334155' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>🏦 SBAMS</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
            {user?.username} · {user?.role}
          </div>
        </div>
        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {nav.map(({ to, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'block', padding: '0.6rem 1.25rem',
              color: isActive ? '#fff' : '#94a3b8',
              background: isActive ? '#334155' : 'transparent',
              textDecoration: 'none', fontSize: '0.875rem',
              borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
              transition: 'all 0.15s',
            })}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #334155' }}>
          <button onClick={handleLogout} style={{
            width: '100%', background: '#334155', color: '#f1f5f9',
            border: 'none', borderRadius: 6, padding: '0.5rem',
            cursor: 'pointer', fontSize: '0.875rem',
          }}>
            Sign out
          </button>
        </div>
      </aside>
      <main style={{ marginLeft: 220, flex: 1, padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  );
}