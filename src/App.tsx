import { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import LanguageToggle from './components/LanguageToggle';
import SettingsButton from './components/SettingsButton';
import SettingsDrawer from './components/SettingsDrawer';
import SearchForm from './components/SearchForm';
import ResultsList from './components/ResultsList';
import { SearchResult } from './types/hsCode';

function AppContent() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSearch = async (results: SearchResult[]) => {
    setResults(results);
  };

  const handleLoadingChange = (loading: boolean) => {
    setIsLoading(loading);
  };

  const handleError = (error: string | null) => {
    setError(error);
  };

  return (
    <div className="app-wrapper">
      <div className="container">
        <div className="app-header">
          <div className="header-left">
            <div className="header-title-group">
              <h1 className="app-title">🔍 HS Code Finder</h1>
              <p className="app-subtitle">Find Harmonized System codes using natural language descriptions with AI-powered vector search</p>
            </div>
          </div>
          <div className="header-right">
            <LanguageToggle />
            <SettingsButton onClick={() => setSettingsOpen(true)} />
          </div>
        </div>
        
        <SettingsDrawer 
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
        
        <SearchForm 
          onResults={handleSearch}
          onLoadingChange={handleLoadingChange}
          onError={handleError}
        />
        
        {error && (
          <div className="message-container error-message">
            <span className="message-icon">⚠️</span>
            <div className="message-content">
              <p className="message-title">Search Error</p>
              <p className="message-text">{error}</p>
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <span className="loading-text">Searching through HS codes...</span>
          </div>
        )}
        
        {!isLoading && results.length === 0 && !error && (
          <div className="empty-state">
            <p className="empty-icon">📋</p>
            <p className="empty-text">Search for HS codes to get started</p>
          </div>
        )}
        
        <ResultsList results={results} />
      </div>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;