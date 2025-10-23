import React, { useState } from 'react';
import { X } from 'lucide-react';
import ApiKeyManager from './ApiKeyManager';
import './SettingsDrawer.css';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'api-keys' | 'preferences' | 'about';

/**
 * Settings Drawer Component
 * Slides in from the right side with multiple tabs
 */
export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('api-keys');

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="settings-overlay"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`settings-drawer ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="drawer-header">
          <h2>Settings</h2>
          <button 
            className="close-button"
            onClick={onClose}
            title="Close settings"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="drawer-tabs">
          <button
            className={`tab-button ${activeTab === 'api-keys' ? 'active' : ''}`}
            onClick={() => setActiveTab('api-keys')}
          >
            API Keys
          </button>
          <button
            className={`tab-button ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
          <button
            className={`tab-button ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
        </div>

        {/* Content */}
        <div className="drawer-content">
          {/* API Keys Tab */}
          {activeTab === 'api-keys' && (
            <div className="tab-content">
              <h3>Manage API Keys</h3>
              <p className="tab-description">
                Add or update API keys for embedding providers. Your keys are encrypted and stored securely.
              </p>
              <ApiKeyManager />
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="tab-content">
              <h3>Preferences</h3>
              <div className="preference-group">
                <label htmlFor="results-per-page">Results per page</label>
                <select id="results-per-page" defaultValue="10" title="Number of results to display">
                  <option value="5">5 results</option>
                  <option value="10">10 results</option>
                  <option value="20">20 results</option>
                  <option value="50">50 results</option>
                </select>
              </div>
              <div className="preference-group">
                <label htmlFor="auto-save">
                  <input id="auto-save" type="checkbox" defaultChecked title="Auto-save search history" />
                  Auto-save history
                </label>
              </div>
              <div className="preference-group">
                <label htmlFor="notifications">
                  <input id="notifications" type="checkbox" defaultChecked title="Enable notifications" />
                  Enable notifications
                </label>
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="tab-content">
              <h3>About HS Code Finder</h3>
              <div className="about-info">
                <p><strong>Version:</strong> 1.0.0</p>
                <p><strong>Description:</strong> AI-powered HS Code search with vector embeddings</p>
                <p><strong>Language Support:</strong> English, Vietnamese</p>
                <p><strong>Repository:</strong> hs-code-finder</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SettingsDrawer;
