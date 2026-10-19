// ── Synthesized alert sounds (WebAudio, zero assets) ─────────────────────
// Three acoustically distinct signatures so the student can tell, without
// looking at the screen, whether a CLASS / EXAM / PRESENTATION is coming up.

import type { ReminderKind } from "./reminders";

let ctx: AudioContext | null = null;

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

interface ToneOpts {
  freq: number;
  start: number; // offset seconds from now
  dur: number;
  type?: OscillatorType;
  gain?: number;
  slideTo?: number;
}

function tone(ac: AudioContext, { freq, start, dur, type = "sine", gain = 0.16, slideTo }: ToneOpts): void {
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/** CLASS — soft, friendly two-note chime (E5 → A5) */
export function playClassChime(): void {
  const ac = ensureAudio();
  if (!ac) return;
  tone(ac, { freq: 659.25, start: 0, dur: 0.34, type: "sine", gain: 0.2 });
  tone(ac, { freq: 880, start: 0.24, dur: 0.5, type: "sine", gain: 0.2 });
}

/** EXAM — urgent triple alarm (880 Hz pulses, square-ish) */
export function playExamAlarm(): void {
  const ac = ensureAudio();
  if (!ac) return;
  for (let i = 0; i < 3; i++) {
    tone(ac, { freq: 880, start: i * 0.21, dur: 0.14, type: "square", gain: 0.09 });
    tone(ac, { freq: 587.33, start: i * 0.21 + 0.02, dur: 0.12, type: "triangle", gain: 0.07 });
  }
}

/** PRESENTATION — rising arpeggio (C5 → E5 → G5 → C6) */
export function playPresentationChime(): void {
  const ac = ensureAudio();
  if (!ac) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => {
    tone(ac, { freq: f, start: i * 0.13, dur: 0.22, type: "triangle", gain: 0.15 });
  });
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
