
import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Word, Language, Config, LETTER_NAMES_ITALIAN } from '../types';
import { INITIAL_WORDS, CONFIG } from '../constants';
import { TRANSLATIONS } from '../translations';
import { preloadAudio } from '../services/geminiService';
import { playClickSound, playWinSound, playLoseSound } from '../services/soundEffects';

// Helper to load state
const getInitialState = (): GameState => {
  try {
    const saved = localStorage.getItem('italianHangmanState');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        currentWord: null, // Words are re-selected on load to ensure validity
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

interface UseHangmanGameProps {
  language: Language;
  sfxEnabled: boolean;
  enableAudio: boolean;
  onGameEnd?: (word: Word, status: 'won' | 'lost') => void;
  onLetterGuess?: (letter: string) => void;
}

export const useHangmanGame = ({ 
  language, 
  sfxEnabled, 
  enableAudio,
  onGameEnd,
  onLetterGuess
}: UseHangmanGameProps) => {
  const [gameState, setGameState] = useState<GameState>(getInitialState);
  const stateRef = useRef(gameState);

  // Sync ref and localStorage
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

  const selectNewWord = useCallback(() => {
    let availableWords = INITIAL_WORDS.filter(
      (w) =>
        w.difficulty === stateRef.current.currentDifficulty &&
        !stateRef.current.wordsAttempted.includes(w.italian)
    );

    // Fallback logic for difficulty progression/cycling
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

    if (enableAudio && selectedWord) {
      preloadAudio(selectedWord.italian, 'it');
    }

    setGameState((prev) => ({
      ...prev,
      currentWord: selectedWord,
      guessedLetters: [],
      attemptsRemaining: CONFIG.max_attempts,
      gameStatus: 'playing',
      feedback: '',
      hintsUsed: 0
    }));
  }, [enableAudio]);

  // Initial load
  useEffect(() => {
    if (!gameState.currentWord) {
      selectNewWord();
    }
  }, [selectNewWord, gameState.currentWord]);

  const handleGameWin = (finalGuessedLetters: string[]) => {
    const state = stateRef.current;
    if (!state.currentWord) return;

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

    const currentT = TRANSLATIONS[language];

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

    onGameEnd?.(state.currentWord, 'won');
  };

  const handleLetterGuess = useCallback((letter: string) => {
    const state = stateRef.current;
    
    if (!state.currentWord || state.gameStatus !== 'playing') return;
    if (state.guessedLetters.includes(letter)) return;

    if (sfxEnabled) playClickSound();
    onLetterGuess?.(letter);

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
      
      onGameEnd?.(state.currentWord, 'lost');
    } else {
      setGameState(prev => ({
        ...prev,
        guessedLetters: newGuessedLetters,
        attemptsRemaining: nextAttempts,
        feedback: isCorrect ? TRANSLATIONS[language].feedback_good : TRANSLATIONS[language].feedback_bad
      }));
    }
  }, [language, sfxEnabled, onGameEnd, onLetterGuess]);

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
      // Only reveal consonants (vowels are usually too easy/frequent)
      const ITALIAN_ALPHABET = 'abcdefghilmnopqrstuvz'.split('');
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

  const resetGame = () => {
    localStorage.removeItem('italianHangmanState');
    setGameState(getInitialState());
  };

  return {
    gameState,
    selectNewWord,
    handleLetterGuess,
    handleHint,
    resetGame
  };
};
