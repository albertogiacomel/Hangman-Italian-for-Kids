
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Word, GameState, CategoryEmoji, Config, LETTER_NAMES_ITALIAN } from './types';
import { INITIAL_WORDS, ITALIAN_ALPHABET } from './constants';
import { HangmanVisual } from './components/HangmanVisual';
import { Keyboard } from './components/Keyboard';
import { speakWithGemini, speakInstant } from './services/geminiService';

const CONFIG: Config = {
  words_per_difficulty_level: 3,
  max_attempts: 6,
  enable_audio: true,
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
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
  });

  const [isFullScreen, setIsFullScreen] = useState(false);

  const stateRef = useRef(gameState);
  useEffect(() => {
    stateRef.current = gameState;
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

  // Monitora i cambiamenti di stato dello schermo intero (es. se premuto ESC)
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
      let nextDiff = stateRef.current.currentDifficulty;
      if (nextDiff === 'easy') nextDiff = 'medium';
      else if (nextDiff === 'medium') nextDiff = 'hard';
      else nextDiff = 'easy';

      availableWords = INITIAL_WORDS.filter((w) => w.difficulty === nextDiff);
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
    }));
  }, []);

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
      const newDiffProgress = { ...state.difficultyProgress };
      newDiffProgress[state.currentDifficulty] += 1;

      let nextDifficulty = state.currentDifficulty;
      if (newDiffProgress[state.currentDifficulty] >= CONFIG.words_per_difficulty_level) {
        if (state.currentDifficulty === 'easy') nextDifficulty = 'medium';
        else if (state.currentDifficulty === 'medium') nextDifficulty = 'hard';
      }

      setGameState(prev => ({
        ...prev,
        guessedLetters: newGuessedLetters,
        attemptsRemaining: nextAttempts,
        gameStatus: 'won',
        successCount: prev.successCount + 1,
        wordsCompleted: prev.wordsCompleted + 1,
        wordsAttempted: [...prev.wordsAttempted, prev.currentWord!.italian],
        difficultyProgress: newDiffProgress,
        currentDifficulty: nextDifficulty,
        feedback: 'Bravissimo! 🎉'
      }));

      if (CONFIG.enable_audio) {
        speakInstant(state.currentWord.italian, 'it');
        setTimeout(() => speakInstant(state.currentWord!.english, 'en'), 1200);
      }
    } else if (nextAttempts <= 0) {
      setGameState(prev => ({
        ...prev,
        guessedLetters: newGuessedLetters,
        attemptsRemaining: 0,
        gameStatus: 'lost',
        wordsCompleted: prev.wordsCompleted + 1,
        wordsAttempted: [...prev.wordsAttempted, prev.currentWord!.italian],
        feedback: 'Riprova! 😢'
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
    selectNewWord();
  }, [selectNewWord]);

  const displayWord = useMemo(() => {
    if (!gameState.currentWord) return '';
    return gameState.currentWord.italian.toLowerCase().split('').map(char => 
      gameState.guessedLetters.includes(char) ? char.toUpperCase() : '_'
    ).join(' ');
  }, [gameState.currentWord, gameState.guessedLetters]);

  return (
    <div className="min-h-screen bg-blue-50 pb-12">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-title text-blue-600">Hangman Italiano</h1>
        <div className="flex gap-4 items-center">
          <div className="hidden sm:flex text-sm font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">
            Parole: {gameState.successCount}
          </div>
          <div className="hidden sm:flex text-sm font-bold bg-purple-100 text-purple-700 px-3 py-1 rounded-full uppercase">
            {gameState.currentDifficulty}
          </div>
          <button 
            onClick={toggleFullScreen}
            className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100"
            title={isFullScreen ? "Esci da Schermo Intero" : "Attiva Schermo Intero"}
          >
            {isFullScreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-8 px-4">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-blue-100 p-6 md:p-10 text-center">
          <HangmanVisual wrongGuesses={CONFIG.max_attempts - gameState.attemptsRemaining} />

          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-gray-500 uppercase tracking-widest text-sm font-bold">
              <span>{CategoryEmoji[gameState.currentWord?.category as keyof typeof CategoryEmoji] || '🏷️'}</span>
              <span>{gameState.currentWord?.category}</span>
            </div>
            
            <div className="text-5xl md:text-7xl font-mono font-bold tracking-[0.2em] text-gray-800 my-4">
              {displayWord}
            </div>

            <div className="text-xl text-blue-500 font-bold h-8 transition-all">
              {gameState.feedback}
            </div>
          </div>

          <div className="mt-8">
            <Keyboard 
              guessedLetters={gameState.guessedLetters} 
              onLetterGuess={handleLetterGuess}
              disabled={gameState.gameStatus !== 'playing'}
            />
          </div>

          <div className="mt-10 flex justify-center gap-4 text-gray-600 font-medium">
             Tentativi rimasti: <span className="font-bold text-red-500">{gameState.attemptsRemaining}</span>
          </div>
        </div>

        {(gameState.gameStatus === 'won' || gameState.gameStatus === 'lost') && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
              <div className="text-6xl mb-4 animate-bounce">
                {gameState.gameStatus === 'won' ? '🏆' : '😿'}
              </div>
              <h2 className={`text-4xl font-title mb-2 ${gameState.gameStatus === 'won' ? 'text-green-600' : 'text-orange-600'}`}>
                {gameState.gameStatus === 'won' ? 'Bravissimo!' : 'Non mollare!'}
              </h2>
              
              <div className="bg-blue-50 rounded-2xl p-4 my-6">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Italiano</span>
                  <button onClick={() => speakWithGemini(gameState.currentWord!.italian, 'it')} className="text-blue-500 hover:text-blue-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-3 uppercase tracking-widest">
                  {gameState.currentWord?.italian}
                </div>
                <div className="border-t border-blue-100 pt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Inglese</span>
                    <button onClick={() => speakInstant(gameState.currentWord!.english, 'en')} className="text-purple-500 hover:text-purple-700 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
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
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 hover:-translate-y-1 transition-all text-lg"
                >
                  Prossima parola 🚀
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-8 text-center text-gray-400 text-sm px-4">
        <p>Usa la tua tastiera fisica per giocare istantaneamente!</p>
        <p className="mt-1">Imparare divertendosi • Learning while having fun</p>
      </footer>
    </div>
  );
}
