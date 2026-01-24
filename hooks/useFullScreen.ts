
import { useState, useEffect, useCallback } from 'react';

export const useFullScreen = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => console.error(e));
    } else {
      if (document.exitFullscreen) {
        void document.exitFullscreen();
      }
    }
  }, []);

  return { isFullScreen, toggleFullScreen };
};
    