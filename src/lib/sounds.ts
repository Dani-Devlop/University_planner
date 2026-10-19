// WEEKLY//UNI — Web-Audio synth notification sounds (no audio assets)
// Three distinct signatures: class bell / exam siren / presentation harp arp.

export type SoundKind = "class" | "exam" | "presentation";

/** Lazily created + cached AudioContext */
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Shared master chain: delay feedback + compressor */
function masterChain(ac: AudioContext): GainNode {
  const input = ac.createGain();
  input.gain.value = 0.9;

  const delay = ac.createDelay(1);
  delay.delayTime.value = 0.155;
  const fb = ac.createGain();
  fb.gain.value = 0.34;
  delay.connect(fb).connect(delay);

  const wet = ac.createGain();
  wet.gain.value = 0.22;
  delay.connect(wet);

  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.knee.value = 12;
  comp.ratio.value = 4;
  comp.attack.value = 0.004;
  comp.release.value = 0.24;

  input.connect(comp);
  input.connect(delay);
  wet.connect(comp);
  comp.connect(ac.destination);
  return input;
}

interface ToneOpts {
  freq: number;
  start: number;
  dur: number;
  type?: OscillatorType;
  peak?: number;
  /** vibrato: [rateHz, depthHz, delaySec] */
  vibrato?: [number, number, number];
  /** harmonics for bell partials: [freqRatio, gain, durScale] */
  partials?: Array<[number, number, number]>;
  glideTo?: number;
  lowpass?: number;
}

function tone(ac: AudioContext, out: GainNode, o: ToneOpts) {
  const t0 = ac.currentTime + o.start;
  const osc = ac.createOscillator();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(o.glideTo, t0 + o.dur);

  const g = ac.createGain();
  const peak = o.peak ?? 0.22;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);

  let node: AudioNode = osc;
  if (o.lowpass) {
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = o.lowpass;
    osc.connect(lp);
    node = lp;
  }
  node.connect(g).connect(out);

  if (o.vibrato) {
    const [rate, depth, vd] = o.vibrato;
    const lfo = ac.createOscillator();
    lfo.frequency.value = rate;
    const lg = ac.createGain();
    lg.gain.setValueAtTime(0.0001, t0);
    lg.gain.linearRampToValueAtTime(depth, t0 + vd);
    lfo.connect(lg).connect(osc.frequency);
    lfo.start(t0);
    lfo.stop(t0 + o.dur + 0.1);
  }

  for (const [ratio, pg, ds] of o.partials ?? []) {
    const po = ac.createOscillator();
    po.type = "sine";
    po.frequency.setValueAtTime(o.freq * ratio, t0);
    const pg2 = ac.createGain();
    pg2.gain.setValueAtTime(0.0001, t0);
    pg2.gain.exponentialRampToValueAtTime(peak * pg, t0 + 0.01);
    pg2.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur * ds);
    po.connect(pg2).connect(out);
    po.start(t0);
    po.stop(t0 + o.dur * ds + 0.05);
  }

  osc.start(t0);
  osc.stop(t0 + o.dur + 0.05);
}

/** دو لَخی «دینگ‌دونگ» — E6(1318.51) → C6(1046.5) with inharmonic partials, vibrato [180,80,180] */
export function playClassBell() {
  const ac = getCtx();
  if (!ac) return;
  const out = masterChain(ac);
  const E6 = 1318.51, C6 = 1046.5;
  // دینگ
  tone(ac, out, {
    freq: E6, start: 0, dur: 0.5, peak: 0.26,
    partials: [[2.756, 0.5, 0.6], [5.404, 0.25, 0.35], [8.933, 0.12, 0.2]],
    vibrato: [180, 80, 180] as unknown as [number, number, number],
  });
  // دونگ
  tone(ac, out, {
    freq: C6, start: 0.28, dur: 0.85, peak: 0.3,
    partials: [[2.756, 0.5, 0.6], [5.404, 0.22, 0.4], [8.933, 0.1, 0.22]],
  });
}

/** آژیر سه‌ضرب — D5(587.33) → G5(783.99) square + lowpass, 9 short vibrato hits */
export function playExamSiren() {
  const ac = getCtx();
  if (!ac) return;
  const out = masterChain(ac);
  const D5 = 587.33, G5 = 783.99;
  for (let i = 0; i < 3; i++) {
    const t = i * 0.34;
    tone(ac, out, {
      freq: D5, glideTo: G5, start: t, dur: 0.26, type: "square", peak: 0.16, lowpass: 2400,
      vibrato: [9, 26, 0.05],
    });
  }
}

/** آرپژ هارپ پنتاتونیک C5..E6 + sparkle chord C6/G6/C7 — 6 short + 1 long vibrato */
export function playPresentationArp() {
  const ac = getCtx();
  if (!ac) return;
  const out = masterChain(ac);
  const NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5]; // C5 D5 E5 G5 A5 C6
  NOTES.forEach((f, i) => {
    tone(ac, out, { freq: f, start: i * 0.09, dur: 0.3, type: "triangle", peak: 0.16, vibrato: [6, 3, 0.06] });
  });
  // sparkle chord
  [1046.5, 1567.98, 2093.0].forEach((f, i) => {
    tone(ac, out, { freq: f, start: 0.62 + i * 0.02, dur: 1.1, type: "sine", peak: 0.1, vibrato: [5.5, 4, 0.4] });
  });
}

export function playSound(kind: SoundKind) {
  switch (kind) {
    case "class": return playClassBell();
    case "exam": return playExamSiren();
    case "presentation": return playPresentationArp();
  }
}

export const SOUND_LABELS: Record<SoundKind, string> = {
  class: "زنگ دینگ‌دونگ",
  exam: "آژیر سه‌ضرب",
  presentation: "آرپژ صحنه",
};
