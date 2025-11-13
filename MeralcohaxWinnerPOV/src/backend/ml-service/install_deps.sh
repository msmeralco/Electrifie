# Quick Install Script for Python Dependencies
# This installs packages one-by-one to avoid timeout issues

echo "🔧 Installing Python dependencies for KILOS ML Service..."
echo ""

# Install in groups to avoid timeout
echo "📦 Step 1/4: Installing FastAPI and web framework..."
pip install --no-cache-dir --timeout 300 fastapi uvicorn python-multipart pydantic python-dotenv

echo ""
echo "📦 Step 2/4: Installing core data science libraries..."
pip install --no-cache-dir --timeout 300 numpy pandas scipy

echo ""
echo "📦 Step 3/4: Installing ML libraries (this may take a while)..."
pip install --no-cache-dir --timeout 300 scikit-learn
pip install --no-cache-dir --timeout 300 xgboost
pip install --no-cache-dir --timeout 300 lightgbm

echo ""
echo "📦 Step 4/4: Installing additional utilities..."
pip install --no-cache-dir --timeout 300 imbalanced-learn joblib geopy

echo ""
echo "✅ Installation complete!"
echo ""
echo "To verify, run: python -c 'import fastapi, pandas, sklearn, xgboost, lightgbm; print(\"All imports successful!\")'"
