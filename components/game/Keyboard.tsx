
import React from 'react';
import { ITALIAN_ALPHABET } from '../../constants';

interface KeyboardProps {
  guessedLetters: string[];
  onLetterGuess: (letter: string) => void;
  disabled?: boolean;
}

export const Keyboard: React.FC<KeyboardProps> = ({ guessedLetters, onLetterGuess, disabled }) => {
  return (
    <div 
      className="grid grid-cols-7 sm:grid-cols-11 gap-2 max-w-2xl mx-auto px-4"
      role="group"
      aria-label="Virtual Keyboard"
    >
      {ITALIAN_ALPHABET.map((letter) => {
        const isUsed = guessedLetters.includes(letter);
        return (
          <button
            key={letter}
            onClick={() => onLetterGuess(letter)}
            disabled={isUsed || disabled}
            aria-label={`Letter ${letter.toUpperCase()}`}
            aria-disabled={isUsed || disabled}
            className={`
              h-12 w-full flex items-center justify-center rounded-xl text-lg font-bold transition-all duration-200 outline-none
              focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900
              ${isUsed 
                ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed transform scale-95 border border-transparent' 
                : 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-200 shadow-md hover:bg-blue-50 dark:hover:bg-gray-700 active:translate-y-1 hover:shadow-lg border-b-4 border-blue-200 dark:border-gray-950 active:border-b-0'
              }
            `}
          >
            {letter.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
};
    