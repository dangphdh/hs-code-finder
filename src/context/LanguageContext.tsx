import React, { createContext, useContext, useState, useEffect } from 'react';
import { electronStorage } from '../services/electronStorage';

/**
 * Language preference type
 */
export type Language = 'en' | 'vi';

/**
 * Language Context
 */
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  getLabel: (en: string, vi?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Language Provider Component
 */
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load language preference on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const stored = await electronStorage.getItem('hs_code_language');
        if (stored) {
          const parsed = JSON.parse(stored);
          setLanguageState(parsed.language || 'en');
        }
      } catch (error) {
        console.error('Failed to load language preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      await electronStorage.setItem('hs_code_language', JSON.stringify({ language: lang }));
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  };

  const getLabel = (en: string, vi?: string): string => {
    return language === 'vi' && vi ? vi : en;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, getLabel }}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Hook to use language context
 */
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
