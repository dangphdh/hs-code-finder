/**
 * Format similarity score as percentage
 */
export const formatSimilarity = (score: number): string => {
  return `${(score * 100).toFixed(1)}%`;
};

/**
 * Truncate text to specific length
 */
export const truncateText = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Highlight matching keywords in text
 */
export const highlightKeywords = (text: string, keywords: string[]): string => {
  let highlighted = text;
  keywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  });
  return highlighted;
};

/**
 * Validate API key format
 */
export const validateApiKeyFormat = (provider: string, apiKey: string): boolean => {
  const trimmed = apiKey.trim();
  
  if (trimmed.length === 0) {
    return false;
  }

  switch (provider) {
    case 'openai':
      // OpenAI keys typically start with 'sk-'
      return trimmed.startsWith('sk-') && trimmed.length > 10;
    case 'cohere':
      // Cohere keys are typically longer alphanumeric strings
      return trimmed.length > 20 && /^[a-zA-Z0-9\-]+$/.test(trimmed);
    case 'huggingface':
      // HuggingFace keys typically start with 'hf_'
      return trimmed.startsWith('hf_') && trimmed.length > 10;
    default:
      return trimmed.length > 10;
  }
};

/**
 * Get provider display info
 */
export const getProviderInfo = (provider: string) => {
  const info: Record<string, { name: string; color: string; url: string }> = {
    openai: {
      name: 'OpenAI',
      color: '#10a37f',
      url: 'https://platform.openai.com/api-keys'
    },
    cohere: {
      name: 'Cohere',
      color: '#ffa500',
      url: 'https://dashboard.cohere.ai/api-keys'
    },
    huggingface: {
      name: 'HuggingFace',
      color: '#000000',
      url: 'https://huggingface.co/settings/tokens'
    }
  };

  return info[provider] || { name: provider, color: '#666', url: '#' };
};