-- =====================================================
-- PROJECT KILOS - DATABASE SCHEMA
-- Three-Level NTL Detection System (Meralco Context)
-- =====================================================

-- =====================================================
-- LEVEL 3: GRID/FEEDER LEVEL (System-Wide)
-- =====================================================

CREATE TABLE feeders (
    feeder_id VARCHAR(50) PRIMARY KEY,
    feeder_name VARCHAR(255) NOT NULL,
    voltage_level ENUM('13.2kV', '13.8kV', '34.5kV') NOT NULL,
    substation_id VARCHAR(50) NOT NULL,
    area VARCHAR(100), -- e.g., 'Quezon City', 'Manila', 'Makati'
    installed_capacity_mva DECIMAL(10, 2),
    peak_load_mw DECIMAL(10, 2),
    -- Performance Metrics (from your screenshot)
    system_loss_percentage DECIMAL(5, 2) DEFAULT 5.99, -- Target: 5.99%
    technical_loss_percentage DECIMAL(5, 2),
    non_technical_loss_percentage DECIMAL(5, 2),
    -- Reliability Metrics
    saidi_minutes DECIMAL(10, 2), -- System Average Interruption Duration Index
    saifi_times DECIMAL(10, 2), -- System Average Interruption Frequency Index
    -- Financial
    monthly_energy_purchased_kwh DECIMAL(15, 2),
    monthly_energy_billed_kwh DECIMAL(15, 2),
    revenue_loss_php DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Validation: System loss should be reasonable
    CONSTRAINT chk_system_loss CHECK (system_loss_percentage BETWEEN 0 AND 20),
    CONSTRAINT chk_saidi CHECK (saidi_minutes >= 0),
    CONSTRAINT chk_saifi CHECK (saifi_times >= 0)
);

-- =====================================================
-- LEVEL 2: TRANSFORMER LEVEL (Aggregated)
-- =====================================================

CREATE TABLE transformers (
    transformer_id VARCHAR(50) PRIMARY KEY,
    feeder_id VARCHAR(50) NOT NULL,
    transformer_name VARCHAR(255),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    address TEXT,
    -- Technical Specs
    capacity_kva DECIMAL(10, 2) NOT NULL,
    voltage_primary VARCHAR(20), -- e.g., '13.2kV'
    voltage_secondary VARCHAR(20), -- e.g., '230V'
    installation_date DATE,
    -- Loss Detection
    total_connected_customers INT DEFAULT 0,
    monthly_input_kwh DECIMAL(12, 2), -- Energy IN to transformer
    monthly_output_kwh DECIMAL(12, 2), -- Energy billed to customers
    technical_loss_kwh DECIMAL(12, 2), -- Expected technical losses
    non_technical_loss_kwh DECIMAL(12, 2), -- Suspected theft/meter errors
    loss_percentage DECIMAL(5, 2), -- (Input - Output) / Input * 100
    -- Risk Assessment
    risk_score DECIMAL(5, 2), -- 0-100 score
    risk_level ENUM('low', 'medium', 'high', 'critical'),
    anomaly_count INT DEFAULT 0,
    last_inspection_date DATE,
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (feeder_id) REFERENCES feeders(feeder_id),
    
    -- Validations
    CONSTRAINT chk_capacity CHECK (capacity_kva > 0),
    CONSTRAINT chk_loss_percentage CHECK (loss_percentage BETWEEN -10 AND 50),
    CONSTRAINT chk_risk_score CHECK (risk_score BETWEEN 0 AND 100),
    -- Energy balance check
    CONSTRAINT chk_energy_balance CHECK (
        monthly_input_kwh IS NULL OR 
        monthly_output_kwh IS NULL OR 
        monthly_input_kwh >= monthly_output_kwh
    )
);

-- =====================================================
-- LEVEL 1: CUSTOMER LEVEL (Granular)
-- =====================================================

