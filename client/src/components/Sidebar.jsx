import { NavLink } from 'react-router-dom';

export default function Sidebar({ collapsed, onToggle, isAdmin }) {
  return (
    <aside className={`app-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="app-sidebar-header">
        {!collapsed && <span className="app-sidebar-title">Menu</span>}
        <button
          className="sidebar-toggle"
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label="Toggle sidebar"
        >
          <i className={`fa-solid ${collapsed ? 'fa-angles-right' : 'fa-angles-left'}`} />
        </button>
      </div>

      <nav className="app-sidebar-nav">
        <p className="app-sidebar-section">{!collapsed && 'File'}</p>
        <NavLink to="/" end className="app-sidebar-link" title="My Drive">
          <span className="app-sidebar-icon"><i className="fa-solid fa-folder-open" /></span>
          {!collapsed && <span>My Drive</span>}
        </NavLink>
        <NavLink to="/recent" className="app-sidebar-link" title="Recent files">
          <span className="app-sidebar-icon"><i className="fa-solid fa-clock-rotate-left" /></span>
          {!collapsed && <span>Recent</span>}
        </NavLink>
        <NavLink to="/starred" className="app-sidebar-link" title="Starred files">
          <span className="app-sidebar-icon"><i className="fa-solid fa-star" /></span>
          {!collapsed && <span>Starred</span>}
        </NavLink>
        <NavLink to="/shared" className="app-sidebar-link" title="Shared with public">
          <span className="app-sidebar-icon"><i className="fa-solid fa-globe" /></span>
          {!collapsed && <span>Public Links</span>}
        </NavLink>
        <NavLink to="/trash" className="app-sidebar-link" title="Trash">
          <span className="app-sidebar-icon"><i className="fa-solid fa-trash" /></span>
          {!collapsed && <span>Trash</span>}
        </NavLink>

        {isAdmin && (
          <>
            <p className="app-sidebar-section">{!collapsed && 'Administration'}</p>
            <NavLink to="/admin" className="app-sidebar-link" title="Admin panel">
              <span className="app-sidebar-icon"><i className="fa-solid fa-shield-halved" /></span>
              {!collapsed && <span>Admin Panel</span>}
            </NavLink>
            <NavLink to="/admin/stats" className="app-sidebar-link" title="Storage statistics">
              <span className="app-sidebar-icon"><i className="fa-solid fa-chart-pie" /></span>
              {!collapsed && <span>Statistics</span>}
            </NavLink>
            <NavLink to="/admin/activity" className="app-sidebar-link" title="Activity log">
              <span className="app-sidebar-icon"><i className="fa-solid fa-clipboard-list" /></span>
              {!collapsed && <span>Activity Log</span>}
            </NavLink>
          </>
        )}

        <p className="app-sidebar-section">{!collapsed && 'Account'}</p>
        <NavLink to="/settings" className="app-sidebar-link" title="Account settings">
          <span className="app-sidebar-icon"><i className="fa-solid fa-gear" /></span>
          {!collapsed && <span>Settings</span>}
        </NavLink>
        <a
          className="app-sidebar-link"
          href="/api-docs"
          target="_blank"
          rel="noreferrer"
          title="API Documentation"
        >
          <span className="app-sidebar-icon"><i className="fa-solid fa-book" /></span>
          {!collapsed && <span>API Docs</span>}
        </a>
      </nav>
    </aside>
  );
}
