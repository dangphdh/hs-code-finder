import { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import LanguageToggle from './components/LanguageToggle';
import ApiKeyManager from './components/ApiKeyManager';
import SearchForm from './components/SearchForm';
import ResultsList from './components/ResultsList';
import { SearchResult } from './types/hsCode';

function AppContent() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="container">
      <h1>HS Code Finder</h1>
      <p>Find Harmonized System codes using natural language descriptions with AI-powered vector search</p>
      
      <LanguageToggle />
      
      <ApiKeyManager />
      
      <SearchForm 
        onResults={handleSearch}
        onLoadingChange={handleLoadingChange}
        onError={handleError}
      />
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {isLoading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <span>Searching...</span>
        </div>
      )}
      
      <ResultsList results={results} />
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