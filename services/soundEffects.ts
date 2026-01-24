
// Utilizziamo un singolo AudioContext per l'intera app per efficienza
let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

const playTone = (freq: number, type: OscillatorType, duration: number, startTime: number = 0) => {
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
  
  gain.gain.setValueAtTime(0.1, ctx.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime + startTime);
  osc.stop(ctx.currentTime + startTime + duration);
};

export const playClickSound = () => {
  // Un "pop" breve e piacevole
  playTone(600, 'sine', 0.1);
};

export const playWinSound = () => {
  // Un arpeggio ascendente in maggiore
  const now = 0;
  playTone(523.25, 'triangle', 0.2, now);       // C5
  playTone(659.25, 'triangle', 0.2, now + 0.1); // E5
  playTone(783.99, 'triangle', 0.4, now + 0.2); // G5
  playTone(1046.50, 'sine', 0.6, now + 0.3);    // C6
};

export const playLoseSound = () => {
  // Un tono discendente triste
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);

  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.5);
};
