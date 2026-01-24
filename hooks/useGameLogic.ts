
import { useEffect, useCallback, useReducer } from 'react';
import { GameState, Word, Language } from '../types';
import { INITIAL_WORDS, CONFIG } from '../constants';
import { TRANSLATIONS } from '../translations';
import { preloadAudio } from '../services/geminiService';
import { playClickSound, playWinSound, playLoseSound } from '../services/soundEffects';
import { storageService } from '../services/storageService';

// --- ACTIONS ---
type GameAction =
  | { type: 'NEW_GAME'; payload: { word: Word; difficulty: GameState['currentDifficulty'] } }
  | { type: 'GUESS_LETTER'; payload: { letter: string; language: Language; sfx: boolean } }
  | { type: 'USE_HINT'; payload: { language: Language; sfx: boolean } }
  | { type: 'RESET_GAME' }
  | { type: 'LOAD_STATE'; payload: GameState }
  | { type: 'NEXT_LEVEL'; payload: { newDifficulty: GameState['currentDifficulty'] } };

const initialState: GameState = {
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
  hintsUsed: 0,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'LOAD_STATE':
      return { ...action.payload };

    case 'RESET_GAME':
      return initialState;

    case 'NEW_GAME':
      return {
        ...state,
        currentWord: action.payload.word,
        currentDifficulty: action.payload.difficulty,
        guessedLetters: [],
        attemptsRemaining: CONFIG.max_attempts,
        gameStatus: 'playing',
        feedback: '',
        hintsUsed: 0,
      };

    case 'GUESS_LETTER': {
      const { letter, language, sfx } = action.payload;
      if (!state.currentWord || state.gameStatus !== 'playing' || state.guessedLetters.includes(letter)) {
        return state;
      }

      const newGuessedLetters = [...state.guessedLetters, letter];
      const targetWord = state.currentWord.italian.toLowerCase();
      const isCorrect = targetWord.includes(letter);
      const nextAttempts = isCorrect ? state.attemptsRemaining : state.attemptsRemaining - 1;

      // Check Win
      const allLettersGuessed = targetWord.split('').every((char) => newGuessedLetters.includes(char) || char === ' ' || char === '-');

      if (allLettersGuessed) {
        if (sfx) playWinSound();
        const errors = CONFIG.max_attempts - state.attemptsRemaining;
        const starsEarned = errors === 0 ? 3 : errors <= 2 ? 2 : 1;

        const newDiffProgress = { ...state.difficultyProgress };
        newDiffProgress[state.currentDifficulty] += 1;

        return {
          ...state,
          guessedLetters: newGuessedLetters,
          gameStatus: 'won',
          successCount: state.successCount + 1,
          wordsCompleted: state.wordsCompleted + 1,
          wordsAttempted: [...state.wordsAttempted, state.currentWord.italian],
          difficultyProgress: newDiffProgress,
          feedback: `${TRANSLATIONS[language].win_msg} 🎉`,
          streak: state.streak + 1,
          totalStars: state.totalStars + starsEarned,
        };
      }

      // Check Loss
      if (nextAttempts <= 0) {
        if (sfx) playLoseSound();
        return {
          ...state,
          guessedLetters: newGuessedLetters,
          attemptsRemaining: 0,
          gameStatus: 'lost',
          wordsCompleted: state.wordsCompleted + 1,
          wordsAttempted: [...state.wordsAttempted, state.currentWord.italian],
          feedback: TRANSLATIONS[language].feedback_try_again,
          streak: 0,
        };
      }

      if (sfx) playClickSound();
      return {
        ...state,
        guessedLetters: newGuessedLetters,
        attemptsRemaining: nextAttempts,
        feedback: isCorrect ? TRANSLATIONS[language].feedback_good : TRANSLATIONS[language].feedback_bad,
      };
    }

    case 'USE_HINT': {
      const { language, sfx } = action.payload;
      if (!state.currentWord || state.gameStatus !== 'playing' || state.hintsUsed >= 2) return state;

      if (sfx) playClickSound();
      const newHintLevel = state.hintsUsed + 1;
      let feedbackMsg = '';
      const newGuessedLetters = [...state.guessedLetters];
      const currentT = TRANSLATIONS[language];

      if (newHintLevel === 1) {
        const categoryName = currentT.categories[state.currentWord.category] || state.currentWord.category;
        feedbackMsg = language === 'it' && state.currentWord.hint
            ? state.currentWord.hint
            : `${currentT.hint_intro_generic} ${categoryName}...`;
      } else if (newHintLevel === 2) {
        const targetWord = state.currentWord.italian.toLowerCase();
        const ALPHABET = 'abcdefghilmnopqrstuvz'.split('');
        const unrevealed = targetWord.split('').filter(char => !state.guessedLetters.includes(char) && ALPHABET.includes(char) && !'aeiou'.includes(char));
        
        if (unrevealed.length > 0) {
          const randomChar = unrevealed[Math.floor(Math.random() * unrevealed.length)];
          if (randomChar) {
            newGuessedLetters.push(randomChar);
            feedbackMsg = `${currentT.hint_intro_letter}: ${randomChar.toUpperCase()}`;
          }
        } else {
          feedbackMsg = currentT.hint_no_consonants;
        }
      }

      // Check win on hint
      const targetWord = state.currentWord.italian.toLowerCase();
      const allGuessed = targetWord.split('').every(char => newGuessedLetters.includes(char) || char === ' ' || char === '-');
      
      if (allGuessed) {
         const errors = CONFIG.max_attempts - state.attemptsRemaining;
         const starsEarned = errors === 0 ? 3 : errors <= 2 ? 2 : 1;
         const newDiffProgress = { ...state.difficultyProgress };
         newDiffProgress[state.currentDifficulty] += 1;
         return {
            ...state,
            guessedLetters: newGuessedLetters,
            gameStatus: 'won',
            successCount: state.successCount + 1,
            wordsCompleted: state.wordsCompleted + 1,
            wordsAttempted: [...state.wordsAttempted, state.currentWord.italian],
            difficultyProgress: newDiffProgress,
            hintsUsed: newHintLevel,
            feedback: `${TRANSLATIONS[language].win_msg} 🎉`,
            streak: state.streak + 1,
            totalStars: state.totalStars + starsEarned,
         }
      }

      return { ...state, hintsUsed: newHintLevel, guessedLetters: newGuessedLetters, feedback: feedbackMsg };
    }

    case 'NEXT_LEVEL':
        return { ...state, currentDifficulty: action.payload.newDifficulty };

    default:
      return state;
  }
}

