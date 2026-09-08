import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="topbar-left">
          <button
            className="sidebar-toggle topbar-sidebar-toggle"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <i className="fa-solid fa-bars" />
          </button>
          <Link to="/" className="brand">Uploader CDN</Link>
        </div>
        <div className="topbar-right">
          <div className="user-chip">
            <span className="user-avatar">{user?.email?.[0]?.toUpperCase()}</span>
            <div className="user-chip-info">
              <span className="user-email">{user?.email}</span>
              <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
            </div>
          </div>
          <button className="secondary" onClick={logout}>Logout</button>
        </div>
      </header>
      <div className="dashboard-body">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} isAdmin={user?.role === 'admin'} />
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
