import { useState, useEffect, useMemo } from 'react';
import { CategoryEmoji, LETTER_NAMES_ITALIAN, Language, Word } from './types/index';
import { ITALIAN_ALPHABET, CONFIG } from './constants/index';
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

  // Typography scaling
  const wordLen = gameState.currentWord?.italian.length || 0;
  let wordFontSizeClass = 'text-4xl sm:text-5xl md:text-6xl';
  let wordContainerGap = 'gap-2 sm:gap-3';
  if (wordLen > 11) {
    wordFontSizeClass = 'text-lg sm:text-2xl md:text-3xl';
    wordContainerGap = 'gap-0.5';
  } else if (wordLen > 8) {
    wordFontSizeClass = 'text-xl sm:text-3xl md:text-4xl';
    wordContainerGap = 'gap-1';
  } else if (wordLen > 6) {
    wordFontSizeClass = 'text-3xl sm:text-4xl md:text-5xl';
    wordContainerGap = 'gap-2';
  }

  const displayWordAria = useMemo(() => {
    if (!gameState.currentWord) return '';
    return gameState.currentWord.italian
      .toLowerCase()
      .split('')
      .map((char) => (gameState.guessedLetters.includes(char) ? char : '_'))
      .join(' ');
  }, [gameState.currentWord, gameState.guessedLetters]);

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-950 pb-12 font-sans selection:bg-blue-200 dark:selection:bg-blue-800 transition-colors duration-300">
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 shadow-sm sticky top-0 z-20 px-4 py-3 sm:px-6 sm:py-4 flex flex-wrap items-center justify-between gap-y-2 transition-colors duration-300">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 dark:bg-blue-700 text-white p-2 rounded-lg shadow-sm">
            <span className="text-xl">🇮🇹</span>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-title text-blue-800 dark:text-blue-400 leading-none">Hangman</h1>
            <p className="text-xs text-blue-400 dark:text-blue-300 font-bold tracking-wider uppercase">{t.subtitle}</p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2 sm:gap-4 items-center ml-auto">
          {/* Stats Badges */}
          <div className="hidden sm:flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-800 shadow-sm" title={t.streak_title}>
            <span className="text-lg">🔥</span>
            <span className="font-bold text-sm">{gameState.streak}</span>
          </div>

          <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-3 py-1.5 rounded-full border border-yellow-200 dark:border-yellow-800 shadow-sm" title={t.stars_title}>
            <span className="text-lg">⭐</span>
            <span className="font-bold text-sm">{gameState.totalStars}</span>
          </div>

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

          {/* Action Buttons */}
          <button onClick={toggleTheme} className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          <button onClick={toggleFullScreen} className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 hidden sm:block">
            {isFullScreen ? '↙️' : '↗️'}
          </button>

          <button onClick={() => setIsMenuOpen(true)} className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700">
            ☰
          </button>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto mt-6 sm:mt-8 px-4">
        {/* Progress Bar */}
        <div className="mb-6 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-blue-50 dark:border-gray-800 transition-colors duration-300">
          <ProgressBar current={gameState.difficultyProgress[gameState.currentDifficulty] % CONFIG.words_per_difficulty_level} max={CONFIG.words_per_difficulty_level} label={`${t.level} ${gameState.currentDifficulty}`} />
        </div>

        {/* Main Game Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border-4 border-blue-100 dark:border-gray-800 p-6 md:p-10 text-center relative transition-colors duration-300">
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {/* Visual */}
            <div className="w-full md:w-1/3 flex justify-center">
              <HangmanVisual wrongGuesses={CONFIG.max_attempts - gameState.attemptsRemaining} />
            </div>

            {/* Word & Info */}
            <div className="w-full md:w-2/3 flex flex-col items-center gap-4">
              
              {/* Category Pill */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-300 uppercase tracking-widest text-xs font-bold transition-colors">
                <span className="text-lg">{CategoryEmoji[gameState.currentWord?.category as keyof typeof CategoryEmoji] || '🏷️'}</span>
                <span>{t.categories[gameState.currentWord?.category || ''] || gameState.currentWord?.category}</span>
              </div>

              {/* Word Display */}
              <div className={`${wordFontSizeClass} font-mono font-bold text-gray-800 dark:text-white w-full transition-colors flex flex-nowrap justify-center ${wordContainerGap}`} aria-label={`Current word: ${displayWordAria}`}>
                {gameState.currentWord?.italian.split('').map((char, index) => (
                    <span key={index} className="inline-block border-b-4 border-transparent">
                      {gameState.guessedLetters.includes(char) ? char.toUpperCase() : '_'}
                    </span>
                  ))}
              </div>

              {/* Feedback Area */}
              <div className="h-12 flex items-center justify-center w-full" aria-live="polite">
                <div className={`text-lg sm:text-xl font-bold transition-all px-4 py-1 rounded-lg 
                  ${gameState.feedback.includes('Bravissimo') || gameState.feedback.includes('Great') ? 'text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-900/50' : 
                    gameState.feedback.includes('Riprova') || gameState.feedback.includes('Try') ? 'text-red-500 dark:text-red-300 bg-red-50 dark:bg-red-900/50' : 
                    gameState.feedback ? 'text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/50' : ''}`}>
                  {gameState.feedback}
                </div>
              </div>

              {/* Hint Button */}
              <button onClick={handleHint} disabled={gameState.hintsUsed >= 2 || gameState.gameStatus !== 'playing'}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  gameState.hintsUsed >= 2 || gameState.gameStatus !== 'playing'
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/60 shadow-sm hover:shadow-md'
                }`}>
                <span>💡</span>
                {gameState.hintsUsed === 0 ? t.hint_btn : gameState.hintsUsed === 1 ? t.hint_btn_more : t.hint_btn_none}
              </button>
            </div>
          </div>

          {/* Keyboard */}
          <div className="mt-8 sm:mt-10">
            <Keyboard guessedLetters={gameState.guessedLetters} onLetterGuess={handleLetterGuess} disabled={gameState.gameStatus !== 'playing'} />
          </div>

          {/* Hearts / Attempts */}
          <div className="mt-8 flex justify-center gap-4 text-gray-600 dark:text-gray-400 font-medium text-sm">
            {t.attempts}:
            <div className="flex gap-1">
              {[...Array(gameState.attemptsRemaining)].map((_, i) => <span key={i} className="text-red-500">❤️</span>)}
              {[...Array(CONFIG.max_attempts - gameState.attemptsRemaining)].map((_, i) => <span key={`lost-${i}`} className="text-gray-300 dark:text-gray-700">🖤</span>)}
            </div>
          </div>
        </div>
        
        <AdBanner label={t.ad_label} />
        <GameModal gameState={gameState} language={language} t={t} isAudioLoading={isAudioLoading} onSpeak={speak} onNextWord={selectNewWord} />
        <GameMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} language={language} setLanguage={setLanguage} sfxEnabled={sfxEnabled} toggleSfx={toggleSfx} gameState={gameState} resetConfirm={resetConfirm} setResetConfirm={setResetConfirm} onReset={handleFullReset} t={t} />
      </main>

      <footer className="mt-8 text-center text-gray-400 dark:text-gray-500 text-sm px-4 pb-4 transition-colors">
        <p>{t.keyboard_msg}</p>
        <p className="mt-1 font-medium">{t.slogan}</p>
      </footer>
    </div>
  );
}
