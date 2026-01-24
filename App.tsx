
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameState, CategoryEmoji, LETTER_NAMES_ITALIAN, Language } from './types';
import { INITIAL_WORDS, ITALIAN_ALPHABET, CONFIG } from './constants';
import { TRANSLATIONS } from './translations';
import { HangmanVisual } from './components/HangmanVisual';
import { Keyboard } from './components/Keyboard';
import { AdBanner } from './components/AdBanner';
import { ProgressBar } from './components/ProgressBar';
import { speakWithGemini, speakInstant } from './services/geminiService';
import { playClickSound, playWinSound, playLoseSound } from './services/soundEffects';

export default function App() {
  // --- LANGUAGE MANAGEMENT ---
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('appLanguage');
    return (saved === 'it' || saved === 'en') ? saved : 'it';
  });

  const t = TRANSLATIONS[language];

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('appLanguage', lang);
  };

  // Theme Management
  const [theme, setTheme] = useState(() => {
    if (localStorage.getItem('theme')) {
      return localStorage.getItem('theme') as 'light' | 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // SFX Management
  const [sfxEnabled, setSfxEnabled] = useState(() => {
    const saved = localStorage.getItem('sfxEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleSfx = () => {
    setSfxEnabled((prev: boolean) => {
      const newValue = !prev;
      localStorage.setItem('sfxEnabled', JSON.stringify(newValue));
      return newValue;
    });
  };

  // Menu State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  // Load initial state from localStorage if available
  const getInitialState = (): GameState => {
    try {
      const saved = localStorage.getItem('italianHangmanState');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          currentWord: null,
          currentDifficulty: parsed.currentDifficulty || 'easy',
          wordsCompleted: parsed.wordsCompleted || 0,
          successCount: parsed.successCount || 0,
          guessedLetters: [],
          attemptsRemaining: CONFIG.max_attempts,
          gameStatus: 'new',
          wordsAttempted: parsed.wordsAttempted || [],
          difficultyProgress: parsed.difficultyProgress || { easy: 0, medium: 0, hard: 0 },
          feedback: '',
          streak: parsed.streak || 0,
          totalStars: parsed.totalStars || 0,
          hintsUsed: 0
        };
      }
    } catch (e) {
      console.error("Failed to load save state", e);
    }
    
    return {
      currentWord: null,
      currentDifficulty: 'easy',
      wordsCompleted: 0,
      successCount: 0,
      guessedLetters: [],
      attemptsRemaining: CONFIG.max_attempts,
      gameStatus: 'new',
      wordsAttempted: [],
      difficultyProgress: { easy: 0, medium: 0, hard: 0 },
      feedback: '',
      streak: 0,
      totalStars: 0,
      hintsUsed: 0
    };
  };

  const [gameState, setGameState] = useState<GameState>(getInitialState);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const stateRef = useRef(gameState);
  
  // Persist state changes
  useEffect(() => {
    stateRef.current = gameState;
    localStorage.setItem('italianHangmanState', JSON.stringify({
      currentDifficulty: gameState.currentDifficulty,
      wordsCompleted: gameState.wordsCompleted,
      successCount: gameState.successCount,
      wordsAttempted: gameState.wordsAttempted,
      difficultyProgress: gameState.difficultyProgress,
      streak: gameState.streak,
      totalStars: gameState.totalStars
    }));
  }, [gameState]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable full-screen mode: ${e.message}`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  const handleResetGame = () => {
    localStorage.removeItem('italianHangmanState');
    setGameState({
      currentWord: null,
      currentDifficulty: 'easy',
      wordsCompleted: 0,
      successCount: 0,
      guessedLetters: [],
      attemptsRemaining: CONFIG.max_attempts,
      gameStatus: 'new',
      wordsAttempted: [],
      difficultyProgress: { easy: 0, medium: 0, hard: 0 },
      feedback: '',
      streak: 0,
      totalStars: 0,
      hintsUsed: 0
    });
    setResetConfirm(false);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handler = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const handleSpeak = async (text: string, lang: 'it' | 'en') => {
    if (CONFIG.enable_audio) {
      setIsAudioLoading(true);
      try {
        if (lang === 'it') {
          // Usa Gemini service (che include fallback)
          await speakWithGemini(text, lang);
        } else {
          // Usa browser nativo per inglese
          speakInstant(text, lang);
        }
      } finally {
        setIsAudioLoading(false);
      }
    }
  };

  const selectNewWord = useCallback(() => {
    let availableWords = INITIAL_WORDS.filter(
      (w) =>
        w.difficulty === stateRef.current.currentDifficulty &&
        !stateRef.current.wordsAttempted.includes(w.italian)
    );

    if (availableWords.length === 0) {
      let nextDiff = stateRef.current.currentDifficulty;
      if (nextDiff === 'easy') nextDiff = 'medium';
      else if (nextDiff === 'medium') nextDiff = 'hard';
      else nextDiff = 'easy';

      const nextWords = INITIAL_WORDS.filter((w) => w.difficulty === nextDiff);
      const attemptedInNext = stateRef.current.wordsAttempted; 
      availableWords = nextWords.filter(w => !attemptedInNext.includes(w.italian));
      
      if (availableWords.length === 0) {
         availableWords = nextWords;
      }
      
      setGameState(prev => ({ ...prev, currentDifficulty: nextDiff }));
    }

    const selectedWord = availableWords[Math.floor(Math.random() * availableWords.length)];

    setGameState((prev) => ({
      ...prev,
      currentWord: selectedWord,
      guessedLetters: [],
      attemptsRemaining: CONFIG.max_attempts,
      gameStatus: 'playing',
      feedback: '',
      hintsUsed: 0
    }));
  }, []);

  const handleHint = () => {
    const state = stateRef.current;
    if (!state.currentWord || state.gameStatus !== 'playing') return;
    if (state.hintsUsed >= 2) return;
    
    if (sfxEnabled) playClickSound();

    const newHintLevel = state.hintsUsed + 1;
    let feedbackMsg = '';
    let newGuessedLetters = [...state.guessedLetters];
    
    const currentT = TRANSLATIONS[language]; 

    if (newHintLevel === 1) {
      const categoryName = currentT.categories[state.currentWord.category] || state.currentWord.category;
      if (language === 'it') {
         feedbackMsg = state.currentWord.hint || `${currentT.hint_intro_generic} ${categoryName}...`;
      } else {
         feedbackMsg = `${currentT.hint_intro_generic} ${categoryName}...`;
      }

    } else if (newHintLevel === 2) {
      const targetWord = state.currentWord.italian.toLowerCase();
      const unrevealedConsonants = targetWord.split('').filter(char => 
        !state.guessedLetters.includes(char) && 
        ITALIAN_ALPHABET.includes(char) &&
        !'aeiou'.includes(char)
      );

      if (unrevealedConsonants.length > 0) {
        const randomConsonant = unrevealedConsonants[Math.floor(Math.random() * unrevealedConsonants.length)];
        newGuessedLetters.push(randomConsonant);
        feedbackMsg = `${currentT.hint_intro_letter}: ${randomConsonant.toUpperCase()}`;
        
        const allLettersGuessed = targetWord
          .split('')
          .every((char) => newGuessedLetters.includes(char) || char === ' ' || char === '-');
          
        if (allLettersGuessed) {
           handleGameWin(newGuessedLetters);
           return;
        }
      } else {
        feedbackMsg = currentT.hint_no_consonants;
      }
    }

    setGameState(prev => ({
      ...prev,
      hintsUsed: newHintLevel,
      guessedLetters: newGuessedLetters,
      feedback: feedbackMsg
    }));
  };

  const handleGameWin = (finalGuessedLetters: string[]) => {
    const state = stateRef.current;
    const currentT = TRANSLATIONS[language];
    
    if (sfxEnabled) playWinSound();

    const errors = CONFIG.max_attempts - state.attemptsRemaining;
    let starsEarned = 1;
    if (errors === 0) starsEarned = 3;
    else if (errors <= 2) starsEarned = 2;

    const newDiffProgress = { ...state.difficultyProgress };
    newDiffProgress[state.currentDifficulty] += 1;

    let nextDifficulty = state.currentDifficulty;
    if (newDiffProgress[state.currentDifficulty] >= CONFIG.words_per_difficulty_level) {
      if (state.currentDifficulty === 'easy') nextDifficulty = 'medium';
      else if (state.currentDifficulty === 'medium') nextDifficulty = 'hard';
    }

    setGameState(prev => ({
      ...prev,
      guessedLetters: finalGuessedLetters,
      gameStatus: 'won',
      successCount: prev.successCount + 1,
      wordsCompleted: prev.wordsCompleted + 1,
      wordsAttempted: [...prev.wordsAttempted, prev.currentWord!.italian],
      difficultyProgress: newDiffProgress,
      currentDifficulty: nextDifficulty,
      feedback: `${currentT.win_msg} 🎉`,
      streak: prev.streak + 1,
      totalStars: prev.totalStars + starsEarned
    }));

    if (CONFIG.enable_audio && state.currentWord) {
      handleSpeak(state.currentWord.italian, 'it');
      // Ritardo per l'inglese leggermente aumentato per non sovrapporsi
      setTimeout(() => handleSpeak(state.currentWord!.english, 'en'), 1500);
    }
  };

  const handleLetterGuess = useCallback((letter: string) => {
    const state = stateRef.current;
    
    if (!state.currentWord || state.gameStatus !== 'playing') return;
    if (state.guessedLetters.includes(letter)) return;

    if (sfxEnabled) playClickSound();

    if (CONFIG.enable_audio) {
      const letterName = LETTER_NAMES_ITALIAN[letter] || letter;
      // Lettere sono brevi, usiamo instant per reattività
      speakInstant(letterName, 'it');
    }

    const newGuessedLetters = [...state.guessedLetters, letter];
    const targetWord = state.currentWord.italian.toLowerCase();
    const isCorrect = targetWord.includes(letter);

    let nextAttempts = state.attemptsRemaining;
    if (!isCorrect) {
      nextAttempts -= 1;
    }

    const allLettersGuessed = targetWord
      .split('')
      .every((char) => newGuessedLetters.includes(char) || char === ' ' || char === '-');

    if (allLettersGuessed) {
      handleGameWin(newGuessedLetters);
    } else if (nextAttempts <= 0) {
      if (sfxEnabled) playLoseSound();
      setGameState(prev => ({
        ...prev,
        guessedLetters: newGuessedLetters,
        attemptsRemaining: 0,
        gameStatus: 'lost',
        wordsCompleted: prev.wordsCompleted + 1,
        wordsAttempted: [...prev.wordsAttempted, prev.currentWord!.italian],
        feedback: TRANSLATIONS[language].feedback_try_again,
        streak: 0
      }));
      
      if (CONFIG.enable_audio) {
        handleSpeak(state.currentWord.italian, 'it');
        setTimeout(() => handleSpeak(state.currentWord!.english, 'en'), 1500);
      }
    } else {
      setGameState(prev => ({
        ...prev,
        guessedLetters: newGuessedLetters,
        attemptsRemaining: nextAttempts,
        feedback: isCorrect ? TRANSLATIONS[language].feedback_good : TRANSLATIONS[language].feedback_bad
      }));
    }
  }, [language, sfxEnabled]); 

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const key = e.key.toLowerCase();
      if (ITALIAN_ALPHABET.includes(key)) {
        handleLetterGuess(key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleLetterGuess]);

  useEffect(() => {
    if (!gameState.currentWord) {
      selectNewWord();
    }
  }, [selectNewWord, gameState.currentWord]);

  const displayWord = useMemo(() => {
    if (!gameState.currentWord) return '';
    return gameState.currentWord.italian.toLowerCase().split('').map(char => 
      gameState.guessedLetters.includes(char) ? char.toUpperCase() : '_'
    ).join(' ');
  }, [gameState.currentWord, gameState.guessedLetters]);

  // Determine dynamic font size based on word length
  const wordLen = gameState.currentWord?.italian.length || 0;
  let wordFontSizeClass = "text-4xl sm:text-5xl md:text-6xl";
  if (wordLen > 10) {
    wordFontSizeClass = "text-lg sm:text-3xl md:text-4xl";
  } else if (wordLen > 7) {
    wordFontSizeClass = "text-2xl sm:text-4xl md:text-5xl";
  }

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-950 pb-12 font-sans selection:bg-blue-200 dark:selection:bg-blue-800 transition-colors duration-300">
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 shadow-sm sticky top-0 z-20 px-4 py-3 sm:px-6 sm:py-4 flex flex-wrap items-center justify-between gap-y-2 transition-colors duration-300">
        <div className="flex items-center gap-2">
           <div className="bg-blue-600 dark:bg-blue-700 text-white p-2 rounded-lg shadow-sm" aria-hidden="true">
             <span className="text-xl">🇮🇹</span>
           </div>
           <div>
             <h1 className="text-xl sm:text-2xl font-title text-blue-800 dark:text-blue-400 leading-none">Hangman</h1>
             <p className="text-xs text-blue-400 dark:text-blue-300 font-bold tracking-wider uppercase">{t.subtitle}</p>
           </div>
        </div>
        
        <nav className="flex flex-wrap gap-2 sm:gap-4 items-center ml-auto" aria-label="Game Stats and Settings">
          {/* Streak Badge */}
          <div className="hidden sm:flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-800 shadow-sm" title={t.streak_title}>
             <span className="text-lg" aria-hidden="true">🔥</span>
             <span className="font-bold text-sm" aria-label={`${gameState.streak} day streak`}>{gameState.streak}</span>
          </div>

          {/* Stars Badge */}
          <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-3 py-1.5 rounded-full border border-yellow-200 dark:border-yellow-800 shadow-sm" title={t.stars_title}>
             <span className="text-lg" aria-hidden="true">⭐</span>
             <span className="font-bold text-sm" aria-label={`${gameState.totalStars} total stars`}>{gameState.totalStars}</span>
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
            title={theme === 'light' ? t.theme_dark : t.theme_light}
            aria-label={theme === 'light' ? t.theme_dark : t.theme_light}
          >
             {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
             ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
             )}
          </button>
          
          <button 
            onClick={toggleFullScreen}
            className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
            title={isFullScreen ? t.fullscreen_off : t.fullscreen_on}
            aria-label={isFullScreen ? t.fullscreen_off : t.fullscreen_on}
          >
            {isFullScreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
            )}
          </button>

          {/* Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
            title={t.menu}
            aria-label={t.menu}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto mt-6 sm:mt-8 px-4">
        {/* Progress Bar for Current Level */}
        <div className="mb-6 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-blue-50 dark:border-gray-800 transition-colors duration-300">
          <ProgressBar 
            current={gameState.difficultyProgress[gameState.currentDifficulty] % CONFIG.words_per_difficulty_level} 
            max={CONFIG.words_per_difficulty_level} 
            label={`${t.level} ${gameState.currentDifficulty}`}
          />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border-4 border-blue-100 dark:border-gray-800 p-6 md:p-10 text-center relative transition-colors duration-300">
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="w-full md:w-1/3 flex justify-center">
               <HangmanVisual wrongGuesses={CONFIG.max_attempts - gameState.attemptsRemaining} />
            </div>

            <div className="w-full md:w-2/3 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-300 uppercase tracking-widest text-xs font-bold transition-colors">
                <span className="text-lg">{CategoryEmoji[gameState.currentWord?.category as keyof typeof CategoryEmoji] || '🏷️'}</span>
                <span>{t.categories[gameState.currentWord?.category || ''] || gameState.currentWord?.category}</span>
              </div>
              
              <div 
                className={`${wordFontSizeClass} font-mono font-bold tracking-[0.15em] text-gray-800 dark:text-white w-full transition-colors whitespace-nowrap`}
                aria-label={`Current word: ${displayWord}`}
              >
                {displayWord}
              </div>

              <div className="h-12 flex items-center justify-center w-full" aria-live="polite">
                <div className={`text-lg sm:text-xl font-bold transition-all px-4 py-1 rounded-lg ${
                   gameState.feedback.includes('Bravissimo') || gameState.feedback.includes('Great') || gameState.feedback.includes('Ottimo') ? 'text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-900/50' : 
                   gameState.feedback.includes('Riprova') || gameState.feedback.includes('Try') ? 'text-red-500 dark:text-red-300 bg-red-50 dark:bg-red-900/50' :
                   gameState.feedback ? 'text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/50' : ''
                }`}>
                  {gameState.feedback}
                </div>
              </div>

               {/* Hint Button */}
               <button
                  onClick={handleHint}
                  disabled={gameState.hintsUsed >= 2 || gameState.gameStatus !== 'playing'}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
                    ${gameState.hintsUsed >= 2 || gameState.gameStatus !== 'playing'
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/60 shadow-sm hover:shadow-md'
                    }
                  `}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                  </svg>
                  {gameState.hintsUsed === 0 ? t.hint_btn : gameState.hintsUsed === 1 ? t.hint_btn_more : t.hint_btn_none}
                </button>
            </div>
          </div>

          <div className="mt-8 sm:mt-10">
            <Keyboard 
              guessedLetters={gameState.guessedLetters} 
              onLetterGuess={handleLetterGuess}
              disabled={gameState.gameStatus !== 'playing'}
            />
          </div>

          <div className="mt-8 flex justify-center gap-4 text-gray-600 dark:text-gray-400 font-medium text-sm">
             {t.attempts}: 
             <div className="flex gap-1">
               {[...Array(gameState.attemptsRemaining)].map((_, i) => (
                 <span key={i} className="text-red-500">❤️</span>
               ))}
               {[...Array(CONFIG.max_attempts - gameState.attemptsRemaining)].map((_, i) => (
                 <span key={`lost-${i}`} className="text-gray-300 dark:text-gray-700">🖤</span>
               ))}
             </div>
          </div>
        </div>

        {/* Ad Space */}
        <AdBanner label={t.ad_label} />

        {(gameState.gameStatus === 'won' || gameState.gameStatus === 'lost') && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300" role="dialog" aria-labelledby="modal-title">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl scale-100 animate-in zoom-in-95 duration-300 relative overflow-hidden transition-colors">
              
              {/* Confetti Background for Win */}
              {gameState.gameStatus === 'won' && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
                  <div className="absolute top-0 left-10 w-4 h-4 bg-red-400 rounded-full animate-bounce delay-100"></div>
                  <div className="absolute top-10 right-10 w-3 h-3 bg-blue-400 rounded-full animate-bounce delay-300"></div>
                  <div className="absolute bottom-20 left-1/2 w-5 h-5 bg-yellow-400 rounded-full animate-bounce delay-500"></div>
                  <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                </div>
              )}

              <div className="text-7xl mb-4 animate-bounce filter drop-shadow-lg">
                {gameState.gameStatus === 'won' ? '🏆' : '😿'}
              </div>
              
              <h2 id="modal-title" className={`text-4xl font-title mb-2 ${gameState.gameStatus === 'won' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {gameState.gameStatus === 'won' ? t.win_title : t.lose_title}
              </h2>
              
              {gameState.gameStatus === 'won' && (
                <div className="flex justify-center gap-1 mb-4">
                  {[...Array(3)].map((_, i) => (
                     <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${
                       i < (gameState.attemptsRemaining >= 4 ? 3 : gameState.attemptsRemaining >= 2 ? 2 : 1) 
                       ? 'text-yellow-400 fill-current' 
                       : 'text-gray-200 dark:text-gray-700 fill-current'
                     }`} viewBox="0 0 20 20">
                       <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                     </svg>
                  ))}
                </div>
              )}

              <div className="bg-blue-50 dark:bg-gray-800 rounded-2xl p-4 my-6 border border-blue-100 dark:border-gray-700 relative transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-blue-400 dark:text-blue-300 uppercase font-bold tracking-wider">{t.italian_label}</span>
                  <button 
                    onClick={() => handleSpeak(gameState.currentWord!.italian, 'it')} 
                    className={`p-1 hover:bg-blue-100 dark:hover:bg-gray-700 rounded-full text-blue-500 dark:text-blue-300 transition-colors ${isAudioLoading ? 'opacity-50 cursor-wait' : ''}`}
                    disabled={isAudioLoading}
                  >
                    {isAudioLoading ? (
                      <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="text-3xl font-bold text-gray-800 dark:text-white mb-3 uppercase tracking-widest transition-colors">
                  {gameState.currentWord?.italian}
                </div>
                <div className="border-t border-blue-200 dark:border-gray-700 pt-3 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-purple-400 dark:text-purple-300 uppercase font-bold tracking-wider">{t.english_label}</span>
                    <button onClick={() => speakInstant(gameState.currentWord!.english, 'en')} className="p-1 hover:bg-purple-100 dark:hover:bg-gray-700 rounded-full text-purple-500 dark:text-purple-300 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-xl font-medium text-blue-700 dark:text-blue-300 capitalize transition-colors">
                    {gameState.currentWord?.english}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={selectNewWord}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-600 dark:to-blue-800 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-lg flex items-center justify-center gap-2"
                >
                  <span>{t.next_word}</span>
                  <span>🚀</span>
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Menu Modal */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in" role="dialog" aria-labelledby="menu-title">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-sm w-full p-6 border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 id="menu-title" className="text-xl font-bold text-gray-800 dark:text-white">{t.menu}</h2>
              <button onClick={() => {setIsMenuOpen(false); setResetConfirm(false);}} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500" aria-label="Close menu">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Language Selector in Menu */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700" role="group" aria-label="Language selection">
                <button 
                  onClick={() => changeLanguage('it')} 
                  aria-pressed={language === 'it'}
                  className={`py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${language === 'it' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  <span className="text-base">🇮🇹</span>
                  <span>{t.italian_label}</span>
                </button>
                <button 
                  onClick={() => changeLanguage('en')} 
                  aria-pressed={language === 'en'}
                  className={`py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${language === 'en' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  <span className="text-base">🇬🇧</span>
                  <span>{t.english_label}</span>
                </button>
              </div>

              {/* Settings Group */}
              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2 text-xs uppercase tracking-wide px-1">{t.settings}</h3>
                <div className="flex items-center justify-between px-1">
                  <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">{t.sfx_label}</span>
                  <button 
                    onClick={toggleSfx}
                    role="switch"
                    aria-checked={sfxEnabled}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${sfxEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${sfxEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {!resetConfirm ? (
                <button 
                  onClick={() => setResetConfirm(true)}
                  className="w-full p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2 border border-red-100 dark:border-red-900/50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {t.reset_btn}
                </button>
              ) : (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/50" role="alert">
                  <p className="text-red-800 dark:text-red-200 font-medium text-center mb-3">{t.reset_confirm}</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setResetConfirm(false)}
                      className="flex-1 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {t.no_cancel}
                    </button>
                    <button 
                      onClick={handleResetGame}
                      className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold shadow-sm"
                    >
                      {t.yes_reset}
                    </button>
                  </div>
                </div>
              )}
              
              <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-xl">
                 <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2 text-sm uppercase tracking-wide">{t.stats_title}</h3>
                 <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">{t.stats_level}</p>
                        <p className="font-bold text-gray-800 dark:text-white capitalize">{gameState.currentDifficulty}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">{t.stats_found}</p>
                        <p className="font-bold text-gray-800 dark:text-white">{gameState.successCount}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">{t.stats_stars}</p>
                        <p className="font-bold text-yellow-500 flex items-center gap-1">{gameState.totalStars} <span aria-hidden="true">⭐</span></p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">{t.stats_streak}</p>
                        <p className="font-bold text-orange-500 flex items-center gap-1">{gameState.streak} <span aria-hidden="true">🔥</span></p>
                    </div>
                 </div>
              </div>

              <div className="text-center text-xs text-gray-400 mt-4">
                 v1.1.0 • Italian Hangman
              </div>
            </div>
          </div>
        </div>
      )}
      </main>

      <footer className="mt-8 text-center text-gray-400 dark:text-gray-500 text-sm px-4 pb-4 transition-colors">
        <p>{t.keyboard_msg}</p>
        <p className="mt-1 font-medium">{t.slogan}</p>
      </footer>
    </div>
  );
}
