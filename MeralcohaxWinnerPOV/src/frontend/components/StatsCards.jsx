import PropTypes from 'prop-types';
import './StatsCards.css';

function StatsCards({ stats }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-PH').format(value);
  };

  const cards = [
    {
      title: 'Flagged Today',
      value: formatNumber(stats.flagged_today),
      icon: '🚩',
      trend: '+12% vs yesterday',
      color: 'red'
    },
    {
      title: 'High Confidence Cases',
      value: formatNumber(stats.high_confidence_cases),
      icon: '⚠️',
      subtitle: '>75% confidence',
      color: 'orange'
    },
    {
      title: 'Estimated Loss (Daily)',
      value: formatCurrency(stats.total_estimated_loss),
      icon: '💰',
      trend: 'Potential recovery',
      color: 'purple'
    },
    {
      title: 'Recovery This Month',
      value: formatCurrency(stats.recovery_this_month),
      icon: '✅',
      trend: '+₱4.2M vs last month',
      color: 'green'
    },
    {
      title: 'Model Accuracy',
      value: `${stats.model_accuracy}%`,
      icon: '🎯',
      subtitle: 'Validation set',
      color: 'blue'
    },
    {
      title: 'Pending Inspections',
      value: formatNumber(stats.inspections_pending),
      icon: '📋',
      subtitle: 'Field operations',
      color: 'gray'
    }
  ];

  return (
    <div className="stats-cards">
      {cards.map((card, index) => (
        <div key={index} className={`stat-card ${card.color}`}>
          <div className="card-icon">{card.icon}</div>
          <div className="card-content">
            <h3>{card.title}</h3>
            <div className="card-value">{card.value}</div>
            {card.subtitle && <div className="card-subtitle">{card.subtitle}</div>}
            {card.trend && <div className="card-trend">{card.trend}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

StatsCards.propTypes = {
  stats: PropTypes.shape({
    flagged_today: PropTypes.number.isRequired,
    high_confidence_cases: PropTypes.number.isRequired,
    total_estimated_loss: PropTypes.number.isRequired,
    recovery_this_month: PropTypes.number.isRequired,
    model_accuracy: PropTypes.number.isRequired,
    inspections_pending: PropTypes.number.isRequired,
  }).isRequired,
};

export default StatsCards;
