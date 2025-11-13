import PropTypes from "prop-types";
import { useState } from "react";
import "./TopThefts.css";

function TopThefts({ hotlist }) {
  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const sortedCases = (hotlist || []).sort(
    (a, b) => b.prediction_confidence - a.prediction_confidence
  );

  const totalPages = Math.ceil(sortedCases.length / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCases = sortedCases.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const formatCurrency = (value) => `₱${(value / 1000).toFixed(0)}K`;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Pagination display logic
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 3;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= maxVisible) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage > totalPages - maxVisible) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage, "...", totalPages);
      }
    }
    return pages;
  // const topCases = (hotlist || [])
  //   .map(item => ({
  //     ...item,
  //     // Convert API fields to component format
  //     prediction_confidence: parseFloat(item.ntl_confidence || 0) / 100,
  //     estimated_monthly_loss: parseFloat(item.last_billing_amount || 0),
  //     location: item.address || item.customer_name
  //   }))
  //   .sort((a, b) => b.prediction_confidence - a.prediction_confidence)
  //   .slice(0, 5);

  // const formatCurrency = (value) => {
  //   if (!value || value === 0) return '₱0K';
  //   return `₱${(value / 1000).toFixed(0)}K`;
  };

  return (
    <div className="top-thefts">
      <div className="top-thefts-header">
        <div className="top-thefts-title-wrapper">
          <h3 className="top-thefts-title">Top Priority Cases</h3>
          <p className="top-thefts-subtitle">Statistics within NCR</p>
        </div>
      </div>

      <div className="top-thefts-list">
        {paginatedCases.map((item, index) => (
          <div key={item.customer_id} className="theft-item">
            <div className="theft-rank">
              #{startIndex + index + 1}
            </div>

            <div className="theft-details">
              <div className="theft-customer">{item.customer_id}</div>
              <div className="theft-location">{item.location}</div>
            </div>

            <div className="theft-metrics">
              <div className="metric-block">
                <span className="metric-label">Confidence</span>
                <span
                  className="metric-value"
                  style={{
                    color:
                      item.prediction_confidence >= 0.8
                        ? "#ef4444"
                        : item.prediction_confidence >= 0.6
                        ? "#f59e0b"
                        : "#10b981",
                  }}
                >
                  {Math.round(item.prediction_confidence * 100)}%
                </span>
              </div>

              <div className="metric-block">
                <span className="metric-label">Est. Loss</span>
                <span className="metric-value">
                  {formatCurrency(item.estimated_monthly_loss)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="top-thefts-footer">
        <button className="assign-btn">Assign Inspections</button>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          className={`page-btn ${currentPage === 1 ? "disabled" : ""}`}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>

        {getPageNumbers().map((page, index) =>
          page === "..." ? (
            <span key={index} className="ellipsis">...</span>
          ) : (
            <button
              key={index}
              className={`page-btn ${currentPage === page ? "active" : ""}`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          )
        )}

        <button
          className={`page-btn ${currentPage === totalPages ? "disabled" : ""}`}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

TopThefts.propTypes = {
  hotlist: PropTypes.arrayOf(
    PropTypes.shape({
      customer_id: PropTypes.string.isRequired,
      location: PropTypes.string.isRequired,
      prediction_confidence: PropTypes.number.isRequired,
      estimated_monthly_loss: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default TopThefts;
