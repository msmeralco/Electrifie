# PROJECT KILOS - Database Architecture

## Three-Level NTL Detection System (Meralco-Aligned)

Based on Meralco's 2024 Integrated Report and operational structure.

---

## 📊 Data Hierarchy

```
LEVEL 3: GRID/FEEDER LEVEL (System-Wide)
   ↓
LEVEL 2: TRANSFORMER LEVEL (Aggregated - 15-60 customers each)
   ↓
LEVEL 1: CUSTOMER LEVEL (Granular - Individual meters)
```

---

## 🏗️ Database Schema

### Level 3: Feeders (Distribution Feeders)
**Purpose**: Monitor system-wide performance and losses

**Key Metrics** (from Meralco 2024 Report):
- System Loss: **5.99%** (target)
- SAIDI: **108.21 minutes** (reliability index)
- SAIFI: **1.04 times** (interruption frequency)
- Energy Sales: **53,606 GWh**
- Customer Accounts: **8.0 Million**

**Validation Rules**:
✅ System loss must be < 6.5% (regulatory cap)
✅ Energy purchased ≥ Energy billed
✅ SAIDI within acceptable range (< 120 min)

---

### Level 2: Transformers
**Purpose**: Detect theft clusters and transformer-level anomalies

**Metrics**:
- Capacity: 50-250 kVA (typical distribution)
- Connected Customers: 
  - **50-75 kVA**: 15-25 customers (residential, dense Metro Manila)
  - **100-167 kVA**: 25-40 customers (mixed residential/commercial)
  - **250 kVA**: 40-60 customers (high-density urban areas)
- Technical Loss: ~2% (normal)
- NTL Loss: 0-15% (abnormal >10%)

**Cross-Checking Formula**:
```
Input Energy (kWh) = Output Energy + Technical Loss + NTL Loss

Validation:
IF (Input - Output - TechnicalLoss) > 15% of Input
THEN Flag as "High NTL Cluster"
```

**Manager's Verification Process**:
1. Check transformer meter readings (Input)
2. Sum all customer bills (Output)
3. Calculate expected technical loss (~2%)
4. Unexplained gap = Suspected NTL

---

### Level 1: Customers
**Purpose**: Individual NTL detection and inspection targeting

**Risk Factors**:
- Consumption patterns (spike/drop/zero)
- Billing anomalies
- Historical inspection results
- Meter type (analog more vulnerable)
- Connection type (overhead easier to tamper)

**ML Risk Score** (0-100):
- **0-30**: Low risk (normal consumption)
- **30-60**: Medium risk (minor anomalies)
- **60-80**: High risk (significant anomalies)
- **80-100**: Critical (inspection required)

---

## ✅ Data Validation & Cross-Checking

### How Meralco Managers Verify Data Integrity

#### 1. **Energy Balance Check** (Most Important!)

```sql
-- For each transformer
Input Energy = Σ Customer Consumption + Technical Loss + NTL Loss

Example:
Transformer TRF-000123
- Input: 50,000 kWh/month
- Customer Total: 45,000 kWh/month
- Technical Loss: 1,000 kWh (2%)
- Unexplained: 4,000 kWh (8%) ← SUSPICIOUS!
```

**Rule**: If unexplained loss > 10%, flag transformer for inspection.

#### 2. **Consumption Pattern Analysis**

```sql
-- Red Flags:
1. Zero consumption for 3+ months (but property occupied)
2. Sudden 80% drop in consumption (meter tamper)
3. Consumption spike >500% (meter error or reversal)
4. Negative consumption (meter running backwards)
```

#### 3. **Transformer Load vs. Capacity**

```sql
-- Sanity Check:
IF Monthly Output > (Capacity_kVA × 0.8 × 730 hours)
THEN "Transformer Overload - Data Error or Illegal Load"

Example:
100 kVA transformer
Max monthly output = 100 × 0.8 × 730 = 58,400 kWh
If reported output = 65,000 kWh → IMPOSSIBLE!
```

#### 4. **Feeder-Level Reconciliation**

```sql
-- Every month, check:
Energy Purchased from Grid = Σ All Transformer Inputs
Σ All Customer Bills ≈ Energy Purchased × (1 - System Loss %)

Meralco Target: 5.99% system loss
IF Actual > 6.5% → Investigation needed
```

#### 5. **Historical Comparison**

