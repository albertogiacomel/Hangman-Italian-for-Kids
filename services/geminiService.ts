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
// Circuit breaker for Quota Exhausted
let isQuotaExhausted = false;

const getAudioContext = () => {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return sharedAudioCtx;
};

// Core function: Ensures audio is in cache (Memory or DB), fetching from API if needed.
// Does NOT play the audio.
const ensureAudioLoaded = async (text: string, language: 'it' | 'en'): Promise<AudioBuffer | null> => {
  // Inglese usa browser native, niente da precaricare lato API
  if (language === 'en') return null;
  
  // Circuit breaker: se abbiamo finito la quota, inutile provare
  if (isQuotaExhausted) return null;

  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;

  const ctx = getAudioContext();
  const cacheKey = `${language}:${text.toLowerCase()}`;

  // 1. CHECK MEMORY CACHE
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  // 2. CHECK PERSISTENT DB CACHE (IndexedDB)
  const cachedArrayBuffer = await getAudioFromDB(cacheKey);
  if (cachedArrayBuffer) {
    const audioBuffer = await decodeAudioData(cachedArrayBuffer, ctx, 24000, 1);
    memoryCache.set(cacheKey, audioBuffer); // Promuovi in memoria
    return audioBuffer;
  }

  // 3. CALL GEMINI API
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Dì con voce molto chiara e amichevole: ${text}`;
  const voiceName = 'Kore';

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
    if (base64Audio) {
      const rawBytes = decode(base64Audio);
      
      // Save raw PCM bytes to DB
      saveAudioToDB(cacheKey, rawBytes.buffer);

      // Decode and Cache
      const audioBuffer = await decodeAudioData(rawBytes, ctx, 24000, 1);
      memoryCache.set(cacheKey, audioBuffer);
      
      return audioBuffer;
    }
  } catch (error: any) {
    // Gestione errore Quota Exhausted (429)
    // Checks for standard status/code or nested error object structure often returned by the API
    const isQuotaError = 
      error?.status === 429 || 
      error?.code === 429 || 
      error?.error?.code === 429 || 
      error?.error?.status === 'RESOURCE_EXHAUSTED' ||
      (error?.message && (
        error.message.includes('429') || 
        error.message.includes('quota') || 
        error.message.includes('RESOURCE_EXHAUSTED')
      ));

    if (isQuotaError) {
      if (!isQuotaExhausted) {
        console.warn("Gemini API Quota Exceeded. Switching to browser TTS fallback for this session.");
        isQuotaExhausted = true;
      }
    } else {
      console.error("Gemini TTS Preload/Fetch Error:", error);
    }
  }
  return null;
};

// Public: Preloads audio silently. Good for calling at start of turn.
export const preloadAudio = async (text: string, language: 'it' | 'en' = 'it') => {
  await ensureAudioLoaded(text, language);
};

// Public: Plays audio (fetching if necessary)
export const speakWithGemini = async (text: string, language: 'it' | 'en' = 'it') => {
  if (language === 'en') {
    speakInstant(text, language);
    return;
  }

  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  try {
    // Ensure loaded (might already be cached thanks to preloadAudio)
    const audioBuffer = await ensureAudioLoaded(text, language);
    
    if (audioBuffer) {
      playBuffer(audioBuffer, ctx);
    } else {
      // Fallback if buffer creation failed or quota exceeded
      speakInstant(text, language);
    }
  } catch (e) {
    console.error("Playback error", e);
    speakInstant(text, language);
  }
};

const playBuffer = (buffer: AudioBuffer, ctx: AudioContext) => {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
};

export const speakInstant = (text: string, language: 'it' | 'en' = 'it') => {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = language === 'it' ? 'it-IT' : 'en-US';
  
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => 
    v.lang.startsWith(language === 'it' ? 'it' : 'en') && 
    (v.name.includes('Google') || v.name.includes('Premium'))
  );
  if (preferredVoice) utter.voice = preferredVoice;

  utter.rate = 0.9;
  window.speechSynthesis.cancel(); 
  window.speechSynthesis.speak(utter);
};