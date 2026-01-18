
import React from 'react';
import { ITALIAN_ALPHABET } from '../constants';

interface KeyboardProps {
  guessedLetters: string[];
  onLetterGuess: (letter: string) => void;
  disabled?: boolean;
}

export const Keyboard: React.FC<KeyboardProps> = ({ guessedLetters, onLetterGuess, disabled }) => {
  return (
    <div className="grid grid-cols-7 sm:grid-cols-11 gap-2 max-w-2xl mx-auto px-4">
      {ITALIAN_ALPHABET.map((letter) => {
        const isUsed = guessedLetters.includes(letter);
        return (
          <button
            key={letter}
            onClick={() => onLetterGuess(letter)}
            disabled={isUsed || disabled}
            className={`
              h-12 w-full flex items-center justify-center rounded-xl text-lg font-bold transition-all duration-200
              ${isUsed 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed transform scale-95' 
                : 'bg-white text-blue-600 shadow-md hover:bg-blue-50 active:translate-y-1 hover:shadow-lg border-b-4 border-blue-200 active:border-b-0'
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
