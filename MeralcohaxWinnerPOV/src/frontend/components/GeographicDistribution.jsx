import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './GeographicDistribution.css';

function GeographicDistribution() {
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchGeographicData = async () => {
      try {
        const response = await fetch('/api/geographic');
        const data = await response.json();
        if (data.success) {
          setGeoData(data);
        }
      } catch (error) {
        console.error('Failed to fetch geographic data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGeographicData();
  }, []);

  if (loading) {
    return (
      <div className="geographic-distribution">
        <div className="geo-header">
          <h3 className="geo-title">Geographic Distribution</h3>
          <p className="geo-subtitle">Loading...</p>
        </div>
      </div>
    );
  }

  if (!geoData) {
    return (
      <div className="geographic-distribution">
        <div className="geo-header">
          <h3 className="geo-title">Geographic Distribution</h3>
          <p className="geo-subtitle">Failed to load data</p>
        </div>
      </div>
    );
  }

  const regions = geoData.regions;
  const totalCases = geoData.totalCases;
  const totalLoss = geoData.totalLoss;

  // Pagination math
  const totalPages = Math.ceil(regions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRegions = regions.slice(startIndex, startIndex + itemsPerPage);

  const getRiskLevel = (riskLevel) => {
    switch (riskLevel) {
      case 'critical': return { label: 'Critical', color: '#ef4444' };
      case 'high': return { label: 'High', color: '#f59e0b' };
      case 'medium': return { label: 'Medium', color: '#eab308' };
      case 'low': return { label: 'Low', color: '#10b981' };
      default: return { label: 'Low', color: '#10b981' };
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const renderPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          className={`page-number ${i === currentPage ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="geographic-distribution">
      <div className="geo-header">
        <h3 className="geo-title">Geographic Distribution</h3>
        <p className="geo-subtitle">Detected NTL Cases by Region (Metro Manila)</p>
        <p className="geo-context">Estimated loss calculated from 72,123 flagged customers (₱15 avg/case)</p>
      </div>

      <div className="geo-summary">
        <div className="geo-stat">
          <span className="geo-stat-value">{totalCases}</span>
          <span className="geo-stat-label">Total Cases</span>
        </div>
        <div className="geo-stat">
          <span className="geo-stat-value">₱{(totalLoss / 1_000_000).toFixed(1)}M</span>
          <span className="geo-stat-label">NTL Loss (Flagged Cases)</span>
        </div>
        <div className="geo-stat">
          <span className="geo-stat-value">{regions.length}</span>
          <span className="geo-stat-label">Active Regions</span>
        </div>
      </div>

      <div className="regions-list">
        {paginatedRegions.map((region, index) => {
          const risk = getRiskLevel(region.riskLevel);
          const percentage = totalCases > 0
            ? (region.cases / totalCases) * 100
            : 0;

          return (
            <div key={index} className="region-item">
              <div className="region-header">
                <div className="region-info">
                  <span className="region-rank">
                    #{startIndex + index + 1}
                  </span>
                  <span className="region-name">{region.name}</span>
                </div>
                <span className="region-badge" style={{ background: risk.color }}>
                  {risk.label}
                </span>
              </div>

              <div className="region-stats">
                <div className="region-stat-item">
                  <span className="stat-label">Cases</span>
                  <span className="stat-value">{region.cases.toLocaleString()}</span>
                </div>
                <div className="region-stat-item">
                  <span className="stat-label">Loss/Month</span>
                  <span className="stat-value">₱{(region.loss / 1000).toFixed(0)}K</span>
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
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          Previous
        </button>

        {renderPageNumbers()}

        <button
          className={`page-btn ${currentPage === totalPages ? 'disabled' : ''}`}
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

GeographicDistribution.propTypes = {
  hotlist: PropTypes.array
};

export default GeographicDistribution;
