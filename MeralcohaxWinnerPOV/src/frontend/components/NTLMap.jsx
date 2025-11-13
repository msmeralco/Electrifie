import { useState, useEffect, useMemo } from 'react';
import Map, { NavigationControl, Marker, Popup } from 'react-map-gl';
import { DeckGL } from '@deck.gl/react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import mapboxgl from 'mapbox-gl';
import PropTypes from 'prop-types';
import './NTLMap.css';

// Disable Mapbox telemetry to prevent analytics/tracking requests
// This stops the ERR_BLOCKED_BY_CLIENT console errors
mapboxgl.prewarm();
if (typeof mapboxgl.telemetry !== 'undefined') {
  mapboxgl.telemetry = false;
}

// CartoDB Basemap Options
// You can switch between different CartoDB basemaps by changing the key below:
// - 'dark-matter': Dark theme (default)
// - 'positron': Light theme
// - 'voyager': Colorful theme
const CARTO_BASEMAPS = {
  'dark-matter': 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  'positron': 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  'voyager': 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
};

// Use CartoDB Dark Matter as default (change the key to switch basemaps)
const MAP_STYLE = CARTO_BASEMAPS['voyager'];

// Your Mapbox access token (required even when using CartoDB basemaps)
// react-map-gl is built on mapbox-gl-js and requires a valid token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

// Metro Manila bounds
const INITIAL_VIEW_STATE = {
  longitude: 121.0244,
  latitude: 14.5995,
  zoom: 11,
  pitch: 0,
  bearing: 0
};

// Sample NTL hotspot data for Metro Manila
const generateNTLData = () => {
  const hotspots = [
    // Quezon City clusters
    { lng: 121.0437, lat: 14.6760, cases: 45, loss: 1200000, area: 'Quezon City North', risk: 'critical' },
    { lng: 121.0244, lat: 14.6488, cases: 38, loss: 980000, area: 'Quezon City Central', risk: 'high' },
    // Manila clusters
    { lng: 120.9842, lat: 14.5995, cases: 52, loss: 1450000, area: 'Manila Downtown', risk: 'critical' },
    { lng: 120.9896, lat: 14.6091, cases: 31, loss: 850000, area: 'Tondo', risk: 'high' },
    // Makati clusters
    { lng: 121.0168, lat: 14.5547, cases: 28, loss: 720000, area: 'Makati CBD', risk: 'medium' },
    // Pasig clusters
    { lng: 121.0851, lat: 14.5764, cases: 34, loss: 890000, area: 'Pasig', risk: 'high' },
    // Caloocan
    { lng: 120.9833, lat: 14.6588, cases: 41, loss: 1100000, area: 'Caloocan', risk: 'critical' },
    // Mandaluyong
    { lng: 121.0359, lat: 14.5794, cases: 26, loss: 680000, area: 'Mandaluyong', risk: 'medium' },
  ];

  // For 3D view, add scatter points around each hotspot
  const points = [];
  hotspots.forEach(hotspot => {
    points.push(hotspot);
    // Add random scatter points around each hotspot for heatmap density
    for (let i = 0; i < hotspot.cases; i++) {
      points.push({
        lng: hotspot.lng + (Math.random() - 0.5) * 0.02,
        lat: hotspot.lat + (Math.random() - 0.5) * 0.02,
        cases: 1,
        loss: hotspot.loss / hotspot.cases,
        area: hotspot.area,
        risk: hotspot.risk
      });
    }
  });

  return { hotspots, points };
};

