import React from 'react';
import './CustomerServiceView.css';
import InspectionTable from './InspectionTable';

export default function CustomerServiceView({ hotlist = [], stats = null }) {
    return (
        <div className="customers-container">
            <header className="customers-header">
                <h2>Customer Service</h2>
                <p className="sub">Customer inspection records & service data</p>
            </header>

            <div className="customers-content">
                <div className="card card-inspections">
                    <InspectionTable hotlist={hotlist} />
                </div>
            </div>

            <div className="customers-footer">
                {/* Add any extra controls / filters here if desired */}
            </div>
        </div>
    );
}