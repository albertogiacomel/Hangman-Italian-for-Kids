
import { useState, useEffect, useCallback } from 'react';
import { GameState, Word, Language, LETTER_NAMES_ITALIAN } from '../data/types';
import { INITIAL_WORDS, CONFIG, ITALIAN_ALPHABET } from '../data/constants';
import { TRANSLATIONS } from '../data/translations';
import { playInteractionsSound, playWinSound, playLoseSound, speakWithGemini, preloadAudio, speakInstant } from '../services/audioService';

export function useHangman(language: Language, sfxEnabled: boolean) {
  const t = TRANSLATIONS[language];
  
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
    } catch (e) {}
    return {
      currentWord: null, currentDifficulty: 'easy', wordsCompleted: 0, successCount: 0,
      guessedLetters: [], attemptsRemaining: CONFIG.max_attempts, gameStatus: 'new',
      wordsAttempted: [], difficultyProgress: { easy: 0, medium: 0, hard: 0 },
      feedback: '', streak: 0, totalStars: 0, hintsUsed: 0
    };
  };

  const [state, setState] = useState<GameState>(getInitialState);

  useEffect(() => {
    localStorage.setItem('italianHangmanState', JSON.stringify({
      currentDifficulty: state.currentDifficulty,
      wordsCompleted: state.wordsCompleted,
      successCount: state.successCount,
      wordsAttempted: state.wordsAttempted,
      difficultyProgress: state.difficultyProgress,
      streak: state.streak,
      totalStars: state.totalStars
    }));
  }, [state.currentDifficulty, state.wordsCompleted, state.successCount, state.wordsAttempted, state.difficultyProgress, state.streak, state.totalStars]);

  const selectNewWord = useCallback(() => {
    setState(prev => {
      const { currentDifficulty, wordsAttempted } = prev;
      let availableWords = INITIAL_WORDS.filter(w => w.difficulty === currentDifficulty && !wordsAttempted.includes(w.italian));

      let nextDiff = currentDifficulty;
      if (availableWords.length === 0) {
        const diffs: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
        const nextIdx = (diffs.indexOf(currentDifficulty) + 1) % 3;
        nextDiff = diffs[nextIdx];
        availableWords = INITIAL_WORDS.filter(w => w.difficulty === nextDiff && !wordsAttempted.includes(w.italian));
        if (availableWords.length === 0) availableWords = INITIAL_WORDS.filter(w => w.difficulty === nextDiff);
      }

      const selected = availableWords[Math.floor(Math.random() * availableWords.length)];
      if (CONFIG.enable_audio && selected) {
        preloadAudio(selected.italian, 'it');
        preloadAudio(selected.english, 'en');
      }

      return {
        ...prev,
        currentDifficulty: nextDiff,
        currentWord: selected,
        guessedLetters: [],
        attemptsRemaining: CONFIG.max_attempts,
        gameStatus: 'playing',
        feedback: '',
        hintsUsed: 0
      };
    });
  }, []);

  useEffect(() => {
    if (state.gameStatus === 'new' && !state.currentWord) {
      selectNewWord();
    }
  }, [state.gameStatus, state.currentWord, selectNewWord]);

  const handleEndGameAudio = async (word: Word) => {
    await speakWithGemini(word.italian, 'it');
    // Ritardo di 2 secondi tra italiano e inglese come richiesto
    await new Promise(r => setTimeout(r, 2000));
    await speakWithGemini(word.english, 'en');
  };

  const handleLetterGuess = useCallback((letter: string) => {
    setState(prev => {
      const { currentWord, gameStatus, guessedLetters, attemptsRemaining } = prev;
      if (!currentWord || gameStatus !== 'playing' || guessedLetters.includes(letter)) return prev;
      
      if (sfxEnabled) playInteractionsSound();
      if (CONFIG.enable_audio) {
        speakInstant(LETTER_NAMES_ITALIAN[letter] || letter, 'it');
      }
      
      const isCorrect = currentWord.italian.toLowerCase().includes(letter);
      const newGuessed = [...guessedLetters, letter];
      const newAttempts = isCorrect ? attemptsRemaining : attemptsRemaining - 1;

      const isWon = currentWord.italian.toLowerCase().split('').every(c => 
        newGuessed.includes(c) || c === ' ' || c === '-'
      );

      if (isWon) {
        if (sfxEnabled) playWinSound();
        const errors = CONFIG.max_attempts - newAttempts;
        const stars = errors === 0 ? 3 : errors <= 2 ? 2 : 1;
        const newProgress = { ...prev.difficultyProgress };
        newProgress[prev.currentDifficulty]++;
        
        handleEndGameAudio(currentWord);
        
        return {
          ...prev,
          guessedLetters: newGuessed,
          gameStatus: 'won',
          successCount: prev.successCount + 1,
          wordsCompleted: prev.wordsCompleted + 1,
          wordsAttempted: [...prev.wordsAttempted, currentWord.italian],
          difficultyProgress: newProgress,
          feedback: `${t.win_msg} 🎉`,
          streak: prev.streak + 1,
          totalStars: prev.totalStars + stars
        };
      } 
      
      if (newAttempts <= 0) {
        if (sfxEnabled) playLoseSound();
        handleEndGameAudio(currentWord);
        return {
          ...prev,
          guessedLetters: newGuessed,
          attemptsRemaining: 0,
          gameStatus: 'lost',
          wordsCompleted: prev.wordsCompleted + 1,
          wordsAttempted: [...prev.wordsAttempted, currentWord.italian],
          feedback: t.feedback_try_again,
          streak: 0
        };
      }

      return {
        ...prev,
        guessedLetters: newGuessed,
        attemptsRemaining: newAttempts,
        feedback: isCorrect ? t.feedback_good : t.feedback_bad
      };
    });
  }, [sfxEnabled, t]);

  const handleHint = useCallback(() => {
    setState(prev => {
      const { currentWord, gameStatus, hintsUsed, guessedLetters } = prev;
      if (!currentWord || gameStatus !== 'playing' || hintsUsed >= 2) return prev;
      
      if (sfxEnabled) playInteractionsSound();

      const nextHintLevel = hintsUsed + 1;
      let feedback = '';

      if (nextHintLevel === 1) {
        feedback = language === 'it' 
          ? (currentWord.hint || t.hint_fallback) 
          : `${t.hint_intro_generic} ${t.categories[currentWord.category]}...`;
          
        return { ...prev, hintsUsed: nextHintLevel, feedback };
      } else {
        const target = currentWord.italian.toLowerCase();
        const unrevealed = target.split('').filter(c => 
          !guessedLetters.includes(c) && ITALIAN_ALPHABET.includes(c) && !'aeiou'.includes(c)
        );

        if (unrevealed.length > 0) {
          const char = unrevealed[Math.floor(Math.random() * unrevealed.length)];
          const tempGuessed = [...guessedLetters, char];
          const isWon = target.split('').every(c => tempGuessed.includes(c) || c === ' ' || c === '-');
          
          if (isWon) {
             setTimeout(() => handleLetterGuess(char), 0);
             return prev;
          }

          feedback = `${t.hint_intro_letter}: ${char.toUpperCase()}`;
          return { ...prev, hintsUsed: nextHintLevel, guessedLetters: tempGuessed, feedback };
        } else {
          return { ...prev, hintsUsed: nextHintLevel, feedback: t.hint_no_consonants };
        }
      }
    });
  }, [sfxEnabled, language, t, handleLetterGuess]);

  const resetGame = useCallback(() => {
    localStorage.removeItem('italianHangmanState');
    setState(getInitialState());
  }, []);

  return { state, handleLetterGuess, handleHint, selectNewWord, resetGame };
}
