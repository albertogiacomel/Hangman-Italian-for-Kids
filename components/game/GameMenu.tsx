
import React from 'react';
import { GameState, Language } from '../../types';
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
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500">
            X
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setLanguage('it')}
              className={`py-2 rounded-lg text-sm font-bold flex justify-center gap-2 ${language === 'it' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600' : 'text-gray-500'}`}
            >
              🇮🇹 {t.italian_label}
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`py-2 rounded-lg text-sm font-bold flex justify-center gap-2 ${language === 'en' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600' : 'text-gray-500'}`}
            >
              🇬🇧 {t.english_label}
            </button>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">{t.sfx_label}</span>
            <button onClick={toggleSfx} className={`relative h-6 w-11 rounded-full ${sfxEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <span className={`block h-4 w-4 bg-white rounded-full transform transition ${sfxEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {!resetConfirm ? (
            <button
              onClick={() => setResetConfirm(true)}
              className="w-full p-4 bg-red-50 text-red-600 font-bold rounded-xl border border-red-100"
            >
              {t.reset_btn}
            </button>
          ) : (
            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
              <p className="text-red-800 font-medium text-center mb-3">{t.reset_confirm}</p>
              <div className="flex gap-2">
                <button onClick={() => setResetConfirm(false)} className="flex-1 py-2 bg-white text-gray-700 rounded-lg font-bold">{t.no_cancel}</button>
                <button onClick={onReset} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold">{t.yes_reset}</button>
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-xl text-sm">
             <div className="grid grid-cols-2 gap-4">
                <div><p className="text-gray-500">{t.stats_level}</p><p className="font-bold dark:text-white capitalize">{gameState.currentDifficulty}</p></div>
                <div><p className="text-gray-500">{t.stats_found}</p><p className="font-bold dark:text-white">{gameState.successCount}</p></div>
                <div><p className="text-gray-500">{t.stats_stars}</p><p className="font-bold text-yellow-500">{gameState.totalStars} ⭐</p></div>
                <div><p className="text-gray-500">{t.stats_streak}</p><p className="font-bold text-orange-500">{gameState.streak} 🔥</p></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
    