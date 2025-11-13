# Project KILOS - Dependencies Guide

## 📦 Complete Dependencies Documentation

This document lists all libraries and packages used in the Project KILOS NTL Detection Dashboard. Use this as a reference for setting up the project on new machines.

---

## 🎯 Root Project Dependencies

**Location**: `/package.json`

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `deck.gl` | ^9.0.0 | WebGL-powered framework for visual exploratory data analysis |
| `dotenv` | ^17.2.3 | Environment variable management |
| `mapbox-gl` | ^3.0.0 | Interactive maps for geographic visualization |
| `mysql2` | ^3.15.3 | MySQL database driver for Node.js |
| `prop-types` | ^15.8.1 | Runtime type checking for React props |
| `react` | ^19.2.0 | Core React library for UI components |
| `react-dom` | ^19.2.0 | React rendering for web browsers |
| `react-map-gl` | ^7.1.0 | React wrapper for Mapbox GL JS |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@eslint/js` | ^9.39.1 | ESLint JavaScript language plugin |
| `@types/react` | ^19.2.2 | TypeScript type definitions for React |
| `@types/react-dom` | ^19.2.2 | TypeScript type definitions for React DOM |
| `@vitejs/plugin-react` | ^5.1.0 | Vite plugin for React fast refresh |
| `eslint` | ^9.39.1 | JavaScript linting tool |
| `eslint-plugin-react-hooks` | ^7.0.1 | ESLint rules for React Hooks |
| `eslint-plugin-react-refresh` | ^0.4.24 | ESLint rules for React Fast Refresh |
| `globals` | ^16.5.0 | Global identifiers from different JavaScript environments |
| `vite` | ^7.2.2 | Next-generation frontend build tool |

### Scripts

```bash
npm run dev           # Start Vite dev server (frontend)
npm run build         # Build production bundle
npm run lint          # Run ESLint
npm run preview       # Preview production build
npm run backend:api   # Start Express API server
npm run backend:ml    # Start Python ML service
npm install:all       # Install all dependencies (root + backend)
```

---

## 🔧 Backend API Dependencies

**Location**: `/src/backend/api/package.json`

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^4.18.2 | Fast, minimalist web framework for Node.js |
| `cors` | ^2.8.5 | Enable Cross-Origin Resource Sharing |
| `dotenv` | ^16.3.1 | Load environment variables from .env file |
| `axios` | ^1.6.2 | Promise-based HTTP client |
| `mysql2` | ^3.6.5 | MySQL client for Node.js with Promise support |
| `jsonwebtoken` | ^9.0.2 | JWT implementation for authentication |
| `bcrypt` | ^5.1.1 | Password hashing library |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `nodemon` | ^3.0.2 | Auto-restart Node.js server on file changes |

### Scripts

```bash
npm start    # Start API server
npm run dev  # Start API server with nodemon (auto-reload)
```

---

## 🗄️ Database Setup

### Required Software

- **MySQL**: Version 9.5.0 (installed via Homebrew)
- **Node.js**: Version 24.11.1
- **npm**: Latest version

### MySQL Installation (macOS)

```bash
# Install MySQL via Homebrew
brew install mysql

# Start MySQL service
brew services start mysql

# Create database
mysql -u root -e "CREATE DATABASE project_kilos;"
```

### Database Schema

```bash
# Load schema
mysql -u root project_kilos < src/backend/database/schema.sql

# Generate synthetic data
node src/backend/database/seed_data.js
```

**Data Generated**:
- 35 feeders across Metro Manila
- 2,196 transformers
- 67,238 customers
- 806,856 consumption readings (12 months per customer)

---

## 🐍 Python ML Service (Planned)

**Location**: `/src/backend/ml-service/`

**Note**: ML service is currently in development. Future dependencies will include:

- `flask` - Web framework for Python
- `scikit-learn` - Machine learning library
- `pandas` - Data analysis library
- `numpy` - Numerical computing
- `joblib` - Model serialization

---

## 🚀 Installation Instructions for Team Members

### 1. Clone Repository

```bash
git clone https://github.com/cleruu/MeralcohaxWinnerPOV.git
cd MeralcohaxWinnerPOV
```

### 2. Install MySQL

```bash
# macOS (Homebrew)
brew install mysql
brew services start mysql

