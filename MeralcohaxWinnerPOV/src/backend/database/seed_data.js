/**
 * PROJECT KILOS - Synthetic Data Generator
 * Generates realistic Meralco-style NTL data for testing
 * Based on 2024 Integrated Report metrics
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Meralco 2024 Operational Metrics (from screenshots)
const MERALCO_METRICS = {
  // From Financial Highlights
  consolidatedRevenue: 470.4e9, // PhP 470.4B
  energySales: 53606, // 53,606 GWh
  customerAccounts: 8.0e6, // 8.0M customers
  averageRetailRate: 10.54, // PhP 10.54/kWh
  
  // From Operational Highlights
  franchiseElectrificationRate: 0.9997, // 99.97%
  systemLossPercentage: 5.99, // 5.99%
  saidiMinutes: 108.21, // System Average Interruption Duration
  saifiTimes: 1.04, // System Average Interruption Frequency
  customerSavings: 5.1e9, // PhP 5.1B customer savings
  
  // Distribution
  metroManilaPopulation: 14e6,
  coverageAreaKm2: 9337,
  
  // Typical NTL Patterns
  ntlRate: 0.03, // 3% of customers have some NTL behavior
  severeNtlRate: 0.005, // 0.5% are critical cases
};

// Metro Manila Distribution Areas
const METRO_MANILA_AREAS = [
  { area: 'Quezon City', lat: 14.6760, lng: 121.0437, customers: 2800000, risk_factor: 1.2 },
  { area: 'Manila', lat: 14.5995, lng: 120.9842, customers: 1780000, risk_factor: 1.5 },
  { area: 'Caloocan', lat: 14.6588, lng: 120.9833, customers: 1580000, risk_factor: 1.3 },
  { area: 'Pasig', lat: 14.5764, lng: 121.0851, customers: 755000, risk_factor: 1.1 },
  { area: 'Makati', lat: 14.5547, lng: 121.0168, customers: 582000, risk_factor: 0.8 },
  { area: 'Mandaluyong', lat: 14.5794, lng: 121.0359, customers: 386000, risk_factor: 1.0 },
  { area: 'Taguig', lat: 14.5176, lng: 121.0509, customers: 886000, risk_factor: 0.9 },
  { area: 'Parañaque', lat: 14.4793, lng: 121.0198, customers: 665000, risk_factor: 1.1 },
];

// Customer Profiles
const CUSTOMER_TYPES = {
  residential: {
    weight: 0.85, // 85% of customers
    avgConsumption: 250, // kWh/month
    stdDev: 120,
    ntlProbability: 0.03,
  },
  commercial: {
    weight: 0.12,
    avgConsumption: 1500,
    stdDev: 800,
    ntlProbability: 0.05,
  },
  industrial: {
    weight: 0.03,
    avgConsumption: 8000,
    stdDev: 3000,
    ntlProbability: 0.02,
  },
};

// NTL Patterns
const NTL_PATTERNS = {
  meter_tamper: {
    signature: 'gradual_decline',
    consumptionMultiplier: 0.4, // Reports only 40% of actual
    detectionDifficulty: 'medium',
    avgMonthsActive: 8,
  },
  illegal_connection: {
    signature: 'zero_billing',
    consumptionMultiplier: 0.0,
    detectionDifficulty: 'easy',
    avgMonthsActive: 3,
  },
  meter_bypass: {
    signature: 'sudden_drop',
    consumptionMultiplier: 0.3,
    detectionDifficulty: 'hard',
    avgMonthsActive: 12,
  },
  defective_meter: {
    signature: 'erratic',
    consumptionMultiplier: 0.6,
    detectionDifficulty: 'medium',
    avgMonthsActive: 18,
  },
};

/**
 * Generate random value from normal distribution
 */
function normalRandom(mean, stdDev) {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stdDev;
}

/**
 * Generate Feeders (Level 3)
 */
