
import { GoogleGenAI, Modality } from "@google/genai";

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
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
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

// Singleton AudioContext per evitare lag di inizializzazione
let sharedAudioCtx: AudioContext | null = null;

export const speakWithGemini = async (text: string, language: 'it' | 'en' = 'it') => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return;

  // Inizializza o riprendi l'AudioContext
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  if (sharedAudioCtx.state === 'suspended') {
    await sharedAudioCtx.resume();
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = language === 'it' 
    ? `Dì con voce molto chiara e amichevole: ${text}` 
    : `Say clearly: ${text}`;
  
  const voiceName = language === 'it' ? 'Kore' : 'Puck';

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
      const audioBuffer = await decodeAudioData(decode(base64Audio), sharedAudioCtx, 24000, 1);
      const source = sharedAudioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(sharedAudioCtx.destination);
      source.start();
    }
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    speakInstant(text, language);
  }
};

// Funzione per feedback immediato senza latenza di rete
export const speakInstant = (text: string, language: 'it' | 'en' = 'it') => {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = language === 'it' ? 'it-IT' : 'en-US';
  utter.rate = 1.1;
  window.speechSynthesis.cancel(); // Interrompi pronunce precedenti per immediatezza
  window.speechSynthesis.speak(utter);
};
