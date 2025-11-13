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
import FieldOpsView from './components/FieldOpsView';
import EngineeringView from './components/EngineeringView';
import CustomerServiceView from './components/CustomerServiceView';

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

      const [allCustomersRes, hotlistRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/customers?limit=75000`),
        fetch(`${API_URL}/hotlist?limit=75000`),
        fetch(`${API_URL}/stats`)
      ]);

      if (!allCustomersRes.ok || !hotlistRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const allCustomersData = await allCustomersRes.json();
      const hotlistData = await hotlistRes.json();
      const statsData = await statsRes.json();

      const hotlistArray = hotlistData.hotlist || [];
      const allCustomersArray = allCustomersData.customers || [];

      const lowMediumCustomers = allCustomersArray
        .filter(c => c.risk_level === 'low' || c.risk_level === 'medium')
        .slice(0, 5000)
        .map(item => ({
          ...item,
          address: `${item.customer_name} Location`,
          avg_monthly_kwh: 200 + Math.random() * 300,
          last_billing_amount: (200 + Math.random() * 300) * 15,
          ntl_confidence: parseFloat(item.risk_score) || 0,
          days_since_inspection: Math.floor(Math.random() * 365)
        }));

      const combinedCustomers = [...hotlistArray, ...lowMediumCustomers];

      const transformedHotlist = combinedCustomers.map(item => {
        const ntlConfidence = parseFloat(item.ntl_confidence || item.risk_score) || 0;
        const avgMonthlyKwh = parseFloat(item.avg_monthly_kwh) || 0;

        let lossPercentage = 0;
        const riskLevel = item.risk_level?.toLowerCase();

        if (riskLevel === 'critical') {
          lossPercentage = 0.35 + (ntlConfidence / 100) * 0.25;
        } else if (riskLevel === 'high') {
          lossPercentage = 0.20 + (ntlConfidence / 100) * 0.15;
        } else if (riskLevel === 'medium') {
          lossPercentage = 0.10 + (ntlConfidence / 100) * 0.10;
        } else {
          lossPercentage = 0.02 + (ntlConfidence / 100) * 0.08;
        }

        const estimatedMonthlyLoss = avgMonthlyKwh * lossPercentage * 12;

        return {
          ...item,
          prediction_confidence: ntlConfidence / 100,
          estimated_monthly_loss: Math.round(estimatedMonthlyLoss),
          location: item.address || item.customer_name
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
              <GeographicDistribution />
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
          <div className="dashboard-row">
            <div className="chart-card chart-1-2">
              <TopThefts hotlist={hotlist} />
            </div>
            <div className="chart-card chart-1-2">
              <TheftCategoryChart />
            </div>
          </div>
        );

      default:
        return null;
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

                  <MetricsCards stats={stats} />

                  {/* Row 1 */}
                  <div className="dashboard-row">
                    <div className="chart-card chart-2-3">
                      <RevenueChart stats={stats} />
                    </div>
                    <div className="chart-card chart-1-3">
                      <TheftCategoryChart stats={stats} />
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="dashboard-row">
                    <div className="chart-card chart-1-2">
                      <GeographicDistribution />
                    </div>
                    <div className="chart-card chart-1-2">
                      <ImpactMetrics />
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="filter-buttons" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    {['all', 'revenue', 'geographic', 'impact', 'issues'].map(filter => (
                      <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                      >
                        {filter.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {/* Table */}
                  <div className="table-section">
                    <InspectionTable hotlist={hotlist} totalCustomers={stats?.customers?.total_customers} />
                  </div>

                  {/* Filter results */}
                  {renderCharts()}
                </div>
              )}

              {activeView === 'map' && (
                <div className="map-view">
                  <NTLMap hotlist={hotlist} />
                </div>
              )}

              {activeView === 'fieldops' && (
                <FieldOpsView hotlist={hotlist} stats={stats} />
              )}

              {activeView === 'engineering' && (
                <EngineeringView hotlist={hotlist} stats={stats} />
              )}

              {activeView === 'customers' && (
                <CustomerServiceView hotlist={hotlist} stats={stats} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
