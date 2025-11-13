import PropTypes from 'prop-types';
import './RevenueChart.css';

function RevenueChart({ stats }) {
  // Generate sample data for the chart
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  const data = months.map((month, index) => {
    if (index > currentMonth) return null;
    const base = 10 + Math.random() * 15;
    return base;
  });

  const maxValue = Math.max(...data.filter(v => v !== null));

  return (
    <div className="revenue-chart">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">Loss Prevention (Monthly)</h3>
          <p className="chart-subtitle">Revenue saved from NTL detection</p>
        </div>
        <div className="chart-controls">
          <button className="period-btn active">Month</button>
          <button className="period-btn">Week</button>
          <button className="period-btn">Year</button>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-bars">
          {data.map((value, index) => (
            value !== null && (
              <div key={index} className="bar-wrapper">
                <div 
                  className="bar"
                  style={{ 
                    height: `${(value / maxValue) * 100}%`,
                    background: index === currentMonth 
                      ? 'linear-gradient(180deg, #fb7018 0%, #ff9800 100%)'
                      : 'linear-gradient(180deg, #ffcc80 0%, #ffe0b2 100%)'
                  }}
                >
                  <div className="bar-value">₱{value.toFixed(1)}M</div>
                </div>
                <div className="bar-label">{months[index]}</div>
              </div>
            )
          ))}
        </div>
      </div>

      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#fb7018' }}></div>
          <span>Current Month</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#ffcc80' }}></div>
          <span>Previous Months</span>
        </div>
      </div>
    </div>
  );
}

RevenueChart.propTypes = {
  stats: PropTypes.object,
};

export default RevenueChart;