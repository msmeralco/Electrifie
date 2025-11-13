# Backend Setup Guide

## Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ installed
- MySQL 8.0+ installed and running
- npm or yarn

### Step 1: Install Dependencies
```bash
cd MeralcohaxWinnerPOV
npm install
```

### Step 2: Setup Database (Automated)
```bash
# Make setup script executable (macOS/Linux)
chmod +x scripts/setup-database.sh

# Run setup script
./scripts/setup-database.sh
```

The script will:
- ✅ Check MySQL installation
- ✅ Create `project_kilos` database
- ✅ Run schema.sql (create tables)
- ✅ Generate synthetic data (optional)

### Step 3: Configure Environment
```bash
# Copy environment template
cp src/backend/api/.env.example src/backend/api/.env

# Edit if needed (default works for local MySQL)
# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=project_kilos
# DB_USER=root
# DB_PASSWORD=
```

### Step 4: Start Backend
```bash
# Terminal 1: API Server
npm run backend:api

# Terminal 2: Frontend
npm run dev
```

---

## Manual Setup (If Script Fails)

### 1. Create Database
```bash
mysql -u root -p
```

```sql
CREATE DATABASE project_kilos;
USE project_kilos;
SOURCE src/backend/database/schema.sql;
EXIT;
```

### 2. Generate Data
```bash
node src/backend/database/seed_data.js
```

### 3. Verify Setup
```bash
mysql -u root -p project_kilos
```

```sql
-- Check tables
SHOW TABLES;

-- Count records
SELECT COUNT(*) FROM feeders;
SELECT COUNT(*) FROM transformers;
SELECT COUNT(*) FROM customers;

-- View hotlist
SELECT * FROM v_hotlist LIMIT 10;
```

---

## Database Structure

### Tables Created
1. **feeders** - Level 3 (Grid/Feeder level)
2. **transformers** - Level 2 (Transformer clusters)
3. **customers** - Level 1 (Individual customers)
4. **consumption_readings** - Time series data
5. **inspections** - Field inspection results
6. **validation_rules** - Data integrity checks

### Views
- **v_hotlist** - Top NTL suspects
- **v_transformer_performance** - Transformer metrics

### Stored Procedures
- **sp_validate_energy_balance** - Energy balance validation

---

## API Endpoints

Once running, test with:

```bash
# Health check
curl http://localhost:3001/api/health

# Get hotlist
curl http://localhost:3001/api/hotlist?limit=10

# Dashboard stats
curl http://localhost:3001/api/stats

# Map markers
curl http://localhost:3001/api/map/markers?risk_level=high

# Customer details
curl http://localhost:3001/api/customers/CUST-000001
```

---

## Troubleshooting

### MySQL Connection Failed
```bash
# Check MySQL is running
pgrep mysqld

# Start MySQL (macOS)
brew services start mysql

# Start MySQL (Linux)
sudo systemctl start mysql
```

### "Database not connected" in API
Check `.env` file has correct credentials:
```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=project_kilos
```

### No data in database
```bash
# Re-run seed script
node src/backend/database/seed_data.js
```

### Port 3001 already in use
```bash
# Change port in .env
PORT=3002
```

---

## Data Statistics (After Seeding)

Expected records:
- **24 Feeders** (8 Metro Manila areas × 3-5 feeders)
- **~1,500 Transformers** (50-80 per feeder)
- **~30,000 Customers** (15-60 per transformer)

Total data:
- ~30,000 customer records
- ~360,000 consumption readings (12 months × customers)
- ~100 inspection results

---

## Database Credentials (Development)

**Default (no password)**:
```
Host: localhost
Port: 3306
Database: project_kilos
Username: root
Password: (empty)
```

**Change in .env for production!**

---

## Next Steps

After backend is running:

1. ✅ Test API endpoints
2. ✅ Start frontend (`npm run dev`)
3. ✅ Navigate to Map View in dashboard
4. ✅ See real data from database!
5. ✅ Train ML model with real features

---

## Architecture Validation

This database implements:
- ✅ Three-level NTL detection hierarchy
- ✅ Energy balance validation (physics-based)
- ✅ Meralco 2024 actual metrics
- ✅ Production-ready schema
- ✅ ML-ready features
- ✅ Validated by industry professional

See `docs/DATABASE_ARCHITECTURE_JUSTIFICATION.md` for full details.