# Create database
mysql -u root -e "CREATE DATABASE project_kilos;"
```

### 3. Install Node.js Dependencies

```bash
# Install root dependencies
npm install

# Install backend API dependencies
cd src/backend/api
npm install
cd ../../..
```

**Or use the convenience script**:
```bash
npm run install:all
```

### 4. Set Up Environment Variables

Create `.env` file in project root:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=project_kilos
DB_PORT=3306

# API Configuration
API_PORT=3001
API_URL=http://localhost:3001

# Frontend Configuration
VITE_API_URL=http://localhost:3001
```

### 5. Initialize Database

```bash
# Load schema
mysql -u root project_kilos < src/backend/database/schema.sql

# Generate data (takes ~5-10 minutes)
node src/backend/database/seed_data.js
```

### 6. Start Development Servers

**Terminal 1 - Backend API**:
```bash
npm run backend:api
```

**Terminal 2 - Frontend**:
```bash
npm run dev
```

**Access**:
- Frontend: http://localhost:5173
- API: http://localhost:3001

---

## 📊 Key Dependencies Breakdown

### Frontend Visualization Stack

**React Ecosystem**:
- Core rendering with React 19.2.0
- Modern hooks and state management
- Type-safe props with PropTypes

**Mapping & Geospatial**:
- `mapbox-gl`: Interactive 3D maps
- `react-map-gl`: React integration for Mapbox
- `deck.gl`: WebGL-powered data visualization layers

**Build Tools**:
- `vite`: Lightning-fast HMR and builds
- Modern ES modules support
- Optimized production bundles

### Backend Data Stack

**Database Layer**:
- `mysql2`: Native MySQL driver with Promise/async support
- Connection pooling for performance
- Prepared statements for security

**API Layer**:
- `express`: RESTful API endpoints
- `cors`: Cross-origin support for frontend
- `jsonwebtoken`: JWT authentication (future use)
- `bcrypt`: Secure password hashing (future use)

**Data Generation**:
- Custom seed script with realistic NTL patterns
- Energy balance calculations
- Geographic distribution across Metro Manila

---

## 🔍 Version Compatibility Notes

### Node.js Version

**Current**: v24.11.1

**Why we upgraded from v20.18.1**:
- Vite 7.2.2 requires Node.js >= 22
- Better ES module support
- Performance improvements

### MySQL Version

**Current**: 9.5.0

**Notes**:
- No password for root user (development only)
- InnoDB storage engine for transactions
- UTF8MB4 character set for full Unicode support

### React Version

**Current**: 19.2.0

**Breaking Changes from v18**:
- New concurrent features
- Automatic batching improvements
- Enhanced hooks behavior

---

## 📝 Dependency Update Log

| Date | Package | Old Version | New Version | Reason |
|------|---------|-------------|-------------|--------|
| 2025-11-13 | Node.js | 20.18.1 | 24.11.1 | Vite compatibility |
| 2025-11-13 | mysql2 | - | 3.6.5 | Database connectivity |
| 2025-11-13 | dotenv | - | 17.2.3 | Environment config |

---

## 🆘 Troubleshooting

### Common Issues

**1. MySQL Connection Error**
```bash
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution**: Start MySQL service
```bash
brew services start mysql
```

**2. Port Already in Use**
```bash
Error: listen EADDRINUSE: address already in use :::3001
```
**Solution**: Kill process on port 3001
```bash
lsof -ti:3001 | xargs kill -9
```

**3. Node Version Mismatch**
```bash
The engine "node" is incompatible with this module
```
**Solution**: Update to Node.js 24.x
```bash
nvm install 24
nvm use 24
```

**4. Module Not Found**
```bash
Error: Cannot find module 'mysql2'
```
**Solution**: Reinstall dependencies
```bash
npm install
cd src/backend/api && npm install
```

---

## 📚 Additional Resources

- **React Documentation**: https://react.dev
- **Vite Guide**: https://vite.dev
- **Express.js**: https://expressjs.com
- **MySQL**: https://dev.mysql.com/doc
- **Mapbox GL JS**: https://docs.mapbox.com/mapbox-gl-js
- **Deck.gl**: https://deck.gl

---

**Last Updated**: November 13, 2025
**Project**: KILOS (Kuryente Intelligence for Loss & Operations System)
**Team**: Meralco Hackathon 2024 Winners POV
