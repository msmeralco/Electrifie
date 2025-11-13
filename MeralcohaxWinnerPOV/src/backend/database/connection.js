/**
 * PROJECT KILOS - Database Connection Pool
 * MySQL connection management for API
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Connection pool configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'project_kilos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✓ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Initialize database (create tables if not exist)
 */
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Check if tables exist
    const [tables] = await connection.query('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('⚠ No tables found. Please run schema.sql first.');
      console.log('Command: mysql -u root -p project_kilos < src/backend/database/schema.sql');
    } else {
      console.log(`✓ Found ${tables.length} tables in database`);
    }
    
    connection.release();
    return tables.length > 0;
  } catch (error) {
    console.error('Database initialization error:', error.message);
    return false;
  }
}

/**
 * Get hotlist from database view
 */
async function getHotlist(limit = 50) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        customer_id,
        customer_name,
        address,
        risk_score,
        risk_level,
        ntl_confidence,
        avg_monthly_kwh,
        last_billing_amount,
        location_lat,
        location_lng,
        days_since_inspection,
        has_meter_tamper,
        has_billing_anomaly,
        has_consumption_anomaly
      FROM v_hotlist
      LIMIT ?
    `, [limit]);
    
    return rows;
  } catch (error) {
    console.error('Hotlist query error:', error.message);
    throw error;
  }
}

/**
 * Get customer details by ID
 */
async function getCustomerById(customerId) {
  try {
    const [customers] = await pool.query(`
      SELECT 
        c.*,
        t.transformer_name,
        t.location_lat as transformer_lat,
        t.location_lng as transformer_lng,
        t.loss_percentage as transformer_loss,
        f.area as feeder_area
      FROM customers c
      LEFT JOIN transformers t ON c.transformer_id = t.transformer_id
      LEFT JOIN feeders f ON t.feeder_id = f.feeder_id
      WHERE c.customer_id = ?
    `, [customerId]);
    
    if (customers.length === 0) {
      return null;
    }
    
    // Get consumption history
    const [consumption] = await pool.query(`
      SELECT 
        reading_date,
        kwh_consumed,
        billing_amount,
        is_anomaly,
        anomaly_type,
        deviation_percentage
      FROM consumption_readings
      WHERE customer_id = ?
      ORDER BY reading_date DESC
      LIMIT 12
    `, [customerId]);
    
    return {
      ...customers[0],
      consumption_history: consumption
    };
  } catch (error) {
    console.error('Customer query error:', error.message);
    throw error;
  }
}

/**
 * Get transformer details with customer list
 */
async function getTransformerById(transformerId) {
  try {
    const [transformers] = await pool.query(`
      SELECT 
        t.*,
        f.area as feeder_area,
        f.system_loss_percentage as feeder_loss
      FROM transformers t
      LEFT JOIN feeders f ON t.feeder_id = f.feeder_id
      WHERE t.transformer_id = ?
    `, [transformerId]);
    
    if (transformers.length === 0) {
      return null;
    }
    
    // Get customers on this transformer
    const [customers] = await pool.query(`
      SELECT 
        customer_id,
        customer_name,
        customer_type,
        risk_score,
        risk_level,
        has_meter_tamper,
        has_billing_anomaly,
        has_consumption_anomaly
      FROM customers
      WHERE transformer_id = ?
      ORDER BY risk_score DESC
    `, [transformerId]);
    
    return {
      ...transformers[0],
      customers: customers
    };
  } catch (error) {
    console.error('Transformer query error:', error.message);
    throw error;
  }
}

/**
 * Get map markers (all high-risk customers for visualization)
 */
async function getMapMarkers(riskLevel = 'high') {
  try {
    let query = `
      SELECT 
        customer_id,
        customer_name,
        risk_score,
        risk_level,
        location_lat,
        location_lng,
        has_meter_tamper,
        has_billing_anomaly,
        has_consumption_anomaly
      FROM customers
      WHERE location_lat IS NOT NULL 
        AND location_lng IS NOT NULL
    `;
    
    const params = [];
    
    if (riskLevel === 'high') {
      query += ` AND risk_level IN ('high', 'critical')`;
    } else if (riskLevel === 'all') {
      // No filter
    } else {
      query += ` AND risk_level = ?`;
      params.push(riskLevel);
    }
    
    query += ` ORDER BY risk_score DESC LIMIT 1000`;
    
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error) {
    console.error('Map markers query error:', error.message);
    throw error;
  }
}

/**
 * Get dashboard statistics
 */
async function getDashboardStats() {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN risk_level = 'critical' THEN 1 END) as critical_count,
        COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_count,
        COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_count,
        COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as low_count,
        AVG(risk_score) as avg_risk_score,
        COUNT(CASE WHEN has_meter_tamper = 1 THEN 1 END) as meter_tamper_count,
        COUNT(CASE WHEN has_billing_anomaly = 1 THEN 1 END) as billing_anomaly_count,
        COUNT(CASE WHEN has_consumption_anomaly = 1 THEN 1 END) as consumption_anomaly_count
      FROM customers
    `);
    
    const [transformerStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_transformers,
        AVG(loss_percentage) as avg_loss_percentage,
        COUNT(CASE WHEN risk_level = 'critical' THEN 1 END) as critical_transformers,
        COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_transformers
      FROM transformers
    `);
    
    const [feederStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_feeders,
        AVG(system_loss_percentage) as avg_system_loss,
        SUM(revenue_loss_php) as total_revenue_loss
      FROM feeders
    `);
    
    return {
      customers: stats[0],
      transformers: transformerStats[0],
      feeders: feederStats[0]
    };
  } catch (error) {
    console.error('Dashboard stats query error:', error.message);
    throw error;
  }
}

