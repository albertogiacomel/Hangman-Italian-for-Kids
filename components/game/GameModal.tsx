
import React from 'react';
import { GameState, Language } from '../../types';
import { TRANSLATIONS } from '../../translations';

interface GameModalProps {
  gameState: GameState;
  language: Language;
  t: typeof TRANSLATIONS['it'];
  isAudioLoading: boolean;
  onSpeak: (text: string, lang: 'it' | 'en') => void;
  onNextWord: () => void;
}

export const GameModal: React.FC<GameModalProps> = ({
  gameState,
  language,
  t,
  isAudioLoading,
  onSpeak,
  onNextWord,
}) => {
  if (gameState.gameStatus !== 'won' && gameState.gameStatus !== 'lost') return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl scale-100 animate-in zoom-in-95 duration-300 relative overflow-hidden transition-colors">
        {gameState.gameStatus === 'won' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
            <div className="absolute top-0 left-10 w-4 h-4 bg-red-400 rounded-full animate-bounce delay-100"></div>
            <div className="absolute top-10 right-10 w-3 h-3 bg-blue-400 rounded-full animate-bounce delay-300"></div>
            <div className="absolute bottom-20 left-1/2 w-5 h-5 bg-yellow-400 rounded-full animate-bounce delay-500"></div>
            <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
          </div>
        )}

        <div className="text-7xl mb-4 animate-bounce filter drop-shadow-lg">
          {gameState.gameStatus === 'won' ? '🏆' : '😿'}
        </div>

        <h2
          id="modal-title"
          className={`text-4xl font-title mb-2 ${
            gameState.gameStatus === 'won'
              ? 'text-green-600 dark:text-green-400'
              : 'text-orange-600 dark:text-orange-400'
          }`}
        >
          {gameState.gameStatus === 'won' ? t.win_title : t.lose_title}
        </h2>

        {gameState.gameStatus === 'won' && (
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(3)].map((_, i) => (
              <svg
                key={i}
                xmlns="http://www.w3.org/2000/svg"
                className={`h-8 w-8 ${
                  i < (gameState.attemptsRemaining >= 4 ? 3 : gameState.attemptsRemaining >= 2 ? 2 : 1)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-200 dark:text-gray-700 fill-current'
                }`}
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        )}

        {gameState.currentWord && (
          <div className="bg-blue-50 dark:bg-gray-800 rounded-2xl p-4 my-6 border border-blue-100 dark:border-gray-700 relative transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-blue-400 dark:text-blue-300 uppercase font-bold tracking-wider">
                {t.italian_label}
              </span>
              <button
                onClick={() => onSpeak(gameState.currentWord!.italian, 'it')}
                className={`p-1 hover:bg-blue-100 dark:hover:bg-gray-700 rounded-full text-blue-500 dark:text-blue-300 transition-colors ${
                  isAudioLoading ? 'opacity-50 cursor-wait' : ''
                }`}
                disabled={isAudioLoading}
                aria-label="Listen in Italian"
              >
                {isAudioLoading ? '⏳' : '🔊'}
              </button>
            </div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white mb-3 uppercase tracking-widest transition-colors">
              {gameState.currentWord.italian}
            </div>
            <div className="border-t border-blue-200 dark:border-gray-700 pt-3 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-purple-400 dark:text-purple-300 uppercase font-bold tracking-wider">
                  {t.english_label}
                </span>
                <button
                  onClick={() => onSpeak(gameState.currentWord!.english, 'en')}
                  className="p-1 hover:bg-purple-100 dark:hover:bg-gray-700 rounded-full text-purple-500 dark:text-purple-300 transition-colors"
                  aria-label="Listen in English"
                >
                  🔊
                </button>
              </div>
              <div className="text-xl font-medium text-blue-700 dark:text-blue-300 capitalize transition-colors">
                {gameState.currentWord.english}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={onNextWord}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-600 dark:to-blue-800 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-lg flex items-center justify-center gap-2"
          >
            <span>{t.next_word}</span>
            <span>🚀</span>
          </button>
        </div>
      </div>
    </div>
  );
};
    