import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './LanguageToggle.css';

/**
 * Language Toggle Component
 */
export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="language-toggle">
      <button
        className={`toggle-btn ${language === 'en' ? 'active' : ''}`}
        onClick={() => setLanguage('en')}
        title="English"
      >
        EN
      </button>
      <button
        className={`toggle-btn ${language === 'vi' ? 'active' : ''}`}
        onClick={() => setLanguage('vi')}
        title="Tiếng Việt"
      >
        VI
      </button>
    </div>
  );
};

export default LanguageToggle;
