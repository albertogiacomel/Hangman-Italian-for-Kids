
import React from 'react';
import { GameState, Language } from '../../types/index';
import { TRANSLATIONS } from '../../translations';

interface GameMenuProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  sfxEnabled: boolean;
  toggleSfx: () => void;
  gameState: GameState;
  resetConfirm: boolean;
  setResetConfirm: (v: boolean) => void;
  onReset: () => void;
  t: typeof TRANSLATIONS['it'];
}

export const GameMenu: React.FC<GameMenuProps> = ({
  isOpen,
  onClose,
  language,
  setLanguage,
  sfxEnabled,
  toggleSfx,
  gameState,
  resetConfirm,
  setResetConfirm,
  onReset,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in"
      role="dialog"
      aria-labelledby="menu-title"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-sm w-full p-6 border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h2 id="menu-title" className="text-xl font-bold text-gray-800 dark:text-white">
            {t.menu}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500"
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div
            className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
            role="group"
            aria-label="Language selection"
          >
            <button
              onClick={() => setLanguage('it')}
              aria-pressed={language === 'it'}
              className={`py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                language === 'it'
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-300'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span className="text-base">🇮🇹</span>
              <span>{t.italian_label}</span>
            </button>
            <button
              onClick={() => setLanguage('en')}
              aria-pressed={language === 'en'}
              className={`py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                language === 'en'
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-300'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span className="text-base">🇬🇧</span>
              <span>{t.english_label}</span>
            </button>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2 text-xs uppercase tracking-wide px-1">
              {t.settings}
            </h3>
            <div className="flex items-center justify-between px-1">
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">{t.sfx_label}</span>
              <button
                onClick={toggleSfx}
                role="switch"
                aria-checked={sfxEnabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                  sfxEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    sfxEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {!resetConfirm ? (
            <button
              onClick={() => setResetConfirm(true)}
              className="w-full p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2 border border-red-100 dark:border-red-900/50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              {t.reset_btn}
            </button>
          ) : (
            <div
              className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/50"
              role="alert"
            >
              <p className="text-red-800 dark:text-red-200 font-medium text-center mb-3">
                {t.reset_confirm}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setResetConfirm(false)}
                  className="flex-1 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {t.no_cancel}
                </button>
                <button
                  onClick={onReset}
                  className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold shadow-sm"
                >
                  {t.yes_reset}
                </button>
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-xl">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2 text-sm uppercase tracking-wide">
              {t.stats_title}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t.stats_level}</p>
                <p className="font-bold text-gray-800 dark:text-white capitalize">
                  {gameState.currentDifficulty}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t.stats_found}</p>
                <p className="font-bold text-gray-800 dark:text-white">{gameState.successCount}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t.stats_stars}</p>
                <p className="font-bold text-yellow-500 flex items-center gap-1">
                  {gameState.totalStars} <span aria-hidden="true">⭐</span>
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t.stats_streak}</p>
                <p className="font-bold text-orange-500 flex items-center gap-1">
                  {gameState.streak} <span aria-hidden="true">🔥</span>
                </p>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-gray-400 mt-4">v1.1.0 • Italian Hangman</div>
        </div>
      </div>
    </div>
  );
};