CREATE TABLE customers (
    customer_id VARCHAR(50) PRIMARY KEY,
    account_number VARCHAR(50) UNIQUE NOT NULL,
    transformer_id VARCHAR(50) NOT NULL,
    -- Customer Info
    customer_name VARCHAR(255),
    customer_type ENUM('residential', 'commercial', 'industrial') NOT NULL,
    address TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    -- Service Details
    meter_number VARCHAR(50),
    meter_type ENUM('analog', 'digital', 'smart') DEFAULT 'analog',
    connection_type ENUM('overhead', 'underground') DEFAULT 'overhead',
    service_voltage VARCHAR(20) DEFAULT '230V',
    contracted_load_kw DECIMAL(10, 2),
    installation_date DATE,
    -- Risk Profiling
    risk_score DECIMAL(5, 2) DEFAULT 0, -- 0-100
    risk_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
    ntl_confidence DECIMAL(5, 2), -- ML model confidence (0-100)
    -- Flags
    is_active BOOLEAN DEFAULT TRUE,
    is_flagged BOOLEAN DEFAULT FALSE,
    has_meter_tamper BOOLEAN DEFAULT FALSE,
    has_billing_anomaly BOOLEAN DEFAULT FALSE,
    has_consumption_anomaly BOOLEAN DEFAULT FALSE,
    -- Inspection
    last_inspection_date DATE,
    inspection_result ENUM('clean', 'minor_violation', 'major_violation', 'theft_confirmed'),
    inspector_notes TEXT,
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (transformer_id) REFERENCES transformers(transformer_id),
    
    -- Validations
    CONSTRAINT chk_risk_score_customer CHECK (risk_score BETWEEN 0 AND 100),
    CONSTRAINT chk_ntl_confidence CHECK (ntl_confidence IS NULL OR ntl_confidence BETWEEN 0 AND 100)
);

-- =====================================================
-- CONSUMPTION DATA (Time Series)
-- =====================================================

CREATE TABLE consumption_readings (
    reading_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    reading_date DATE NOT NULL,
    -- Consumption
    kwh_consumed DECIMAL(10, 2) NOT NULL,
    billing_amount_php DECIMAL(12, 2),
    -- Rate (from your screenshot: PhP 10.54/kWh average)
    rate_per_kwh DECIMAL(6, 2) DEFAULT 10.54,
    -- Anomaly Detection
    is_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_type ENUM('spike', 'drop', 'zero', 'negative', 'tamper_suspected'),
    expected_kwh DECIMAL(10, 2), -- ML predicted normal consumption
    deviation_percentage DECIMAL(5, 2), -- % difference from expected
    -- ML Scores
    ntl_probability DECIMAL(5, 4), -- 0.0000 to 1.0000
    anomaly_score DECIMAL(5, 2), -- 0-100
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    
    -- Prevent duplicate readings
    UNIQUE KEY unique_customer_reading (customer_id, reading_date),
    
    -- Validations
    CONSTRAINT chk_kwh_consumed CHECK (kwh_consumed >= 0),
    CONSTRAINT chk_billing_amount CHECK (billing_amount_php IS NULL OR billing_amount_php >= 0),
    CONSTRAINT chk_deviation CHECK (deviation_percentage IS NULL OR deviation_percentage BETWEEN -100 AND 1000)
);

-- =====================================================
-- INSPECTION HISTORY
-- =====================================================

CREATE TABLE inspections (
    inspection_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    inspection_date DATE NOT NULL,
    inspector_id VARCHAR(50),
    -- Findings
    result ENUM('clean', 'minor_violation', 'major_violation', 'theft_confirmed', 'meter_defective') NOT NULL,
    violation_type ENUM('meter_tamper', 'illegal_connection', 'meter_bypass', 'defective_meter', 'none'),
    estimated_loss_kwh DECIMAL(10, 2),
    estimated_loss_php DECIMAL(12, 2),
    -- Actions
    action_taken TEXT,
    penalty_amount_php DECIMAL(12, 2),
    meter_replaced BOOLEAN DEFAULT FALSE,
    legal_action BOOLEAN DEFAULT FALSE,
    -- Notes
    inspector_notes TEXT,
    photo_urls JSON, -- Array of image URLs
    -- Follow-up
    requires_followup BOOLEAN DEFAULT FALSE,
    followup_date DATE,
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    
    -- Validations
    CONSTRAINT chk_estimated_loss CHECK (estimated_loss_kwh IS NULL OR estimated_loss_kwh >= 0),
    CONSTRAINT chk_penalty CHECK (penalty_amount_php IS NULL OR penalty_amount_php >= 0)
);

