
import { useState, useCallback } from 'react';
import { speakWithGemini, speakInstant } from '../services/geminiService';
import { CONFIG } from '../constants/index';

export const useAudio = (enabled: boolean) => {
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  const speak = useCallback(async (text: string, lang: 'it' | 'en') => {
    if (!enabled) return;

    setIsAudioLoading(true);
    try {
      if (lang === 'it') {
        await speakWithGemini(text, lang);
      } else {
        speakInstant(text, lang);
      }
    } catch (e) {
      console.error("Audio playback error:", e);
    } finally {
      setIsAudioLoading(false);
    }
  }, [enabled]);

  return { speak, isAudioLoading };
};
