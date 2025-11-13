import PropTypes from 'prop-types';
import './TheftCategoryChart.css';

function TheftCategoryChart() {
  const categories = [
    { name: 'Consumption Anomaly', value: 42, color: '#fb7018', icon: '📉' },
    { name: 'AMI Tamper Alert', value: 28, color: '#ef4444', icon: '⚠️' },
    { name: 'Load Profile Mismatch', value: 18, color: '#f59e0b', icon: '📊' },
    { name: 'Geospatial Clustering', value: 12, color: '#8b5cf6', icon: '🗺️' },
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
          <span className="stat-value">87.3%</span>
        </div>
      </div>
    </div>
  );
}

TheftCategoryChart.propTypes = {
  data: PropTypes.array,
};

export default TheftCategoryChart;