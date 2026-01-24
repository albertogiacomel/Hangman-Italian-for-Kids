
import React from 'react';

interface ProgressBarProps {
  current: number;
  max: number;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, max, label }) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  
  return (
    <div className="w-full flex flex-col gap-1">
      {label && (
        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-blue-500 dark:text-blue-300 transition-colors">
          <span>{label}</span>
          <span>{current} / {max}</span>
        </div>
      )}
      <div className="h-3 w-full bg-blue-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner transition-colors">
        <div 
          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 transition-all duration-500 ease-out rounded-full relative"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};
