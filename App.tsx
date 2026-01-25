import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameState, CategoryEmoji, LETTER_NAMES_ITALIAN, Language } from './types';
import { INITIAL_WORDS, ITALIAN_ALPHABET, CONFIG } from './constants';
import { TRANSLATIONS } from './translations';
import { HangmanVisual } from './components/HangmanVisual';
import { Keyboard } from './components/Keyboard';
import { AdBanner } from './components/AdBanner';
import { ProgressBar } from './components/ProgressBar';
import { speakWithGemini, speakInstant, preloadAudio } from './services/geminiService';
import { playClickSound, playWinSound, playLoseSound } from './services/soundEffects';

export default function App() {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('appLanguage');
    return (saved === 'it' || saved === 'en') ? saved : 'it';
  });

  const t = TRANSLATIONS[language];

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('appLanguage', lang);
  };

  const [theme, setTheme] = useState(() => {
    if (localStorage.getItem('theme')) {
      return localStorage.getItem('theme') as 'light' | 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

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

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

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
      currentWord: null, currentDifficulty: 'easy', wordsCompleted: 0, successCount: 0,
      guessedLetters: [], attemptsRemaining: CONFIG.max_attempts, gameStatus: 'new',
      wordsAttempted: [], difficultyProgress: { easy: 0, medium: 0, hard: 0 },
      feedback: '', streak: 0, totalStars: 0, hintsUsed: 0
    };
  };

  const [gameState, setGameState] = useState<GameState>(getInitialState);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const stateRef = useRef(gameState);
  
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
      document.documentElement.requestFullscreen().catch(e => console.error(e));
      setIsFullScreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  const handleResetGame = () => {
    localStorage.removeItem('italianHangmanState');
    setGameState({
      currentWord: null, currentDifficulty: 'easy', wordsCompleted: 0, successCount: 0,
      guessedLetters: [], attemptsRemaining: CONFIG.max_attempts, gameStatus: 'new',
      wordsAttempted: [], difficultyProgress: { easy: 0, medium: 0, hard: 0 },
      feedback: '', streak: 0, totalStars: 0, hintsUsed: 0
    });
    setResetConfirm(false);
    setIsMenuOpen(false);
  };

  const handleSpeak = async (text: string, lang: 'it' | 'en') => {
    if (CONFIG.enable_audio) {
      setIsAudioLoading(true);
      try {
        if (lang === 'it') await speakWithGemini(text, lang);
        else speakInstant(text, lang);
      } finally {
        setIsAudioLoading(false);
      }
    }
  };

  const selectNewWord = useCallback(() => {
    let availableWords = INITIAL_WORDS.filter(
      (w) => w.difficulty === stateRef.current.currentDifficulty && !stateRef.current.wordsAttempted.includes(w.italian)
    );

    if (availableWords.length === 0) {
      let nextDiff = stateRef.current.currentDifficulty;
      if (nextDiff === 'easy') nextDiff = 'medium';
      else if (nextDiff === 'medium') nextDiff = 'hard';
      else nextDiff = 'easy';
      const nextWords = INITIAL_WORDS.filter((w) => w.difficulty === nextDiff);
      availableWords = nextWords.filter(w => !stateRef.current.wordsAttempted.includes(w.italian));
      if (availableWords.length === 0) availableWords = nextWords;
      setGameState(prev => ({ ...prev, currentDifficulty: nextDiff }));
    }

    const selectedWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    if (CONFIG.enable_audio && selectedWord) preloadAudio(selectedWord.italian, 'it');

    setGameState((prev) => ({
      ...prev, currentWord: selectedWord, guessedLetters: [],
      attemptsRemaining: CONFIG.max_attempts, gameStatus: 'playing',
      feedback: '', hintsUsed: 0
    }));
  }, []);

  const handleHint = () => {
    const state = stateRef.current;
    if (!state.currentWord || state.gameStatus !== 'playing' || state.hintsUsed >= 2) return;
    if (sfxEnabled) playClickSound();

    const newHintLevel = state.hintsUsed + 1;
    let feedbackMsg = '';
    let newGuessedLetters = [...state.guessedLetters];
    
    if (newHintLevel === 1) {
      const categoryName = t.categories[state.currentWord.category] || state.currentWord.category;
      feedbackMsg = language === 'it' ? (state.currentWord.hint || `${t.hint_intro_generic} ${categoryName}...`) : `${t.hint_intro_generic} ${categoryName}...`;
    } else if (newHintLevel === 2) {
      const targetWord = state.currentWord.italian.toLowerCase();
      const unrevealedConsonants = targetWord.split('').filter(char => 
        !state.guessedLetters.includes(char) && ITALIAN_ALPHABET.includes(char) && !'aeiou'.includes(char)
      );
      if (unrevealedConsonants.length > 0) {
        const randomConsonant = unrevealedConsonants[Math.floor(Math.random() * unrevealedConsonants.length)];
        newGuessedLetters.push(randomConsonant);
        feedbackMsg = `${t.hint_intro_letter}: ${randomConsonant.toUpperCase()}`;
        if (targetWord.split('').every((char) => newGuessedLetters.includes(char) || char === ' ' || char === '-')) {
          handleGameWin(newGuessedLetters);
          return;
        }
      } else { feedbackMsg = t.hint_no_consonants; }
    }
    setGameState(prev => ({ ...prev, hintsUsed: newHintLevel, guessedLetters: newGuessedLetters, feedback: feedbackMsg }));
  };

  const handleGameWin = (finalGuessedLetters: string[]) => {
    if (sfxEnabled) playWinSound();
    const errors = CONFIG.max_attempts - stateRef.current.attemptsRemaining;
    const starsEarned = errors === 0 ? 3 : errors <= 2 ? 2 : 1;
    const newDiffProgress = { ...stateRef.current.difficultyProgress };
    newDiffProgress[stateRef.current.currentDifficulty] += 1;

    let nextDiff = stateRef.current.currentDifficulty;
    if (newDiffProgress[stateRef.current.currentDifficulty] >= CONFIG.words_per_difficulty_level) {
      if (stateRef.current.currentDifficulty === 'easy') nextDiff = 'medium';
      else if (stateRef.current.currentDifficulty === 'medium') nextDiff = 'hard';
    }

    setGameState(prev => ({
      ...prev, guessedLetters: finalGuessedLetters, gameStatus: 'won',
      successCount: prev.successCount + 1, wordsCompleted: prev.wordsCompleted + 1,
      wordsAttempted: [...prev.wordsAttempted, prev.currentWord!.italian],
      difficultyProgress: newDiffProgress, currentDifficulty: nextDiff,
      feedback: `${t.win_msg} 🎉`, streak: prev.streak + 1, totalStars: prev.totalStars + starsEarned
    }));

    if (CONFIG.enable_audio && stateRef.current.currentWord) {
      handleSpeak(stateRef.current.currentWord.italian, 'it');
      setTimeout(() => handleSpeak(stateRef.current.currentWord!.english, 'en'), 3000);
    }
  };

  const handleLetterGuess = useCallback((letter: string) => {
    if (!stateRef.current.currentWord || stateRef.current.gameStatus !== 'playing' || stateRef.current.guessedLetters.includes(letter)) return;
    if (sfxEnabled) playClickSound();
    if (CONFIG.enable_audio) speakInstant(LETTER_NAMES_ITALIAN[letter] || letter, 'it');

    const newGuessedLetters = [...stateRef.current.guessedLetters, letter];
    const targetWord = stateRef.current.currentWord.italian.toLowerCase();
    const isCorrect = targetWord.includes(letter);
    const nextAttempts = stateRef.current.attemptsRemaining - (isCorrect ? 0 : 1);

    if (targetWord.split('').every((char) => newGuessedLetters.includes(char) || char === ' ' || char === '-')) {
      handleGameWin(newGuessedLetters);
    } else if (nextAttempts <= 0) {
      if (sfxEnabled) playLoseSound();
      setGameState(prev => ({
        ...prev, guessedLetters: newGuessedLetters, attemptsRemaining: 0,
        gameStatus: 'lost', wordsCompleted: prev.wordsCompleted + 1,
        wordsAttempted: [...prev.wordsAttempted, prev.currentWord!.italian],
        feedback: t.feedback_try_again, streak: 0
      }));
      if (CONFIG.enable_audio) {
        handleSpeak(stateRef.current.currentWord.italian, 'it');
        setTimeout(() => handleSpeak(stateRef.current.currentWord!.english, 'en'), 3000);
      }
    } else {
      setGameState(prev => ({
        ...prev, guessedLetters: newGuessedLetters, attemptsRemaining: nextAttempts,
        feedback: isCorrect ? t.feedback_good : t.feedback_bad
      }));
    }
  }, [language, sfxEnabled, t]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const key = e.key.toLowerCase();
      if (ITALIAN_ALPHABET.includes(key)) handleLetterGuess(key);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleLetterGuess]);

  useEffect(() => { if (!gameState.currentWord) selectNewWord(); }, [selectNewWord, gameState.currentWord]);

  const wordLen = gameState.currentWord?.italian.length || 0;
  let wordFontSizeClass = "text-4xl sm:text-5xl md:text-6xl";
  let wordContainerGap = "gap-2 sm:gap-3";
  if (wordLen > 11) { wordFontSizeClass = "text-xl sm:text-2xl md:text-3xl"; wordContainerGap = "gap-0.5"; }
  else if (wordLen > 8) { wordFontSizeClass = "text-2xl sm:text-3xl md:text-4xl"; wordContainerGap = "gap-1"; }

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-950 pb-12 font-sans selection:bg-blue-200 dark:selection:bg-blue-800 transition-colors duration-300">
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 shadow-sm sticky top-0 z-20 px-4 py-3 sm:px-6 sm:py-4 flex flex-wrap items-center justify-between gap-y-2 transition-colors">
        <div className="flex items-center gap-2">
           <div className="bg-blue-600 dark:bg-blue-700 text-white p-2 rounded-lg shadow-sm" aria-hidden="true">
             <span className="text-xl">🇮🇹</span>
           </div>
           <div>
             <h1 className="text-xl sm:text-2xl font-title text-blue-800 dark:text-blue-400 leading-none">Hangman</h1>
             <p className="text-xs text-blue-400 dark:text-blue-300 font-bold tracking-wider uppercase">{t.subtitle}</p>
           </div>
        </div>
        
        <nav className="flex flex-wrap gap-2 sm:gap-4 items-center ml-auto">
          <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 px-3 py-1.5 rounded-full border border-orange-200 shadow-sm">
             <span className="text-lg">🔥</span><span className="font-bold text-sm">{gameState.streak}</span>
          </div>
          <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-3 py-1.5 rounded-full border border-yellow-200 shadow-sm">
             <span className="text-lg">⭐</span><span className="font-bold text-sm">{gameState.totalStars}</span>
          </div>
          <button onClick={toggleTheme} className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-500 rounded-xl border border-gray-200 dark:border-gray-700">
             {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button onClick={() => setIsMenuOpen(true)} className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-500 rounded-xl border border-gray-200 dark:border-gray-700">
            ☰
          </button>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto mt-6 sm:mt-8 px-4">
        <div className="mb-6 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-blue-50 dark:border-gray-800 transition-colors">
          <ProgressBar 
            current={gameState.difficultyProgress[gameState.currentDifficulty] % CONFIG.words_per_difficulty_level} 
            max={CONFIG.words_per_difficulty_level} 
            label={`${t.level} ${gameState.currentDifficulty}`}
          />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border-4 border-blue-100 dark:border-gray-800 p-6 md:p-10 text-center transition-colors">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="w-full md:w-1/3 flex justify-center">
               <HangmanVisual wrongGuesses={CONFIG.max_attempts - gameState.attemptsRemaining} />
            </div>

            <div className="w-full md:w-2/3 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700 text-gray-500 uppercase tracking-widest text-xs font-bold">
                <span className="text-lg">{CategoryEmoji[gameState.currentWord?.category as keyof typeof CategoryEmoji] || '🏷️'}</span>
                <span>{t.categories[gameState.currentWord?.category || '']}</span>
              </div>
              
              <div className={`${wordFontSizeClass} font-mono font-bold text-gray-800 dark:text-white w-full transition-all flex flex-nowrap justify-center ${wordContainerGap}`}>
                {gameState.currentWord?.italian.toLowerCase().split('').map((char, index) => (
                  <span key={index} className="word-letter">
                    {gameState.guessedLetters.includes(char) ? char.toUpperCase() : '_'}
                  </span>
                ))}
              </div>

              <div className="h-12 flex items-center justify-center w-full">
                <div className={`text-lg sm:text-xl font-bold transition-all px-4 py-1 rounded-lg ${
                   gameState.feedback.includes('Bravo') || gameState.feedback.includes('Ottimo') ? 'text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-900/40' : 
                   gameState.feedback ? 'text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40' : ''
                }`}>
                  {gameState.feedback}
                </div>
              </div>

               <button
                  onClick={handleHint}
                  disabled={gameState.hintsUsed >= 2 || gameState.gameStatus !== 'playing'}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm ${gameState.hintsUsed >= 2 || gameState.gameStatus !== 'playing' ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 active:scale-95'}`}
                >
                  💡 {gameState.hintsUsed === 0 ? t.hint_btn : gameState.hintsUsed === 1 ? t.hint_btn_more : t.hint_btn_none}
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
               {[...Array(gameState.attemptsRemaining)].map((_, i) => <span key={i} className="text-red-500 animate-pulse">❤️</span>)}
               {[...Array(CONFIG.max_attempts - gameState.attemptsRemaining)].map((_, i) => <span key={i} className="text-gray-300 dark:text-gray-700">🖤</span>)}
             </div>
          </div>
        </div>

        <AdBanner label={t.ad_label} />

        {(gameState.gameStatus === 'won' || gameState.gameStatus === 'lost') && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl scale-100 animate-in zoom-in-95 duration-300">
              <div className="text-7xl mb-4 animate-bounce-slow">
                {gameState.gameStatus === 'won' ? '🏆' : '😿'}
              </div>
              <h2 className={`text-4xl font-title mb-2 ${gameState.gameStatus === 'won' ? 'text-green-600 dark:text-green-400' : 'text-orange-600'}`}>
                {gameState.gameStatus === 'won' ? t.win_title : t.lose_title}
              </h2>
              <div className="bg-blue-50 dark:bg-gray-800 rounded-2xl p-5 my-6 border border-blue-100 dark:border-gray-700">
                <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2 uppercase tracking-widest">{gameState.currentWord?.italian}</div>
                <div className="text-xl font-medium text-blue-700 dark:text-blue-300 capitalize">{gameState.currentWord?.english}</div>
              </div>
              <button onClick={selectNewWord} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                {t.next_word} 🚀
              </button>
            </div>
          </div>
        )}

      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-sm w-full p-6 border dark:border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{t.menu}</h2>
              <button onClick={() => {setIsMenuOpen(false); setResetConfirm(false);}} className="text-gray-500">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <button onClick={() => changeLanguage('it')} className={`py-2 rounded-lg text-sm font-bold ${language === 'it' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600' : 'text-gray-500'}`}>🇮🇹 {t.italian_label}</button>
                <button onClick={() => changeLanguage('en')} className={`py-2 rounded-lg text-sm font-bold ${language === 'en' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600' : 'text-gray-500'}`}>🇬🇧 {t.english_label}</button>
              </div>
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
                <span className="text-sm font-medium">{t.sfx_label}</span>
                <button onClick={toggleSfx} className={`w-12 h-6 rounded-full relative transition-colors ${sfxEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${sfxEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              {!resetConfirm ? (
                <button onClick={() => setResetConfirm(true)} className="w-full p-4 bg-red-50 dark:bg-red-900/20 text-red-600 font-bold rounded-xl">{t.reset_btn}</button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-center text-red-600 font-bold">{t.reset_confirm}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setResetConfirm(false)} className="flex-1 py-2 bg-gray-100 rounded-lg text-sm font-bold">{t.no_cancel}</button>
                    <button onClick={handleResetGame} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold">{t.yes_reset}</button>
                  </div>
                </div>
              )}
              <div className="text-center text-[10px] text-gray-400 mt-4">v1.3.12 • Italian Hangman</div>
            </div>
          </div>
        </div>
      )}
      </main>
      <footer className="mt-8 text-center text-gray-400 text-sm px-4 pb-4">
        <p>{t.keyboard_msg}</p>
        <p className="mt-1 font-medium">{t.slogan}</p>
      </footer>
    </div>
  );
}