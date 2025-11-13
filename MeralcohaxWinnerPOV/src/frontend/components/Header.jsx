import PropTypes from 'prop-types';
import './Header.css';

function Header({ onRefresh }) {
  const currentDate = new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-icon">⚡</span>
          <div className="logo-text">
            <h1>Project KILOS</h1>
            <p>Kuryente Intelligence for Loss & Operations System</p>
          </div>
        </div>
      </div>
      
      <div className="header-center">
        <div className="date-display">
          <span className="date-label">Inspection Date:</span>
          <span className="date-value">{currentDate}</span>
        </div>
      </div>

      <div className="header-right">
        <button onClick={onRefresh} className="btn-refresh" title="Refresh data">
          🔄 Refresh
        </button>
        <div className="user-menu">
          <span className="user-badge">👤 Field Ops Admin</span>
        </div>
      </div>
    </header>
  );
}

Header.propTypes = {
  onRefresh: PropTypes.func.isRequired,
};

export default Header;
