import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './RevenueChart.css';

function RevenueChart({ stats }) {
  
  const [period, setPeriod] = useState("month");
  const [chartData, setChartData] = useState({ month: {}, week: {}, year: {} });

  useEffect(() => {
    const now = new Date();

    // ---------- MONTH (your friend's logic merged) ----------
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = now.getMonth();

    // — compute loss-prevention base (your friend's code)
    const totalMonthlyLoss = stats?.feeders?.total_revenue_loss
      ? parseFloat(stats.feeders.total_revenue_loss) / 1_000_000
      : 17.0; // fallback (millions)

    const baseMonthlyPrevention = totalMonthlyLoss * 0.8;

    const monthData = months.map((_, index) => {
      if (index > currentMonth) return null;

      // Variation ±20% (your friend's logic)
      const variation = 0.8 + (Math.random() * 0.4);
      return baseMonthlyPrevention * variation;
    });

    // ---------- WEEK (Mon–Sun, includes weekends now) ----------
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Convert JS getDay() to Mon=0..Sun=6
    const todayIndex = (now.getDay() + 6) % 7;

    const weekData = weekdays.map((_, i) =>
      i <= todayIndex ? 2 + Math.random() * 5 : null
    );

    // ---------- YEAR (last 6 years) ----------
    const years = [];
    const currentYear = now.getFullYear();
    for (let y = currentYear - 5; y <= currentYear; y++) years.push(y);

    const yearData = years.map(() => 100 + Math.random() * 300);

    setChartData({
      month: { labels: months, data: monthData },
      week: { labels: weekdays, data: weekData },
      year: { labels: years, data: yearData },
    });
  }, [stats]);   // stats change re-generates data once


  // ---------- RENDERING LOGIC ----------
  const labels = chartData[period]?.labels || [];
  const data = chartData[period]?.data || [];

  const lastIndex = (() => {
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i] != null) return i;
    }
    return -1;
  })();

  const validData = data.filter(v => v != null);
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
            value != null ? (
              <div key={index} className="bar-wrapper">
                <div
                  className="bar"
                  style={{
                    height: `${(value / maxValue) * 100}%`,
                    background:
                      index === lastIndex
                        ? 'linear-gradient(180deg, #fb7018 0%, #ff9800 100%)'
                        : 'linear-gradient(180deg, #ffcc80 0%, #ffe0b2 100%)'
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