/**
 * Get geographic distribution stats
 */
async function getGeographicDistribution() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        f.area,
        COUNT(DISTINCT c.customer_id) as customer_count,
        COUNT(DISTINCT CASE WHEN c.risk_level IN ('high', 'critical') THEN c.customer_id END) as high_risk_count,
        AVG(c.risk_score) as avg_risk_score,
        AVG(t.loss_percentage) as avg_transformer_loss,
        f.system_loss_percentage as feeder_loss
      FROM feeders f
      LEFT JOIN transformers t ON f.feeder_id = t.feeder_id
      LEFT JOIN customers c ON t.transformer_id = c.transformer_id
      GROUP BY f.area, f.system_loss_percentage
      ORDER BY high_risk_count DESC
    `);
    
    return rows;
  } catch (error) {
    console.error('Geographic distribution query error:', error.message);
    throw error;
  }
}

/**
 * Search customers by criteria
 */
async function searchCustomers(criteria = {}) {
  try {
    let query = `
      SELECT 
        customer_id,
        customer_name,
        customer_type,
        risk_score,
        risk_level,
        location_lat,
        location_lng,
        has_meter_tamper,
        has_billing_anomaly,
        has_consumption_anomaly
      FROM customers
      WHERE 1=1
    `;
    
    const params = [];
    
    if (criteria.risk_level) {
      query += ` AND risk_level = ?`;
      params.push(criteria.risk_level);
    }
    
    if (criteria.min_risk_score) {
      query += ` AND risk_score >= ?`;
      params.push(criteria.min_risk_score);
    }
    
    if (criteria.customer_type) {
      query += ` AND customer_type = ?`;
      params.push(criteria.customer_type);
    }
    
    if (criteria.area) {
      query += ` AND transformer_id IN (
        SELECT t.transformer_id FROM transformers t
        JOIN feeders f ON t.feeder_id = f.feeder_id
        WHERE f.area = ?
      )`;
      params.push(criteria.area);
    }
    
    query += ` ORDER BY risk_score DESC LIMIT ?`;
    params.push(criteria.limit || 100);
    
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error) {
    console.error('Search customers query error:', error.message);
    throw error;
  }
}

export {
  pool,
  testConnection,
  initializeDatabase,
  getHotlist,
  getCustomerById,
  getTransformerById,
  getMapMarkers,
  getDashboardStats,
  getGeographicDistribution,
  searchCustomers
};
