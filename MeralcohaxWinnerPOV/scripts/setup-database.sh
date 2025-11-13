#!/bin/bash

# PROJECT KILOS - Database Setup Script
# Automates MySQL database creation and initialization

echo "╔════════════════════════════════════════════╗"
echo "║  PROJECT KILOS - Database Setup            ║"
echo "║  Non-Technical Loss Detection System       ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database configuration
DB_NAME="project_kilos"
DB_USER=${DB_USER:-"root"}
DB_PASSWORD=${DB_PASSWORD:-""}
SCHEMA_FILE="src/backend/database/schema.sql"
SEED_FILE="src/backend/database/seed_data.js"

# Check if MySQL is installed
echo "🔍 Checking MySQL installation..."
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}✗ MySQL not found${NC}"
    echo ""
    echo "Please install MySQL:"
    echo "  macOS:   brew install mysql"
    echo "  Ubuntu:  sudo apt-get install mysql-server"
    echo "  Windows: Download from https://dev.mysql.com/downloads/installer/"
    exit 1
fi
echo -e "${GREEN}✓ MySQL found${NC}"

# Check if MySQL is running
echo "🔍 Checking MySQL service..."
if ! pgrep -x "mysqld" > /dev/null; then
    echo -e "${YELLOW}⚠ MySQL service not running${NC}"
    echo "Starting MySQL..."
    
    # Try to start MySQL (macOS with Homebrew)
    if command -v brew &> /dev/null; then
        brew services start mysql
    else
        echo "Please start MySQL manually:"
        echo "  macOS:   brew services start mysql"
        echo "  Linux:   sudo systemctl start mysql"
        echo "  Windows: net start MySQL"
    fi
    
    sleep 3
fi
echo -e "${GREEN}✓ MySQL service running${NC}"

# Prompt for password if not set
if [ -z "$DB_PASSWORD" ]; then
    echo ""
    read -sp "Enter MySQL root password (press Enter if none): " DB_PASSWORD
    echo ""
fi

# Test connection
echo "🔍 Testing database connection..."
MYSQL_CMD="mysql -u $DB_USER"
if [ -n "$DB_PASSWORD" ]; then
    MYSQL_CMD="mysql -u $DB_USER -p$DB_PASSWORD"
fi

if ! $MYSQL_CMD -e "SELECT 1;" &> /dev/null; then
    echo -e "${RED}✗ Failed to connect to MySQL${NC}"
    echo "Please check your credentials and try again."
    exit 1
fi
echo -e "${GREEN}✓ Connection successful${NC}"

# Create database
echo "🔨 Creating database '$DB_NAME'..."
$MYSQL_CMD -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database created${NC}"
else
    echo -e "${RED}✗ Failed to create database${NC}"
    exit 1
fi

# Run schema
echo "🔨 Running schema.sql..."
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}✗ Schema file not found: $SCHEMA_FILE${NC}"
    exit 1
fi

$MYSQL_CMD $DB_NAME < "$SCHEMA_FILE" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Schema created${NC}"
else
    echo -e "${RED}✗ Failed to run schema${NC}"
    exit 1
fi

# Count tables
TABLE_COUNT=$($MYSQL_CMD -N -e "USE $DB_NAME; SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';")
echo -e "${GREEN}✓ Created $TABLE_COUNT tables${NC}"

# Ask if user wants to seed data
echo ""
read -p "Do you want to generate synthetic data? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Generating synthetic data..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        echo -e "${RED}✗ Node.js not found${NC}"
        echo "Please install Node.js to generate synthetic data."
        exit 1
    fi
    
    # Check if seed file exists
    if [ ! -f "$SEED_FILE" ]; then
        echo -e "${RED}✗ Seed file not found: $SEED_FILE${NC}"
        exit 1
    fi
    
    # Set environment variables for seed script
    export DB_HOST="localhost"
    export DB_PORT="3306"
    export DB_USER="$DB_USER"
    export DB_PASSWORD="$DB_PASSWORD"
    export DB_NAME="$DB_NAME"
    
    # Run seed script
    node "$SEED_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Data seeded successfully${NC}"
        
        # Show counts
        echo ""
        echo "📊 Database Statistics:"
        FEEDER_COUNT=$($MYSQL_CMD -N -e "USE $DB_NAME; SELECT COUNT(*) FROM feeders;")
        TRANSFORMER_COUNT=$($MYSQL_CMD -N -e "USE $DB_NAME; SELECT COUNT(*) FROM transformers;")
        CUSTOMER_COUNT=$($MYSQL_CMD -N -e "USE $DB_NAME; SELECT COUNT(*) FROM customers;")
        
        echo "  - Feeders: $FEEDER_COUNT"
        echo "  - Transformers: $TRANSFORMER_COUNT"
        echo "  - Customers: $CUSTOMER_COUNT"
    else
        echo -e "${RED}✗ Failed to seed data${NC}"
    fi
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ Database Setup Complete!               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env in src/backend/api/"
echo "  2. Update database credentials in .env if needed"
echo "  3. Start the API server: npm run backend:api"
echo "  4. Start the frontend: npm run dev"
echo ""
echo "Database connection string:"
echo "  mysql://$DB_USER@localhost:3306/$DB_NAME"
echo ""
