import React from 'react';
import './EngineeringView.css';
import TheftCategoryChart from './TheftCategoryChart';
import InspectionTable from './InspectionTable';

export default function EngineeringView({ hotlist = [], stats = null }) {
    return (
        <div className="engineering-container">
            <header className="engineering-header">
                <h2>Engineering</h2>
                <p className="sub">Theft categories and inspection data</p>
            </header>

            <div className="engineering-grid">
                <div className="card card-chart">
                    <TheftCategoryChart hotlist={hotlist} />
                </div>

                <div className="card card-inspections">
                    <InspectionTable hotlist={hotlist} compact />
                </div>
            </div>
        </div>
    );
}