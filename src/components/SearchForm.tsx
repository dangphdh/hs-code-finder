import { useState } from 'react';
import { useHSCodeSearch } from '../hooks/useHSCodeSearch';
import { useEmbeddingProviders } from '../hooks/useHSCodeSearch';
import { useLanguage } from '../context/LanguageContext';
import { SearchResult } from '../types/hsCode';
import { Search } from 'lucide-react';

interface SearchFormProps {
  onResults: (results: SearchResult[]) => void;
  onLoadingChange: (loading: boolean) => void;
  onError: (error: string | null) => void;
}

const SearchForm: React.FC<SearchFormProps> = ({ onResults, onLoadingChange, onError }) => {
  const [query, setQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('openai-small');
  const { search, isLoading, error, searchMode } = useHSCodeSearch();
  const { providers } = useEmbeddingProviders();
  const { language } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      onError('Please enter a search query');
      return;
    }

    onLoadingChange(true);
    onError(null);

    try {
      const results = await search(query, selectedProvider, 10);
      onResults(results);
      onError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      onError(errorMessage);
      onResults([]);
    } finally {
      onLoadingChange(false);
    }
  };

  const getPlaceholder = (): string => {
    if (language === 'vi') {
      return "Ví dụ: 'Trái táo', 'Vải cotton', 'Thành phần điện tử'";
    }
    return "e.g., 'Apple fruit', 'Cotton fabric', 'Electronics components'";
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <div className="search-input-group">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={getPlaceholder()}
            className="search-input"
            disabled={isLoading}
            autoFocus
          />
          <button
            type="submit"
            className="search-button"
            disabled={isLoading || !query.trim()}
            title="Search (Enter to submit)"
          >
            <Search size={20} />
            <span className="button-text">{isLoading ? 'Searching...' : 'Search'}</span>
          </button>
        </div>
      </div>

      <div className="search-options">
        <div className="provider-selector">
          <label htmlFor="provider-select">Provider:</label>
          <select
            id="provider-select"
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            disabled={isLoading}
            className="provider-select"
          >
            {providers.map(provider => (
              <option key={provider.key} value={provider.key}>
                {provider.name} ({provider.dimensions}d)
                {provider.hasApiKey ? ' ✓' : ' (no key)'}
              </option>
            ))}
          </select>
        </div>

        <div className="search-mode-badge">
          Search Mode: <span className={`badge-${searchMode}`}>{searchMode}</span>
        </div>
      </div>

      {error && (
        <div className="search-error">
          ⚠️ {error}
        </div>
      )}
    </form>
  );
};

export default SearchForm;