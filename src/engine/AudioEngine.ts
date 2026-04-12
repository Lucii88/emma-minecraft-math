let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicEnabled = true;
let sfxEnabled = true;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.15) {
  if (!sfxEnabled) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(masterGain!);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function playClick() {
  playTone(800, 0.06, 'square', 0.08);
}

export function playCorrect() {
  const ctx = getCtx();
  if (!sfxEnabled) return;
  const notes = [523, 659, 784];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.15, 'square', 0.12), i * 80);
  });
}

export function playWrong() {
  playTone(200, 0.25, 'sawtooth', 0.1);
  setTimeout(() => playTone(160, 0.3, 'sawtooth', 0.08), 100);
}

export function playLevelUp() {
  if (!sfxEnabled) return;
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.2, 'square', 0.1), i * 120);
  });
  setTimeout(() => {
    playTone(1047, 0.4, 'triangle', 0.08);
  }, 500);
}

export function playAchievement() {
  if (!sfxEnabled) return;
  const notes = [784, 988, 1175, 1319];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.25, 'triangle', 0.1), i * 100);
  });
}

export function playXPOrb() {
  const freq = 600 + Math.random() * 400;
  playTone(freq, 0.08, 'sine', 0.06);
}

export function playFlip() {
  playTone(440, 0.05, 'square', 0.05);
}

export function playMatch() {
  playTone(660, 0.12, 'square', 0.1);
  setTimeout(() => playTone(880, 0.15, 'square', 0.1), 60);
}

export function playPurchase() {
  const notes = [440, 554, 659];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.12, 'triangle', 0.1), i * 80);
  });
}

let musicOsc: OscillatorNode | null = null;
let musicGainNode: GainNode | null = null;
let musicInterval: number | null = null;

const MELODY = [
  262, 294, 330, 262, 0, 330, 349, 392, 0,
  392, 440, 392, 349, 330, 262, 0,
  294, 262, 220, 262, 0, 0,
];

export function startMusic() {
  if (!musicEnabled || musicInterval) return;
  const ctx = getCtx();
  let idx = 0;

  musicGainNode = ctx.createGain();
  musicGainNode.gain.value = 0.04;
  musicGainNode.connect(masterGain!);

  function playNote() {
    if (!musicEnabled) { stopMusic(); return; }
    const freq = MELODY[idx % MELODY.length];
    idx++;
    if (freq === 0) return;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0.04, ctx.currentTime);
    noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(noteGain);
    noteGain.connect(musicGainNode!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  }

  musicInterval = window.setInterval(playNote, 400);
}

export function stopMusic() {
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
}

export function toggleMusic() {
  musicEnabled = !musicEnabled;
  if (!musicEnabled) stopMusic();
  else startMusic();
  return musicEnabled;
}

export function toggleSfx() {
  sfxEnabled = !sfxEnabled;
  return sfxEnabled;
}

export function initAudio() {
  getCtx();
}
