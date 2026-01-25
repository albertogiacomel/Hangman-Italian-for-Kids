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
  const bufferToDecode = data instanceof Uint8Array ? data.buffer : data;
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
// Fondamentale per il Free Tier: salva l'audio localmente per non rifare chiamate API costose in termini di tempo e quota
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
    return undefined;
  }
};

const saveAudioToDB = async (key: string, data: ArrayBuffer) => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(data, key);
  } catch (e) {}
};

// --- MAIN SERVICE ---

let sharedAudioCtx: AudioContext | null = null;
const memoryCache = new Map<string, AudioBuffer>();
// Circuit breaker per gestire il Free Tier di Gemini
let isQuotaExhausted = false;

const getAudioContext = () => {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return sharedAudioCtx;
};

const ensureAudioLoaded = async (text: string, language: 'it' | 'en'): Promise<AudioBuffer | null> => {
  if (language === 'en') return null;
  if (isQuotaExhausted) return null; // Se abbiamo esaurito la quota, non tentare nemmeno

  // Ensure process.env.API_KEY is available as required by guidelines
  if (!process.env.API_KEY) return null;

  const ctx = getAudioContext();
  const cacheKey = `${language}:${text.toLowerCase()}`;

  // 1. MEMORY CACHE
  if (memoryCache.has(cacheKey)) return memoryCache.get(cacheKey)!;

  // 2. DB CACHE
  const cachedArrayBuffer = await getAudioFromDB(cacheKey);
  if (cachedArrayBuffer) {
    const audioBuffer = await decodeAudioData(cachedArrayBuffer, ctx, 24000, 1);
    memoryCache.set(cacheKey, audioBuffer);
    return audioBuffer;
  }

  // 3. API CALL (GEMINI) - Directly use process.env.API_KEY in constructor as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Dì chiaramente in italiano: ${text}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const rawBytes = decode(base64Audio);
      saveAudioToDB(cacheKey, rawBytes.buffer);
      const audioBuffer = await decodeAudioData(rawBytes, ctx, 24000, 1);
      memoryCache.set(cacheKey, audioBuffer);
      return audioBuffer;
    }
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes('429')) {
      console.warn("Quota Gemini esaurita per questa sessione. Fallback su browser TTS.");
      isQuotaExhausted = true;
    }
  }
  return null;
};

export const preloadAudio = async (text: string, language: 'it' | 'en' = 'it') => {
  await ensureAudioLoaded(text, language);
};

export const speakWithGemini = async (text: string, language: 'it' | 'en' = 'it') => {
  if (language === 'en') {
    speakInstant(text, language);
    return;
  }

  const ctx = getAudioContext();
  if (ctx.state === 'suspended') await ctx.resume();

  try {
    const audioBuffer = await ensureAudioLoaded(text, language);
    if (audioBuffer) {
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
    } else {
      speakInstant(text, language);
    }
  } catch (e) {
    speakInstant(text, language);
  }
};

export const speakInstant = (text: string, language: 'it' | 'en' = 'it') => {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = language === 'it' ? 'it-IT' : 'en-US';
  window.speechSynthesis.cancel(); 
  window.speechSynthesis.speak(utter);
};
