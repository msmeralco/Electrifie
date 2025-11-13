# Project KILOS - System Requirements

## Verified Environment

✅ **Node.js**: v24.11.1  
✅ **npm**: v11.6.2  
✅ **nvm**: 0.40.1  
✅ **Python**: 3.9+ (required for ML service)  

---

## Installation Steps

### 1. Install Frontend & Root Dependencies
```bash
cd /Users/robbieespaldon/Code/nodetest/MeralcohaxWinnerPOV/MeralcohaxWinnerPOV
npm install
```

### 2. Install API Gateway Dependencies
```bash
cd src/backend/api
npm install
cd ../../..
```

### 3. Install ML Service Dependencies (Python)
```bash
cd src/backend/ml-service
pip install -r requirements.txt
cd ../../..
```

---

## Running the System

### Option 1: Run All Services Separately

**Terminal 1 - API Gateway (Node.js):**
```bash
cd src/backend/api
npm start
# Runs on http://localhost:3001
```

**Terminal 2 - Frontend (React + Vite):**
```bash
npm run dev
# Runs on http://localhost:5173
```

**Terminal 3 - ML Service (Python/FastAPI) - Optional:**
```bash
cd src/backend/ml-service
python app.py
# Runs on http://localhost:8000
# Note: Currently using demo data, ML service not required for basic demo
```

### Option 2: Quick Demo (API + Frontend Only)

Since the API is using sample data for demo purposes, you can run just:

**Terminal 1:**
```bash
cd src/backend/api
npm start
```

**Terminal 2:**
```bash
npm run dev
```

Then open: `http://localhost:5173`

---

## Project Structure

```
MeralcohaxWinnerPOV/
├── src/
│   ├── frontend/               # React dashboard (Vite)
│   │   ├── Dashboard.jsx
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── HotlistTable.jsx
│   │   │   ├── StatsCards.jsx
│   │   │   └── Header.jsx
│   │   └── ...
│   │
│   └── backend/
│       ├── api/                # Node.js/Express API (Port 3001)
│       │   ├── server.js
│       │   └── package.json
│       │
│       └── ml-service/         # Python/FastAPI ML engine (Port 8000)
│           ├── app.py
│           ├── model/
│           │   ├── ntl_detector.py
│           │   └── feature_engineering.py
│           └── requirements.txt
│
├── package.json                # Frontend build config
├── vite.config.js              # Vite config (proxies /api to :3001)
└── README.md
```

---

## Tech Stack

### Frontend
- **React 19** - UI library
- **Vite 7** - Build tool & dev server
- **CSS3** - Styling (no framework, custom CSS)

### Backend - API Gateway
- **Node.js v24.11.1** - Runtime
- **Express 4** - Web framework
- **Axios** - HTTP client
- **CORS** - Cross-origin support

### Backend - ML Service
- **Python 3.9+** - Runtime
- **FastAPI** - Web framework
- **scikit-learn** - ML library
- **XGBoost, LightGBM** - Gradient boosting
- **pandas, numpy** - Data processing

---

## Current Demo Mode

The system is currently configured for **demo mode** with:
- ✅ API generates sample NTL predictions (realistic data)
- ✅ Frontend dashboard fully functional
- ✅ All features working (sorting, filtering, export)
- ⏸️ ML model training/prediction (optional for demo)

To enable full ML capabilities, start the Python ML service and the API will automatically switch to calling it.

---

## Next Steps

1. **Install dependencies** (see above)
2. **Run API + Frontend** for quick demo
3. **Test the dashboard** at http://localhost:5173
4. **Explore features**:
   - View daily inspection hotlist
   - Sort by confidence/loss
   - Export to CSV
   - Check dashboard stats

---

## Troubleshooting

**Port already in use:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

**Module not found (Node):**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Python dependencies:**
```bash
pip install --upgrade pip
pip install -r src/backend/ml-service/requirements.txt
```
