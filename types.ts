
export interface Word {
  italian: string;
  english: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Config {
  words_per_difficulty_level: number;
  max_attempts: number;
  enable_audio: boolean;
}

export type GameStatus = 'new' | 'playing' | 'won' | 'lost';

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
}

export enum CategoryEmoji {
  animals = '🐾',
  colors = '🎨',
  objects = '🏠',
  food = '🍎',
  people = '👨‍👩‍👧‍👦',
  verbs = '🏃',
}

export const LETTER_NAMES_ITALIAN: Record<string, string> = {
  a: 'a', b: 'bi', c: 'ci', d: 'di', e: 'e', f: 'effe', g: 'gi', h: 'acca',
  i: 'i', l: 'elle', m: 'emme', n: 'enne', o: 'o', p: 'pi', q: 'cu', r: 'erre',
  s: 'esse', t: 'ti', u: 'u', v: 'vu', z: 'zeta'
};
