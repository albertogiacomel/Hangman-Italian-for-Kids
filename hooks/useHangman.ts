
import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Word, Language } from '../data/types';
import { INITIAL_WORDS, CONFIG, ITALIAN_ALPHABET } from '../data/constants';
import { TRANSLATIONS } from '../data/translations';
import { playClickSound, playWinSound, playLoseSound, speakWithGemini, speakInstant, preloadAudio } from '../services/audioService';

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
      guessedLetters: [], attemptsRemaining: CONFIG.max_attempts, gameStatus: 'playing',
      wordsAttempted: [], difficultyProgress: { easy: 0, medium: 0, hard: 0 },
      feedback: '', streak: 0, totalStars: 0, hintsUsed: 0
    };
  };

  const [state, setState] = useState<GameState>(getInitialState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
    localStorage.setItem('italianHangmanState', JSON.stringify({
      currentDifficulty: state.currentDifficulty,
      wordsCompleted: state.wordsCompleted,
      successCount: state.successCount,
      wordsAttempted: state.wordsAttempted,
      difficultyProgress: state.difficultyProgress,
      streak: state.streak,
      totalStars: state.totalStars
    }));
  }, [state]);

  const selectNewWord = useCallback(() => {
    const { currentDifficulty, wordsAttempted } = stateRef.current;
    let availableWords = INITIAL_WORDS.filter(w => w.difficulty === currentDifficulty && !wordsAttempted.includes(w.italian));

    if (availableWords.length === 0) {
      const diffs: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
      const nextIdx = (diffs.indexOf(currentDifficulty) + 1) % 3;
      const nextDiff = diffs[nextIdx];
      availableWords = INITIAL_WORDS.filter(w => w.difficulty === nextDiff && !wordsAttempted.includes(w.italian));
      if (availableWords.length === 0) availableWords = INITIAL_WORDS.filter(w => w.difficulty === nextDiff);
      setState(s => ({ ...s, currentDifficulty: nextDiff }));
    }

    const selected = availableWords[Math.floor(Math.random() * availableWords.length)];
    if (CONFIG.enable_audio && selected) preloadAudio(selected.italian);

    setState(s => ({
      ...s, currentWord: selected, guessedLetters: [],
      attemptsRemaining: CONFIG.max_attempts, gameStatus: 'playing',
      feedback: '', hintsUsed: 0
    }));
  }, []);

  const handleLetterGuess = useCallback((letter: string) => {
    const { currentWord, gameStatus, guessedLetters, attemptsRemaining } = stateRef.current;
    if (!currentWord || gameStatus !== 'playing' || guessedLetters.includes(letter)) return;
    
    if (sfxEnabled) playClickSound();
    const isCorrect = currentWord.italian.toLowerCase().includes(letter);
    const newGuessed = [...guessedLetters, letter];
    const newAttempts = isCorrect ? attemptsRemaining : attemptsRemaining - 1;

    const isWon = currentWord.italian.toLowerCase().split('').every(c => newGuessed.includes(c) || c === ' ' || c === '-');

    if (isWon) {
      if (sfxEnabled) playWinSound();
      const stars = (CONFIG.max_attempts - newAttempts) === 0 ? 3 : (CONFIG.max_attempts - newAttempts) <= 2 ? 2 : 1;
      const newProgress = { ...stateRef.current.difficultyProgress };
      newProgress[stateRef.current.currentDifficulty]++;
      
      setState(s => ({
        ...s, guessedLetters: newGuessed, gameStatus: 'won',
        successCount: s.successCount + 1, wordsCompleted: s.wordsCompleted + 1,
        wordsAttempted: [...s.wordsAttempted, currentWord.italian],
        difficultyProgress: newProgress, feedback: `${t.win_msg} 🎉`,
        streak: s.streak + 1, totalStars: s.totalStars + stars
      }));
      speakWithGemini(currentWord.italian);
    } else if (newAttempts <= 0) {
      if (sfxEnabled) playLoseSound();
      setState(s => ({
        ...s, guessedLetters: newGuessed, attemptsRemaining: 0,
        gameStatus: 'lost', wordsCompleted: s.wordsCompleted + 1,
        wordsAttempted: [...s.wordsAttempted, currentWord.italian],
        feedback: t.feedback_try_again, streak: 0
      }));
      speakWithGemini(currentWord.italian);
    } else {
      setState(s => ({
        ...s, guessedLetters: newGuessed, attemptsRemaining: newAttempts,
        feedback: isCorrect ? t.feedback_good : t.feedback_bad
      }));
    }
  }, [sfxEnabled, t]);

  const handleHint = () => {
    const { currentWord, gameStatus, hintsUsed, guessedLetters } = stateRef.current;
    if (!currentWord || gameStatus !== 'playing' || hintsUsed >= 2) return;
    if (sfxEnabled) playClickSound();

    const nextHintLevel = hintsUsed + 1;
    let feedback = '';
    let newGuessed = [...guessedLetters];

    if (nextHintLevel === 1) {
      feedback = language === 'it' ? (currentWord.hint || t.hint_fallback) : `${t.hint_intro_generic} ${t.categories[currentWord.category]}...`;
    } else {
      const target = currentWord.italian.toLowerCase();
      const unrevealed = target.split('').filter(c => !guessedLetters.includes(c) && ITALIAN_ALPHABET.includes(c) && !'aeiou'.includes(c));
      if (unrevealed.length > 0) {
        const char = unrevealed[Math.floor(Math.random() * unrevealed.length)];
        newGuessed.push(char);
        feedback = `${t.hint_intro_letter}: ${char.toUpperCase()}`;
        // Controllo vittoria post-indizio
        if (target.split('').every(c => newGuessed.includes(c) || c === ' ' || c === '-')) {
           // Simula vittoria
           handleLetterGuess(char);
           return;
        }
      } else feedback = t.hint_no_consonants;
    }
    setState(s => ({ ...s, hintsUsed: nextHintLevel, guessedLetters: newGuessed, feedback }));
  };

  const resetGame = () => {
    localStorage.removeItem('italianHangmanState');
    setState(getInitialState());
    selectNewWord();
  };

  return { state, handleLetterGuess, handleHint, selectNewWord, resetGame };
}
