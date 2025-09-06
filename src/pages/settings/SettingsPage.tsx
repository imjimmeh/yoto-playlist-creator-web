import React, { useState, useEffect } from "react";
import PageHero from "../../components/PageHero";
import SettingsSection from "../../components/SettingsSection";
import FormGroup from "../../components/FormGroup";
import LoadingButton from "../../components/LoadingButton";
import { useSettings } from "../../hooks/useSettings";
import { useError } from "@/contexts/ErrorContext";
import "./SettingsPage.css";
import { logger } from "@/services/Logger";

const SettingsPage: React.FC = () => {
  const { settings, saveSettings, isLoading } = useSettings();
  const { showSuccess, showError } = useError();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await saveSettings(localSettings);
      showSuccess(
        "Settings saved successfully! Your configuration is now active."
      );
    } catch (error: unknown) {
      showError("Failed to save settings. Please try again.");
      logger.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (id === "ai-api-key") {
      setLocalSettings({
        ...localSettings,
        aiConfig: { ...localSettings.aiConfig, apiKey: value },
      });
    } else if (id === "ai-base-url") {
      setLocalSettings({
        ...localSettings,
        aiConfig: { ...localSettings.aiConfig, baseUrl: value },
      });
    } else if (id === "embedding-model") {
      setLocalSettings({
        ...localSettings,
        aiConfig: { ...localSettings.aiConfig, embeddingModel: value },
      });
    } else if (id === "chat-model") {
      setLocalSettings({
        ...localSettings,
        aiConfig: { ...localSettings.aiConfig, chatModel: value },
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="settings-page">
      <PageHero title="Settings" description="Configure your settings" />

      <div className="settings-content">
        <SettingsSection
          icon="🤖"
          title="AI Configuration"
          description="Configure AI settings for generating playlist icons"
        >
          <FormGroup
            id="ai-api-key"
            label="AI API Key"
            badge="optional"
            helpText="OpenAI-compatible API key for AI features"
            className="token-input-wrapper"
          >
            <input
              id="ai-api-key"
              type="password"
              className="form-input"
              value={localSettings.aiConfig.apiKey}
              onChange={handleInputChange}
              placeholder="sk-..."
            />
          </FormGroup>

          <FormGroup
            id="ai-base-url"
            label="AI Base URL"
            badge="optional"
            helpText="Custom endpoint for local or alternative AI services"
          >
            <input
              id="ai-base-url"
              type="text"
              className="form-input"
              value={localSettings.aiConfig.baseUrl}
              onChange={handleInputChange}
              placeholder="http://localhost:8080/v1"
            />
          </FormGroup>

          <div className="advanced-section">
            <div className="advanced-header">
              <h3>Advanced AI Settings</h3>
              <span className="advanced-badge">Advanced</span>
            </div>

            <FormGroup
              id="embedding-model"
              label="Embedding Model"
              badge="optional"
              helpText="Model for semantic understanding of audio content"
            >
              <input
                id="embedding-model"
                type="text"
                className="form-input"
                value={localSettings.aiConfig.embeddingModel}
                onChange={handleInputChange}
                placeholder="mixedbread-ai/mxbai-embed-xsmall-v1"
              />
            </FormGroup>

            <FormGroup
              id="chat-model"
              label="Chat Model"
              badge="optional"
              helpText="Model for generating descriptions and analyzing content"
            >
              <input
                id="chat-model"
                type="text"
                className="form-input"
                value={localSettings.aiConfig.chatModel}
                onChange={handleInputChange}
                placeholder="openai/gpt-oss-20b"
              />
            </FormGroup>
          </div>
        </SettingsSection>
      </div>

      <div className="settings-actions">
        <LoadingButton
          variant="primary"
          size="lg"
          onClick={handleSave}
          loading={isSaving}
          loadingChildren="Saving Settings..."
          className="save-button"
        >
          <span>💾</span>
          Save Settings
        </LoadingButton>
      </div>

      {/* Status notifications are now handled with toast notifications */}
    </div>
  );
};

export default SettingsPage;
