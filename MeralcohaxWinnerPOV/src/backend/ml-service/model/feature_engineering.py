"""
Feature Engineering for NTL Detection
Transforms raw customer data into ML-ready features
"""

import numpy as np
import pandas as pd
from typing import List
from scipy import stats
from geopy.distance import geodesic


class FeatureEngineer:
    """
    Generates features from raw customer data
    
    Feature Categories:
    1. Consumption Features (temporal patterns)
    2. AMI/Smart Meter Features (technical anomalies)
    3. Customer Profile Features (demographic)
    4. Geospatial Features (location-based)
    """
    
    def __init__(self):
        self.feature_names = []
    
    def transform(self, data: pd.DataFrame) -> np.ndarray:
        """
        Transform raw customer data to feature matrix
        
        Args:
            data: DataFrame with customer information
            
        Returns:
            numpy array with engineered features
        """
        features = []
        
        for _, row in data.iterrows():
            customer_features = self._extract_features(row)
            features.append(customer_features)
        
        return np.array(features)
    
    def _extract_features(self, customer: pd.Series) -> List[float]:
        """Extract all features for a single customer"""
        features = []
        
        # 1. CONSUMPTION FEATURES
        consumption = customer.get('consumption_history', [])
        if isinstance(consumption, list) and len(consumption) >= 12:
            features.extend(self._consumption_features(consumption))
        else:
            features.extend([0] * 15)  # Placeholder for missing data
        
        # 2. AMI FEATURES
        ami_data = customer.get('ami_data', {})
        features.extend(self._ami_features(ami_data))
        
        # 3. CUSTOMER PROFILE FEATURES
        features.extend(self._profile_features(customer))
        
        # 4. GEOSPATIAL FEATURES
        features.extend(self._geospatial_features(customer))
        
        # Store feature names (first time only)
        if not self.feature_names:
            self.feature_names = self._get_feature_names()
        
        return features
    
    def _consumption_features(self, consumption: List[float]) -> List[float]:
        """
        Extract temporal consumption patterns
        
        Features:
        - Trend (increasing/decreasing)
        - Volatility (standard deviation)
        - Recent vs. historical ratio
        - Drop detection
        - Coefficient of variation
        """
        consumption = np.array(consumption)
        
        # Basic statistics
        mean_consumption = np.mean(consumption)
        std_consumption = np.std(consumption)
        median_consumption = np.median(consumption)
        
        # Trend (linear regression slope)
        x = np.arange(len(consumption))
        slope, _ = np.polyfit(x, consumption, 1)
        
        # Recent vs. historical (last 3 months vs. previous 9)
        recent_avg = np.mean(consumption[-3:])
        historical_avg = np.mean(consumption[:-3])
        recent_ratio = recent_avg / historical_avg if historical_avg > 0 else 1
        
        # Drop detection (>30% decrease)
        max_drop = 0
        for i in range(1, len(consumption)):
            drop = (consumption[i-1] - consumption[i]) / consumption[i-1] if consumption[i-1] > 0 else 0
            max_drop = max(max_drop, drop)
        
        # Coefficient of variation (volatility measure)
        cv = std_consumption / mean_consumption if mean_consumption > 0 else 0
        
        # Month-over-month changes
        mom_changes = np.diff(consumption)
        mom_mean = np.mean(mom_changes)
        mom_std = np.std(mom_changes)
        
        # Z-score of recent consumption
        z_score_recent = (recent_avg - mean_consumption) / std_consumption if std_consumption > 0 else 0
        
        # Percentage of months with zero consumption
        zero_months = np.sum(consumption == 0) / len(consumption)
        
        return [
            mean_consumption,
            std_consumption,
            median_consumption,
            slope,
            recent_ratio,
            max_drop,
            cv,
            mom_mean,
            mom_std,
            z_score_recent,
            zero_months,
            recent_avg,
            historical_avg,
            np.min(consumption),
            np.max(consumption)
        ]
    
    def _ami_features(self, ami_data: dict) -> List[float]:
        """
        Extract AMI/Smart Meter features
        
        Features:
        - Tamper alert count
        - Voltage readings (average, min, max)
        - Power factor
        - Phase imbalance
        """
        # Default values if AMI data is missing
        if not ami_data:
            return [0, 220, 220, 220, 0.95, 0]
        
        tamper_alerts = ami_data.get('tamper_alerts', 0)
        voltage = ami_data.get('voltage_reading', 220)
        
        # Simulate voltage statistics (in production, get from time-series)
        voltage_avg = voltage
        voltage_min = voltage * 0.95
        voltage_max = voltage * 1.05
        
        power_factor = ami_data.get('power_factor', 0.95)
        phase_imbalance = ami_data.get('phase_imbalance', 0)
        
        return [
            tamper_alerts,
            voltage_avg,
            voltage_min,
            voltage_max,
            power_factor,
            phase_imbalance
        ]
    
    def _profile_features(self, customer: pd.Series) -> List[float]:
        """
        Extract customer profile features
        
        Features:
        - Customer type (one-hot encoded)
        - Business category (encoded)
        - Account age (simulated)
        """
        # Customer type encoding
        customer_type = customer.get('customer_type', 'residential')
        type_residential = 1 if customer_type == 'residential' else 0
        type_commercial = 1 if customer_type == 'commercial' else 0
        type_industrial = 1 if customer_type == 'industrial' else 0
        
        # Business category (simplified encoding)
        business_category = customer.get('business_category', 'none')
        category_encoded = hash(business_category) % 100  # Simple hash encoding
        
        # Account age (months) - simulated
        account_age = 24  # Default 2 years
        
        return [
            type_residential,
            type_commercial,
            type_industrial,
            category_encoded,
            account_age
        ]
    
    def _geospatial_features(self, customer: pd.Series) -> List[float]:
        """
        Extract geospatial features
        
        Features:
        - Distance from transformer (simulated)
        - Density score (customers per area)
        - Latitude/Longitude (normalized)
        """
        lat = customer.get('latitude', 14.5995)  # Default: Manila
        lon = customer.get('longitude', 120.9842)
        
        # Normalize coordinates (simple min-max for Philippines)
        lat_normalized = (lat - 14.0) / 7.0  # Rough normalization
        lon_normalized = (lon - 120.0) / 7.0
        
        # Distance from transformer (simulated, in meters)
        # In production: calculate actual distance
        distance_from_transformer = 50
        
        # Density score (simulated)
        # In production: count customers within radius
        density_score = 15
        
        return [
            lat_normalized,
            lon_normalized,
            distance_from_transformer,
            density_score
        ]
    
    def _get_feature_names(self) -> List[str]:
        """Return list of feature names"""
        return [
            # Consumption features (15)
            'mean_consumption', 'std_consumption', 'median_consumption',
            'trend_slope', 'recent_ratio', 'max_drop', 'coeff_variation',
            'mom_mean', 'mom_std', 'z_score_recent', 'zero_months',
            'recent_avg', 'historical_avg', 'min_consumption', 'max_consumption',
            
            # AMI features (6)
            'tamper_alerts', 'voltage_avg', 'voltage_min', 'voltage_max',
            'power_factor', 'phase_imbalance',
            
            # Profile features (5)
            'type_residential', 'type_commercial', 'type_industrial',
            'business_category', 'account_age',
            
            # Geospatial features (4)
            'lat_normalized', 'lon_normalized',
            'distance_transformer', 'density_score'
        ]
