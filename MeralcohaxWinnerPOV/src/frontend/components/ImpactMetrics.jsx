import PropTypes from 'prop-types';
import './ImpactMetrics.css';

function ImpactMetrics() {
  const impacts = [
    {
      title: 'Annual NTL Loss (Est.)',
      value: '₱4.7B - ₱9.4B',
      subtitle: '1-2% of ₱470.4B revenue',
      icon: <i class="fi fi-br-cheap-dollar"></i>,
      color: '#ef4444',
    },
    {
      title: 'System Loss (2024)',
      value: '5.99%',
      subtitle: 'Cap: 6.25% (ERC)',
      icon: <i class="fi fi-br-triangle-warning"></i>,
      color: '#f59e0b',
    },
    {
      title: 'Fire Incidents (2023)',
      value: '15,900+',
      subtitle: 'Faulty wiring #1 cause',
      icon: <i class="fi fi-br-flame"></i>,
      color: '#dc2626',
    },
    {
      title: 'Revenue Recovery Goal',
      value: '₱2.3B',
      subtitle: 'Target for 2025',
      icon: <i class="fi fi-br-revenue-alt"></i>,
      color: '#10b981',
    },
  ];

  return (
    <div className="impact-metrics">
      <div className="impact-header">
        <h3 className="impact-title">Business Impact Analysis</h3>
        <p className="impact-subtitle">Why KILOS matters for Meralco</p>
      </div>

      <div className="impact-grid">
        {impacts.map((impact, index) => (
          <div key={index} className="impact-card">
            <div className="impact-icon" style={{ background: `${impact.color}15`, color: impact.color }}>
              {impact.icon}
            </div>
            <div className="impact-content">
              <h4 className="impact-card-title">{impact.title}</h4>
              <div className="impact-value" style={{ color: impact.color }}>
                {impact.value}
              </div>
              <p className="impact-subtitle-text">{impact.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="impact-footer">
        <div className="impact-stat">
          <span className="impact-stat-value">₱28.1B</span>
          <span className="impact-stat-label">Total unbilled electricity (5.99% loss)</span>
        </div>
        <div className="impact-stat">
          <span className="impact-stat-value">8.0M</span>
          <span className="impact-stat-label">Customer accounts monitored</span>
        </div>
      </div>
    </div>
  );
}

ImpactMetrics.propTypes = {
  data: PropTypes.object,
};

export default ImpactMetrics;