
import { GoogleGenAI, Modality } from "@google/genai";

// --- UTILITIES AUDIO ---

const decode = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const decodeAudioData = async (
  data: Uint8Array | ArrayBuffer,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  // Se è già un ArrayBuffer, usalo, altrimenti prendi il buffer dalla Uint8Array
  const bufferToDecode = data instanceof Uint8Array ? data.buffer : data;
  
  // Nota: decodeAudioData nativo è preferibile per file completi, 
  // ma per raw PCM (come quello di Gemini Live/TTS a volte) serve la decodifica manuale o corretta.
  // Qui assumiamo che Gemini restituisca un formato decodificabile o PCM raw.
  // Tuttavia, nel codice originale si usava una decodifica manuale per PCM 24kHz.
  // Manteniamo la logica originale PCM int16 -> float32 per coerenza.

  const dataInt16 = new Int16Array(bufferToDecode);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

// --- INDEXED DB HELPER (PERSISTENT CACHE) ---
const DB_NAME = 'hangman_audio_db';
const STORE_NAME = 'audio_files';
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getAudioFromDB = async (key: string): Promise<ArrayBuffer | undefined> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn("DB Read Error", e);
    return undefined;
  }
};

const saveAudioToDB = async (key: string, data: ArrayBuffer) => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(data, key);
  } catch (e) {
    console.warn("DB Write Error", e);
  }
};

// --- MAIN SERVICE ---

// Singleton AudioContext
let sharedAudioCtx: AudioContext | null = null;
// Simple In-Memory Cache (for speed within same session before DB hit)
const memoryCache = new Map<string, AudioBuffer>();

export const speakWithGemini = async (text: string, language: 'it' | 'en' = 'it') => {
  // 1. OTTIMIZZAZIONE: Usa il TTS del browser per l'Inglese.
  // Gemini costa risorse, il browser è gratis e perfetto per l'inglese.
  if (language === 'en') {
    speakInstant(text, language);
    return;
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    speakInstant(text, language);
    return;
  }

  // Inizializza AudioContext
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  if (sharedAudioCtx.state === 'suspended') {
    await sharedAudioCtx.resume();
  }

  const cacheKey = `${language}:${text.toLowerCase()}`;
  
  // 2. CHECK MEMORY CACHE
  if (memoryCache.has(cacheKey)) {
    playBuffer(memoryCache.get(cacheKey)!, sharedAudioCtx);
    return;
  }

  // 3. CHECK PERSISTENT DB CACHE (IndexedDB)
  const cachedArrayBuffer = await getAudioFromDB(cacheKey);
  if (cachedArrayBuffer && sharedAudioCtx) {
    const audioBuffer = await decodeAudioData(cachedArrayBuffer, sharedAudioCtx, 24000, 1);
    memoryCache.set(cacheKey, audioBuffer); // Promuovi in memoria
    playBuffer(audioBuffer, sharedAudioCtx);
    return;
  }

  // 4. CALL GEMINI API (Solo se non in cache)
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Dì con voce molto chiara e amichevole: ${text}`;
  const voiceName = 'Kore'; // Usiamo Kore per l'italiano

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio && sharedAudioCtx) {
      // Decode base64 to Uint8Array
      const rawBytes = decode(base64Audio);
      
      // Save raw PCM bytes to DB (persistente)
      saveAudioToDB(cacheKey, rawBytes.buffer);

      // Decode to AudioBuffer for playback
      const audioBuffer = await decodeAudioData(rawBytes, sharedAudioCtx, 24000, 1);
      
      // Save to Memory Cache
      memoryCache.set(cacheKey, audioBuffer);
      
      playBuffer(audioBuffer, sharedAudioCtx);
    }
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    // Fallback in case of API error or Quota Exceeded
    speakInstant(text, language);
  }
};

const playBuffer = (buffer: AudioBuffer, ctx: AudioContext) => {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
};

// Funzione per feedback immediato senza latenza di rete (Browser Native)
export const speakInstant = (text: string, language: 'it' | 'en' = 'it') => {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = language === 'it' ? 'it-IT' : 'en-US';
  
  // Cerchiamo una voce Google/Microsoft se disponibile per qualità migliore
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => 
    v.lang.startsWith(language === 'it' ? 'it' : 'en') && 
    (v.name.includes('Google') || v.name.includes('Premium'))
  );
  if (preferredVoice) utter.voice = preferredVoice;

  utter.rate = 0.9; // Leggermente più lento per chiarezza didattica
  window.speechSynthesis.cancel(); 
  window.speechSynthesis.speak(utter);
};
