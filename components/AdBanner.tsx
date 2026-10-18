import React, { useId } from 'react';
import { Language } from '../data/types';
import { SPONSOR_MESSAGE, SponsorMessage } from '../data/sponsorship';

interface AdBannerProps {
  language: Language;
  message?: SponsorMessage | null;
}

/** A manually reviewed message, never a third-party advertising embed. */
export const AdBanner: React.FC<AdBannerProps> = ({ language, message = SPONSOR_MESSAGE }) => {
  const labelId = useId();
  if (!message?.reviewed || !message.name.trim() || !message.copy[language]?.trim()) return null;

  return (
    <aside aria-labelledby={labelId} data-sponsor-message className="w-full min-w-0 rounded-2xl border border-gray-300 bg-white p-4 text-gray-800 shadow-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100">
      <p id={labelId} className="mb-2 text-sm font-semibold">
        {language === 'it' ? 'Messaggio pubblicitario · Sponsor del gioco' : 'Advertisement · Game sponsor'}
      </p>
      <p className="break-words text-base font-bold leading-relaxed">{message.name}</p>
      <p className="break-words text-base leading-relaxed">{message.copy[language]}</p>
    </aside>
  );
};