-- =====================================================
-- DATA VALIDATION & CROSS-CHECKING RULES
-- (How Meralco managers would verify data)
-- =====================================================

CREATE TABLE validation_rules (
    rule_id INT AUTO_INCREMENT PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    rule_type ENUM('customer', 'transformer', 'feeder') NOT NULL,
    rule_description TEXT,
    sql_condition TEXT, -- SQL expression for validation
    severity ENUM('warning', 'error', 'critical') DEFAULT 'warning',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Meralco-style validation rules
INSERT INTO validation_rules (rule_name, rule_type, rule_description, sql_condition, severity) VALUES
-- Customer Level Validations
('Zero Consumption Check', 'customer', 'Flag customers with 0 consumption for 3+ consecutive months', 
 'SELECT customer_id FROM consumption_readings GROUP BY customer_id HAVING SUM(kwh_consumed) = 0', 'warning'),

('Negative Consumption', 'customer', 'Impossible: consumption cannot be negative', 
 'SELECT customer_id FROM consumption_readings WHERE kwh_consumed < 0', 'critical'),

('Consumption Spike >500%', 'customer', 'Consumption >500% of 3-month average', 
 'SELECT customer_id FROM consumption_readings WHERE deviation_percentage > 500', 'error'),

('Consumption Drop >80%', 'customer', 'Sudden drop >80% may indicate meter tamper', 
 'SELECT customer_id FROM consumption_readings WHERE deviation_percentage < -80', 'error'),

-- Transformer Level Validations
('Transformer Overload', 'transformer', 'Output exceeds transformer capacity', 
 'SELECT transformer_id FROM transformers WHERE monthly_output_kwh > (capacity_kva * 0.8 * 730)', 'critical'),

('High Transformer Loss', 'transformer', 'Loss >15% indicates potential theft cluster', 
 'SELECT transformer_id FROM transformers WHERE loss_percentage > 15', 'error'),

('Energy Balance Violation', 'transformer', 'Output cannot exceed input', 
 'SELECT transformer_id FROM transformers WHERE monthly_output_kwh > monthly_input_kwh', 'critical'),

-- Feeder Level Validations
('System Loss Exceeds Target', 'feeder', 'System loss >6.5% (regulatory cap)', 
 'SELECT feeder_id FROM feeders WHERE system_loss_percentage > 6.5', 'warning'),

('High SAIDI', 'feeder', 'Service interruptions >120 minutes indicates reliability issues', 
 'SELECT feeder_id FROM feeders WHERE saidi_minutes > 120', 'warning');

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Customer lookups
CREATE INDEX idx_customer_transformer ON customers(transformer_id);
CREATE INDEX idx_customer_risk ON customers(risk_level, risk_score DESC);
CREATE INDEX idx_customer_active ON customers(is_active, is_flagged);

-- Consumption queries
CREATE INDEX idx_consumption_date ON consumption_readings(reading_date);
CREATE INDEX idx_consumption_customer ON consumption_readings(customer_id, reading_date DESC);
CREATE INDEX idx_consumption_anomaly ON consumption_readings(is_anomaly, anomaly_type);

-- Transformer aggregations
CREATE INDEX idx_transformer_feeder ON transformers(feeder_id);
CREATE INDEX idx_transformer_risk ON transformers(risk_level, risk_score DESC);

-- Inspections
CREATE INDEX idx_inspection_customer ON inspections(customer_id, inspection_date DESC);
CREATE INDEX idx_inspection_date ON inspections(inspection_date);

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- Dashboard: Top NTL Suspects
CREATE VIEW v_hotlist AS
SELECT 
    c.customer_id,
    c.account_number,
    c.customer_name,
    c.address,
    c.risk_score,
    c.risk_level,
    c.ntl_confidence,
    c.location_lat,
    c.location_lng,
    c.has_meter_tamper,
    c.has_billing_anomaly,
    c.has_consumption_anomaly,
    t.transformer_id,
    t.transformer_name,
    t.location_lat AS transformer_lat,
    t.location_lng AS transformer_lng,
    f.feeder_name,
    f.area,
    COALESCE(recent.avg_monthly_kwh, 0) AS avg_monthly_kwh,
    COALESCE(recent.last_billing_amount, 0) AS last_billing_amount,
    c.last_inspection_date,
    DATEDIFF(CURRENT_DATE, c.last_inspection_date) AS days_since_inspection
FROM customers c
LEFT JOIN transformers t ON c.transformer_id = t.transformer_id
LEFT JOIN feeders f ON t.feeder_id = f.feeder_id
LEFT JOIN (
    SELECT 
        customer_id,
        AVG(kwh_consumed) AS avg_monthly_kwh,
        MAX(billing_amount_php) AS last_billing_amount
    FROM consumption_readings
    WHERE reading_date >= DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH)
    GROUP BY customer_id
) recent ON c.customer_id = recent.customer_id
WHERE c.is_active = TRUE
  AND c.risk_level IN ('high', 'critical')
