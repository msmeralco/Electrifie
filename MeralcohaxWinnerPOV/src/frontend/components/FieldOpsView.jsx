import React from 'react';
import './FieldOpsView.css';
import TopThefts from './TopThefts';
import InspectionTable from './InspectionTable';

export default function FieldOpsView({ hotlist = [], stats = null }) {
    return (
        <div className="fieldops-container">
            <header className="fieldops-header">
                <h2>Field Ops</h2>
                <p className="sub">Operational view for inspections & top targets</p>
            </header>

            <div className="fieldops-grid">
                <div className="card card-topthefts">
                    <TopThefts hotlist={hotlist} />
                </div>

                <div className="card card-inspections">
                    <InspectionTable hotlist={hotlist} compact />
                </div>
            </div>

            <div className="fieldops-footer">
                {/* Add any extra controls / filters here if desired */}
            </div>
        </div>
    );
}