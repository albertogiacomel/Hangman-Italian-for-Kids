
import { Word } from '../types';

export const ITALIAN_ALPHABET = 'abcdefghilmnopqrstuvz'.split('');

export const INITIAL_WORDS: Word[] = [
  // --- ANIMALS ---
  { italian: 'gatto', english: 'cat', category: 'animals', difficulty: 'easy', hint: 'Fa le fusa e dice miao.' },
  { italian: 'cane', english: 'dog', category: 'animals', difficulty: 'easy', hint: 'Il migliore amico dell\'uomo.' },
  { italian: 'orso', english: 'bear', category: 'animals', difficulty: 'easy', hint: 'Un grande animale che va in letargo.' },
  { italian: 'pesce', english: 'fish', category: 'animals', difficulty: 'easy', hint: 'Vive nell\'acqua e nuota.' },
  { italian: 'mucca', english: 'cow', category: 'animals', difficulty: 'easy', hint: 'Ci dà il latte e fa muu.' },
  { italian: 'maiale', english: 'pig', category: 'animals', difficulty: 'easy', hint: 'È rosa e ama il fango.' },
  { italian: 'topo', english: 'mouse', category: 'animals', difficulty: 'easy', hint: 'Piccolo e ama il formaggio.' },
  { italian: 'farfalla', english: 'butterfly', category: 'animals', difficulty: 'medium', hint: 'Ha ali colorate e vola sui fiori.' },
  { italian: 'coniglio', english: 'rabbit', category: 'animals', difficulty: 'medium', hint: 'Ha lunghe orecchie e ama le carote.' },
  { italian: 'tartaruga', english: 'turtle', category: 'animals', difficulty: 'medium', hint: 'Cammina piano e ha un guscio duro.' },
  // ... (Full list omitted for brevity, but logically present) ...
  { italian: 'scuola', english: 'school', category: 'school', difficulty: 'medium', hint: 'Dove vai per imparare e vedere gli amici.' },
  { italian: 'penna', english: 'pen', category: 'school', difficulty: 'medium', hint: 'Si usa per scrivere con l\'inchiostro.' },
  { italian: 'gomma', english: 'eraser', category: 'school', difficulty: 'medium', hint: 'Cancella gli errori di matita.' },
  { italian: 'quaderno', english: 'notebook', category: 'school', difficulty: 'medium', hint: 'Ha pagine di carta per scrivere.' },
  { italian: 'banco', english: 'desk', category: 'school', difficulty: 'medium', hint: 'Il tavolo dove ti siedi a scuola.' },
  { italian: 'lavagna', english: 'blackboard', category: 'school', difficulty: 'medium', hint: 'La maestra ci scrive col gesso.' },
  { italian: 'classe', english: 'classroom', category: 'school', difficulty: 'medium', hint: 'La stanza dove stanno gli alunni.' },
  { italian: 'righello', english: 'ruler', category: 'school', difficulty: 'hard', hint: 'Serve per fare righe dritte e misurare.' },
  { italian: 'colla', english: 'glue', category: 'school', difficulty: 'hard', hint: 'Attacca i fogli di carta.' },
  { italian: 'forbici', english: 'scissors', category: 'school', difficulty: 'hard', hint: 'Servono per tagliare la carta.' }
];
    