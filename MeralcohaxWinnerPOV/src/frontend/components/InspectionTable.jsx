import { useState } from 'react';
import PropTypes from 'prop-types';
import './InspectionTable.css';

function InspectionTable({ hotlist, totalCustomers }) {
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'prediction_confidence', direction: 'desc' });
  const itemsPerPage = 10;

  // Generate recommended action based on risk level and NTL indicators
  const getRecommendedAction = (item) => {
    const riskLevel = item.risk_level?.toLowerCase();
    const confidence = item.prediction_confidence * 100;
    const hasMeterTamper = item.has_meter_tamper;
    const hasBillingAnomaly = item.has_billing_anomaly;
    const hasConsumptionAnomaly = item.has_consumption_anomaly;
    
    if (riskLevel === 'critical' && confidence >= 90) {
      if (hasMeterTamper) {
        return 'Immediate field inspection with legal team';
      }
      return 'Urgent site visit with security personnel';
    } else if (riskLevel === 'critical') {
      return 'Priority inspection within 24 hours';
    } else if (riskLevel === 'high') {
      if (hasConsumptionAnomaly) {
        return 'Schedule meter reading audit';
      }
      return 'Field inspection within 3 days';
    } else if (riskLevel === 'medium') {
      return 'Remote monitoring and follow-up call';
    }
    return 'Standard inspection queue';
  };

  // Convert boolean flags to readable indicators
  const getTopIndicators = (item) => {
    const indicators = [];
    if (item.has_meter_tamper) {
      indicators.push('meter_tamper');
    }
    if (item.has_billing_anomaly) {
      indicators.push('billing_anomaly');
    }
    if (item.has_consumption_anomaly) {
      indicators.push('consumption_anomaly');
    }
    return indicators;
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedData = [...(hotlist || [])].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const toggleRow = (id) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedRows(prev => 
      prev.length === paginatedData.length ? [] : paginatedData.map(item => item.customer_id)
    );
  };

  const formatCurrency = (value) => {
    if (value < 1000) {
      return `₱${Math.round(value)}`;
    }
    return `₱${(value / 1000).toFixed(1)}K`;
  };

  const formatConsumption = (kwh) => {
    return `${Math.round(kwh)} kWh`;
  };

  const getRiskBadge = (confidence) => {
    if (confidence >= 0.8) return { label: 'Critical', class: 'critical' };
    if (confidence >= 0.6) return { label: 'High', class: 'high' };
    if (confidence >= 0.4) return { label: 'Medium', class: 'medium' };
    return { label: 'Low', class: 'low' };
  };

  return (
    <div className="inspection-table">
      <div className="table-header">
        <h3 className="table-title">Inspection Queue ({totalCustomers ? totalCustomers.toLocaleString() : hotlist.length} cases)</h3>
        <div className="table-actions">
          {selectedRows.length > 0 && (
            <span className="selected-count">{selectedRows.length} selected</span>
          )}
          <button className="action-btn">Export</button>
          <button className="action-btn primary">Schedule Inspections</button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={selectedRows.length === paginatedData.length}
                  onChange={toggleAll}
                />
              </th>
              <th onClick={() => handleSort('customer_id')}>
                Customer ID
                {sortConfig.key === 'customer_id' && (
                  <span className="sort-icon">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th onClick={() => handleSort('location')}>
                Location
                {sortConfig.key === 'location' && (
                  <span className="sort-icon">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th onClick={() => handleSort('avg_monthly_kwh')}>
                Monthly Usage
                {sortConfig.key === 'avg_monthly_kwh' && (
                  <span className="sort-icon">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th onClick={() => handleSort('prediction_confidence')}>
                Risk Level
                {sortConfig.key === 'prediction_confidence' && (
                  <span className="sort-icon">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th onClick={() => handleSort('estimated_monthly_loss')}>
                Est. Loss
                {sortConfig.key === 'estimated_monthly_loss' && (
                  <span className="sort-icon">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th>Top Indicators</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item) => {
              const risk = getRiskBadge(item.prediction_confidence);
              return (
                <tr key={item.customer_id}>
                  <td className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(item.customer_id)}
                      onChange={() => toggleRow(item.customer_id)}
                    />
                  </td>
                  <td className="customer-id">{item.customer_id}</td>
                  <td>{item.location}</td>
                  <td className="consumption-cell">
                    {formatConsumption(parseFloat(item.avg_monthly_kwh) || 0)}
                  </td>
                  <td>
                    <span className={`risk-badge ${risk.class}`}>
                      {risk.label}
                    </span>
                    <span className="confidence-percent">
                      {Math.round(item.prediction_confidence * 100)}%
                    </span>
                  </td>
                  <td className="loss-cell">{formatCurrency(item.estimated_monthly_loss)}</td>
                  <td className="indicators-cell">
                    {getTopIndicators(item).slice(0, 2).map((indicator, idx) => (
                      <span key={idx} className="indicator-tag">
                        {indicator.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {getTopIndicators(item).length === 0 && (
                      <span className="indicator-tag low-risk">normal usage</span>
                    )}
                  </td>
                  <td className="actions-cell">
                    <span className="recommended-action">
                      {getRecommendedAction(item)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <div className="pagination-info">
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length}
        </div>
        <div className="pagination">
          <button 
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            Previous
          </button>
          {[...Array(Math.min(5, totalPages))].map((_, idx) => {
            const pageNum = idx + 1;
            return (
              <button
                key={pageNum}
                className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
          <button 
            className="page-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

InspectionTable.propTypes = {
  hotlist: PropTypes.arrayOf(PropTypes.shape({
    customer_id: PropTypes.string.isRequired,
    location: PropTypes.string,
    address: PropTypes.string,
    prediction_confidence: PropTypes.number.isRequired,
    estimated_monthly_loss: PropTypes.number.isRequired,
    has_meter_tamper: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
    has_billing_anomaly: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
    has_consumption_anomaly: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
    avg_monthly_kwh: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    risk_level: PropTypes.string,
  })).isRequired,
  totalCustomers: PropTypes.number,
};

export default InspectionTable;