import {getGameSettings} from '../shared/game-kit';
import { hasOptionalConsent } from '../shared/site-privacy';

import { GoogleGenAI, Modality } from "@google/genai";

const settings = getGameSettings('hangman');
const allowed = (channel: 'effects' | 'voice') => { const value=settings.getSnapshot();return !value.muted&&value[channel]; };
const activeVoice = new Set<AudioBufferSourceNode>();
settings.subscribe(() => {
  if(!allowed('effects')){for(const source of activeEffects)source.stop();activeEffects.clear();}
  if(!allowed('voice')) { for(const source of activeVoice) source.stop(); activeVoice.clear(); window.speechSynthesis?.cancel(); }
  if(sfxCtx) { if(!allowed('effects')&&!allowed('voice')) void sfxCtx.suspend(); else if(sfxCtx.state==='suspended') void sfxCtx.resume(); }
});
// --- SFX LOGIC ---
let sfxCtx: AudioContext | null = null;
const activeEffects=new Set<AudioScheduledSourceNode>();
const trackEffect=(source:AudioScheduledSourceNode)=>{activeEffects.add(source);source.onended=()=>activeEffects.delete(source);};
const getSfxCtx = () => {
  if (!sfxCtx) sfxCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  return sfxCtx;
};

const playTone = (freq: number, type: OscillatorType, duration: number, startTime: number = 0) => {
  if (!allowed('effects')) return;
  const ctx = getSfxCtx();
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
  gain.gain.setValueAtTime(0.1, ctx.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);
  osc.connect(gain); gain.connect(ctx.destination);
  trackEffect(osc);osc.start(ctx.currentTime + startTime); osc.stop(ctx.currentTime + startTime + duration);
};

export const playInteractionsSound = () => playTone(600, 'sine', 0.1);
export const playWinSound = () => {
  playTone(523.25, 'triangle', 0.2, 0);
  playTone(659.25, 'triangle', 0.2, 0.1);
  playTone(783.99, 'triangle', 0.4, 0.2);
};
export const playLoseSound = () => {
  if (!allowed('effects')) return;
  const ctx = getSfxCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
  osc.connect(gain); gain.connect(ctx.destination);
  trackEffect(osc);osc.start(); osc.stop(ctx.currentTime + 0.5);
};

// --- GEMINI TTS LOGIC ---
const decode = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
};

const decodeAudioData = async (data: Uint8Array, ctx: AudioContext) => {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
  return buffer;
};

const memoryCache = new Map<string, AudioBuffer>();

export const preloadAudio = async (text: string, lang: 'it' | 'en' = 'it') => {
  const cacheKey = `${lang}:${text.toLowerCase()}`;
  if (memoryCache.has(cacheKey) || !process.env.API_KEY || !hasOptionalConsent('google-ai') || !allowed('voice')) return;
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const voiceName = lang === 'it' ? 'Kore' : 'Puck';
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: lang === 'it' ? `Dì chiaramente: ${text}` : `Say clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    });
    
    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64 && hasOptionalConsent('google-ai')) {
      const buffer = await decodeAudioData(decode(base64), getSfxCtx());
      memoryCache.set(cacheKey, buffer);
      console.debug(`Cached audio for: ${cacheKey}`);
    }
  } catch (e) {
    console.warn("TTS Preload failed", e);
  }
};

export const speakWithGemini = async (text: string, lang: 'it' | 'en' = 'it') => {
  if (!allowed('voice')) return;
  const ctx = getSfxCtx();
  if (ctx.state === 'suspended') await ctx.resume();
  
  const cacheKey = `${lang}:${text.toLowerCase()}`;
  const cached = memoryCache.get(cacheKey);

  if (cached) {
    const source = ctx.createBufferSource();
    source.buffer = cached;
    source.connect(ctx.destination);
    if (!allowed('voice')) return;
    activeVoice.add(source); source.start();
    return new Promise(resolve => source.onended = event => {activeVoice.delete(source);resolve(event);});
  } else {
    // Fallback istantaneo se non in cache, ma cerchiamo di precaricare per la prossima volta
    preloadAudio(text, lang);
    speakInstant(text, lang);
    return Promise.resolve();
  }
};

export const speakInstant = (text: string, lang: 'it' | 'en') => {
  if (!allowed('voice')) return;
  // Solo se non stiamo già parlando una parola lunga
  if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
  }
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang === 'it' ? 'it-IT' : 'en-US';
  if (!hasOptionalConsent('google-ai')) {
    const voice = window.speechSynthesis.getVoices().find(v => v.localService && v.lang.toLowerCase().startsWith(lang));
    if (!voice) return;
    utter.voice = voice;
  }
  utter.rate = 1.1; // Leggermente più veloce per le lettere
  window.speechSynthesis.speak(utter);
};
