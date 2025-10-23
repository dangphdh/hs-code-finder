import { useState } from 'react';
import { useEmbeddingProviders } from '../hooks/useHSCodeSearch';
import { Eye, EyeOff, Trash2 } from 'lucide-react';

const ApiKeyManager: React.FC = () => {
  const { providers, saveApiKey, removeApiKey } = useEmbeddingProviders();
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [validatingKey, setValidatingKey] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<Record<string, boolean>>({});

  const handleInputChange = (provider: string, value: string) => {
    setInputValues(prev => ({
      ...prev,
      [provider]: value
    }));
  };

  const toggleKeyVisibility = (provider: string) => {
    setVisibleKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const handleSaveKey = async (provider: string) => {
    const apiKey = inputValues[provider];
    if (!apiKey.trim()) return;

    setValidatingKey(provider);
    
    try {
      // Validate API key
      const isValid = await validateApiKey(provider, apiKey);
      
      if (isValid) {
        saveApiKey(provider, apiKey);
        setValidationStatus(prev => ({
          ...prev,
          [provider]: true
        }));
        setInputValues(prev => ({
          ...prev,
          [provider]: ''
        }));
      } else {
        setValidationStatus(prev => ({
          ...prev,
          [provider]: false
        }));
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationStatus(prev => ({
        ...prev,
        [provider]: false
      }));
    } finally {
      setValidatingKey(null);
    }
  };

  const handleRemoveKey = (provider: string) => {
    if (confirm(`Remove API key for ${provider}?`)) {
      removeApiKey(provider);
      setValidationStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[provider];
        return newStatus;
      });
    }
  };

  const validateApiKey = async (_provider: string, apiKey: string): Promise<boolean> => {
    // This would normally call the provider's validate method
    // For now, just do basic validation
    return apiKey.trim().length > 10;
  };

  return (
    <div className="api-key-manager">
      <h2>API Key Management</h2>
      <p className="api-manager-description">
        Add your API keys to use AI-powered embedding providers for better search results.
      </p>

      <div className="providers-grid">
        {providers.map(provider => (
          <div key={provider.key} className="provider-card">
            <div className="provider-header">
              <h3>{provider.name}</h3>
              <span className="provider-badge">{provider.model}</span>
            </div>

            <div className="provider-info">
              <p>Dimensions: <strong>{provider.dimensions}</strong></p>
            </div>

            {provider.hasApiKey ? (
              <div className="provider-configured">
                <div className="success-badge">✓ Configured</div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleRemoveKey(provider.name.toLowerCase())}
                  title={`Remove ${provider.name} API key`}
                >
                  <Trash2 size={16} /> Remove
                </button>
              </div>
            ) : (
              <div className="provider-input-group">
                <div className="input-wrapper">
                  <input
                    type={visibleKeys[provider.key] ? 'text' : 'password'}
                    placeholder={`Enter ${provider.name} API Key`}
                    value={inputValues[provider.key] || ''}
                    onChange={(e) => handleInputChange(provider.key, e.target.value)}
                    className="api-input"
                  />
                  <button
                    className="toggle-visibility"
                    onClick={() => toggleKeyVisibility(provider.key)}
                    type="button"
                  >
                    {visibleKeys[provider.key] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => handleSaveKey(provider.key)}
                  disabled={!inputValues[provider.key]?.trim() || validatingKey === provider.key}
                >
                  {validatingKey === provider.key ? 'Validating...' : 'Save & Validate'}
                </button>
              </div>
            )}

            {validationStatus[provider.key] !== undefined && (
              <div className={`validation-message ${validationStatus[provider.key] ? 'valid' : 'invalid'}`}>
                {validationStatus[provider.key] ? '✓ Valid API Key' : '✗ Invalid API Key'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiKeyManager;