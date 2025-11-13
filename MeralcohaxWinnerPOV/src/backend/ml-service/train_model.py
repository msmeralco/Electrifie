"""
Project KILOS - ML Model Training Script
Trains NTL detection model using data from MySQL database
"""

import os
import sys
import pandas as pd
import numpy as np
from datetime import datetime
import mysql.connector
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from model.ntl_detector import NTLDetector
from model.feature_engineering import FeatureEngineer

# Load environment variables
load_dotenv()

def connect_to_database():
    """Connect to MySQL database"""
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'project_kilos'),
            autocommit=True  # Ensure updates are committed automatically
        )
        print("✅ Connected to MySQL database")
        return connection
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        sys.exit(1)

def fetch_training_data(connection):
    """
    Fetch customer and consumption data for training
    """
    print("\n📊 Fetching training data from database...")
    
    # Query to get customers with their consumption patterns from actual monthly readings
    query = """
    SELECT 
        c.customer_id,
        c.customer_type,
        c.contracted_load_kw,
        c.risk_score,
        c.risk_level,
        c.ntl_confidence,
        c.has_meter_tamper,
        c.has_billing_anomaly,
        c.has_consumption_anomaly,
        c.location_lat,
        c.location_lng,
        t.capacity_kva,
        t.loss_percentage as transformer_loss,
        t.anomaly_count as transformer_anomalies,
        f.area,
        f.feeder_name,
        GROUP_CONCAT(cr.kwh_consumed ORDER BY cr.reading_date SEPARATOR ',') as consumption_history,
        GROUP_CONCAT(cr.billing_amount_php ORDER BY cr.reading_date SEPARATOR ',') as billing_history,
        COUNT(DISTINCT cr.reading_id) as total_readings
    FROM customers c
    LEFT JOIN transformers t ON c.transformer_id = t.transformer_id
    LEFT JOIN feeders f ON t.feeder_id = f.feeder_id
    LEFT JOIN consumption_readings cr ON c.customer_id = cr.customer_id
    WHERE c.is_active = TRUE
    GROUP BY c.customer_id
    HAVING total_readings >= 12
    """
    
    df = pd.read_sql(query, connection)
    
    # Convert consumption_history string to array of floats
    df['consumption_array'] = df['consumption_history'].apply(
        lambda x: [float(v) for v in x.split(',')] if pd.notna(x) and x else []
    )
    df['billing_array'] = df['billing_history'].apply(
        lambda x: [float(v) for v in x.split(',')] if pd.notna(x) and x else []
    )
    
    print(f"✓ Fetched {len(df)} customer records with complete 12-month history")
    
    return df

def prepare_features(df):
    """
    Prepare data for ML model training
    Note: Actual feature engineering is done by FeatureEngineer class
    This function just prepares the target variable and cleans data
    """
    print("\n🔧 Preparing training data...")
    
    # Create target variable: NTL or not (based on risk level)
    df['is_ntl'] = df['risk_level'].isin(['high', 'critical']).astype(int)
    
    print(f"✓ Target distribution:")
    print(f"  - Normal customers: {(df['is_ntl']==0).sum()} ({(df['is_ntl']==0).sum()/len(df)*100:.1f}%)")
    print(f"  - NTL customers: {(df['is_ntl']==1).sum()} ({(df['is_ntl']==1).sum()/len(df)*100:.1f}%)")
    
    return df

