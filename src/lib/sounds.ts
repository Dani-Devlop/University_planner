// ── Synthesized alert sounds (WebAudio, zero assets) ─────────────────────
// Three acoustically DIFFERENT signatures so the student can tell, without
// looking at the screen, whether a CLASS / EXAM / PRESENTATION is coming up:
//
//   CLASS         → "campus bell"   — classic two-stroke ding-dong bell
//   EXAM          → "urgent siren"  — rising wee-woo alarm bursts ×3
//   PRESENTATION  → "spotlight run" — fast harp arpeggio + shimmer chord
//
// All voices run through a shared bus: soft feedback-delay reverb +
// compressor, so the chimes sound warm and full instead of beepy.
// Each kind also has its own vibration pattern (Android PWA).

import type { ReminderKind } from "./reminders";

let ctx: AudioContext | null = null;
let bus: GainNode | null = null;

type ACtor = typeof AudioContext;

export function ensureAudio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AC: ACtor | undefined =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: ACtor }).webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Shared master chain: dry + feedback-delay "hall" reverb → compressor. */
function masterBus(ac: AudioContext): GainNode {
  if (bus) return bus;
  const input = ac.createGain();
  input.gain.value = 1;

  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.knee.value = 22;
  comp.ratio.value = 4;
  comp.attack.value = 0.004;
  comp.release.value = 0.28;

  const delay = ac.createDelay(1);
  delay.delayTime.value = 0.155;
  const damp = ac.createBiquadFilter();
  damp.type = "lowpass";
  damp.frequency.value = 4200;
  const feedback = ac.createGain();
  feedback.gain.value = 0.34;
  const wet = ac.createGain();
  wet.gain.value = 0.22;

  input.connect(comp); // dry path
  input.connect(delay);
  delay.connect(damp);
  damp.connect(feedback);
  feedback.connect(delay); // cycle contains a DelayNode → allowed by WebAudio
  damp.connect(wet);
  wet.connect(comp);

  comp.connect(ac.destination);
  bus = input;
  return bus;
}

/** route through an optional stereo panner */
function route(ac: AudioContext, node: AudioNode, pan: number): GainNode {
  const out = ac.createGain();
  out.gain.value = 1;
  if (pan !== 0 && typeof ac.createStereoPanner === "function") {
    const p = ac.createStereoPanner();
    p.pan.value = pan;
    node.connect(p);
    p.connect(out);
  } else {
    node.connect(out);
  }
  out.connect(masterBus(ac));
  return out;
}

/** Bell voice — sine fundamental + inharmonic shimmer partials. */
function bellVoice(
  ac: AudioContext,
  freq: number,
  start: number,
  dur: number,
  gain: number,
  pan = 0
): void {
  const t0 = ac.currentTime + start;
  const partials: Array<[number, number, number]> = [
    // [multiplier, gain, decay scale]
    [1, 1, 1],
    [2, 0.4, 0.7],
    [2.92, 0.2, 0.45],
    [4.16, 0.09, 0.3],
  ];
  for (const [mult, g, decayScale] of partials) {
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * mult, t0);
    const env = ac.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(gain * g, t0 + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.15, dur * decayScale));
    osc.connect(env);
    route(ac, env, pan);
    osc.start(t0);
    osc.stop(t0 + dur + 0.15);
  }
}

/** Alarm voice — square burst through a lowpass, sliding upward. */
function alarmVoice(
  ac: AudioContext,
  f0: number,
  f1: number,
  start: number,
  dur: number,
  gain: number
): void {
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(f0, t0);
  osc.frequency.exponentialRampToValueAtTime(f1, t0 + dur);

  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 2100;
  lp.Q.value = 3;

  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  env.gain.setValueAtTime(gain, t0 + dur * 0.7);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.connect(lp);
  lp.connect(env);
  route(ac, env, 0);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/** Harp voice — triangle body + sine octave sparkle, fast attack. */
function harpVoice(
  ac: AudioContext,
  freq: number,
  start: number,
  dur: number,
  gain: number,
  pan = 0
): void {
  const t0 = ac.currentTime + start;
  for (const [mult, g, type] of [
    [1, 1, "triangle"],
    [2, 0.28, "sine"],
    [3.01, 0.1, "sine"],
  ] as Array<[number, number, OscillatorType]>) {
    const osc = ac.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq * mult, t0);
    const env = ac.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(gain * g, t0 + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * (mult === 1 ? 1 : 0.55));
    osc.connect(env);
    route(ac, env, pan);
    osc.start(t0);
    osc.stop(t0 + dur + 0.1);
  }
}

// ── vibration patterns per kind ──────────────────────────────────────────
const VIBRATION: Record<ReminderKind, number[]> = {
  class: [180, 80, 180],
  exam: [320, 90, 320, 90, 320, 220, 320, 90, 320],
  presentation: [60, 60, 60, 60, 60, 60, 300],
};

function vibrate(kind: ReminderKind): void {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(VIBRATION[kind]);
    }
  } catch {
    /* vibration unsupported */
  }
}

/** CLASS — warm two-stroke campus bell: E6 "ding" → C6 "dong" */
export function playClassChime(): void {
  const ac = ensureAudio();
  if (!ac) return;
  vibrate("class");
  bellVoice(ac, 1318.51, 0, 1.05, 0.2, -0.12); // E6 ding
  bellVoice(ac, 1046.5, 0.34, 1.9, 0.24, 0.12); // C6 dong (longer tail)
}

/** EXAM — rising siren bursts ×3 (D5→G5 wee-woo), impossible to miss */
export function playExamAlarm(): void {
  const ac = ensureAudio();
  if (!ac) return;
  vibrate("exam");
  for (const group of [0, 0.72, 1.44]) {
    for (const dt of [0, 0.19]) {
      alarmVoice(ac, 587.33, 783.99, group + dt, 0.15, 0.12); // D5 → G5 slide
    }
  }
}

/** PRESENTATION — fast pentatonic harp run up + shimmering final chord */
export function playPresentationChime(): void {
  const ac = ensureAudio();
  if (!ac) return;
  vibrate("presentation");
  const run = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1318.51]; // C5..E6
  run.forEach((f, i) => {
    harpVoice(ac, f, i * 0.085, 0.5, 0.11, i % 2 === 0 ? -0.2 : 0.2);
  });
  const t = run.length * 0.085 + 0.05;
  bellVoice(ac, 1046.5, t, 2.2, 0.14, -0.25); // C6
  bellVoice(ac, 1568.0, t + 0.03, 2.0, 0.1, 0.25); // G6
  bellVoice(ac, 2093.0, t + 0.06, 1.6, 0.07, 0); // C7 sparkle
}

export function playReminderSound(kind: ReminderKind): void {
  if (kind === "exam") playExamAlarm();
  else if (kind === "presentation") playPresentationChime();
  else playClassChime();
}

/** Unlock the AudioContext on the first user gesture (needed on mobile). */
export function installAudioUnlock(): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __wuAudioUnlocked?: boolean };
  if (w.__wuAudioUnlocked) return;
  const unlock = () => {
    ensureAudio();
    w.__wuAudioUnlocked = true;
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}
