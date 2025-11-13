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

      setHotlist(hotlistData.hotlist || []);
      setStats(statsData.stats);
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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
                  
                  {/* Row 1: Charts */}
                  <div className="dashboard-row">
                    <div className="chart-card chart-2-3">
                      <RevenueChart stats={stats} />
                    </div>
                    
                    <div className="chart-card chart-1-3">
                      <TheftCategoryChart />
                    </div>
                  </div>

                  {/* Row 2: Geographic Distribution and Impact Metrics */}
                  <div className="dashboard-row">
                    <div className="chart-card chart-1-2">
                      <GeographicDistribution hotlist={hotlist || []} />
                    </div>
                    
                    <div className="chart-card chart-1-2">
                      <ImpactMetrics />
                    </div>
                  </div>

                  {/* Row 3: Top Cases */}
                  <div className="dashboard-row">
                    <div className="chart-card chart-full">
                      <TopThefts hotlist={hotlist || []} />
                    </div>
                  </div>

                  {/* Row 4: Full Table */}
                  <div className="table-section">
                    <InspectionTable hotlist={hotlist || []} />
                  </div>
                </div>
              )}

              {activeView === 'map' && (
                <div className="map-view">
                  <NTLMap hotlist={hotlist || []} />
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
