
import { GoogleGenAI, Modality } from "@google/genai";

// --- SFX LOGIC ---
let sfxCtx: AudioContext | null = null;
const getSfxCtx = () => {
  if (!sfxCtx) sfxCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return sfxCtx;
};

const playTone = (freq: number, type: OscillatorType, duration: number, startTime: number = 0) => {
  const ctx = getSfxCtx();
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
  gain.gain.setValueAtTime(0.1, ctx.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(ctx.currentTime + startTime); osc.stop(ctx.currentTime + startTime + duration);
};

export const playClickSound = () => playTone(600, 'sine', 0.1);
export const playWinSound = () => {
  playTone(523.25, 'triangle', 0.2, 0);
  playTone(659.25, 'triangle', 0.2, 0.1);
  playTone(783.99, 'triangle', 0.4, 0.2);
};
export const playLoseSound = () => {
  const ctx = getSfxCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + 0.5);
};

// --- GEMINI TTS LOGIC ---
const decode = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
};

const decodeAudioData = async (data: Uint8Array, ctx: AudioContext) => {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
  return buffer;
};

const memoryCache = new Map<string, AudioBuffer>();

export const preloadAudio = async (text: string) => {
  if (memoryCache.has(text) || !process.env.API_KEY) return;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Dì: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64) {
      const buffer = await decodeAudioData(decode(base64), getSfxCtx());
      memoryCache.set(text, buffer);
    }
  } catch (e) {}
};

export const speakWithGemini = async (text: string) => {
  const ctx = getSfxCtx();
  if (ctx.state === 'suspended') await ctx.resume();
  const cached = memoryCache.get(text);
  if (cached) {
    const source = ctx.createBufferSource();
    source.buffer = cached; source.connect(ctx.destination); source.start();
  } else {
    speakInstant(text, 'it');
  }
};

export const speakInstant = (text: string, lang: 'it' | 'en') => {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang === 'it' ? 'it-IT' : 'en-US';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
};
