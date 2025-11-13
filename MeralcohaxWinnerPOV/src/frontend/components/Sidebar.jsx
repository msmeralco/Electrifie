import { useState } from 'react';
import PropTypes from 'prop-types';
import './Sidebar.css';

function Sidebar({ activeView, setActiveView }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'map', icon: '🗺️', label: 'Map View' },
    { id: 'analytics', icon: '📈', label: 'Analytics' },
    { id: 'inspections', icon: '🔍', label: 'Inspections' },
    { id: 'reports', icon: '📄', label: 'Reports' },
    { id: 'customers', icon: '👥', label: 'Customers' },
    { id: 'alerts', icon: '🔔', label: 'Alerts' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div 
        className="sidebar-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <div className="logo">
          <span className="logo-icon">⚡</span>
          {!isCollapsed && <span className="logo-text">KILOS</span>}
        </div>
        {!isCollapsed && <p className="logo-subtitle">NTL Detection</p>}
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
            title={isCollapsed ? item.label : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            {!isCollapsed && <span className="nav-label">{item.label}</span>}
          </button>
        ))}
      </nav>

      {!isCollapsed && (
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">👤</div>
            <div className="user-info">
              <div className="user-name">Admin User</div>
              <div className="user-role">Operations Manager</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Sidebar.propTypes = {
  activeView: PropTypes.string.isRequired,
  setActiveView: PropTypes.func.isRequired,
};

export default Sidebar;