```sql
-- For each customer:
Current Month vs. 3-Month Average
Current Month vs. Same Month Last Year

IF Deviation > ±50% without valid reason
THEN Flag for inspection
```

---

## 🎯 Synthetic Data Generation

### Realistic Meralco Patterns

Based on 2024 Report:
- **470.4B PhP** consolidated revenue
- **10.54 PhP/kWh** average rate
- **99.97%** electrification rate
- **8.0M** customer accounts

### Customer Distribution:
- **85%** Residential (avg 250 kWh/month)
- **12%** Commercial (avg 1,500 kWh/month)
- **3%** Industrial (avg 8,000 kWh/month)

### NTL Patterns:
1. **Meter Tamper** (40% reporting)
   - Gradual decline in consumption
   - Detection: Medium difficulty
   
2. **Illegal Connection** (0% reporting)
   - Zero billing but property occupied
   - Detection: Easy (field inspection)
   
3. **Meter Bypass** (30% reporting)
   - Sudden drop in consumption
   - Detection: Hard (visual inspection needed)
   
4. **Defective Meter** (60% reporting)
   - Erratic readings
   - Detection: Medium (replacement needed)

---

## 🔍 Validation Queries

### Check Energy Balance for All Transformers
```sql
CALL sp_validate_energy_balance('TRF-000001');
```

### Find High-Loss Transformers
```sql
SELECT transformer_id, loss_percentage, risk_level
FROM transformers
WHERE loss_percentage > 10
ORDER BY loss_percentage DESC;
```

### Top NTL Suspects
```sql
SELECT * FROM v_hotlist LIMIT 100;
```

### System-Wide Loss Report
```sql
SELECT 
    feeder_name,
    system_loss_percentage,
    non_technical_loss_percentage,
    revenue_loss_php
FROM feeders
WHERE system_loss_percentage > 6.0
ORDER BY system_loss_percentage DESC;
```

---

## 🚀 Usage

### 1. Initialize Database
```bash
mysql -u root -p < src/backend/database/schema.sql
```

### 2. Generate Synthetic Data
```bash
node src/backend/database/seed_data.js
```

### 3. Validate Data Integrity
```sql
-- Run all validation rules
SELECT * FROM validation_rules WHERE is_active = TRUE;

-- Check for critical violations
SELECT customer_id FROM consumption_readings WHERE kwh_consumed < 0;
SELECT transformer_id FROM transformers WHERE loss_percentage > 15;
```

---

## 📈 For ML Training

### Features per Customer:
- 12-month consumption history
- Consumption statistics (mean, std, trend)
- Billing amount history
- Anomaly flags (spike, drop, zero)
- Transformer-level context (loss %, risk score)
- Geographic features (area, location)
- Meter characteristics (type, age)

### Labels:
- **Risk Score** (0-100, regression)
- **NTL Probability** (0-1, classification)
- **Inspection Result** (clean/violation, classification)

### Data Quality Checks Before Training:
1. ✅ No negative consumption
2. ✅ No energy balance violations
3. ✅ Realistic transformer loads
4. ✅ Consistent geographic distribution
5. ✅ Proper temporal patterns (monthly/seasonal)

---

## 🎓 Key Insights for Demo

### What Makes This "Meralco-Grade"?

1. **Three-Level Architecture** matches real utility structure
2. **Energy Balance Validation** ensures data consistency
3. **Realistic Metrics** based on 2024 annual report
4. **Cross-Checking Rules** mirror actual manager workflows
5. **Synthetic Data** follows real consumption patterns

### Manager's Daily Workflow:

```
Morning:
1. Check hotlist (v_hotlist view)
2. Review high-loss transformers
3. Validate yesterday's inspection results

Afternoon:
4. Dispatch inspectors to top suspects
5. Monitor real-time transformer loads
6. Update risk scores based on new data

Evening:
7. Generate daily loss report
8. Update system dashboards
9. Plan tomorrow's inspections
```

---

## 📝 Notes

- All monetary values in **Philippine Pesos (PhP)**
- Energy in **kWh** (kilowatt-hours)
- Power in **kW/kVA/MW/MVA**
- Average retail rate: **10.54 PhP/kWh** (2024)
- System loss target: **5.99%** (below regulatory cap of 6.5%)

---

## 🔗 References

1. Meralco 2024 Integrated Report
2. Energy Regulatory Commission (ERC) Guidelines
3. Distribution System Loss Standards
4. SAIDI/SAIFI Reliability Metrics
