import PropTypes from 'prop-types';
import './TheftCategoryChart.css';

function TheftCategoryChart({ stats }) {
  // Use real data from stats API if available, otherwise fallback to sample data
  const consumptionAnomalyCount = stats?.customers?.consumption_anomaly_count || 42;
  const meterTamperCount = stats?.customers?.meter_tamper_count || 28;
  const billingAnomalyCount = stats?.customers?.billing_anomaly_count || 18;
  
  // Calculate additional detection method (based on remaining high/critical cases)
  const totalNTLCases = stats?.customers ? (stats.customers.critical_count + stats.customers.high_count) : 100;
  const knownMethods = consumptionAnomalyCount + meterTamperCount + billingAnomalyCount;
  const otherMethods = Math.max(0, totalNTLCases - knownMethods);

  const categories = [
    { name: 'Consumption Anomaly', value: consumptionAnomalyCount, color: '#fb7018', icon: <i class="fi fi-br-chat-arrow-down"></i> },
    { name: 'AMI Tamper Alert', value: meterTamperCount, color: '#fb7018', icon: <i class="fi fi-br-triangle-warning"></i> },
    { name: 'Load Profile Mismatch', value: billingAnomalyCount, color: '#fb7018', icon: <i class="fi fi-br-stats"></i> },
    { name: 'Geospatial Clustering', value: otherMethods, color: '#fb7018', icon: <i class="fi fi-br-region-pin-alt"></i> },
  ];

  const total = categories.reduce((sum, cat) => sum + cat.value, 0);

  return (
    <div className="theft-category-chart">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">NTL Detection by Method</h3>
          <p className="chart-subtitle">Ensemble model breakdown</p>
        </div>
      </div>

      <div className="category-list">
        {categories.map((category, index) => {
          const percentage = ((category.value / total) * 100).toFixed(1);
          
          return (
            <div key={index} className="category-item">
              <div className="category-info">
                <span className="category-icon">{category.icon}</span>
                <div className="category-details">
                  <span className="category-name">{category.name}</span>
                  <span className="category-count">{category.value} cases</span>
                </div>
              </div>
              
              <div className="category-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${percentage}%`,
                      background: category.color
                    }}
                  />
                </div>
                <span className="category-percentage">{percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="chart-footer">
        <div className="footer-stat">
          <span className="stat-label">Total Detections</span>
          <span className="stat-value">{total}</span>
        </div>
        <div className="footer-stat">
          <span className="stat-label">Avg Confidence</span>
          <span className="stat-value">{stats?.customers ? (parseFloat(stats.customers.avg_risk_score || 40.3)).toFixed(1) + '%' : '87.3%'}</span>
        </div>
      </div>
    </div>
  );
}

TheftCategoryChart.propTypes = {
  stats: PropTypes.object,
};

export default TheftCategoryChart;