async function generateFeeders(connection) {
  console.log('Generating feeders...');
  
  const feeders = [];
  let feederId = 1;
  
  for (const area of METRO_MANILA_AREAS) {
    // Each area has 3-5 feeders
    const feederCount = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < feederCount; i++) {
      const feeder = {
        feeder_id: `FDR-${String(feederId).padStart(4, '0')}`,
        feeder_name: `${area.area} Feeder ${i + 1}`,
        voltage_level: ['13.2kV', '13.8kV'][Math.floor(Math.random() * 2)],
        substation_id: `SUB-${area.area.substring(0, 3).toUpperCase()}-${i + 1}`,
        area: area.area,
        installed_capacity_mva: normalRandom(25, 5),
        peak_load_mw: normalRandom(18, 4),
        // Meralco targets 5.99% system loss
        system_loss_percentage: normalRandom(5.99, 1.2),
        technical_loss_percentage: normalRandom(3.5, 0.8),
        non_technical_loss_percentage: normalRandom(2.49, 0.8),
        saidi_minutes: normalRandom(108.21, 30),
        saifi_times: normalRandom(1.04, 0.3),
        monthly_energy_purchased_kwh: normalRandom(15000000, 3000000),
        monthly_energy_billed_kwh: normalRandom(14000000, 2800000),
        revenue_loss_php: normalRandom(500000, 200000),
      };
      
      feeders.push(feeder);
      feederId++;
    }
  }
  
  // Insert feeders
  for (const feeder of feeders) {
    await connection.execute(`
      INSERT INTO feeders 
      (feeder_id, feeder_name, voltage_level, substation_id, area, 
       installed_capacity_mva, peak_load_mw, system_loss_percentage, 
       technical_loss_percentage, non_technical_loss_percentage,
       saidi_minutes, saifi_times, monthly_energy_purchased_kwh, 
       monthly_energy_billed_kwh, revenue_loss_php)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      feeder.feeder_id, feeder.feeder_name, feeder.voltage_level, feeder.substation_id,
      feeder.area, feeder.installed_capacity_mva, feeder.peak_load_mw,
      feeder.system_loss_percentage, feeder.technical_loss_percentage,
      feeder.non_technical_loss_percentage, feeder.saidi_minutes, feeder.saifi_times,
      feeder.monthly_energy_purchased_kwh, feeder.monthly_energy_billed_kwh,
      feeder.revenue_loss_php
    ]);
  }
  
  console.log(`✓ Generated ${feeders.length} feeders`);
  return feeders;
}

/**
 * Generate Transformers (Level 2)
 */
async function generateTransformers(connection, feeders) {
  console.log('Generating transformers...');
  
  const transformers = [];
  let transformerId = 1;
  
  for (const feeder of feeders) {
    // Each feeder has 50-80 transformers
    const transformerCount = Math.floor(Math.random() * 31) + 50;
    
    const area = METRO_MANILA_AREAS.find(a => a.area === feeder.area);
    
    for (let i = 0; i < transformerCount; i++) {
      // Random location near feeder area
      const lat = area.lat + (Math.random() - 0.5) * 0.05;
      const lng = area.lng + (Math.random() - 0.5) * 0.05;
      
      const capacityKva = [50, 75, 100, 167, 250][Math.floor(Math.random() * 5)];
      
      // Customers per transformer: More realistic for dense Metro Manila
      // Smaller transformers (50-75 kVA): 15-25 residential customers
      // Medium transformers (100-167 kVA): 25-40 customers
      // Large transformers (250 kVA): 40-60 customers
      let customersPerTransformer;
      if (capacityKva <= 75) {
        customersPerTransformer = Math.floor(Math.random() * 11) + 15; // 15-25
      } else if (capacityKva <= 167) {
        customersPerTransformer = Math.floor(Math.random() * 16) + 25; // 25-40
      } else {
        customersPerTransformer = Math.floor(Math.random() * 21) + 40; // 40-60
      }
      
      const inputKwh = Math.max(1000, Math.round(normalRandom(capacityKva * 0.6 * 730, capacityKva * 0.2 * 730)));
      const technicalLoss = Math.round(inputKwh * 0.02); // 2% technical loss
      const ntlLoss = Math.round(inputKwh * (Math.random() * 0.10)); // 0-10% NTL
      const outputKwh = inputKwh - technicalLoss - ntlLoss; // Exact balance
      const lossPercentage = ((technicalLoss + ntlLoss) / inputKwh) * 100;
      
      // Risk assessment
      let riskLevel, riskScore;
      if (lossPercentage > 15) {
        riskLevel = 'critical';
        riskScore = 80 + Math.random() * 20;
      } else if (lossPercentage > 10) {
        riskLevel = 'high';
        riskScore = 60 + Math.random() * 20;
      } else if (lossPercentage > 7) {
        riskLevel = 'medium';
        riskScore = 40 + Math.random() * 20;
      } else {
        riskLevel = 'low';
        riskScore = Math.random() * 40;
      }
      
      const transformer = {
        transformer_id: `TRF-${String(transformerId).padStart(6, '0')}`,
        feeder_id: feeder.feeder_id,
        transformer_name: `${feeder.area} TX-${i + 1}`,
        location_lat: lat,
        location_lng: lng,
        address: `${feeder.area}, Metro Manila`,
        capacity_kva: capacityKva,
        voltage_primary: '13.2kV',
        voltage_secondary: '230V',
        installation_date: new Date(2010 + Math.floor(Math.random() * 14), Math.floor(Math.random() * 12), 1),
        total_connected_customers: customersPerTransformer,
        monthly_input_kwh: inputKwh,
        monthly_output_kwh: outputKwh,
        technical_loss_kwh: technicalLoss,
        non_technical_loss_kwh: ntlLoss,
        loss_percentage: lossPercentage,
        risk_score: riskScore,
        risk_level: riskLevel,
        anomaly_count: Math.floor(Math.random() * 5),
        last_inspection_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      };
      
      transformers.push(transformer);
      transformerId++;
    }
  }
  
  // Insert transformers
  for (const tx of transformers) {
    try {
      // Validate energy balance before insert
      if (tx.monthly_output_kwh > tx.monthly_input_kwh) {
        console.error('❌ Energy balance violation detected:');
        console.error(`   Input: ${tx.monthly_input_kwh}, Output: ${tx.monthly_output_kwh}`);
        console.error(`   Tech Loss: ${tx.technical_loss_kwh}, NTL Loss: ${tx.non_technical_loss_kwh}`);
        throw new Error('Output cannot exceed Input');
      }
      
      await connection.execute(`
        INSERT INTO transformers 
        (transformer_id, feeder_id, transformer_name, location_lat, location_lng, address,
         capacity_kva, voltage_primary, voltage_secondary, installation_date,
         total_connected_customers, monthly_input_kwh, monthly_output_kwh,
         technical_loss_kwh, non_technical_loss_kwh, loss_percentage,
         risk_score, risk_level, anomaly_count, last_inspection_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        tx.transformer_id, tx.feeder_id, tx.transformer_name, tx.location_lat, tx.location_lng,
        tx.address, tx.capacity_kva, tx.voltage_primary, tx.voltage_secondary, tx.installation_date,
        tx.total_connected_customers, tx.monthly_input_kwh, tx.monthly_output_kwh,
        tx.technical_loss_kwh, tx.non_technical_loss_kwh, tx.loss_percentage,
        tx.risk_score, tx.risk_level, tx.anomaly_count, tx.last_inspection_date
      ]);
    } catch (error) {
      console.error(`Failed to insert transformer ${tx.transformer_id}:`, error.message);
      throw error;
    }
  }
  
  console.log(`✓ Generated ${transformers.length} transformers`);
  return transformers;
}

