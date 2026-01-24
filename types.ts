
export interface Word {
  italian: string;
  english: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hint?: string;
}

export interface Config {
  words_per_difficulty_level: number;
  max_attempts: number;
  enable_audio: boolean;
}

export type GameStatus = 'new' | 'playing' | 'won' | 'lost';
export type Language = 'it' | 'en';

export interface GameState {
  currentWord: Word | null;
  currentDifficulty: 'easy' | 'medium' | 'hard';
  wordsCompleted: number;
  successCount: number;
  guessedLetters: string[];
  attemptsRemaining: number;
  gameStatus: GameStatus;
  wordsAttempted: string[];
  difficultyProgress: { easy: number; medium: number; hard: number };
  feedback: string;
  streak: number;
  totalStars: number;
  hintsUsed: number; // 0 = none, 1 = text hint, 2 = letter reveal
}

export enum CategoryEmoji {
  animals = '🐾',
  colors = '🎨',
  objects = '🏠',
  food = '🍎',
  people = '👨‍👩‍👧‍👦',
  verbs = '🏃',
  numbers = '🔢',
  time = '📅',
  body = '🦵',
  emotions = '😎',
  weather = '⛈️',
  nature = '🌲',
  clothing = '👕',
  transport = '🚀',
  school = '🎒',
}

export const LETTER_NAMES_ITALIAN: Record<string, string> = {
  a: 'a', b: 'bi', c: 'ci', d: 'di', e: 'e', f: 'effe', g: 'gi', h: 'acca',
  i: 'i', l: 'elle', m: 'emme', n: 'enne', o: 'o', p: 'pi', q: 'cu', r: 'erre',
  s: 'esse', t: 'ti', u: 'u', v: 'vu', z: 'zeta'
};
