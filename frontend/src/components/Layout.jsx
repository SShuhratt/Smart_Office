import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Users,
  UserCheck,
  ClipboardList,
  ShieldCheck,
  Search,
  Bell,
  LogOut,
} from 'lucide-react';

const allNav = [
  { to: '/dashboard', label: 'Dashboard', roles: ['ADMIN', 'AUDITOR'], icon: LayoutDashboard },
  { to: '/assets', label: 'Assets', roles: ['ADMIN', 'AUDITOR', 'USER'], icon: Package },
  { to: '/employees', label: 'Employees', roles: ['ADMIN', 'AUDITOR'], icon: Users },
  { to: '/assign', label: 'Assign Asset', roles: ['ADMIN'], icon: UserCheck },
  { to: '/auditors', label: 'Auditors', roles: ['ADMIN'], icon: ShieldCheck },
  { to: '/audit', label: 'Audit Log', roles: ['ADMIN', 'AUDITOR'], icon: ClipboardList },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const nav = allNav
    .filter((item) => item.roles.includes(user?.role))
    .map((item) =>
      user?.role === 'USER' && item.to === '/assets'
        ? { ...item, label: 'My Assets' }
        : item
    );

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">S</div>
          <div>
            <div className="brand-title">SBAMS</div>
            <div className="brand-subtitle">Startup-grade asset ops</div>
          </div>
        </div>

        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">
            {(user?.username || 'U').slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="sidebar-user-name">{user?.username}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Workspace</div>

          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
              }
            >
              <span className="sidebar-link-icon">
                <Icon size={18} strokeWidth={2} />
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-logout-btn">
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="app-main">
        <header className="topbar">
          <div className="topbar-search">
            <Search size={16} />
            <input placeholder="Search assets, people, logs..." />
          </div>

          <div className="topbar-actions">
            <button className="topbar-icon-btn">
              <Bell size={18} />
            </button>

            <div className="topbar-profile">
              <div className="topbar-profile-avatar">
                {(user?.username || 'U').slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="topbar-profile-name">{user?.username}</div>
                <div className="topbar-profile-role">{user?.role}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="app-main-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}