function NTLMap({ hotlist = [] }) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [popupInfo, setPopupInfo] = useState(null);
  const [is3D, setIs3D] = useState(false);
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    const fetchGeographicData = async () => {
      try {
        const response = await fetch('/api/geographic');
        const data = await response.json();
        if (data.success) {
          setGeoData(data);
        }
      } catch (error) {
        console.error('Failed to fetch geographic data for map:', error);
        // Fallback to sample data
        setGeoData({
          success: true,
          regions: generateNTLData().hotspots.map(h => ({
            name: h.area,
            cases: h.cases,
            loss: h.loss,
            avgConfidence: 0.75,
            riskLevel: h.risk,
            lat: h.lat,
            lng: h.lng
          }))
        });
      }
    };

    fetchGeographicData();
  }, []);

  // Transform API data into map format
  const { hotspots, points } = useMemo(() => {
    if (!geoData || !geoData.regions) {
      return generateNTLData(); // Fallback to sample data
    }

    // Convert API data to hotspots format
    const hotspots = geoData.regions.map(region => ({
      lng: region.lng,
      lat: region.lat,
      cases: region.cases,
      loss: region.loss,
      area: region.name,
      risk: region.riskLevel,
      avgConfidence: region.avgConfidence
    }));

    // Create scatter points for 3D heatmap
    const points = [];
    hotspots.forEach(hotspot => {
      points.push(hotspot);
      // Add points around each hotspot for heatmap density
      const numPoints = Math.min(Math.floor(hotspot.cases / 200), 50); // Scale points based on cases
      for (let i = 0; i < numPoints; i++) {
        points.push({
          lng: hotspot.lng + (Math.random() - 0.5) * 0.02,
          lat: hotspot.lat + (Math.random() - 0.5) * 0.02,
          cases: 1,
          loss: hotspot.loss / hotspot.cases,
          area: hotspot.area,
          risk: hotspot.risk
        });
      }
    });

    return { hotspots, points };
  }, [geoData]);

  // Update pitch when switching between 2D and 3D
  const currentViewState = {
    ...viewState,
    pitch: is3D ? 45 : 0,
  };

  // 3D Layers for deck.gl
  const layers = useMemo(() => {
    if (!is3D) return [];

    return [
      new HeatmapLayer({
        id: 'heatmap-layer',
        data: points,
        getPosition: d => [d.lng, d.lat],
        getWeight: d => d.cases,
        radiusPixels: 60,
        intensity: 1,
        threshold: 0.05,
        aggregation: 'SUM'
      }),
      new ScatterplotLayer({
        id: 'scatter-layer',
        data: hotspots,
        getPosition: d => [d.lng, d.lat],
        getRadius: d => Math.sqrt(d.cases) * 100,
        getFillColor: d => {
          switch(d.risk) {
            case 'critical': return [239, 68, 68, 180];  // Critical - red (#ef4444)
            case 'high': return [251, 112, 24, 180];     // High - orange (#fb7018)  
            case 'medium': return [245, 158, 11, 180];   // Medium - yellow (#f59e0b)
            case 'low': return [16, 185, 129, 180];      // Low - green (#10b981)
            default: return [16, 185, 129, 180];         // Default to low (green)
          }
        },
        pickable: true,
        radiusScale: 6,
        radiusMinPixels: 8,
        radiusMaxPixels: 100,
      })
    ];
  }, [is3D, hotspots, points]);

  const getMarkerColor = (risk) => {
    switch(risk) {
      case 'critical': return '#ef4444';
      case 'high': return '#fb7018';
      case 'medium': return '#f59e0b';
      default: return '#10b981';
    }
  };

  const getMarkerSize = (cases) => {
    if (cases > 40) return 20;
    if (cases > 30) return 16;
    return 12;
  };

  const formatCurrency = (value) => `₱${(value / 1000).toFixed(0)}K`;

  return (
    <div className="ntl-map">
      {/* Map Container - Full Screen */}
      <div className="map-wrapper">
        {is3D ? (
          // 3D View with deck.gl
          <DeckGL
            viewState={currentViewState}
            onViewStateChange={evt => setViewState(evt.viewState)}
            controller={true}
            layers={layers}
            onWebGLInitialized={(gl) => {
              // Ensure WebGL context is properly initialized
              if (gl) {
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
              }
            }}
            onError={(error) => {
              console.warn('DeckGL error:', error);
            }}
            getTooltip={({ object }) =>
              object && {
                html: `
                  <div class="map-tooltip">
                    <strong>${object.area}</strong><br/>
                    ${object.cases} NTL cases<br/>
                    ${formatCurrency(object.loss)} estimated loss
                  </div>
                `,
                style: {
                  backgroundColor: '#1f2937',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                }
              }
            }
          >
            <Map
              mapStyle={MAP_STYLE}
              mapboxAccessToken={MAPBOX_TOKEN}
              style={{ width: '100%', height: '100%' }}
              reuseMaps
            >
              <NavigationControl position="top-right" />
            </Map>
          </DeckGL>
        ) : (
          // 2D View with Markers
          <Map
            {...currentViewState}
            onMove={evt => setViewState(evt.viewState)}
            mapStyle={MAP_STYLE}
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: '100%', height: '100%' }}
          >
            <NavigationControl position="top-right" />
            
            {hotspots.map((hotspot, index) => (
              <Marker
                key={index}
                longitude={hotspot.lng}
                latitude={hotspot.lat}
                anchor="center"
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  setPopupInfo(hotspot);
                }}
              >
                <div
                  className="custom-marker"
                  style={{
                    width: `${getMarkerSize(hotspot.cases)}px`,
                    height: `${getMarkerSize(hotspot.cases)}px`,
                    backgroundColor: getMarkerColor(hotspot.risk),
                    border: '2px solid white',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    boxShadow: `0 0 ${getMarkerSize(hotspot.cases)}px ${getMarkerColor(hotspot.risk)}`,
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                />
              </Marker>
            ))}

            {popupInfo && (
              <Popup
                longitude={popupInfo.lng}
                latitude={popupInfo.lat}
                anchor="bottom"
                onClose={() => setPopupInfo(null)}
                closeButton={true}
                closeOnClick={false}
              >
                <div className="map-popup">
                  <h4 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '14px', fontWeight: '700' }}>
                    {popupInfo.area}
                  </h4>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>Cases:</strong> {popupInfo.cases}
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>Loss:</strong> {formatCurrency(popupInfo.loss)}
                    </div>
                    {popupInfo.avgConfidence && (
                      <div style={{ marginBottom: '4px' }}>
                        <strong>Avg Confidence:</strong> {(popupInfo.avgConfidence * 100).toFixed(1)}%
                      </div>
                    )}
                    <div>
                      <strong>Risk:</strong>{' '}
                      <span style={{ 
                        color: getMarkerColor(popupInfo.risk),
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        fontSize: '11px'
                      }}>
                        {popupInfo.risk}
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            )}
          </Map>
        )}

        {/* Floating Controls - Lower Left */}
        <div className="map-controls">
          {/* Toggle Button */}
          <button 
            className="view-toggle-btn"
            onClick={() => setIs3D(!is3D)}
            title={is3D ? 'Switch to 2D View' : 'Switch to 3D View'}
          >
            {is3D ? '📍 2D View' : '🏔️ 3D View'}
          </button>

          {/* Legend */}
          <div className="map-legend">
            <div className="legend-title">Threat Level:</div>
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-circle" style={{ background: '#ef4444' }} />
                <span>Critical (85%)</span>
              </div>
              <div className="legend-item">
                <div className="legend-circle" style={{ background: '#fb7018' }} />
                <span>High (70%)</span>
              </div>
              <div className="legend-item">
                <div className="legend-circle" style={{ background: '#f59e0b' }} />
                <span>Medium (55%)</span>
              </div>
              <div className="legend-item">
                <div className="legend-circle" style={{ background: '#10b981' }} />
                <span>Low (35%)</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="map-stats">
            <div className="map-stat">
              <span className="stat-value">{geoData?.regions?.length || 16}</span>
              <span className="stat-label">Active Clusters</span>
            </div>
            <div className="map-stat">
              <span className="stat-value">{geoData?.totalCases?.toLocaleString() || '72,123'}</span>
              <span className="stat-label">Total Cases</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

NTLMap.propTypes = {
  hotlist: PropTypes.array,
};

export default NTLMap;