
import { GameState, Language } from '../types/index';

const KEYS = {
  GAME_STATE: 'italianHangmanState',
  LANGUAGE: 'appLanguage',
  THEME: 'theme',
  SFX: 'sfxEnabled',
};

export const storageService = {
  saveGameState: (state: Partial<GameState>) => {
    try {
      localStorage.setItem(KEYS.GAME_STATE, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving game state:', e);
    }
  },

  loadGameState: (): Partial<GameState> | null => {
    try {
      const saved = localStorage.getItem(KEYS.GAME_STATE);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Error loading game state:', e);
      return null;
    }
  },

  clearGameState: () => {
    localStorage.removeItem(KEYS.GAME_STATE);
  },

  saveLanguage: (lang: Language) => localStorage.setItem(KEYS.LANGUAGE, lang),
  
  loadLanguage: (defaultLang: Language = 'it'): Language => {
    const saved = localStorage.getItem(KEYS.LANGUAGE);
    return (saved === 'it' || saved === 'en') ? (saved as Language) : defaultLang;
  },

  saveTheme: (theme: 'light' | 'dark') => localStorage.setItem(KEYS.THEME, theme),
  
  loadTheme: (): 'light' | 'dark' => {
    const saved = localStorage.getItem(KEYS.THEME);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },

  saveSfx: (enabled: boolean) => localStorage.setItem(KEYS.SFX, JSON.stringify(enabled)),
  
  loadSfx: (defaultVal = true): boolean => {
    const saved = localStorage.getItem(KEYS.SFX);
    return saved !== null ? JSON.parse(saved) : defaultVal;
  }
};