interface UseGameLogicProps {
  language: Language;
  sfxEnabled: boolean;
  enableAudio: boolean;
  onGameEnd?: (word: Word, status: 'won' | 'lost') => void;
  onLetterGuess?: (letter: string) => void;
}

export const useGameLogic = ({ language, sfxEnabled, enableAudio, onGameEnd, onLetterGuess }: UseGameLogicProps) => {
  const [gameState, dispatch] = useReducer(gameReducer, initialState);

  // Load
  useEffect(() => {
    const saved = storageService.loadGameState();
    if (saved) {
      dispatch({
        type: 'LOAD_STATE',
        payload: { ...initialState, ...saved, currentWord: null, gameStatus: 'new', guessedLetters: [] } as GameState
      });
    }
  }, []);

  // Save
  useEffect(() => {
    storageService.saveGameState({
      currentDifficulty: gameState.currentDifficulty,
      wordsCompleted: gameState.wordsCompleted,
      successCount: gameState.successCount,
      wordsAttempted: gameState.wordsAttempted,
      difficultyProgress: gameState.difficultyProgress,
      streak: gameState.streak,
      totalStars: gameState.totalStars,
    });
  }, [gameState]);

  // Callbacks
  useEffect(() => {
    if ((gameState.gameStatus === 'won' || gameState.gameStatus === 'lost') && gameState.currentWord) {
      onGameEnd?.(gameState.currentWord, gameState.gameStatus);
    }
  }, [gameState.gameStatus, gameState.currentWord, onGameEnd]);

  const selectNewWord = useCallback(() => {
    let currentDiff = gameState.currentDifficulty;
    const progress = gameState.difficultyProgress[currentDiff];
    
    // Progression check
    if (progress > 0 && progress % CONFIG.words_per_difficulty_level === 0) {
        if (currentDiff === 'easy') currentDiff = 'medium';
        else if (currentDiff === 'medium') currentDiff = 'hard';
    }

    let availableWords = INITIAL_WORDS.filter(w => w.difficulty === currentDiff && !gameState.wordsAttempted.includes(w.italian));
    if (availableWords.length === 0) {
       availableWords = INITIAL_WORDS.filter(w => w.difficulty === currentDiff);
    }

    const selectedWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    if (enableAudio && selectedWord) preloadAudio(selectedWord.italian, 'it');
    if (selectedWord) dispatch({ type: 'NEW_GAME', payload: { word: selectedWord, difficulty: currentDiff } });
  }, [gameState.currentDifficulty, gameState.difficultyProgress, gameState.wordsAttempted, enableAudio]);

  // Init
  useEffect(() => {
    if (!gameState.currentWord && gameState.gameStatus === 'new') selectNewWord();
  }, [gameState.currentWord, gameState.gameStatus, selectNewWord]);

  const handleLetterGuess = useCallback((letter: string) => {
    onLetterGuess?.(letter);
    dispatch({ type: 'GUESS_LETTER', payload: { letter, language, sfx: sfxEnabled } });
  }, [language, sfxEnabled, onLetterGuess]);

  const handleHint = useCallback(() => {
    dispatch({ type: 'USE_HINT', payload: { language, sfx: sfxEnabled } });
  }, [language, sfxEnabled]);

  const resetGame = useCallback(() => {
    storageService.clearGameState();
    dispatch({ type: 'RESET_GAME' });
    setTimeout(() => selectNewWord(), 0);
  }, [selectNewWord]);

  return { gameState, selectNewWord, handleLetterGuess, handleHint, resetGame };
};
    