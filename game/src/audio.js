// audio.js — every sound in the bakery is synthesized with WebAudio.
// One clear job: sound only. No files, no network, no DOM.
let ctx = null;
let master = null;
let muted = false;

function ensureContext() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ensureContext();
}

export function setMuted(value) {
  muted = value;
  if (master) master.gain.value = value ? 0 : 0.5;
}

export function isMuted() {
  return muted;
}

function tone(freq, seconds, type = 'sine', volume = 0.25, when = 0) {
  if (muted) return;
  const ac = ensureContext();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = ac.currentTime + when;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t);
  osc.stop(t + seconds + 0.05);
}

function noise(seconds, filterFreq = 1200, volume = 0.2, when = 0) {
  if (muted) return;
  const ac = ensureContext();
  if (!ac) return;
  const len = Math.floor(ac.sampleRate * seconds);
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const gain = ac.createGain();
  const t = ac.currentTime + when;
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start(t);
}

export const sfx = {
  click() { tone(660, 0.06, 'triangle', 0.15); },
  pickup() { tone(520, 0.07, 'sine', 0.18); tone(780, 0.06, 'sine', 0.12, 0.05); },
  chop() { noise(0.08, 900, 0.3); tone(180, 0.08, 'square', 0.12); },
  mix() { noise(0.25, 500, 0.12); },
  sizzle() { noise(0.4, 3200, 0.14); noise(0.3, 5200, 0.08, 0.1); },
  ding() { tone(880, 0.25, 'sine', 0.22); tone(1318, 0.35, 'sine', 0.18, 0.08); },
  serve() { tone(523, 0.12, 'triangle', 0.22); tone(659, 0.12, 'triangle', 0.22, 0.09); tone(784, 0.22, 'triangle', 0.22, 0.18); },
  error() { tone(160, 0.18, 'sawtooth', 0.14); tone(120, 0.22, 'sawtooth', 0.12, 0.1); },
  orderIn() { tone(392, 0.09, 'triangle', 0.16); tone(523, 0.12, 'triangle', 0.16, 0.08); },
  lost() { tone(330, 0.2, 'triangle', 0.16); tone(247, 0.3, 'triangle', 0.16, 0.15); },
  brew() { noise(0.3, 800, 0.12); tone(300, 0.15, 'sine', 0.1, 0.05); },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', 0.22, i * 0.12));
  },
  tick() { tone(980, 0.05, 'square', 0.08); },
};
