// Mluvení: nahrávka z mikrofonu → WAV 16 kHz mono → server → Azure Speech.
// Nahrávka se nikde neukládá; po odeslání zůstane jen přepis v paměti.
//
// Nahrává se přes Web Audio (ne MediaRecorder): na iPadu i v Chromu tak
// vznikne stejný nekomprimovaný zvuk a není třeba nic dekódovat.

import type { SpeechResult } from './saymatch';

const API = '/api/mluveni';
export const SAMPLE_RATE = 16000;

/** Zeptá se serveru, jestli je mluvení zapnuté (klíč Azure + rodinný kód).
 *  Ve vývoji bez serveru (vite) přijde HTML místo JSON → vypnuto. */
export async function speechStatus(): Promise<boolean> {
  try {
    const res = await fetch(API, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
    if (!res.ok || !String(res.headers.get('content-type')).includes('json')) return false;
    const data = (await res.json()) as { enabled?: unknown };
    return data.enabled === true;
  } catch {
    return false;
  }
}

/** Pošle nahrávku k přepisu. `ref` = věta k opakování (hodnotí se výslovnost). */
export async function checkSpeech(wav: Blob, ref?: string): Promise<SpeechResult> {
  const failed: SpeechResult = { status: 'error', text: '', lexical: '', scores: null, words: [] };
  try {
    const url = ref ? `${API}?ref=${encodeURIComponent(ref)}` : API;
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'audio/wav' }, body: wav, credentials: 'same-origin' });
    if (!res.ok) return failed;
    return (await res.json()) as SpeechResult;
  } catch {
    return failed;
  }
}

/** Převzorkuje mono záznam (průměr přes okno – stačí pro řeč). */
export function downsample(input: Float32Array, from: number, to = SAMPLE_RATE): Float32Array {
  if (from === to) return input;
  const ratio = from / to;
  const out = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j];
    out[i] = end > start ? sum / (end - start) : 0;
  }
  return out;
}

/** 16bitový PCM WAV (mono). */
export function encodeWav(samples: Float32Array, rate = SAMPLE_RATE): ArrayBuffer {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const text = (at: number, s: string) => [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  v.setUint32(4, 36 + samples.length * 2, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  text(36, 'data');
  v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buf;
}

export const canRecord = () =>
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof window !== 'undefined' && !!(window.AudioContext ?? (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext);

export interface Recording {
  /** Ukončí nahrávání a vrátí WAV (null = nic nezaznělo). */
  stop: () => Promise<Blob | null>;
  /** Zahodí nahrávku. */
  cancel: () => void;
}

export interface RecordOptions {
  /** Hlasitost 0–1 pro „ručičku“ mikrofonu. */
  onLevel?: (level: number) => void;
  /** Zavolá se, když dítě domluví (ticho po řeči) nebo dojde čas. */
  onAutoStop?: () => void;
  maxMs?: number;
}

const SPEECH_LEVEL = 0.03; // RMS, od kdy je to hlas a ne šum
const SILENT = 0.008; // pod tím je celá nahrávka ticho
const SILENCE_MS = 1300; // ticho po řeči = domluveno

/** Spustí nahrávání. Musí se volat z klepnutí (iOS jinak zvuk nepustí).
 *  Vyhodí chybu, když mikrofon není povolený. */
export async function startRecording({ onLevel, onAutoStop, maxMs = 8000 }: RecordOptions = {}): Promise<Recording> {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  // iOS: kontext vytvořený v klepnutí je třeba ještě výslovně spustit.
  if (ctx.state === 'suspended') await ctx.resume().catch(() => undefined);
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  } catch (err) {
    void ctx.close().catch(() => undefined);
    throw err;
  }
  const source = ctx.createMediaStreamSource(stream);
  const node = ctx.createScriptProcessor(4096, 1, 1);
  const chunks: Float32Array[] = [];
  const started = performance.now();
  let spoke = false;
  let peak = 0;
  let lastVoice = started;
  let done = false;

  node.onaudioprocess = (e) => {
    if (done) return;
    const data = e.inputBuffer.getChannelData(0);
    chunks.push(new Float32Array(data));
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
    const rms = Math.sqrt(sum / data.length);
    peak = Math.max(peak, rms);
    onLevel?.(Math.min(1, rms * 8));
    const now = performance.now();
    if (rms > SPEECH_LEVEL) {
      spoke = true;
      lastVoice = now;
    }
    if ((spoke && now - lastVoice > SILENCE_MS) || now - started > maxMs) onAutoStop?.();
  };
  source.connect(node);
  node.connect(ctx.destination); // bez výstupu by Safari zpracování nespustil

  const release = () => {
    done = true;
    node.onaudioprocess = null;
    try {
      source.disconnect();
      node.disconnect();
    } catch {
      /* už odpojené */
    }
    stream.getTracks().forEach((t) => t.stop());
    void ctx.close().catch(() => undefined);
  };

  return {
    stop: async () => {
      const rate = ctx.sampleRate;
      release();
      if (peak < SILENT) return null;
      const length = chunks.reduce((n, c) => n + c.length, 0);
      const all = new Float32Array(length);
      let at = 0;
      for (const c of chunks) {
        all.set(c, at);
        at += c.length;
      }
      return new Blob([encodeWav(downsample(all, rate))], { type: 'audio/wav' });
    },
    cancel: release,
  };
}
