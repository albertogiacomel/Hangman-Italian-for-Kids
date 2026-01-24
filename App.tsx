
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Word, GameState, CategoryEmoji, Config, LETTER_NAMES_ITALIAN } from './types';
import { INITIAL_WORDS, ITALIAN_ALPHABET } from './constants';
import { HangmanVisual } from './components/HangmanVisual';
import { Keyboard } from './components/Keyboard';
import { AdBanner } from './components/AdBanner';
import { ProgressBar } from './components/ProgressBar';
import { speakWithGemini, speakInstant } from './services/geminiService';

const CONFIG: Config = {
  words_per_difficulty_level: 5,
  max_attempts: 6,
  enable_audio: true,
};

// Canvas confetti utility embedded to avoid external dependencies issues
const triggerConfetti = () => {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  (function frame() {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return;

    const particleCount = 50 * (timeLeft / duration);
    
    // Create particles (simple simulation using DOM would be safer for React, 
    // but here we just rely on visual feedback if this advanced animation isn't available.
    // Ideally we'd use 'canvas-confetti' npm package. 
    // Since we can't easily add packages in this environment without risk, 
    // we will skip the complex canvas implementation and rely on CSS animations in the modal).
  }());
};

export default function App() {
  // Load initial state from localStorage if available
  const getInitialState = (): GameState => {
    try {
      const saved = localStorage.getItem('italianHangmanState');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure we merge with default to handle schema changes
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

  useEffect(() => {
    const handler = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const selectNewWord = useCallback(() => {
    let availableWords = INITIAL_WORDS.filter(
      (w) =>
        w.difficulty === stateRef.current.currentDifficulty &&
        !stateRef.current.wordsAttempted.includes(w.italian)
    );

    if (availableWords.length === 0) {
      // If we ran out of words for this level, reset attempted list for this level to allow replay
      // Or move to next level.
      let nextDiff = stateRef.current.currentDifficulty;
      if (nextDiff === 'easy') nextDiff = 'medium';
      else if (nextDiff === 'medium') nextDiff = 'hard';
      else nextDiff = 'easy'; // Loop back or stay on hard? Let's loop for endless play.

      // Check if we have words in next diff
      const nextWords = INITIAL_WORDS.filter((w) => w.difficulty === nextDiff);
      
      // If we are changing level, we can clear attempted words for the NEW level to ensure content
      const attemptedInNext = stateRef.current.wordsAttempted; 
      
      availableWords = nextWords.filter(w => !attemptedInNext.includes(w.italian));
      if (availableWords.length === 0) {
         // Reset completely if truly everything is exhausted (edge case)
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

    const newHintLevel = state.hintsUsed + 1;
    let feedbackMsg = '';
    let newGuessedLetters = [...state.guessedLetters];

    if (newHintLevel === 1) {
      // Hint 1: Show description
      feedbackMsg = state.currentWord.hint || `È un ${state.currentWord.category}...`;
    } else if (newHintLevel === 2) {
      // Hint 2: Reveal a random consonant
      const targetWord = state.currentWord.italian.toLowerCase();
      const unrevealedConsonants = targetWord.split('').filter(char => 
        !state.guessedLetters.includes(char) && 
        ITALIAN_ALPHABET.includes(char) &&
        !'aeiou'.includes(char)
      );

      if (unrevealedConsonants.length > 0) {
        const randomConsonant = unrevealedConsonants[Math.floor(Math.random() * unrevealedConsonants.length)];
        newGuessedLetters.push(randomConsonant);
        feedbackMsg = `Ecco una lettera per te: ${randomConsonant.toUpperCase()}`;
        
        // Check if revealing this letter wins the game
        const allLettersGuessed = targetWord
          .split('')
          .every((char) => newGuessedLetters.includes(char) || char === ' ' || char === '-');
          
        if (allLettersGuessed) {
           handleGameWin(newGuessedLetters);
           return;
        }
      } else {
        // Fallback if no consonants left (rare)
        feedbackMsg = "Non ci sono consonanti da rivelare!";
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
    
    // Calculate Stars
    // 0 errors = 3 stars
    // 1-2 errors = 2 stars
    // 3+ errors = 1 star
    const errors = CONFIG.max_attempts - state.attemptsRemaining;
    let starsEarned = 1;
    if (errors === 0) starsEarned = 3;
    else if (errors <= 2) starsEarned = 2;

    const newDiffProgress = { ...state.difficultyProgress };
    newDiffProgress[state.currentDifficulty] += 1;

    let nextDifficulty = state.currentDifficulty;
    // Advance difficulty if we hit the threshold
    if (newDiffProgress[state.currentDifficulty] >= CONFIG.words_per_difficulty_level) {
      if (state.currentDifficulty === 'easy') nextDifficulty = 'medium';
      else if (state.currentDifficulty === 'medium') nextDifficulty = 'hard';
      // Reset progress for the old difficulty to allow looping later? 
      // For now we just keep counting up.
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
      feedback: 'Bravissimo! 🎉',
      streak: prev.streak + 1,
      totalStars: prev.totalStars + starsEarned
    }));

    if (CONFIG.enable_audio && state.currentWord) {
      speakInstant(state.currentWord.italian, 'it');
      setTimeout(() => speakInstant(state.currentWord!.english, 'en'), 1200);
    }
  };

  const handleLetterGuess = useCallback((letter: string) => {
    const state = stateRef.current;
    if (!state.currentWord || state.gameStatus !== 'playing') return;
    if (state.guessedLetters.includes(letter)) return;

    if (CONFIG.enable_audio) {
      const letterName = LETTER_NAMES_ITALIAN[letter] || letter;
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
      setGameState(prev => ({
        ...prev,
        guessedLetters: newGuessedLetters,
        attemptsRemaining: 0,
        gameStatus: 'lost',
        wordsCompleted: prev.wordsCompleted + 1,
        wordsAttempted: [...prev.wordsAttempted, prev.currentWord!.italian],
        feedback: 'Riprova! 😢',
        streak: 0 // Reset streak on loss
      }));
      
      if (CONFIG.enable_audio) {
        speakInstant(state.currentWord.italian, 'it');
        setTimeout(() => speakInstant(state.currentWord!.english, 'en'), 1200);
      }
    } else {
      setGameState(prev => ({
        ...prev,
        guessedLetters: newGuessedLetters,
        attemptsRemaining: nextAttempts,
        feedback: isCorrect ? 'Ottimo!' : 'Oops!'
      }));
    }
  }, []);

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

  return (
    <div className="min-h-screen bg-blue-50 pb-12 font-sans selection:bg-blue-200">
      <header className="bg-white border-b shadow-sm sticky top-0 z-20 px-4 py-3 sm:px-6 sm:py-4 flex flex-wrap items-center justify-between gap-y-2">
        <div className="flex items-center gap-2">
           <div className="bg-blue-600 text-white p-2 rounded-lg shadow-sm">
             <span className="text-xl">🇮🇹</span>
           </div>
           <div>
             <h1 className="text-xl sm:text-2xl font-title text-blue-800 leading-none">Hangman</h1>
             <p className="text-xs text-blue-400 font-bold tracking-wider uppercase">Impara l'italiano</p>
           </div>
        </div>
        
        <div className="flex flex-wrap gap-2 sm:gap-4 items-center ml-auto">
          {/* Streak Badge */}
          <div className="flex items-center gap-1 bg-orange-100 text-orange-600 px-3 py-1.5 rounded-full border border-orange-200 shadow-sm" title="Giorni consecutivi">
             <span className="text-lg">🔥</span>
             <span className="font-bold text-sm">{gameState.streak}</span>
          </div>

          {/* Stars Badge */}
          <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full border border-yellow-200 shadow-sm" title="Stelle totali">
             <span className="text-lg">⭐</span>
             <span className="font-bold text-sm">{gameState.totalStars}</span>
          </div>

          <div className="hidden sm:flex text-sm font-bold bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full uppercase border border-purple-200">
            {gameState.currentDifficulty}
          </div>
          
          <button 
            onClick={toggleFullScreen}
            className="p-2 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
            title={isFullScreen ? "Esci da Schermo Intero" : "Attiva Schermo Intero"}
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
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-6 sm:mt-8 px-4">
        {/* Progress Bar for Current Level */}
        <div className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-blue-50">
          <ProgressBar 
            current={gameState.difficultyProgress[gameState.currentDifficulty] % CONFIG.words_per_difficulty_level} 
            max={CONFIG.words_per_difficulty_level} 
            label={`Livello ${gameState.currentDifficulty}`}
          />
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-blue-100 p-6 md:p-10 text-center relative">
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="w-full md:w-1/3 flex justify-center">
               <HangmanVisual wrongGuesses={CONFIG.max_attempts - gameState.attemptsRemaining} />
            </div>

            <div className="w-full md:w-2/3 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100 text-gray-500 uppercase tracking-widest text-xs font-bold">
                <span className="text-lg">{CategoryEmoji[gameState.currentWord?.category as keyof typeof CategoryEmoji] || '🏷️'}</span>
                <span>{gameState.currentWord?.category}</span>
              </div>
              
              <div className="text-4xl sm:text-5xl md:text-6xl font-mono font-bold tracking-[0.15em] text-gray-800 break-words w-full">
                {displayWord}
              </div>

              <div className="h-12 flex items-center justify-center w-full">
                <div className={`text-lg sm:text-xl font-bold transition-all px-4 py-1 rounded-lg ${
                   gameState.feedback.includes('Bravissimo') ? 'text-green-600 bg-green-50' : 
                   gameState.feedback.includes('Riprova') ? 'text-red-500 bg-red-50' :
                   gameState.feedback ? 'text-blue-600 bg-blue-50' : ''
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
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 shadow-sm hover:shadow-md'
                    }
                  `}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                  </svg>
                  {gameState.hintsUsed === 0 ? "Aiuto (Hint)" : gameState.hintsUsed === 1 ? "Altro Aiuto" : "Aiuti finiti"}
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

          <div className="mt-8 flex justify-center gap-4 text-gray-600 font-medium text-sm">
             Tentativi rimasti: 
             <div className="flex gap-1">
               {[...Array(gameState.attemptsRemaining)].map((_, i) => (
                 <span key={i} className="text-red-500">❤️</span>
               ))}
               {[...Array(CONFIG.max_attempts - gameState.attemptsRemaining)].map((_, i) => (
                 <span key={`lost-${i}`} className="text-gray-300">🖤</span>
               ))}
             </div>
          </div>
        </div>

        {/* Ad Space */}
        <AdBanner />

        {(gameState.gameStatus === 'won' || gameState.gameStatus === 'lost') && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl scale-100 animate-in zoom-in-95 duration-300 relative overflow-hidden">
              
              {/* Confetti Background for Win - Simple CSS circles */}
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
              
              <h2 className={`text-4xl font-title mb-2 ${gameState.gameStatus === 'won' ? 'text-green-600' : 'text-orange-600'}`}>
                {gameState.gameStatus === 'won' ? 'Bravissimo!' : 'Peccato!'}
              </h2>
              
              {gameState.gameStatus === 'won' && (
                <div className="flex justify-center gap-1 mb-4">
                  {[...Array(3)].map((_, i) => (
                     <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${
                       i < (gameState.attemptsRemaining >= 4 ? 3 : gameState.attemptsRemaining >= 2 ? 2 : 1) 
                       ? 'text-yellow-400 fill-current' 
                       : 'text-gray-200 fill-current'
                     }`} viewBox="0 0 20 20">
                       <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                     </svg>
                  ))}
                </div>
              )}

              <div className="bg-blue-50 rounded-2xl p-4 my-6 border border-blue-100 relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-blue-400 uppercase font-bold tracking-wider">Italiano</span>
                  <button onClick={() => speakWithGemini(gameState.currentWord!.italian, 'it')} className="p-1 hover:bg-blue-100 rounded-full text-blue-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-3 uppercase tracking-widest">
                  {gameState.currentWord?.italian}
                </div>
                <div className="border-t border-blue-200 pt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-purple-400 uppercase font-bold tracking-wider">Inglese</span>
                    <button onClick={() => speakInstant(gameState.currentWord!.english, 'en')} className="p-1 hover:bg-purple-100 rounded-full text-purple-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-xl font-medium text-blue-700 capitalize">
                    {gameState.currentWord?.english}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={selectNewWord}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-lg flex items-center justify-center gap-2"
                >
                  <span>Prossima parola</span>
                  <span>🚀</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-8 text-center text-gray-400 text-sm px-4 pb-4">
        <p>Usa la tua tastiera fisica per giocare!</p>
        <p className="mt-1 font-medium">Imparare divertendosi • Learning while having fun</p>
      </footer>
    </div>
  );
}
