import { useState } from 'react';
import PropTypes from 'prop-types';
import './HotlistTable.css';

function HotlistTable({ data }) {
  const [sortField, setSortField] = useState('confidence_score');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedRows, setSelectedRows] = useState(new Set());

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const toggleRow = (customerId) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedRows(newSelected);
  };

  const toggleAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map(item => item.customer_id)));
    }
  };

  const getRiskBadge = (risk) => {
    const colors = {
      High: 'risk-high',
      Medium: 'risk-medium',
      Low: 'risk-low'
    };
    return <span className={`risk-badge ${colors[risk]}`}>{risk}</span>;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const exportSelected = () => {
    const selected = sortedData.filter(item => selectedRows.has(item.customer_id));
    const csv = convertToCSV(selected);
    downloadCSV(csv, 'kilos_hotlist.csv');
  };

  const convertToCSV = (data) => {
    const headers = ['Customer ID', 'Confidence Score', 'Estimated Loss', 'Risk Level', 'Indicators', 'Action'];
    const rows = data.map(item => [
      item.customer_id,
      item.confidence_score,
      item.estimated_monthly_loss,
      item.risk_level,
      item.theft_indicators.join('; '),
      item.recommended_action
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <div className="hotlist-container">
      <div className="table-toolbar">
        <div className="selection-info">
          {selectedRows.size > 0 && (
            <>
              <span>{selectedRows.size} selected</span>
              <button onClick={exportSelected} className="btn-export">
                📥 Export to CSV
              </button>
            </>
          )}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="hotlist-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedRows.size === data.length && data.length > 0}
                  onChange={toggleAll}
                />
              </th>
              <th onClick={() => handleSort('customer_id')} className="sortable">
                Customer ID {sortField === 'customer_id' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('confidence_score')} className="sortable">
                Confidence {sortField === 'confidence_score' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('estimated_monthly_loss')} className="sortable">
                Est. Loss (₱) {sortField === 'estimated_monthly_loss' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('risk_level')} className="sortable">
                Risk {sortField === 'risk_level' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Theft Indicators</th>
              <th>Recommended Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => (
              <tr
                key={item.customer_id}
                className={selectedRows.has(item.customer_id) ? 'selected' : ''}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selectedRows.has(item.customer_id)}
                    onChange={() => toggleRow(item.customer_id)}
                  />
                </td>
                <td className="customer-id">
                  <div className="rank-badge">#{index + 1}</div>
                  {item.customer_id}
                </td>
                <td className="confidence">
                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{ width: `${item.confidence_score}%` }}
                    ></div>
                    <span className="confidence-text">{item.confidence_score.toFixed(1)}%</span>
                  </div>
                </td>
                <td className="loss-amount">{formatCurrency(item.estimated_monthly_loss)}</td>
                <td>{getRiskBadge(item.risk_level)}</td>
                <td className="indicators">
                  <ul>
                    {item.theft_indicators.map((indicator, i) => (
                      <li key={i}>{indicator}</li>
                    ))}
                  </ul>
                </td>
                <td className="action">{item.recommended_action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="empty-state">
          <p>No NTL suspects detected today. System is monitoring...</p>
        </div>
      )}
    </div>
  );
}

HotlistTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      customer_id: PropTypes.string.isRequired,
      confidence_score: PropTypes.number.isRequired,
      estimated_monthly_loss: PropTypes.number.isRequired,
      risk_level: PropTypes.string.isRequired,
      theft_indicators: PropTypes.arrayOf(PropTypes.string).isRequired,
      recommended_action: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default HotlistTable;
