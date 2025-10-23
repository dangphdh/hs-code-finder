import { HSCode, SearchResult } from '../types/hsCode';

/**
 * Keyword-based fallback search for when API is unavailable
 */
export class FallbackSearch {
  private hsCodesData: HSCode[] = [];
  private isLoaded = false;

  /**
   * Load basic HS codes data for fallback search
   */
  async loadBasicData(): Promise<void> {
    if (this.isLoaded) return;

    try {
      const response = await fetch('/data/hs-codes-basic.json');
      if (!response.ok) {
        throw new Error(`Failed to load fallback data: ${response.statusText}`);
      }

      const data = await response.json();
      this.hsCodesData = data.hs_codes || [];
      this.isLoaded = true;
    } catch (error) {
      console.error('Failed to load basic HS codes:', error);
      throw new Error('Could not load fallback search data');
    }
  }

  /**
   * Keyword-based search
   */
  search(query: string, topK: number = 10): SearchResult[] {
    if (!this.isLoaded || this.hsCodesData.length === 0) {
      return [];
    }

    const queryWords = query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2);

    if (queryWords.length === 0) {
      return [];
    }

    const results: SearchResult[] = this.hsCodesData
      .map(hsCode => ({
        ...hsCode,
        embedding: [], // Not used for fallback
        provider: 'fallback',
        model: 'keyword',
        similarity: this.calculateKeywordScore(queryWords, hsCode),
        source: 'keyword-fallback' as const
      }))
      .filter(result => result.similarity > 0.05)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return results;
  }

  /**
   * Calculate keyword match score
   */
  private calculateKeywordScore(queryWords: string[], hsCode: HSCode): number {
    const text = `${hsCode.description} ${hsCode.keywords?.join(' ') || ''}`.toLowerCase();
    const textLength = text.length;

    if (textLength === 0) return 0;

    let score = 0;
    let matchedWords = 0;

    for (const word of queryWords) {
      if (text.includes(word)) {
        // Weight by word length relative to text
        score += Math.min(word.length / textLength * 10, 1);
        matchedWords++;
      }
    }

    // Boost score based on how many words matched
    const matchRatio = matchedWords / queryWords.length;
    return Math.min(score * matchRatio, 1);
  }

  /**
   * Check if basic data is loaded
   */
  isDataLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * Get count of loaded HS codes
   */
  getDataCount(): number {
    return this.hsCodesData.length;
  }
}