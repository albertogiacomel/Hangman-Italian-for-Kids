import {useGamePreferences,GameKitControls} from './shared/game-kit';

import React, { useEffect } from 'react';
import { Language, CategoryEmoji } from './data/types';
import { CONFIG } from './data/constants';
import { TRANSLATIONS } from './data/translations';
import { useHangman } from './hooks/useHangman';
import { HangmanVisual } from './components/HangmanVisual';
import { Keyboard } from './components/Keyboard';
import { ProgressBar } from './components/ProgressBar';
import { AdBanner } from './components/AdBanner';
import { speakWithGemini } from './services/audioService';

export default function App() {
  const {preferences: kitPreferences} = useGamePreferences('hangman');
  const language = kitPreferences.language as Language;
  const sfxEnabled = !kitPreferences.muted && kitPreferences.effects;
  const { state, handleLetterGuess, handleHint, selectNewWord, resetGame } = useHangman(language, sfxEnabled, kitPreferences.difficulty);
  const t = TRANSLATIONS[language];

  // Listener per la tastiera fisica
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora combinazioni di tasti di sistema
      if (e.ctrlKey || e.altKey || e.metaKey || (e.target as HTMLElement).closest?.('dialog[open],input,select,textarea,#klaro')) return;
      
      const key = e.key.toLowerCase();
      // Verifica se è una lettera a-z
      if (/^[a-z]$/.test(key)) {
        handleLetterGuess(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleLetterGuess]);

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans selection:bg-blue-200">
      <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-20 px-4 py-3 flex items-center justify-between border-b dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-2 rounded-lg text-xl shadow-inner">🇮🇹</div>
          <div>
            <h1 className="text-xl font-title text-blue-800 dark:text-blue-400 leading-none">Hangman</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 dark:text-blue-300">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-bold border border-orange-200 dark:border-orange-800">🔥 {state.streak}</div>
          <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200 dark:border-yellow-800">⭐ {state.totalStars}</div>
          <GameKitControls gameId="hangman" />
          <button className="ag-button ag-button--danger" onClick={() => {
            if(window.confirm(language === 'it' ? 'Azzerare i progressi?' : 'Reset progress?')) resetGame();
          }}>{t.reset_btn}</button>
        </div>
      </header>

      <main className="ag-equal-items grid grid-cols-1 max-w-4xl mx-auto p-4 md:p-8">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border dark:border-gray-800">
          <ProgressBar 
            current={state.difficultyProgress[state.currentDifficulty] % CONFIG.words_per_difficulty_level} 
            max={CONFIG.words_per_difficulty_level} 
            label={`${t.level} ${state.currentDifficulty}`} 
          />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border-4 border-blue-100 dark:border-gray-800 p-6 md:p-10 text-center transition-colors relative">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="w-full md:w-1/3 flex justify-center">
              <HangmanVisual wrongGuesses={CONFIG.max_attempts - state.attemptsRemaining} />
            </div>
            <div className="w-full md:w-2/3 flex flex-col items-center gap-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-full text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 border dark:border-gray-700">
                <span>{CategoryEmoji[state.currentWord?.category as keyof typeof CategoryEmoji] || '🏷️'} {t.categories[state.currentWord?.category || '']}</span>
                <button 
                  onClick={() => speakWithGemini(t.categories[state.currentWord?.category || ''], language)}
                  className="ml-2 p-1 hover:text-blue-500 transition-colors"
                >🔊</button>
              </div>
              
              <div className="text-4xl md:text-6xl font-mono font-bold tracking-tighter flex flex-wrap justify-center gap-x-3 gap-y-1">
                {state.currentWord?.italian.split('').map((char, i) => (
                  <span key={i} className="border-b-4 border-gray-200 dark:border-gray-700 min-w-[1.5rem]">
                    {state.guessedLetters.includes(char.toLowerCase()) ? char.toUpperCase() : '_'}
                  </span>
                ))}
              </div>

              <div className="h-8 text-blue-600 dark:text-blue-400 font-bold text-lg animate-pulse">{state.feedback}</div>
              
              <button 
                onClick={handleHint} 
                disabled={state.hintsUsed >= 2 || state.gameStatus !== 'playing'} 
                className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-6 py-3 rounded-2xl font-bold hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm active:scale-95"
              >
                💡 {state.hintsUsed === 0 ? t.hint_btn : state.hintsUsed === 1 ? t.hint_btn_more : t.hint_btn_none}
              </button>
            </div>
          </div>

          <div className="mt-10">
            <Keyboard guessedLetters={state.guessedLetters} onLetterGuess={handleLetterGuess} disabled={state.gameStatus !== 'playing'} />
          </div>
          
          <div className="mt-8 flex justify-center gap-2 items-center text-sm font-medium text-gray-500 dark:text-gray-400">
            <span className="mr-2">{t.attempts}:</span>
            <div className="flex gap-1">
              {[...Array(CONFIG.max_attempts)].map((_, i) => (
                <span key={i} className={`text-xl transition-all duration-300 ${i < state.attemptsRemaining ? "text-red-500 scale-110" : "text-gray-200 dark:text-gray-800 opacity-50"}`}>
                  {i < state.attemptsRemaining ? "❤️" : "🖤"}
                </span>
              ))}
            </div>
          </div>
        </div>

        <AdBanner language={language} />
      </main>

      {(state.gameStatus === 'won' || state.gameStatus === 'lost') && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-pop border-t-8 border-blue-500">
            <div className="text-8xl mb-4 animate-bounce-slow">
              {state.gameStatus === 'won' ? '🏆' : '😿'}
            </div>
            <h2 className="text-3xl font-title mb-4 text-gray-800 dark:text-white">
              {state.gameStatus === 'won' ? t.win_title : t.lose_title}
            </h2>
            <div className="space-y-4 mb-8">
              <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-2xl border border-blue-100 dark:border-gray-700 flex items-center justify-between">
                <div className="text-left">
                  <div className="text-[10px] font-bold text-blue-400 uppercase">Italiano</div>
                  <div className="text-2xl font-bold uppercase text-blue-900 dark:text-blue-100 tracking-wider">
                    {state.currentWord?.italian}
                  </div>
                </div>
                <button 
                  onClick={() => speakWithGemini(state.currentWord?.italian || '', 'it')}
                  className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform active:scale-90"
                  aria-label="Ascolta Italiano"
                >🔊</button>
              </div>

              <div className="bg-orange-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-orange-100 dark:border-gray-700 flex items-center justify-between">
                <div className="text-left">
                  <div className="text-[10px] font-bold text-orange-400 uppercase">English</div>
                  <div className="text-xl font-medium text-orange-700 dark:text-orange-300 italic">
                    {state.currentWord?.english}
                  </div>
                </div>
                <button 
                  onClick={() => speakWithGemini(state.currentWord?.english || '', 'en')}
                  className="bg-orange-500 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform active:scale-90"
                  aria-label="Listen English"
                >🔊</button>
              </div>
            </div>
            
            <button 
              onClick={selectNewWord} 
              className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all text-xl"
            >
              {t.next_word} 🚀
            </button>
          </div>
        </div>
      )}

      <footer className="text-center p-8 text-gray-400 dark:text-gray-500 text-xs">
        <p className="mb-1">{t.keyboard_msg}</p>
        <p className="font-bold text-gray-500 dark:text-gray-400">{t.slogan}</p>
      </footer>
    </div>
  );
}
