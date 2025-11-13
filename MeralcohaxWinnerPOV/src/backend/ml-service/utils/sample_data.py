"""
Sample Data Generator for KILOS Demo
Generates realistic NTL predictions for demonstration
"""

import random
from datetime import datetime


def generate_sample_hotlist(count=50):
    """Generate sample inspection hotlist for demo"""
    
    # Sample theft indicators
    indicators_pool = [
        "Consumption dropped >50% vs. historical average",
        "AMI tamper alerts detected",
        "Abnormal voltage drop (possible bypass)",
        "Residential account with commercial-level consumption",
        "24/7 flat-line consumption pattern",
        "Geospatial cluster: multiple NTL cases on same transformer",
        "Phase imbalance detected",
        "Zero consumption for 2+ months followed by spike",
        "Consumption pattern mismatch with business hours",
        "Voltage reading below 200V threshold"
    ]
    
    hotlist = []
    
    for i in range(count):
        # Generate customer ID
        customer_id = f"CUST-{random.randint(1000000, 9000000)}"
        
        # Generate confidence score (biased towards higher for top results)
        if i < 10:
            confidence = random.uniform(80, 98)
        elif i < 30:
            confidence = random.uniform(60, 85)
        else:
            confidence = random.uniform(45, 70)
        
        # Generate estimated monthly loss (PHP)
        # Higher confidence = higher loss typically
        base_loss = random.uniform(5000, 50000)
        loss_multiplier = confidence / 50
        estimated_loss = base_loss * loss_multiplier
        
        # Risk level
        if confidence >= 75:
            risk_level = "High"
            action = "Immediate field inspection with legal team standby"
        elif confidence >= 50:
            risk_level = "Medium"
            action = "Schedule inspection within 3 days"
        else:
            risk_level = "Low"
            action = "Monitor for 30 days, flag if pattern continues"
        
        # Select 2-3 random theft indicators
        num_indicators = random.randint(2, 3)
        theft_indicators = random.sample(indicators_pool, num_indicators)
        
        prediction = {
            "customer_id": customer_id,
            "confidence_score": round(confidence, 2),
            "estimated_monthly_loss": round(estimated_loss, 2),
            "theft_indicators": theft_indicators,
            "risk_level": risk_level,
            "recommended_action": action
        }
        
        hotlist.append(prediction)
    
    # Sort by priority (confidence * loss)
    hotlist.sort(
        key=lambda x: x["confidence_score"] * x["estimated_monthly_loss"],
        reverse=True
    )
    
    return hotlist


# For demo purposes - monkey patch into the API
if __name__ == "__main__":
    sample = generate_sample_hotlist(100)
    print(f"Generated {len(sample)} sample predictions")
    print("\nTop 3:")
    for i, pred in enumerate(sample[:3], 1):
        print(f"{i}. {pred['customer_id']} - {pred['confidence_score']}% - ₱{pred['estimated_monthly_loss']:,.0f}")