/**
 * Generate Customers (Level 1)
 */
async function generateCustomers(connection, transformers) {
  console.log('Generating customers...');
  
  let customerCount = 0;
  const allCustomers = [];
  
  for (const transformer of transformers) {
    const numCustomers = transformer.total_connected_customers;
    
    for (let i = 0; i < numCustomers; i++) {
      customerCount++;
      
      // Select customer type based on weights
      const rand = Math.random();
      let customerType;
      if (rand < 0.85) customerType = 'residential';
      else if (rand < 0.97) customerType = 'commercial';
      else customerType = 'industrial';
      
      const profile = CUSTOMER_TYPES[customerType];
      
      // Determine if this customer has NTL behavior
      const hasNtl = Math.random() < (profile.ntlProbability * transformer.risk_score / 50);
      
      let riskScore, riskLevel, ntlConfidence;
      if (hasNtl) {
        riskScore = 60 + Math.random() * 40;
        riskLevel = riskScore > 80 ? 'critical' : 'high';
        ntlConfidence = 70 + Math.random() * 30;
      } else {
        riskScore = Math.random() * 40;
        riskLevel = riskScore > 30 ? 'medium' : 'low';
        ntlConfidence = riskScore;
      }
      
      // Random location near transformer
      const lat = transformer.location_lat + (Math.random() - 0.5) * 0.002;
      const lng = transformer.location_lng + (Math.random() - 0.5) * 0.002;
      
      const customer = {
        customer_id: `CUST-${String(customerCount).padStart(8, '0')}`,
        account_number: `MER-${String(customerCount).padStart(10, '0')}`,
        transformer_id: transformer.transformer_id,
        customer_name: `Customer ${customerCount}`,
        customer_type: customerType,
        address: transformer.address,
        location_lat: lat,
        location_lng: lng,
        meter_number: `MTR-${String(customerCount).padStart(10, '0')}`,
        meter_type: Math.random() > 0.7 ? 'smart' : (Math.random() > 0.5 ? 'digital' : 'analog'),
        connection_type: Math.random() > 0.3 ? 'overhead' : 'underground',
        service_voltage: '230V',
        contracted_load_kw: profile.avgConsumption / 100,
        installation_date: new Date(2000 + Math.floor(Math.random() * 24), Math.floor(Math.random() * 12), 1),
        risk_score: riskScore,
        risk_level: riskLevel,
        ntl_confidence: ntlConfidence,
        is_active: true,
        is_flagged: hasNtl && Math.random() > 0.5,
        has_meter_tamper: hasNtl && Math.random() > 0.7,
        has_billing_anomaly: hasNtl && Math.random() > 0.6,
        has_consumption_anomaly: hasNtl,
        last_inspection_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      };
      
      await connection.execute(`
        INSERT INTO customers 
        (customer_id, account_number, transformer_id, customer_name, customer_type, address,
         location_lat, location_lng, meter_number, meter_type, connection_type, service_voltage,
         contracted_load_kw, installation_date, risk_score, risk_level, ntl_confidence,
         is_active, is_flagged, has_meter_tamper, has_billing_anomaly, has_consumption_anomaly,
         last_inspection_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        customer.customer_id, customer.account_number, customer.transformer_id, customer.customer_name,
        customer.customer_type, customer.address, customer.location_lat, customer.location_lng,
        customer.meter_number, customer.meter_type, customer.connection_type, customer.service_voltage,
        customer.contracted_load_kw, customer.installation_date, customer.risk_score, customer.risk_level,
        customer.ntl_confidence, customer.is_active, customer.is_flagged, customer.has_meter_tamper,
        customer.has_billing_anomaly, customer.has_consumption_anomaly, customer.last_inspection_date
      ]);
      
      allCustomers.push(customer);
    }
  }
  
  console.log(`✓ Generated ${customerCount} customers`);
  return allCustomers;
}

/**
 * Generate consumption readings (12 months of billing data per customer)
 */
async function generateConsumptionReadings(connection, customers) {
  console.log('Generating consumption readings...');
  
  const batchSize = 1000;
  const meralcoRate = 10.54; // ₱ per kWh
  const monthsOfHistory = 12;
  let totalReadings = 0;
  
  for (let i = 0; i < customers.length; i += batchSize) {
    const batch = customers.slice(i, i + batchSize);
    
    for (const customer of batch) {
      const readings = [];
      
      // Determine base consumption based on customer type and risk level
      let baseKwh;
      if (customer.customer_type === 'residential') {
        baseKwh = 150 + Math.random() * 200; // 150-350 kWh/month
      } else if (customer.customer_type === 'commercial') {
        baseKwh = 500 + Math.random() * 1000; // 500-1500 kWh/month
      } else {
        baseKwh = 2000 + Math.random() * 3000; // 2000-5000 kWh/month (industrial)
      }
      
      // Apply NTL patterns for high-risk customers
      let consumptionMultiplier = 1.0;
      if (customer.risk_level === 'critical' || customer.risk_level === 'high') {
        // High-risk customers show declining consumption or suspiciously low usage
        consumptionMultiplier = 0.3 + Math.random() * 0.4; // 30-70% of normal
      }
      
      // Generate 12 months of readings
      for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
        const readingDate = new Date();
        readingDate.setMonth(readingDate.getMonth() - monthsAgo);
        readingDate.setDate(1); // First of the month
        
        // Add some variation month-to-month (±15%)
        const variation = 0.85 + Math.random() * 0.3;
        let kwhConsumed = baseKwh * consumptionMultiplier * variation;
        
        // For tampering cases, show sudden drops in recent months
        if (customer.has_meter_tamper && monthsAgo < 3) {
          kwhConsumed *= 0.5; // Recent sharp drop
        }
        
        // For consumption anomalies, show erratic patterns
        if (customer.has_consumption_anomaly) {
          if (Math.random() < 0.3) {
            kwhConsumed *= (Math.random() < 0.5 ? 0.3 : 2.5); // Extreme highs/lows
          }
        }
        
        kwhConsumed = Math.max(10, Math.round(kwhConsumed)); // Minimum 10 kWh
        const billingAmount = parseFloat((kwhConsumed * meralcoRate).toFixed(2));
        
        readings.push([
          customer.customer_id,
          readingDate.toISOString().split('T')[0],
          kwhConsumed,
          billingAmount
        ]);
      }
      
      // Insert all readings for this customer
      if (readings.length > 0) {
        const placeholders = readings.map(() => '(?, ?, ?, ?)').join(', ');
        const values = readings.flat();
        
        await connection.execute(
          `INSERT INTO consumption_readings 
           (customer_id, reading_date, kwh_consumed, billing_amount_php) 
           VALUES ${placeholders}`,
          values
        );
        
        totalReadings += readings.length;
      }
    }
    
    // Progress indicator
    const processed = Math.min(i + batchSize, customers.length);
    const percent = ((processed / customers.length) * 100).toFixed(1);
    process.stdout.write(`\r  Progress: ${processed}/${customers.length} customers (${percent}%) - ${totalReadings} readings`);
  }
  
  console.log(`\n✓ Generated ${totalReadings} consumption readings`);
}

/**
 * Main execution
 */
async function generateAllData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'project_kilos'
  });
  
  try {
    console.log('🚀 Starting synthetic data generation...\n');
    
    // Clear existing data (in reverse order to respect foreign keys)
    console.log('Clearing existing data...');
    await connection.execute('DELETE FROM consumption_readings');
    await connection.execute('DELETE FROM inspections');
    await connection.execute('DELETE FROM customers');
    await connection.execute('DELETE FROM transformers');
    await connection.execute('DELETE FROM feeders');
    console.log('✓ Cleared existing data\n');
    
    // Generate in hierarchical order
    const feeders = await generateFeeders(connection);
    const transformers = await generateTransformers(connection, feeders);
    const customers = await generateCustomers(connection, transformers);
    await generateConsumptionReadings(connection, customers);
    
    console.log('\n✅ Data generation complete!');
    console.log(`   Feeders: ${feeders.length}`);
    console.log(`   Transformers: ${transformers.length}`);
    console.log(`   Customers: ${customers.length}`);
    console.log(`   Run validation query to check data integrity.\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

// Run if executed directly (ES module syntax)
generateAllData();

export { generateAllData, MERALCO_METRICS };
