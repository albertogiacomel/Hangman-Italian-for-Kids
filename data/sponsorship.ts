import { Language } from './types';

export interface SponsorMessage {
  /** Set only after reviewing the sponsor and both translations. */
  reviewed: boolean;
  name: string;
  copy: Record<Language, string>;
}

// No sponsor is currently configured. Null renders no banner or empty space.
// See docs/advertising.md before configuring a real sponsorship.
export const SPONSOR_MESSAGE: SponsorMessage | null = null;
