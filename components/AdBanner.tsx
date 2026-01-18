
import React, { useEffect } from 'react';

interface AdBannerProps {
  slot?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ slot = "1234567890" }) => {
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
      <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Annuncio pubblicitario</span>
      <div className="bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden min-h-[100px] w-full max-w-[728px]">
        {/* Sostituire i parametri data-ad-client e data-ad-slot con i propri valori reali */}
        <ins className="adsbygoogle"
             style={{ display: 'block', width: '100%' }}
             data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
             data-ad-slot={slot}
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
        
        {/* Placeholder visibile solo se l'annuncio non viene caricato (per demo) */}
        <div className="absolute text-gray-300 text-sm font-medium pointer-events-none">
          Spazio Pubblicitario Google
        </div>
      </div>
    </div>
  );
};
