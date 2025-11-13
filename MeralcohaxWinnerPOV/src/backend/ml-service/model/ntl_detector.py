"""
Project KILOS - NTL Detection Model
Ensemble ML model for Non-Technical Loss detection
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any
from datetime import datetime, timedelta
import joblib
import os

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from imblearn.over_sampling import SMOTE

from .feature_engineering import FeatureEngineer

# Simple logger fallback
try:
    from ..utils.logger import setup_logger
    logger = setup_logger()
except:
    import logging
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.INFO)
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
    logger.addHandler(handler)


class NTLDetector:
    """
    Ensemble ML model for NTL detection
    
    Combines multiple algorithms:
    - Random Forest: Handles non-linear patterns
    - Gradient Boosting: Sequential error correction
    - XGBoost: High performance on tabular data
    - LightGBM: Fast training with categorical features
    """
    
    def __init__(self):
        self.model_version = "1.0.0"
        self.feature_engineer = FeatureEngineer()
        self.scaler = StandardScaler()
        
        # Ensemble models
        self.models = {
            'random_forest': RandomForestClassifier(
                n_estimators=200,
                max_depth=15,
                min_samples_split=10,
                class_weight='balanced',
                random_state=42
            ),
            'gradient_boosting': GradientBoostingClassifier(
                n_estimators=150,
                max_depth=10,
                learning_rate=0.1,
                random_state=42
            ),
            'xgboost': XGBClassifier(
                n_estimators=200,
                max_depth=12,
                learning_rate=0.1,
                scale_pos_weight=10,  # Handle class imbalance
                random_state=42
            ),
            'lightgbm': LGBMClassifier(
                n_estimators=200,
                max_depth=12,
                learning_rate=0.1,
                class_weight='balanced',
                random_state=42
            )
        }
        
        # Model weights (tuned based on validation performance)
        self.model_weights = {
            'random_forest': 0.20,
            'gradient_boosting': 0.25,
            'xgboost': 0.30,
            'lightgbm': 0.25
        }
        
        self.is_trained = False
        self._load_model()
    
    def _load_model(self):
        """Load pre-trained model if exists"""
        model_path = "model/saved_models/ensemble_model.pkl"
        if os.path.exists(model_path):
            try:
                saved_data = joblib.load(model_path)
                self.models = saved_data['models']
                self.scaler = saved_data['scaler']
                self.model_weights = saved_data['weights']
                self.is_trained = True
                logger.info("Loaded pre-trained model successfully")
            except Exception as e:
                logger.warning(f"Could not load model: {e}")
    
    def train(self, training_data: pd.DataFrame, labels: pd.Series):
        """
        Train the ensemble model
        
        Args:
            training_data: DataFrame with customer features
            labels: Series with NTL labels (0: honest, 1: theft)
        """
        logger.info("Starting model training...")
        
        # Feature engineering
        X = self.feature_engineer.transform(training_data)
        
        # Handle class imbalance with SMOTE (less aggressive)
        # Use sampling_strategy=0.3 to create fewer synthetic samples
        # This prevents SMOTE from overwhelming real data patterns
        minority_class_count = int(labels.sum())
        majority_class_count = len(labels) - minority_class_count
        
        print(f"Class distribution before SMOTE:")
        print(f"  Normal (0): {majority_class_count}")
        print(f"  NTL (1): {minority_class_count}")
        
        # Only apply SMOTE if severe imbalance (ratio > 10:1)
        if majority_class_count / (minority_class_count + 1) > 10:
            # Create synthetic samples to bring minority to 30% of majority
            smote = SMOTE(sampling_strategy=0.3, random_state=42, k_neighbors=5)
            X_resampled, y_resampled = smote.fit_resample(X, labels)
            print(f"Class distribution after SMOTE:")
            print(f"  Normal (0): {(y_resampled == 0).sum()}")
            print(f"  NTL (1): {(y_resampled == 1).sum()}")
        else:
            X_resampled, y_resampled = X, labels
            print("Skipping SMOTE - class balance acceptable")
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X_resampled)
        
        # Train each model in ensemble
        for name, model in self.models.items():
            logger.info(f"Training {name}...")
            model.fit(X_scaled, y_resampled)
        
        self.is_trained = True
        logger.info("Model training completed")
        
        # Save model
        self._save_model()
    
    def predict_single(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict NTL for a single customer
        
        Returns:
            Dictionary with prediction results
        """
        # Convert to DataFrame for feature engineering
        df = pd.DataFrame([customer_data])
        
        # Extract features
        features = self.feature_engineer.transform(df)
        features_scaled = self.scaler.transform(features)
        
        # Ensemble prediction (weighted average)
        predictions = []
        for name, model in self.models.items():
            prob = model.predict_proba(features_scaled)[0][1]  # Probability of theft
            predictions.append(prob * self.model_weights[name])
        
        confidence_score = sum(predictions) * 100  # Convert to percentage
        
        # Identify theft indicators
        theft_indicators = self._identify_theft_patterns(customer_data, features)
        
        # Estimate monthly loss (based on consumption anomaly)
        estimated_loss = self._estimate_monthly_loss(customer_data, confidence_score)
        
        # Risk classification
        if confidence_score >= 75:
            risk_level = "High"
            action = "Immediate field inspection with legal team standby"
        elif confidence_score >= 50:
            risk_level = "Medium"
            action = "Schedule inspection within 3 days"
        else:
            risk_level = "Low"
            action = "Monitor for 30 days, flag if pattern continues"
        
        return {
            "customer_id": customer_data["customer_id"],
            "confidence_score": round(confidence_score, 2),
            "estimated_monthly_loss": round(estimated_loss, 2),
            "theft_indicators": theft_indicators,
            "risk_level": risk_level,
            "recommended_action": action
        }
    
    def predict_batch(self, customer_ids: List[str], date: str) -> List[Dict[str, Any]]:
        """
        Generate daily inspection hotlist
        
        In production, this would query the database for customer data
        For demo, we'll generate synthetic predictions
        """
        predictions = []
        
        # TODO: Replace with actual database query
        # For now, return demo data
        logger.info(f"Generating predictions for {len(customer_ids)} customers")
        
        return predictions
    
    def _identify_theft_patterns(self, customer_data: Dict, features: np.ndarray) -> List[str]:
        """
        Identify specific theft indicators based on anomalies
        """
        indicators = []
        
        # Consumption anomaly
        consumption = customer_data.get("consumption_history", [])
        if len(consumption) >= 12:
            recent_avg = np.mean(consumption[-3:])
            historical_avg = np.mean(consumption[:-3])
            
            if recent_avg < historical_avg * 0.5:
                indicators.append("Consumption dropped >50% vs. historical average")
        
        # AMI tamper detection
        ami_data = customer_data.get("ami_data", {})
        if ami_data:
            if ami_data.get("tamper_alerts", 0) > 0:
                indicators.append("AMI tamper alerts detected")
            
            voltage = ami_data.get("voltage_reading", 220)
            if voltage < 200:
                indicators.append("Abnormal voltage drop (possible bypass)")
        
        # Profile mismatch
        customer_type = customer_data.get("customer_type")
        avg_consumption = np.mean(consumption) if consumption else 0
        
        if customer_type == "residential" and avg_consumption > 1000:
            indicators.append("Residential account with commercial-level consumption")
        
        if not indicators:
            indicators.append("Statistical anomaly detected in consumption pattern")
        
        return indicators
    
    def _estimate_monthly_loss(self, customer_data: Dict, confidence_score: float) -> float:
        """
        Estimate monthly revenue loss in PHP
        
        Assumptions:
        - Average rate: ₱10/kWh (blended residential/commercial)
        - Theft typically involves 50-80% of actual consumption
        """
        consumption = customer_data.get("consumption_history", [])
        
        if not consumption:
            return 0
        
        # Calculate expected vs. actual consumption
        historical_avg = np.mean(consumption[:-3]) if len(consumption) > 3 else np.mean(consumption)
        current_consumption = np.mean(consumption[-3:]) if len(consumption) >= 3 else consumption[-1]
        
        # Estimated stolen kWh
        stolen_kwh = max(0, historical_avg - current_consumption)
        
        # Apply confidence factor
        adjusted_theft = stolen_kwh * (confidence_score / 100)
        
        # Convert to PHP (₱10/kWh average blended rate)
        monthly_loss = adjusted_theft * 10
        
        return monthly_loss
    
    def evaluate(self, X_test: pd.DataFrame, y_test: pd.Series) -> Dict[str, Any]:
        """
        Evaluate model performance on test data
        
        Args:
            X_test: Test features DataFrame
            y_test: Test labels Series
            
        Returns:
            Dictionary with evaluation metrics
        """
        from sklearn.metrics import (
            accuracy_score, precision_score, recall_score, f1_score,
            roc_auc_score, confusion_matrix, classification_report
        )
        
        # Transform and scale test data
        X_features = self.feature_engineer.transform(X_test)
        X_scaled = self.scaler.transform(X_features)
        
        # Get ensemble predictions
        all_predictions = []
        all_probabilities = []
        
        for name, model in self.models.items():
            preds = model.predict(X_scaled)
            probs = model.predict_proba(X_scaled)[:, 1]
            all_predictions.append(preds)
            all_probabilities.append(probs)
        
        # Weighted ensemble predictions
        weighted_probs = sum(prob * weight for prob, weight in zip(all_probabilities, self.model_weights.values()))
        
        # Use higher threshold to reduce false positives
        # Since we have severe class imbalance, threshold should be tuned
        # Default 0.5 is too low for 2.5% NTL prevalence
        decision_threshold = 0.6  # Adjust based on business needs
        ensemble_predictions = (weighted_probs >= decision_threshold).astype(int)
        
        # Calculate metrics
        metrics = {
            'accuracy': accuracy_score(y_test, ensemble_predictions),
            'precision': precision_score(y_test, ensemble_predictions),
            'recall': recall_score(y_test, ensemble_predictions),
            'f1_score': f1_score(y_test, ensemble_predictions),
            'roc_auc': roc_auc_score(y_test, weighted_probs),
            'confusion_matrix': confusion_matrix(y_test, ensemble_predictions).tolist(),
            'classification_report': classification_report(y_test, ensemble_predictions, output_dict=True)
        }
        
        logger.info(f"Model Evaluation - Accuracy: {metrics['accuracy']:.4f}, F1: {metrics['f1_score']:.4f}, ROC-AUC: {metrics['roc_auc']:.4f}")
        
        return metrics
    
    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """
        Get probability predictions for NTL detection
        
        Args:
            X: Features DataFrame
            
        Returns:
            Array of probabilities for each class [prob_normal, prob_theft]
        """
        # Transform and scale features
        X_features = self.feature_engineer.transform(X)
        X_scaled = self.scaler.transform(X_features)
        
        # Get ensemble probabilities using proper weighted average
        ensemble_probs = np.zeros((X_scaled.shape[0], 2))
        
        for name, model in self.models.items():
            probs = model.predict_proba(X_scaled)
            # Add weighted contribution to ensemble
            ensemble_probs += probs * self.model_weights[name]
        
        return ensemble_probs
    
    def _save_model(self):
        """Save trained model to disk"""
        os.makedirs("model/saved_models", exist_ok=True)
        
        save_data = {
            'models': self.models,
            'scaler': self.scaler,
            'weights': self.model_weights,
            'version': self.model_version,
            'trained_date': datetime.now().isoformat()
        }
        
        joblib.dump(save_data, "model/saved_models/ensemble_model.pkl")
        logger.info("Model saved successfully")
    
    def get_model_info(self) -> Dict[str, Any]:
        """Return model metadata and performance metrics"""
        return {
            "version": self.model_version,
            "is_trained": self.is_trained,
            "models": list(self.models.keys()),
            "model_weights": self.model_weights,
            "feature_count": len(self.feature_engineer.feature_names),
            "status": "operational" if self.is_trained else "requires_training"
        }
    
    def retrain(self) -> Dict[str, Any]:
        """Placeholder for model retraining workflow"""
        return {
            "status": "success",
            "message": "Model retraining scheduled",
            "next_run": (datetime.now() + timedelta(days=7)).isoformat()
        }
