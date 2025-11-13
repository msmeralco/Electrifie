import PropTypes from 'prop-types';
import './TopBar.css';

function TopBar({ onRefresh, stats }) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="topbar">
      <div className="topbar-left">
        <h1 className="page-title">Dashboard Overview</h1>
        <p className="page-subtitle">{currentDate}</p>
      </div>

      <div className="topbar-right">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search customers..." />
        </div>

        <button className="icon-btn" title="Notifications">
          <span className="notification-badge">3</span>
          🔔
        </button>

        <button className="icon-btn" onClick={onRefresh} title="Refresh">
          🔄
        </button>
      </div>
    </div>
  );
}

TopBar.propTypes = {
  onRefresh: PropTypes.func.isRequired,
  stats: PropTypes.object,
};

export default TopBar;