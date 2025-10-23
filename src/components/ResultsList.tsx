import React from 'react';
import { SearchResult } from '../types/hsCode';
import { formatSimilarity } from '../utils/helpers';
import { Copy, ExternalLink } from 'lucide-react';

interface ResultsListProps {
  results: SearchResult[];
}

const ResultsList: React.FC<ResultsListProps> = ({ results }) => {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="results-container">
      <h2>Search Results ({results.length})</h2>
      
      <div className="results-list">
        {results.map((result, index) => (
          <div key={`${result.code}-${index}`} className="result-item">
            <div className="result-header">
              <div className="result-code-section">
                <span className="result-rank">#{index + 1}</span>
                <span className="result-code">{result.code}</span>
                <button
                  className="copy-button"
                  onClick={() => copyToClipboard(result.code)}
                  title="Copy code to clipboard"
                >
                  {copiedCode === result.code ? '✓ Copied' : <Copy size={16} />}
                </button>
              </div>
              <div className="result-similarity">
                <div className="similarity-score">
                  Match: {formatSimilarity(result.similarity)}
                </div>
                {result.source && (
                  <span className={`source-badge source-${result.source}`}>
                    {result.source === 'vector' ? 'AI-Powered' : 'Keyword'}
                  </span>
                )}
              </div>
            </div>

            <div className="result-body">
              <p className="result-description">{result.description}</p>
              
              <div className="result-metadata">
                <span className="meta-item">
                  <strong>Chapter:</strong> {result.chapter}
                </span>
                <span className="meta-item">
                  <strong>Section:</strong> {result.section}
                </span>
                {result.keywords && result.keywords.length > 0 && (
                  <span className="meta-item">
                    <strong>Keywords:</strong> {result.keywords.join(', ')}
                  </span>
                )}
              </div>
            </div>

            <div className="result-footer">
              <a
                href={`https://www.customs.gov.uk/trade-commodity-codes?commodity_code=${result.code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="view-details-link"
              >
                <ExternalLink size={14} /> View Details
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsList;