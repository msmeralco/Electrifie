import { useState } from 'react';
import PropTypes from 'prop-types';
import './Sidebar.css';


function Sidebar({ activeView, setActiveView }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: <i class="fi fi-br-stats"></i>, label: 'Dashboard' },
    { id: 'map', icon: <i class="fi fi-br-region-pin-alt"></i>, label: 'Map View' },
    { id: 'fieldops', icon: <i class="fi fi-br-wrench-alt"></i>, label: 'Field Ops View' },
    { id: 'engineering', icon: <i class="fi fi-br-hard-hat"></i>, label: 'Engineering View' },
    { id: 'customers', icon: <i class="fi fi-br-users"></i>, label: 'Customer Service View' },
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
          <>
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
              title={isCollapsed ? item.label : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {!isCollapsed && <span className="nav-label">{item.label}</span>}
            </button>
            {item.id === 'map' && !isCollapsed && (
              <div className="sidebar-divider" />
            )}
          </>
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