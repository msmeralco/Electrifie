# KILOS - Setup Guide

## Quick Start

### 1. Install Backend Dependencies
```bash
# API Gateway (Node.js)
cd src/backend/api
npm install

# ML Service (Python)
cd ../ml-service
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies
```bash
cd ../../..
npm install
```

### 3. Run the System

Open 3 terminals:

**Terminal 1 - ML Service:**
```bash
cd src/backend/ml-service
python app.py
```

**Terminal 2 - API Gateway:**
```bash
cd src/backend/api
npm start
```

**Terminal 3 - Frontend:**
```bash
npm run dev
```

### 4. Access Dashboard
Open browser: `http://localhost:5173`

---

## Project Structure

```
MeralcohaxWinnerPOV/
├── src/
│   ├── frontend/          # React app
│   │   ├── Dashboard.jsx
│   │   └── components/
│   │       ├── HotlistTable.jsx
│   │       ├── StatsCards.jsx
│   │       └── Header.jsx
│   │
│   └── backend/
│       ├── api/           # Node.js/Express
│       │   └── server.js
│       │
│       └── ml-service/    # Python/FastAPI
│           ├── app.py
│           ├── model/
│           │   ├── ntl_detector.py
│           │   └── feature_engineering.py
│           └── utils/
│
├── public/
├── package.json
└── README.md
```

---

## Environment Variables

Create `src/backend/api/.env`:
```env
PORT=3001
ML_SERVICE_URL=http://localhost:8000
```

---

## Troubleshooting

**ML Service won't start:**
```bash
# Ensure Python 3.9+ is installed
python --version

# Install dependencies again
pip install -r src/backend/ml-service/requirements.txt
```

**API Gateway errors:**
```bash
# Ensure Node.js 18+ is installed
node --version

# Reinstall dependencies
cd src/backend/api
rm -rf node_modules
npm install
```

**Frontend build issues:**
```bash
# Clear cache
rm -rf node_modules .vite
npm install
npm run dev
```
