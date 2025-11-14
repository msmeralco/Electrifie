import PropTypes from 'prop-types';
import './MetricsCards.css';

function MetricsCards({ stats }) {
  if (!stats || !stats.customers || !stats.transformers || !stats.feeders) {
    return null;
  }

  const formatCurrency = (value) => {
    if (!value || isNaN(value)) return '₱0.0M';
    return `₱${(value / 1000000).toFixed(1)}M`;
  };

  const formatNumber = (value) => {
    if (!value || isNaN(value)) return '0';
    return new Intl.NumberFormat('en-PH').format(value);
  };

  const formatPercentage = (value) => {
    if (!value || isNaN(value)) return '0.0%';
    return `${parseFloat(value).toFixed(2)}%`;
  };

  const metrics = [
    {
      title: 'System Loss Percentage',
      value: formatPercentage(stats.feeders.avg_system_loss),
      subtitle: 'Regulatory Cap: 6.25%',
      change: '+0.24%',
      trend: 'down',
      icon: '',
      color: '#fb7018',
      status: 'warning'
    },
    {
      title: 'NTL Cases Flagged',
      value: formatNumber(stats.customers.total_customers),
      subtitle: `${formatNumber(stats.customers.critical_count + stats.customers.high_count)} high priority`,
      change: '+3.2%',
      trend: 'up',
      icon: '',
      color: '#ef4444',
      status: 'critical'
    },
    {
      title: 'Revenue Loss (Total)',
      value: formatCurrency(stats.feeders.total_revenue_loss),
      subtitle: 'All feeders + network losses',
      change: '+8.2%',
      trend: 'up',
      icon: '',
      color: '#f59e0b',
      status: 'info'
    },
    {
      title: 'KILOS Accuracy',
      value: '93.2%',
      subtitle: 'Ensemble model precision',
      change: '+2.1%',
      trend: 'up',
      icon: '',
      color: '#10b981',
      status: 'success'
    },
    {
      title: 'Active Customers',
      value: `${(stats.customers.total_customers / 1000).toFixed(0)}K`,
      subtitle: 'Monitored accounts',
      change: '+1.2%',
      trend: 'up',
      icon: '',
      color: '#3b82f6',
      status: 'info'
    },
    {
      title: 'AMI Coverage',
      value: '2.4M',
      subtitle: 'Smart meters deployed',
      change: '+15.3%',
      trend: 'up',
      icon: '',
      color: '#8b5cf6',
      status: 'success'
    },
  ];

  return (
    <div className="metrics-grid">
      {metrics.map((metric, index) => (
        <div key={index} className="metric-card">
          <div className="metric-header">
            <span className="metric-title">{metric.title}</span>
            <div className="metric-header-right">
              <span className="metric-icon" style={{ color: metric.color }}>
                {metric.icon}
              </span>
              {metric.title === 'Revenue Loss (Total)' && (
                <div className="metric-tooltip-container">
                  <span className="metric-info">ℹ</span>
                  <div className="metric-tooltip">
                    <div className="tooltip-content">
                      <strong>Revenue Loss Breakdown:</strong>
                      <ul>
                        <li>Technical losses (line losses, transformer losses)</li>
                        <li>Commercial losses (billing errors, meter inaccuracy)</li>
                        <li>Non-technical losses (theft, tampering)</li>
                      </ul>
                      <p><strong>Source:</strong> All 35 feeders revenue_loss_php database</p>
                      <p><strong>vs Geographic View:</strong> Shows only flagged NTL cases (₱1.1M)</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="metric-value">{metric.value}</div>
          
          {metric.subtitle && (
            <div className="metric-subtitle">{metric.subtitle}</div>
          )}
          
          <div className="metric-footer">
            <span className={`metric-change ${metric.trend}`}>
              {metric.trend === 'up' ? '↑' : '↓'} {metric.change}
            </span>
            <span className="metric-period">vs last month</span>
          </div>
        </div>
      ))}
    </div>
  );
}

MetricsCards.propTypes = {
  stats: PropTypes.shape({
    flagged_today: PropTypes.number.isRequired,
    total_estimated_loss: PropTypes.number.isRequired,
    model_accuracy: PropTypes.number.isRequired,
  }).isRequired,
};

export default MetricsCards;