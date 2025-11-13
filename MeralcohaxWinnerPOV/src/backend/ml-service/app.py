"""
Project KILOS - ML Service
Main FastAPI application for NTL detection model serving
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import uvicorn
from datetime import datetime

from model.ntl_detector import NTLDetector
from utils.logger import setup_logger

app = FastAPI(
    title="KILOS ML Service",
    description="Machine Learning service for Non-Technical Loss detection",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = setup_logger()
ntl_detector = NTLDetector()


class CustomerData(BaseModel):
    """Input schema for single customer analysis"""
    customer_id: str
    consumption_history: List[float] = Field(..., min_length=12)  # 12 months
    ami_data: Optional[dict] = None
    customer_type: str = Field(..., pattern="^(residential|commercial|industrial)$")
    transformer_id: str
    latitude: float
    longitude: float
    business_category: Optional[str] = None


class BatchPredictionRequest(BaseModel):
    """Batch prediction for daily hotlist generation"""
    customer_ids: List[str]
    date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))


class NTLPrediction(BaseModel):
    """Output schema for NTL prediction"""
    customer_id: str
    confidence_score: float  # 0-100%
    estimated_monthly_loss: float  # in PHP
    theft_indicators: List[str]
    risk_level: str  # "High", "Medium", "Low"
    recommended_action: str


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "KILOS ML Service",
        "status": "operational",
        "model_version": ntl_detector.model_version,
        "timestamp": datetime.now().isoformat()
    }


@app.post("/predict", response_model=NTLPrediction)
async def predict_single(customer: CustomerData):
    """
    Analyze a single customer for NTL probability
    """
    try:
        logger.info(f"Predicting NTL for customer: {customer.customer_id}")
        
        prediction = ntl_detector.predict_single(customer.model_dump())
        
        return NTLPrediction(**prediction)
    
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/batch", response_model=List[NTLPrediction])
async def predict_batch(request: BatchPredictionRequest):
    """
    Generate daily inspection hotlist for multiple customers
    Ranked by confidence score and estimated loss
    """
    try:
        logger.info(f"Batch prediction for {len(request.customer_ids)} customers")
        
        predictions = ntl_detector.predict_batch(
            customer_ids=request.customer_ids,
            date=request.date
        )
        
        # Sort by confidence score * estimated loss (priority score)
        predictions.sort(
            key=lambda x: x["confidence_score"] * x["estimated_monthly_loss"],
            reverse=True
        )
        
        return [NTLPrediction(**pred) for pred in predictions]
    
    except Exception as e:
        logger.error(f"Batch prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/model/info")
async def model_info():
    """Get model information and performance metrics"""
    return ntl_detector.get_model_info()


@app.post("/model/retrain")
async def trigger_retrain():
    """
    Trigger model retraining (admin only in production)
    Should be called weekly/monthly with new labeled data
    """
    try:
        logger.info("Triggering model retraining")
        result = ntl_detector.retrain()
        return result
    except Exception as e:
        logger.error(f"Retraining error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
