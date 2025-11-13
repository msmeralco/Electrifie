import { useState } from 'react';
import PropTypes from 'prop-types';
import './GeographicDistribution.css';

function GeographicDistribution({ hotlist }) {
  const [currentPage, setCurrentPage] = useState(1);
  const regionsPerPage =3; // Show 4 rows per page

  const calculateDistribution = () => {
    const regions = {};
    const metroManilaRegions = [
      'Quezon City', 'Manila', 'Caloocan', 'Pasig', 'Taguig',
      'Makati', 'Mandaluyong', 'Marikina', 'Parañaque', 'Las Piñas',
      'Muntinlupa', 'Valenzuela', 'Malabon', 'Navotas', 'San Juan', 'Pasay'
    ];

    hotlist.forEach((item, index) => {
      const region = metroManilaRegions[index % metroManilaRegions.length];
      if (!regions[region]) {
        regions[region] = {
          name: region,
          cases: 0,
          estimatedLoss: 0,
          avgConfidence: 0
        };
      }
      regions[region].cases += 1;
      regions[region].estimatedLoss += item.estimated_monthly_loss || 0;
      regions[region].avgConfidence += item.prediction_confidence || 0;
    });

    return Object.values(regions)
      .map(region => ({
        ...region,
        avgConfidence: region.cases > 0 ? region.avgConfidence / region.cases : 0
      }))
      .sort((a, b) => b.cases - a.cases);
  };

  const regions = calculateDistribution();
  const totalCases = regions.reduce((sum, r) => sum + r.cases, 0);
  const totalLoss = regions.reduce((sum, r) => sum + r.estimatedLoss, 0);

  const totalPages = Math.ceil(regions.length / regionsPerPage);
  const startIndex = (currentPage - 1) * regionsPerPage;
  const displayedRegions = regions.slice(startIndex, startIndex + regionsPerPage);

  const getRiskLevel = (cases) => {
    if (cases >= 20) return { label: 'Critical', color: '#ef4444' };
    if (cases >= 10) return { label: 'High', color: '#f59e0b' };
    if (cases >= 5) return { label: 'Medium', color: '#eab308' };
    return { label: 'Low', color: '#10b981' };
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 3;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(
          <button
            key={i}
            className={`page-number ${i === currentPage ? 'active' : ''}`}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        );
      } else if (
        i === currentPage - 2 ||
        i === currentPage + 2
      ) {
        pages.push(
          <span key={`dots-${i}`} className="page-dots">...</span>
        );
      }
    }
    return pages;
  };

  return (
    <div className="geographic-distribution">
      <div className="geo-header">
        <h3 className="geo-title">Geographic Distribution</h3>
        <p className="geo-subtitle">NTL Cases by Region (Metro Manila)</p>
      </div>

      <div className="geo-summary">
        <div className="geo-stat">
          <span className="geo-stat-value">{totalCases}</span>
          <span className="geo-stat-label">Total Cases</span>
        </div>
        <div className="geo-stat">
          <span className="geo-stat-value">₱{(totalLoss / 1000000).toFixed(1)}M</span>
          <span className="geo-stat-label">Est. Monthly Loss</span>
        </div>
        <div className="geo-stat">
          <span className="geo-stat-value">{regions.length}</span>
          <span className="geo-stat-label">Active Regions</span>
        </div>
      </div>

      <div className="regions-list">
        {displayedRegions.map((region, index) => {
          const risk = getRiskLevel(region.cases);
          const percentage = totalCases > 0 ? (region.cases / totalCases * 100) : 0;
          
          return (
            <div key={index} className="region-item">
              <div className="region-header">
                <div className="region-info">
                  <span className="region-rank">#{startIndex + index + 1}</span>
                  <span className="region-name">{region.name}</span>
                </div>
                <span className="region-badge" style={{ background: risk.color }}>
                  {risk.label}
                </span>
              </div>
              
              <div className="region-stats">
                <div className="region-stat-item">
                  <span className="stat-label">Cases</span>
                  <span className="stat-value">{region.cases}</span>
                </div>
                <div className="region-stat-item">
                  <span className="stat-label">Loss/Month</span>
                  <span className="stat-value">₱{(region.estimatedLoss / 1000).toFixed(0)}K</span>
                </div>
                <div className="region-stat-item">
                  <span className="stat-label">Confidence</span>
                  <span className="stat-value">{(region.avgConfidence * 100).toFixed(1)}%</span>
                </div>
              </div>
              
              <div className="region-progress">
                <div 
                  className="region-progress-bar" 
                  style={{ 
                    width: `${percentage}%`,
                    background: risk.color
                  }}
                />
                <span className="region-percentage">{percentage.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      <div className="pagination-controls">
        <button 
          className={`page-btn ${currentPage === 1 ? 'disabled' : ''}`} 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>

        {renderPageNumbers()}

        <button 
          className={`page-btn ${currentPage === totalPages ? 'disabled' : ''}`} 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

GeographicDistribution.propTypes = {
  hotlist: PropTypes.array.isRequired,
};

export default GeographicDistribution;
