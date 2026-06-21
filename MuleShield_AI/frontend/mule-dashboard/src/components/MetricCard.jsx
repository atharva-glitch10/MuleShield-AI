import React from "react";
import PropTypes from "prop-types";

// MetricCard component with glassmorphism styling
export default function MetricCard({ label, value, unit, description, trend }) {
  return (
    <div className="metric-card glass-card">
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        {trend && <span className="metric-trend">{trend}</span>}
      </div>
      <div className="metric-value">
        {value}{unit && <span className="metric-unit">{unit}</span>}
      </div>
      {description && <div className="metric-desc">{description}</div>}
    </div>
  );
}

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  unit: PropTypes.string,
  description: PropTypes.string,
  trend: PropTypes.node,
};

MetricCard.defaultProps = {
  unit: "",
  description: "",
  trend: null,
};
