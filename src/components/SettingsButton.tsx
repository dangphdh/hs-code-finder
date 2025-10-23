import React from 'react';
import { Settings } from 'lucide-react';
import './SettingsButton.css';

interface SettingsButtonProps {
  onClick: () => void;
}

/**
 * Settings Button Component
 * Icon button to open settings drawer
 */
export const SettingsButton: React.FC<SettingsButtonProps> = ({ onClick }) => {
  return (
    <button
      className="settings-button"
      onClick={onClick}
      title="Open settings"
      aria-label="Settings"
    >
      <Settings size={20} />
    </button>
  );
};

export default SettingsButton;
