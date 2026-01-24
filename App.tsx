
import React, { useState, useEffect } from 'react';
import { CategoryEmoji, LETTER_NAMES_ITALIAN, Language, Word } from './types';
import { ITALIAN_ALPHABET, CONFIG } from './constants';
import { TRANSLATIONS } from './translations';
import { HangmanVisual, Keyboard, AdBanner, ProgressBar, GameModal, GameMenu } from './components';
import { useGameLogic } from './hooks/useGameLogic';
import { useAudio } from './hooks/useAudio';
import { useFullScreen } from './hooks/useFullScreen';
import { storageService } from './services/storageService';
import { speakInstant } from './services/geminiService';

export default function App() {
  // Global Settings State
  const [language, setLanguage] = useState<Language>(() => storageService.loadLanguage());
  const [theme, setTheme] = useState(() => storageService.loadTheme());
  const [sfxEnabled, setSfxEnabled] = useState(() => storageService.loadSfx());
  
  // UI State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  // Hooks
  const t = TRANSLATIONS[language];
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const { speak, isAudioLoading } = useAudio(CONFIG.enable_audio);

  const { gameState, handleLetterGuess, handleHint, selectNewWord, resetGame } = useGameLogic({
    language,
    sfxEnabled,
    enableAudio: CONFIG.enable_audio,
    onGameEnd: (word: Word) => {
      if (CONFIG.enable_audio) {
        void speak(word.italian, 'it');
        setTimeout(() => void speak(word.english, 'en'), CONFIG.audio_delay_ms);
      }
    },
    onLetterGuess: (letter) => {
      if (CONFIG.enable_audio) {
        speakInstant(LETTER_NAMES_ITALIAN[letter] || letter, 'it');
      }
    },
  });

  // Persist Settings
  useEffect(() => storageService.saveLanguage(language), [language]);
  useEffect(() => storageService.saveSfx(sfxEnabled), [sfxEnabled]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    storageService.saveTheme(theme);
  }, [theme]);

  // Global Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const key = e.key.toLowerCase();
      if (ITALIAN_ALPHABET.includes(key)) handleLetterGuess(key);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleLetterGuess]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleSfx = () => setSfxEnabled(prev => !prev);
  const handleFullReset = () => { resetGame(); setResetConfirm(false); setIsMenuOpen(false); };

  const wordLen = gameState.currentWord?.italian.length || 0;
  const wordFontSize = wordLen > 11 ? 'text-2xl' : wordLen > 8 ? 'text-3xl' : 'text-5xl';

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-950 pb-12 font-sans transition-colors duration-300">
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 shadow-sm sticky top-0 z-20 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🇮🇹</span>
          <div><h1 className="text-xl font-title text-blue-800 dark:text-blue-400">Hangman</h1></div>
        </div>
        <nav className="flex gap-2">
           <button onClick={toggleTheme} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">Theme</button>
           <button onClick={() => setIsMenuOpen(true)} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">Menu</button>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto mt-6 px-4">
        <div className="mb-6 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm"><ProgressBar current={gameState.difficultyProgress[gameState.currentDifficulty] % CONFIG.words_per_difficulty_level} max={CONFIG.words_per_difficulty_level} label={`${t.level} ${gameState.currentDifficulty}`} /></div>
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-6 text-center relative">
          <HangmanVisual wrongGuesses={CONFIG.max_attempts - gameState.attemptsRemaining} />
          <div className={`mt-4 ${wordFontSize} font-mono font-bold tracking-widest uppercase dark:text-white`}>
            {gameState.currentWord?.italian.split('').map(c => gameState.guessedLetters.includes(c) ? c : '_').join(' ')}
          </div>
          <div className="mt-4 font-bold text-blue-600">{gameState.feedback}</div>
          <div className="mt-8"><Keyboard guessedLetters={gameState.guessedLetters} onLetterGuess={handleLetterGuess} disabled={gameState.gameStatus !== 'playing'} /></div>
        </div>
        
        <div className="mt-8 flex justify-center"><button onClick={handleHint} className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-xl font-bold">{t.hint_btn}</button></div>
        
        <AdBanner label={t.ad_label} />
        <GameModal gameState={gameState} language={language} t={t} isAudioLoading={isAudioLoading} onSpeak={speak} onNextWord={selectNewWord} />
        <GameMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} language={language} setLanguage={setLanguage} sfxEnabled={sfxEnabled} toggleSfx={toggleSfx} gameState={gameState} resetConfirm={resetConfirm} setResetConfirm={setResetConfirm} onReset={handleFullReset} t={t} />
      </main>
    </div>
  );
}
    