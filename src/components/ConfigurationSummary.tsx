import React from "react";
import SettingsSection from "./SettingsSection";
import "./ConfigurationSummary.css";

interface ConfigurationSummaryProps {
  apiKey: string;
}

const ConfigurationSummary: React.FC<ConfigurationSummaryProps> = ({
  apiKey,
}) => {
  if (!apiKey) {
    return null;
  }

  return (
    <SettingsSection
      icon="📊"
      title="Configuration Summary"
      description=""
      className="summary-section"
    >
      <div className="summary-grid">
        <div className="summary-item">
          <div className="summary-label">AI Features</div>
          <div className="summary-value">
            {apiKey ? (
              <span className="status-enabled">
                <span className="status-indicator enabled"></span>
                Enabled
              </span>
            ) : (
              <span className="status-disabled">
                <span className="status-indicator disabled"></span>
                Disabled
              </span>
            )}
          </div>
        </div>
      </div>
    </SettingsSection>
  );
};

export default ConfigurationSummary;
