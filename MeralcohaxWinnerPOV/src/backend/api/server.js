/**
 * Project KILOS - API Gateway
 * Node.js/Express server for frontend communication
 */

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import * as db from '../database/connection.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ML Service URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Database connection flag
let dbConnected = false;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * Health Check
 */
app.get('/api/health', async (req, res) => {
  try {
    let mlHealth;
    try {
      mlHealth = await axios.get(`${ML_SERVICE_URL}/`, { timeout: 2000 });
    } catch (mlError) {
      mlHealth = { data: { status: 'unavailable' } };
    }
    
    res.json({
      status: dbConnected ? 'operational' : 'degraded',
      api: 'healthy',
      database: dbConnected ? 'connected' : 'disconnected',
      ml_service: mlHealth.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      api: 'healthy',
      database: dbConnected ? 'connected' : 'disconnected',
      ml_service: 'unavailable',
      error: error.message
    });
  }
});

/**
 * Get Daily Inspection Hotlist
 * Returns top NTL suspects ranked by priority
 */
app.get('/api/hotlist', async (req, res) => {
  try {
    const { limit = 50, date } = req.query;
    
    if (!dbConnected) {
      // Fallback to sample data if database not available
      const sampleHotlist = generateSampleHotlist(parseInt(limit));
      return res.json({
        success: true,
        count: sampleHotlist.length,
        date: date || new Date().toISOString().split('T')[0],
        hotlist: sampleHotlist,
        source: 'sample_data'
      });
    }
    
    // Get real data from database
    const hotlist = await db.getHotlist(parseInt(limit));
    
    res.json({
      success: true,
      count: hotlist.length,
      date: date || new Date().toISOString().split('T')[0],
      hotlist: hotlist,
      source: 'database'
    });
  } catch (error) {
    console.error('Hotlist error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Analyze Single Customer
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const customerData = req.body;
    
    // Validate required fields
    if (!customerData.customer_id || !customerData.consumption_history) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: customer_id, consumption_history'
      });
    }
    
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, customerData);
    
    res.json({
      success: true,
      prediction: response.data
    });
  } catch (error) {
    console.error('Analysis error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get Statistics/Dashboard Data
 */
app.get('/api/stats', async (req, res) => {
  try {
    if (!dbConnected) {
      // Fallback to mock statistics
      const stats = {
        total_customers: 8000000,
        flagged_today: 342,
        total_estimated_loss: 15400000,
        inspections_pending: 156,
        high_confidence_cases: 89,
        avg_confidence_score: 67.8,
        recovery_this_month: 4200000,
        model_accuracy: 87.5
      };
      
      return res.json({
        success: true,
        stats: stats,
        timestamp: new Date().toISOString(),
        source: 'sample_data'
      });
    }
    
    // Get real dashboard stats from database
    const stats = await db.getDashboardStats();
    
    res.json({
      success: true,
      stats: stats,
      timestamp: new Date().toISOString(),
      source: 'database'
    });
  } catch (error) {
    console.error('Stats error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get Customer Details by ID
 */
app.get('/api/customers/:id', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected'
      });
    }
    
    const customer = await db.getCustomerById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }
    
    res.json({
      success: true,
      customer: customer
    });
  } catch (error) {
    console.error('Customer query error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get Transformer Details by ID
 */
app.get('/api/transformers/:id', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected'
      });
    }
    
    const transformer = await db.getTransformerById(req.params.id);
    
    if (!transformer) {
      return res.status(404).json({
        success: false,
        error: 'Transformer not found'
      });
    }
    
    res.json({
      success: true,
      transformer: transformer
    });
  } catch (error) {
    console.error('Transformer query error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get Map Markers for Visualization
 */
app.get('/api/map/markers', async (req, res) => {
  try {
    const { risk_level = 'high' } = req.query;
    
    if (!dbConnected) {
      return res.json({
        success: true,
        markers: [],
        source: 'sample_data',
        message: 'Database not connected - run setup first'
      });
    }
    
    const markers = await db.getMapMarkers(risk_level);
    
    res.json({
      success: true,
      count: markers.length,
      markers: markers,
      source: 'database'
    });
  } catch (error) {
    console.error('Map markers error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get Geographic Distribution Stats
 */
app.get('/api/geographic/distribution', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected'
      });
    }
    
    const distribution = await db.getGeographicDistribution();
    
    res.json({
      success: true,
      distribution: distribution,
      source: 'database'
    });
  } catch (error) {
    console.error('Geographic distribution error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Search Customers
 */
app.get('/api/customers', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected'
      });
    }
    
    const criteria = {
      risk_level: req.query.risk_level,
      min_risk_score: req.query.min_risk_score ? parseFloat(req.query.min_risk_score) : null,
      customer_type: req.query.customer_type,
      area: req.query.area,
      limit: req.query.limit ? parseInt(req.query.limit) : 100
    };
    
    // Remove null/undefined values
    Object.keys(criteria).forEach(key => 
      criteria[key] === null || criteria[key] === undefined ? delete criteria[key] : {}
    );
    
    const customers = await db.searchCustomers(criteria);
    
    res.json({
      success: true,
      count: customers.length,
      customers: customers,
      source: 'database'
    });
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get Model Info
 */
app.get('/api/model/info', async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/model/info`);
    res.json({
      success: true,
      model: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Submit Inspection Result (Feedback Loop)
 */
app.post('/api/inspection/result', async (req, res) => {
  try {
    const { customer_id, theft_confirmed, notes } = req.body;
    
    // In production: Store in database for model retraining
    console.log('Inspection result received:', { customer_id, theft_confirmed, notes });
    
    res.json({
      success: true,
      message: 'Inspection result recorded'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Helper: Generate sample customer IDs for demo
 */
function generateSampleCustomerIds(count) {
  const ids = [];
  for (let i = 0; i < count; i++) {
    ids.push(`CUST-${Math.floor(Math.random() * 8000000)}`);
  }
  return ids;
}

/**
 * Helper: Generate sample hotlist for demo
 */
function generateSampleHotlist(count) {
  const indicatorsPool = [
    "Consumption dropped >50% vs. historical average",
    "AMI tamper alerts detected",
    "Abnormal voltage drop (possible bypass)",
    "Residential account with commercial-level consumption",
    "24/7 flat-line consumption pattern",
    "Geospatial cluster: multiple NTL cases on same transformer",
    "Phase imbalance detected",
    "Zero consumption for 2+ months followed by spike",
    "Consumption pattern mismatch with business hours",
    "Voltage reading below 200V threshold"
  ];

  const hotlist = [];

  for (let i = 0; i < count; i++) {
    const customerId = `CUST-${Math.floor(Math.random() * 8000000)}`;
    
    // Bias confidence higher for top results
    let confidence;
    if (i < 10) {
      confidence = 80 + Math.random() * 18; // 80-98
    } else if (i < 30) {
      confidence = 60 + Math.random() * 25; // 60-85
    } else {
      confidence = 45 + Math.random() * 25; // 45-70
    }

    // Loss correlates with confidence
    const baseLoss = 5000 + Math.random() * 45000;
    const estimatedLoss = baseLoss * (confidence / 50);

    // Risk level
    let riskLevel, action;
    if (confidence >= 75) {
      riskLevel = "High";
      action = "Immediate field inspection with legal team standby";
    } else if (confidence >= 50) {
      riskLevel = "Medium";
      action = "Schedule inspection within 3 days";
    } else {
      riskLevel = "Low";
      action = "Monitor for 30 days, flag if pattern continues";
    }

    // Random 2-3 indicators
    const numIndicators = 2 + Math.floor(Math.random() * 2);
    const shuffled = [...indicatorsPool].sort(() => 0.5 - Math.random());
    const theftIndicators = shuffled.slice(0, numIndicators);

    hotlist.push({
      customer_id: customerId,
      confidence_score: parseFloat(confidence.toFixed(2)),
      estimated_monthly_loss: parseFloat(estimatedLoss.toFixed(2)),
      theft_indicators: theftIndicators,
      risk_level: riskLevel,
      recommended_action: action
    });
  }

  // Sort by priority
  hotlist.sort((a, b) => {
    const priorityA = a.confidence_score * a.estimated_monthly_loss;
    const priorityB = b.confidence_score * b.estimated_monthly_loss;
    return priorityB - priorityA;
  });

  return hotlist;
}

/**
 * Error Handler
 */
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

/**
 * Start Server
 */
async function startServer() {
  // Test database connection
  console.log('\n🔍 Testing database connection...');
  dbConnected = await db.testConnection();
  
  if (dbConnected) {
    const hasData = await db.initializeDatabase();
    if (!hasData) {
      console.log('\n⚠️  WARNING: Database is empty!');
      console.log('   Run these commands to set up:');
      console.log('   1. mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS project_kilos;"');
      console.log('   2. mysql -u root -p project_kilos < src/backend/database/schema.sql');
      console.log('   3. node src/backend/database/seed_data.js');
      console.log('');
    }
  } else {
    console.log('\n⚠️  WARNING: Database connection failed!');
    console.log('   API will run with sample data only.');
    console.log('   To enable database:');
    console.log('   1. Install MySQL/MariaDB');
    console.log('   2. Set DB credentials in .env file');
    console.log('   3. Create database: CREATE DATABASE project_kilos;');
    console.log('   4. Run schema.sql and seed_data.js');
    console.log('');
  }
  
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║     KILOS API Gateway                      ║
║     Kuryente Intelligence System           ║
╚════════════════════════════════════════════╝

✓ Server running on port ${PORT}
✓ ML Service URL: ${ML_SERVICE_URL}
✓ Database: ${dbConnected ? '🟢 Connected' : '🔴 Using sample data'}
✓ Environment: ${process.env.NODE_ENV || 'development'}

API Endpoints:
  GET  /api/health                    - System health check
  GET  /api/hotlist                   - Daily inspection hotlist
  GET  /api/customers                 - Search customers
  GET  /api/customers/:id             - Customer details
  GET  /api/transformers/:id          - Transformer details
  GET  /api/map/markers               - Map visualization data
  GET  /api/geographic/distribution   - Geographic stats
  GET  /api/stats                     - Dashboard statistics
  POST /api/analyze                   - Analyze single customer
  GET  /api/model/info                - Model information
  POST /api/inspection/result         - Submit inspection feedback

Ready to detect NTL! 🔍⚡
    `);
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