def train_and_evaluate(df):
    """
    Train the ML model
    """
    print("\n🤖 Training NTL Detection Model...")
    print("=" * 60)
    
    # Split data
    from sklearn.model_selection import train_test_split
    
    y = df['is_ntl']
    
    # Split maintaining the full dataframe for feature engineering
    train_df, test_df = train_test_split(
        df, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training set: {len(train_df)} samples")
    print(f"Test set: {len(test_df)} samples")
    
    # Initialize and train model
    detector = NTLDetector()
    
    print("\nTraining ensemble models...")
    print("-" * 60)
    
    # Pass raw dataframe - NTLDetector will do feature engineering
    detector.train(train_df, train_df['is_ntl'])
    
    # Evaluate
    print("\n📈 Model Evaluation:")
    print("=" * 60)
    
    metrics = detector.evaluate(test_df, test_df['is_ntl'])
    
    print(f"\nOverall Accuracy: {metrics['accuracy']:.3f}")
    print(f"Precision: {metrics['precision']:.3f}")
    print(f"Recall: {metrics['recall']:.3f}")
    print(f"F1 Score: {metrics['f1_score']:.3f}")
    print(f"ROC-AUC: {metrics['roc_auc']:.3f}")
    
    print("\nConfusion Matrix:")
    print(f"  True Negatives:  {metrics['confusion_matrix'][0][0]}")
    print(f"  False Positives: {metrics['confusion_matrix'][0][1]}")
    print(f"  False Negatives: {metrics['confusion_matrix'][1][0]}")
    print(f"  True Positives:  {metrics['confusion_matrix'][1][1]}")
    
    # Save model
    print("\n💾 Saving trained model...")
    model_dir = "model/saved_models"
    os.makedirs(model_dir, exist_ok=True)
    
    import joblib
    model_path = f"{model_dir}/ensemble_model.pkl"
    joblib.dump({
        'models': detector.models,
        'scaler': detector.scaler,
        'weights': detector.model_weights,
        'version': detector.model_version,
        'feature_engineer': detector.feature_engineer,
        'trained_at': datetime.now().isoformat(),
        'metrics': metrics
    }, model_path)
    
    print(f"✓ Model saved to {model_path}")
    
    return detector, metrics

def update_predictions_in_db(connection, df, detector):
    """
    Update customer records with ML predictions
    """
    print("\n🔄 Updating predictions in database...")
    
    # Get predictions for all customers - pass raw dataframe
    predictions = detector.predict_proba(df)
    
    if predictions is None or len(predictions) == 0:
        print("⚠️ No predictions generated, skipping database update")
        return
    
    # Debug: Check prediction distribution
    ntl_probs = predictions[:, 1]
    print(f"\n  [DEBUG] Prediction distribution:")
    print(f"    Min prob: {ntl_probs.min():.3f}, Max prob: {ntl_probs.max():.3f}")
    print(f"    Mean prob: {ntl_probs.mean():.3f}, Std: {ntl_probs.std():.3f}")
    print(f"    Unique values: {len(np.unique(ntl_probs))}")
    
    # Update database
    cursor = connection.cursor()
    update_count = 0
    
    # Debug: Print first 10 predictions with their ORIGINAL risk_level
    print("\n  [DEBUG] Sample predictions (showing seed risk_level vs ML prediction):")
    for i in range(min(10, len(df))):
        row = df.iloc[i]
        ntl_prob = predictions[i][1]
        risk_score = ntl_prob * 100
        if risk_score >= 80:
            ml_level = 'critical'
        elif risk_score >= 60:
            ml_level = 'high'
        elif risk_score >= 40:
            ml_level = 'medium'
        else:
            ml_level = 'low'
        print(f"    {row['customer_id']}: seed={row['risk_level']}/{row['risk_score']:.1f} → ML={ml_level}/{risk_score:.1f} (prob={ntl_prob:.3f})")
    
    for i, (idx, row) in enumerate(df.iterrows()):
        customer_id = row['customer_id']
        ntl_prob = predictions[i][1]  # Probability of theft class (use i, not idx!)
        
        # Update risk_score and ntl_confidence with ML predictions
        risk_score = ntl_prob * 100
        
        # Determine risk level
        if risk_score >= 80:
            risk_level = 'critical'
        elif risk_score >= 60:
            risk_level = 'high'
        elif risk_score >= 40:
            risk_level = 'medium'
        else:
            risk_level = 'low'
        
        cursor.execute("""
            UPDATE customers 
            SET risk_score = %s, 
                risk_level = %s,
                ntl_confidence = %s
            WHERE customer_id = %s
        """, (float(risk_score), risk_level, float(ntl_prob * 100), customer_id))
        
        # Debug: Check if update worked for first customer
        if update_count == 0:
            cursor.execute("SELECT risk_score, risk_level FROM customers WHERE customer_id = %s", (customer_id,))
            result = cursor.fetchone()
            print(f"\n  [DEBUG] First update verification:")
            print(f"    Tried to set: score={risk_score:.1f}, level={risk_level}")
            print(f"    Actually in DB: score={result[0]:.1f}, level={result[1]}")
        
        update_count += 1
        
        if update_count % 5000 == 0:
            print(f"  Updated {update_count}/{len(df)} customers...")
    
    cursor.close()
    
    print(f"✓ Updated {update_count} customer predictions")

def main():
    """
    Main training pipeline
    """
    print("\n" + "=" * 60)
    print("🚀 PROJECT KILOS - ML MODEL TRAINING")
    print("=" * 60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Connect to database
    connection = connect_to_database()
    
    try:
        # Fetch data
        df = fetch_training_data(connection)
        
        # Prepare data (creates target variable)
        df = prepare_features(df)
        
        # Train model - pass raw dataframe
        detector, metrics = train_and_evaluate(df)
        
        # Update predictions in database
        update_predictions_in_db(connection, df, detector)
        
        print("\n" + "=" * 60)
        print("✅ MODEL TRAINING COMPLETE!")
        print("=" * 60)
        print(f"\nKey Metrics:")
        print(f"  - Accuracy: {metrics['accuracy']:.1%}")
        print(f"  - Precision: {metrics['precision']:.1%}")
        print(f"  - Recall: {metrics['recall']:.1%}")
        print(f"  - F1 Score: {metrics['f1_score']:.1%}")
        print(f"\nNext steps:")
        print("  1. Start ML service: npm run backend:ml")
        print("  2. Refresh frontend to see updated predictions")
        print("  3. Check model performance in dashboard")
        
    except Exception as e:
        print(f"\n❌ Training failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    finally:
        connection.close()
        print(f"\n🏁 Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
