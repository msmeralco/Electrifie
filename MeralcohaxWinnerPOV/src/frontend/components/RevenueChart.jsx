import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './RevenueChart.css';

function RevenueChart({ stats }) {
  const [period, setPeriod] = useState('month');
  const [chartData, setChartData] = useState({
    month: { labels: [], data: [] },
    week: { labels: [], data: [] },
    year: { labels: [], data: [] },
  });

  // Generate mock data once when component mounts
  useEffect(() => {
    const now = new Date();

    // --- MONTH ---
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = now.getMonth();
    const monthData = months.map((_, i) => (i <= currentMonth ? 10 + Math.random() * 15 : null));

    // --- WEEK (Mon-Sun) ---
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // map JS getDay() (Sun=0..Sat=6) to Mon=0..Sun=6
    const todayIndex = (now.getDay() + 6) % 7;
    const weekData = weekdays.map((_, i) => (i <= todayIndex ? 2 + Math.random() * 5 : null));

    // --- YEAR (last 6 years including current) ---
    const years = [];
    const currentYear = now.getFullYear();
    for (let y = currentYear - 5; y <= currentYear; y++) years.push(y);
    const yearData = years.map(() => 100 + Math.random() * 300);

    setChartData({
      month: { labels: months, data: monthData },
      week: { labels: weekdays, data: weekData },
      year: { labels: years, data: yearData },
    });
  }, []);

  const labels = chartData[period].labels || [];
  const data = chartData[period].data || [];

  // find last non-null index in the original data array
  const lastIndex = (() => {
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i] !== null && data[i] !== undefined) return i;
    }
    return -1;
  })();

  const validData = data.filter(v => v !== null && v !== undefined);
  const maxValue = validData.length ? Math.max(...validData) : 1;

  return (
    <div className="revenue-chart">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">
            Loss Prevention ({period.charAt(0).toUpperCase() + period.slice(1)})
          </h3>
          <p className="chart-subtitle">Revenue saved from NTL detection</p>
        </div>

        <div className="chart-controls">
          {['month', 'week', 'year'].map(p => (
            <button
              key={p}
              className={`period-btn ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-bars">
          {data.map((value, index) =>
            value !== null && value !== undefined ? (
              <div key={index} className="bar-wrapper">
                <div
                  className="bar"
                  style={{
                    height: `${(value / maxValue) * 100}%`,
                    background:
                      index === lastIndex
                        ? 'linear-gradient(180deg, #fb7018 0%, #ff9800 100%)'
                        : 'linear-gradient(180deg, #ffcc80 0%, #ffe0b2 100%)',
                  }}
                >
                  <div className="bar-value">₱{value.toFixed(1)}M</div>
                </div>
                <div className="bar-label">{labels[index]}</div>
              </div>
            ) : null
          )}
        </div>
      </div>

      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#fb7018' }}></div>
          <span>
            Current {period === 'year' ? 'Year' : period === 'month' ? 'Month' : 'Day'}
          </span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#ffcc80' }}></div>
          <span>
            Previous {period === 'year' ? 'Years' : period === 'month' ? 'Months' : 'Days'}
          </span>
        </div>
      </div>
    </div>
  );
}

RevenueChart.propTypes = {
  stats: PropTypes.object,
};

export default RevenueChart;
