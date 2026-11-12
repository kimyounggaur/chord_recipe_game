export type PlaybackResult = {
  status: 'completed' | 'cancelled' | 'blocked' | 'error';
  sessionId: number;
};

type Pending = { id: number; resolve: (result: PlaybackResult) => void };
type Segment = { midis: readonly number[]; offset: number; duration: number };
type ContextFactory = () => AudioContext;

/** A single cancellable audio transport. A fulfilled `completed` means actual source end. */
export class AudioEngine {
  onStateChange?: (busy: boolean, active: number[]) => void;
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private nodes = new Set<OscillatorNode>();
  private gains = new Set<GainNode>();
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private pending: Pending | null = null;
  private session = 0;
  private volume = 0.55;
  private muted = false;
  private disposed = false;
  private readonly hidden = () => {
    if (typeof document === 'undefined' || document.hidden) this.stopAll();
  };
  private readonly blur = () => this.stopAll();

  constructor(private readonly factory: ContextFactory = () => {
    const scope = globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext };
    const Ctor = scope.AudioContext || scope.webkitAudioContext;
    if (!Ctor) throw new Error('Web Audio is unavailable');
    return new Ctor();
  }) {
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', this.hidden);
    if (typeof window !== 'undefined') window.addEventListener('blur', this.blur);
  }

  async unlock(): Promise<'running' | 'blocked'> {
    if (this.disposed) return 'blocked';
    try {
      if (!this.context || this.context.state === 'closed') {
        this.context = this.factory();
        this.master = this.context.createGain();
        this.master.gain.value = this.muted ? 0 : this.volume;
        this.master.connect(this.context.destination);
      }
      if (this.context.state !== 'running') await this.context.resume();
      return this.context.state === 'running' ? 'running' : 'blocked';
    } catch {
      return 'blocked';
    }
  }

  setVolume(value: number): void {
    this.volume = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
    if (this.volume === 0) this.stopAll();
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.context.currentTime, 0.015);
    }
  }

  setMuted(value: boolean): void {
    this.muted = value;
    if (value) this.stopAll();
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(value ? 0 : this.volume, this.context.currentTime, 0.015);
    }
  }

  playSingle(midi: number): Promise<PlaybackResult> {
    return this.run([{ midis: [midi], offset: 0, duration: 0.48 }]);
  }

  playSequence(midis: readonly number[]): Promise<PlaybackResult> {
    return this.run(midis.map((midi, index) => ({ midis: [midi], offset: index * 0.42, duration: 0.37 })));
  }

  playChord(midis: readonly number[]): Promise<PlaybackResult> {
    return this.run([{ midis, offset: 0, duration: 0.9 }]);
  }

  compare(a: readonly number[], b: readonly number[]): Promise<PlaybackResult> {
    return this.run([
      { midis: a, offset: 0, duration: 0.9 },
      { midis: b, offset: 1.25, duration: 0.9 },
    ]);
  }

  stopAll(): void {
    this.session += 1;
    this.cancelSources();
    const pending = this.pending;
    this.pending = null;
    pending?.resolve({ status: 'cancelled', sessionId: pending.id });
    this.emit(false, []);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopAll();
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.hidden);
    if (typeof window !== 'undefined') window.removeEventListener('blur', this.blur);
    if (this.context && this.context.state !== 'closed') void this.context.close().catch(() => undefined);
    this.context = null;
    this.master = null;
    this.onStateChange = undefined;
  }

  private run(segments: Segment[]): Promise<PlaybackResult> {
    this.stopAll();
    const id = this.session;
    if (this.disposed || this.muted || this.volume <= 0) return Promise.resolve({ status: 'blocked', sessionId: id });
    if (!segments.length || segments.some(s => !s.midis.length || s.midis.some(m => !Number.isInteger(m) || m < 0 || m > 127))) {
      return Promise.resolve({ status: 'error', sessionId: id });
    }
    const result = new Promise<PlaybackResult>(resolve => { this.pending = { id, resolve }; });
    this.emit(true, []);
    void this.prepare(id, segments);
    return result;
  }

  private async prepare(id: number, segments: Segment[]): Promise<void> {
    const ready = await this.unlock();
    // stopAll also invalidates an in-flight resume() request.
    if (id !== this.session || !this.pending || this.pending.id !== id) return;
    if (ready !== 'running' || !this.context || !this.master) {
      this.finish(id, 'blocked');
      return;
    }
    try {
      const context = this.context;
      const start = context.currentTime + 0.025;
      const sourceCount = segments.reduce((total, s) => total + s.midis.length * 2, 0);
      let ended = 0;
      for (const segment of segments) {
        const time = start + segment.offset;
        const end = time + segment.duration;
        const noteGain = 0.19 / Math.sqrt(segment.midis.length);
        for (const midi of segment.midis) {
          const frequency = 440 * 2 ** ((midi - 69) / 12);
          for (const harmonic of [1, 2]) {
            const oscillator = context.createOscillator();
            const envelope = context.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.value = frequency * harmonic;
            const peak = noteGain * (harmonic === 1 ? 1 : 0.16);
            envelope.gain.setValueAtTime(0, time);
            envelope.gain.linearRampToValueAtTime(peak, time + 0.015);
            envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * 0.45), end - 0.1);
            envelope.gain.exponentialRampToValueAtTime(0.0001, end);
            oscillator.connect(envelope);
            envelope.connect(this.master);
            this.nodes.add(oscillator);
            this.gains.add(envelope);
            oscillator.onended = () => {
              this.nodes.delete(oscillator);
              this.gains.delete(envelope);
              oscillator.disconnect();
              envelope.disconnect();
              if (id !== this.session) return;
              ended += 1;
              if (ended === sourceCount) this.finish(id, 'completed');
            };
            // start is called immediately with a future audio-clock time, so every tracked
            // source is stoppable even before its scheduled audible onset.
            oscillator.start(time);
            oscillator.stop(end);
          }
        }
        this.later(id, Math.max(0, (time - context.currentTime) * 1000), () => this.emit(true, [...segment.midis]));
        this.later(id, Math.max(0, (end - context.currentTime) * 1000), () => this.emit(true, []));
      }
    } catch {
      this.cancelSources();
      this.finish(id, 'error');
    }
  }

  private later(id: number, delay: number, callback: () => void): void {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      if (id === this.session && this.pending?.id === id) callback();
    }, delay);
    this.timers.add(timer);
  }

  private finish(id: number, status: PlaybackResult['status']): void {
    if (id !== this.session || this.pending?.id !== id) return;
    const pending = this.pending;
    this.pending = null;
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
    this.emit(false, []);
    pending.resolve({ status, sessionId: id });
  }

  private cancelSources(): void {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
    for (const node of this.nodes) {
      node.onended = null;
      try { node.stop(); } catch { /* A failed start should not prevent other sources stopping. */ }
      try { node.disconnect(); } catch { /* Already disconnected. */ }
    }
    this.nodes.clear();
    for (const gain of this.gains) gain.disconnect();
    this.gains.clear();
  }

  private emit(busy: boolean, active: number[]): void {
    this.onStateChange?.(busy, active);
  }
}

export const audio = new AudioEngine();