ORDER BY c.risk_score DESC, c.ntl_confidence DESC;

-- Transformer Performance Dashboard
CREATE VIEW v_transformer_performance AS
SELECT 
    t.transformer_id,
    t.transformer_name,
    t.capacity_kva,
    t.total_connected_customers,
    t.monthly_input_kwh,
    t.monthly_output_kwh,
    t.loss_percentage,
    t.risk_level,
    f.feeder_name,
    f.area,
    COUNT(DISTINCT c.customer_id) AS active_customers,
    SUM(CASE WHEN c.risk_level IN ('high', 'critical') THEN 1 ELSE 0 END) AS high_risk_customers,
    t.monthly_input_kwh - t.monthly_output_kwh AS total_loss_kwh,
    (t.monthly_input_kwh - t.monthly_output_kwh) * 10.54 AS revenue_loss_php
FROM transformers t
LEFT JOIN feeders f ON t.feeder_id = f.feeder_id
LEFT JOIN customers c ON t.transformer_id = c.transformer_id AND c.is_active = TRUE
GROUP BY t.transformer_id, t.transformer_name, t.capacity_kva, t.total_connected_customers,
         t.monthly_input_kwh, t.monthly_output_kwh, t.loss_percentage, t.risk_level,
         f.feeder_name, f.area;

-- =====================================================
-- STORED PROCEDURES FOR DATA VALIDATION
-- =====================================================

DELIMITER //

-- Procedure: Validate Energy Balance (Cross-checking)
CREATE PROCEDURE sp_validate_energy_balance(IN p_transformer_id VARCHAR(50))
BEGIN
    DECLARE v_input_kwh DECIMAL(12,2);
    DECLARE v_sum_customer_kwh DECIMAL(12,2);
    DECLARE v_technical_loss DECIMAL(12,2);
    DECLARE v_diff DECIMAL(12,2);
    
    -- Get transformer input
    SELECT monthly_input_kwh, technical_loss_kwh 
    INTO v_input_kwh, v_technical_loss
    FROM transformers 
    WHERE transformer_id = p_transformer_id;
    
    -- Sum all customer consumption
    SELECT COALESCE(SUM(cr.kwh_consumed), 0)
    INTO v_sum_customer_kwh
    FROM consumption_readings cr
    JOIN customers c ON cr.customer_id = c.customer_id
    WHERE c.transformer_id = p_transformer_id
      AND cr.reading_date >= DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH);
    
    -- Calculate discrepancy
    SET v_diff = v_input_kwh - v_sum_customer_kwh - v_technical_loss;
    
    -- Return validation result
    SELECT 
        p_transformer_id AS transformer_id,
        v_input_kwh AS input_kwh,
        v_sum_customer_kwh AS billed_kwh,
        v_technical_loss AS technical_loss_kwh,
        v_diff AS unexplained_loss_kwh,
        CASE 
            WHEN v_diff > (v_input_kwh * 0.15) THEN 'CRITICAL: >15% unexplained loss'
            WHEN v_diff > (v_input_kwh * 0.10) THEN 'WARNING: >10% unexplained loss'
            WHEN v_diff < 0 THEN 'ERROR: Output exceeds input'
            ELSE 'OK'
        END AS validation_status;
END //

DELIMITER ;
