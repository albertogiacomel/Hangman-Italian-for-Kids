
import React, { useEffect } from 'react';

interface AdBannerProps {
  slot?: string;
  label?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ slot = "1234567890", label = "Annuncio" }) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("Adsbygoogle error:", e);
    }
  }, []);

  return (
    <div className="my-8 w-full flex flex-col items-center">
      <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{label}</span>
      <div className="bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center overflow-hidden min-h-[100px] w-full max-w-[728px]">
        <ins className="adsbygoogle"
             style={{ display: 'block', width: '100%' }}
             data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
             data-ad-slot={slot}
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
        <div className="absolute text-gray-300 dark:text-gray-600 text-sm font-medium pointer-events-none">Google Ads</div>
      </div>
    </div>
  );
};
    