import { useState, useEffect } from 'react';
import './Dashboard.css';
import './responsive.css';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import MetricsCards from './components/MetricsCards';
import RevenueChart from './components/RevenueChart';
import InspectionTable from './components/InspectionTable';
import TopThefts from './components/TopThefts';
import TheftCategoryChart from './components/TheftCategoryChart';
import NTLMap from './components/NTLMap';
import ImpactMetrics from './components/ImpactMetrics';
import GeographicDistribution from './components/GeographicDistribution';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function Dashboard() {
  const [hotlist, setHotlist] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [hotlistRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/hotlist?limit=100`),
        fetch(`${API_URL}/stats`)
      ]);

      if (!hotlistRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const hotlistData = await hotlistRes.json();
      const statsData = await statsRes.json();

      // Transform API data to match component expectations
      const transformedHotlist = (hotlistData.hotlist || []).map(item => {
        const ntlConfidence = parseFloat(item.ntl_confidence) || 0;
        const lastBilling = parseFloat(item.last_billing_amount) || 0;
        
        // Build feature list from boolean flags
        const features = [];
        if (item.has_meter_tamper) features.push('meter_tamper');
        if (item.has_billing_anomaly) features.push('billing_anomaly');
        if (item.has_consumption_anomaly) features.push('consumption_anomaly');
        
        return {
          ...item,
          prediction_confidence: ntlConfidence / 100,
          estimated_monthly_loss: lastBilling,
          location: item.address || item.customer_name,
          top_contributing_features: features
        };
      });

      setHotlist(transformedHotlist);
      setStats(statsData.stats);
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderCharts = () => {
    switch (activeFilter) {
      case 'revenue':
        return (
          <div className="dashboard-row">
            <div className="chart-card chart-full">
              <RevenueChart stats={stats} />
            </div>
          </div>
        );

      case 'geographic':
        return (
          <div className="dashboard-row">
            <div className="chart-card chart-full">
              <GeographicDistribution hotlist={hotlist} />
            </div>
          </div>
        );

      case 'impact':
        return (
          <div className="dashboard-row">
            <div className="chart-card chart-full">
              <ImpactMetrics />
            </div>
          </div>
        );

      case 'issues':
        return (
          <>
            <div className="dashboard-row">
              <div className="chart-card chart-1-2">
                <TopThefts hotlist={hotlist} />
              </div>
              <div className="chart-card chart-1-2">
                <TheftCategoryChart />
              </div>
            </div>


          </>
        );

      default:
        return (
          <>
            <div className="dashboard-row">
              <div className="chart-card chart-2-3">
                <RevenueChart stats={stats} />
              </div>
              <div className="chart-card chart-1-3">
                <TheftCategoryChart />
              </div>
            </div>

            <div className="dashboard-row">
              <div className="chart-card chart-1-2">
                <GeographicDistribution hotlist={hotlist} />
              </div>
              <div className="chart-card chart-1-2">
                <ImpactMetrics />
              </div>
            </div>

            <div className="dashboard-row">
              <div className="chart-card chart-full">
                <TopThefts hotlist={hotlist} />
              </div>
            </div>

            <div className="table-section">
              <InspectionTable hotlist={hotlist} />
            </div>
          </>
        );
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      <div className="dashboard-main">
        {activeView === 'dashboard' && <TopBar onRefresh={loadData} stats={stats} />}

        <div className="dashboard-content">
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
              <button onClick={loadData}>Retry</button>
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading NTL Intelligence Data...</p>
            </div>
          ) : (
            <>
              {activeView === 'dashboard' && (
                <div className="dashboard-view-content">
                  {stats && <MetricsCards stats={stats} />}

                  {/* FILTER BUTTONS */}
                  <div className="filter-buttons" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                    {['all', 'revenue', 'geographic', 'impact', 'issues'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </button>
                    ))}
                  </div>

                  {renderCharts()}
                </div>
              )}

              {activeView === 'map' && (
                <div className="map-view">
                  <NTLMap hotlist={hotlist} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
