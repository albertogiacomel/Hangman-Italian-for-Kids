import React from 'react';

interface HangmanVisualProps {
  wrongGuesses: number;
}

export const HangmanVisual: React.FC<HangmanVisualProps> = ({ wrongGuesses }) => {
  const parts = [
    <circle key="head" cx="150" cy="70" r="22" className="stroke-gray-700 dark:stroke-white" strokeWidth="4" fill="transparent" />,
    <line key="body" x1="150" y1="92" x2="150" y2="150" className="stroke-gray-700 dark:stroke-white" strokeWidth="4" />,
    <line key="leftarm" x1="150" y1="110" x2="120" y2="130" className="stroke-gray-700 dark:stroke-white" strokeWidth="4" strokeLinecap="round" />,
    <line key="rightarm" x1="150" y1="110" x2="180" y2="130" className="stroke-gray-700 dark:stroke-white" strokeWidth="4" strokeLinecap="round" />,
    <line key="leftleg" x1="150" y1="150" x2="125" y2="185" className="stroke-gray-700 dark:stroke-white" strokeWidth="4" strokeLinecap="round" />,
    <line key="rightleg" x1="150" y1="150" x2="175" y2="185" className="stroke-gray-700 dark:stroke-white" strokeWidth="4" strokeLinecap="round" />,
  ];

  return (
    <div className="relative w-full flex justify-center py-4">
      <svg width="240" height="240" viewBox="0 0 200 200" className="drop-shadow-sm overflow-visible">
        <line x1="20" y1="190" x2="180" y2="190" className="stroke-gray-400 dark:stroke-gray-600" strokeWidth="6" strokeLinecap="round" />
        <line x1="50" y1="190" x2="50" y2="10" className="stroke-gray-400 dark:stroke-gray-600" strokeWidth="6" strokeLinecap="round" />
        <line x1="50" y1="10" x2="150" y2="10" className="stroke-gray-400 dark:stroke-gray-600" strokeWidth="6" strokeLinecap="round" />
        <line x1="150" y1="10" x2="150" y2="48" className="stroke-gray-400 dark:stroke-gray-600" strokeWidth="6" strokeLinecap="round" />
        {parts.slice(0, wrongGuesses)}
      </svg>
    </div>
  );
};