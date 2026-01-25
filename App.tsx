
import React, { useState, useEffect } from 'react';
import { Language, CategoryEmoji } from './data/types';
import { CONFIG } from './data/constants';
import { TRANSLATIONS } from './data/translations';
import { useHangman } from './hooks/useHangman';
import { HangmanVisual } from './components/HangmanVisual';
import { Keyboard } from './components/Keyboard';
import { ProgressBar } from './components/ProgressBar';

export default function App() {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('appLanguage') as Language) || 'it');
  const [theme, setTheme] = useState(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');
  const [sfxEnabled, setSfxEnabled] = useState(() => JSON.parse(localStorage.getItem('sfxEnabled') || 'true'));
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { state, handleLetterGuess, handleHint, selectNewWord, resetGame } = useHangman(language, sfxEnabled);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('appLanguage', lang);
  };

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans">
      {/* HEADER */}
      <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-20 px-4 py-3 flex items-center justify-between border-b dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-2 rounded-lg text-xl">🇮🇹</div>
          <div>
            <h1 className="text-xl font-title text-blue-800 dark:text-blue-400 leading-none">Hangman</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 px-3 py-1 rounded-full text-xs font-bold">🔥 {state.streak}</div>
          <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">⭐ {state.totalStars}</div>
          <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">{theme === 'light' ? '🌙' : '☀️'}</button>
          <button onClick={() => setIsMenuOpen(true)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">☰</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        {/* PROGRESS */}
        <div className="mb-6 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border dark:border-gray-800">
          <ProgressBar 
            current={state.difficultyProgress[state.currentDifficulty] % CONFIG.words_per_difficulty_level} 
            max={CONFIG.words_per_difficulty_level} 
            label={`${t.level} ${state.currentDifficulty}`} 
          />
        </div>

        {/* BOARD */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border-4 border-blue-100 dark:border-gray-800 p-6 text-center">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/3"><HangmanVisual wrongGuesses={CONFIG.max_attempts - state.attemptsRemaining} /></div>
            <div className="w-full md:w-2/3 flex flex-col items-center gap-6">
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-full text-xs font-bold uppercase tracking-widest text-gray-500">
                {CategoryEmoji[state.currentWord?.category as keyof typeof CategoryEmoji] || '🏷️'} {t.categories[state.currentWord?.category || '']}
              </div>
              <div className="text-4xl md:text-6xl font-mono font-bold tracking-tighter flex gap-2">
                {state.currentWord?.italian.split('').map((char, i) => (
                  <span key={i}>{state.guessedLetters.includes(char.toLowerCase()) ? char.toUpperCase() : '_'}</span>
                ))}
              </div>
              <div className="h-8 text-blue-600 dark:text-blue-400 font-bold">{state.feedback}</div>
              <button onClick={handleHint} disabled={state.hintsUsed >= 2 || state.gameStatus !== 'playing'} className="bg-yellow-100 text-yellow-700 px-6 py-2 rounded-xl font-bold hover:bg-yellow-200 disabled:opacity-50">
                💡 {state.hintsUsed === 0 ? t.hint_btn : state.hintsUsed === 1 ? t.hint_btn_more : t.hint_btn_none}
              </button>
            </div>
          </div>

          <div className="mt-8"><Keyboard guessedLetters={state.guessedLetters} onLetterGuess={handleLetterGuess} disabled={state.gameStatus !== 'playing'} /></div>
          
          <div className="mt-8 flex justify-center gap-2">
            {[...Array(CONFIG.max_attempts)].map((_, i) => (
              <span key={i} className={i < state.attemptsRemaining ? "text-red-500" : "text-gray-300"}>❤️</span>
            ))}
          </div>
        </div>
      </main>

      {/* WIN/LOSE MODAL */}
      {(state.gameStatus === 'won' || state.gameStatus === 'lost') && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-pop">
            <div className="text-7xl mb-4">{state.gameStatus === 'won' ? '🏆' : '😿'}</div>
            <h2 className="text-3xl font-title mb-4">{state.gameStatus === 'won' ? t.win_title : t.lose_title}</h2>
            <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-2xl mb-6">
              <div className="text-2xl font-bold uppercase">{state.currentWord?.italian}</div>
              <div className="text-blue-600 dark:text-blue-400 italic">{state.currentWord?.english}</div>
            </div>
            <button onClick={selectNewWord} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700">
              {t.next_word} 🚀
            </button>
          </div>
        </div>
      )}

      {/* MENU OVERLAY */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{t.menu}</h2>
              <button onClick={() => setIsMenuOpen(false)}>✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                <button onClick={() => toggleLanguage('it')} className={`py-2 rounded-lg text-sm font-bold ${language === 'it' ? 'bg-white shadow' : ''}`}>🇮🇹 IT</button>
                <button onClick={() => toggleLanguage('en')} className={`py-2 rounded-lg text-sm font-bold ${language === 'en' ? 'bg-white shadow' : ''}`}>🇬🇧 EN</button>
              </div>
              <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
                <span>{t.sfx_label}</span>
                <button onClick={() => setSfxEnabled(!sfxEnabled)}>{sfxEnabled ? '🔊' : '🔇'}</button>
              </div>
              <button onClick={resetGame} className="w-full py-4 text-red-600 font-bold bg-red-50 dark:bg-red-900/20 rounded-xl">{t.reset_btn}</button>
            </div>
          </div>
        </div>
      )}
      
      <footer className="text-center p-8 text-gray-400 text-sm">
        <p>{t.keyboard_msg}</p>
        <p className="mt-2 font-mono">v1.1.0 • Professional Edition</p>
      </footer>
    </div>
  );
}
