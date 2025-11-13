import PropTypes from 'prop-types';
import './TopThefts.css';

function TopThefts({ hotlist }) {
  const topCases = (hotlist || [])
    .map(item => ({
      ...item,
      // Convert API fields to component format
      prediction_confidence: parseFloat(item.ntl_confidence || 0) / 100,
      estimated_monthly_loss: parseFloat(item.last_billing_amount || 0),
      location: item.address || item.customer_name
    }))
    .sort((a, b) => b.prediction_confidence - a.prediction_confidence)
    .slice(0, 5);

  const formatCurrency = (value) => {
    if (!value || value === 0) return '₱0K';
    return `₱${(value / 1000).toFixed(0)}K`;
  };

  return (
    <div className="top-thefts">
      <div className="top-thefts-header">
        <h3 className="top-thefts-title">Top Priority Cases</h3>
        <span className="view-all">View All →</span>
      </div>

      <div className="top-thefts-list">
        {topCases.map((item, index) => (
          <div key={item.customer_id} className="theft-item">
            <div className="theft-rank">#{index + 1}</div>
            
            <div className="theft-details">
              <div className="theft-customer">{item.customer_id}</div>
              <div className="theft-location">{item.location}</div>
            </div>

            <div className="theft-metrics">
              <div className="theft-confidence">
                <span className="confidence-label">Confidence</span>
                <span className="confidence-value" style={{
                  color: item.prediction_confidence >= 0.8 ? '#ef4444' : 
                         item.prediction_confidence >= 0.6 ? '#f59e0b' : '#10b981'
                }}>
                  {Math.round(item.prediction_confidence * 100)}%
                </span>
              </div>
              
              <div className="theft-loss">
                <span className="loss-label">Est. Loss</span>
                <span className="loss-value">{formatCurrency(item.estimated_monthly_loss)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="top-thefts-footer">
        <button className="assign-btn">Assign Inspections</button>
      </div>
    </div>
  );
}

TopThefts.propTypes = {
  hotlist: PropTypes.arrayOf(PropTypes.shape({
    customer_id: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    prediction_confidence: PropTypes.number.isRequired,
    estimated_monthly_loss: PropTypes.number.isRequired,
  })).isRequired,
};

export default TopThefts;