import PropTypes from 'prop-types';
import './GeographicHeatmap.css';

function GeographicHeatmap() {
  const regions = [
    { name: 'Metro Manila North', cases: 145, loss: 4200000, risk: 'critical' },
    { name: 'Metro Manila South', cases: 128, loss: 3800000, risk: 'high' },
    { name: 'Rizal', cases: 89, loss: 2100000, risk: 'high' },
    { name: 'Bulacan', cases: 67, loss: 1900000, risk: 'medium' },
    { name: 'Cavite', cases: 54, loss: 1600000, risk: 'medium' },
  ];

  const formatCurrency = (value) => {
    return `₱${(value / 1000000).toFixed(1)}M`;
  };

  const getRiskColor = (risk) => {
    const colors = {
      critical: '#ef4444',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#10b981',
    };
    return colors[risk] || '#6b7280';
  };

  return (
    <div className="geographic-heatmap">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">Geographic Distribution</h3>
          <p className="chart-subtitle">NTL cases by service area</p>
        </div>
      </div>

      <div className="heatmap-container">
        {/* Simplified map visualization */}
        <div className="map-placeholder">
          <div className="map-icon">🗺️</div>
          <p className="map-text">Meralco Service Area</p>
          <p className="map-subtext">36 cities & municipalities</p>
        </div>

        <div className="region-list">
          {regions.map((region, index) => (
            <div key={index} className="region-item">
              <div className="region-info">
                <div 
                  className="risk-indicator"
                  style={{ background: getRiskColor(region.risk) }}
                />
                <div className="region-details">
                  <span className="region-name">{region.name}</span>
                  <span className="region-stats">
                    {region.cases} cases · {formatCurrency(region.loss)} loss
                  </span>
                </div>
              </div>
              <span className={`risk-badge ${region.risk}`}>
                {region.risk.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="heatmap-legend">
        <span className="legend-title">Risk Level:</span>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#ef4444' }} />
            <span>Critical</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#f59e0b' }} />
            <span>High</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#3b82f6' }} />
            <span>Medium</span>
          </div>
        </div>
      </div>
    </div>
  );
}

GeographicHeatmap.propTypes = {
  data: PropTypes.array,
};

export default GeographicHeatmap;