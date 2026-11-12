import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioEngine } from '../src/audio.ts';

class Param {
  value = 0;
  setValueAtTime() { return this; }
  linearRampToValueAtTime() { return this; }
  exponentialRampToValueAtTime() { return this; }
  setTargetAtTime() { return this; }
}
class FakeGain {
  gain = new Param();
  connect() { return this; }
  disconnect() {}
}
class FakeOscillator {
  frequency = new Param();
  type = 'sine';
  starts: number[] = [];
  stops: (number | undefined)[] = [];
  onended: (() => void) | null = null;
  connect() { return this; }
  disconnect() {}
  start(time: number) { this.starts.push(time); }
  stop(time?: number) { this.stops.push(time); }
  end() { this.onended?.(); }
}
class FakeContext {
  state = 'running';
  currentTime = 0;
  destination = {};
  oscillators: FakeOscillator[] = [];
  resumeResolve?: () => void;
  waitForResume = false;
  createGain() { return new FakeGain(); }
  createOscillator() { const o = new FakeOscillator(); this.oscillators.push(o); return o; }
  resume() {
    if (!this.waitForResume) { this.state = 'running'; return Promise.resolve(); }
    return new Promise<void>(resolve => { this.resumeResolve = () => { this.state = 'running'; resolve(); }; });
  }
  close() { this.state = 'closed'; return Promise.resolve(); }
}
const tick = () => new Promise<void>(resolve => setTimeout(resolve, 0));
function setup() {
  const context = new FakeContext();
  const engine = new AudioEngine(() => context as unknown as AudioContext);
  return { context, engine };
}

test('resume pending cancellation resolves immediately and never schedules delayed sound', async () => {
  const { context, engine } = setup();
  context.state = 'suspended'; context.waitForResume = true;
  const result = engine.playChord([60, 64, 67]);
  engine.stopAll();
  assert.equal((await result).status, 'cancelled');
  context.resumeResolve?.();
  await tick();
  assert.equal(context.oscillators.length, 0);
  engine.dispose();
});

test('completed is emitted only after the last actual source ended', async () => {
  const { context, engine } = setup();
  let resolved = false;
  const promise = engine.playChord([60, 64, 67]).then(result => { resolved = true; return result; });
  await tick();
  assert.equal(context.oscillators.length, 6);
  assert.equal(resolved, false);
  for (const o of context.oscillators.slice(0, 5)) o.end();
  await tick();
  assert.equal(resolved, false);
  context.oscillators[5].end();
  assert.equal((await promise).status, 'completed');
  engine.dispose();
});

test('new playback cancels old scheduled sources and stale completion cannot end new playback', async () => {
  const { context, engine } = setup();
  const a = engine.playSequence([60, 64, 67]);
  await tick();
  const old = [...context.oscillators];
  const oldCallback = old[old.length - 1].onended;
  const b = engine.playChord([60, 63, 67]);
  assert.equal((await a).status, 'cancelled');
  await tick();
  assert.ok(old.every(o => o.stops.includes(undefined)), 'all sources including future starts are stopped');
  oldCallback?.();
  let bResolved = false;
  void b.then(() => { bResolved = true; });
  await tick();
  assert.equal(bResolved, false);
  for (const o of context.oscillators.slice(old.length)) o.end();
  assert.equal((await b).status, 'completed');
  engine.dispose();
});

test('muting cancels playback; muted and zero-volume requests cannot record listening', async () => {
  const { context, engine } = setup();
  const current = engine.playSingle(60);
  await tick();
  engine.setMuted(true);
  assert.equal((await current).status, 'cancelled');
  assert.equal((await engine.playSingle(60)).status, 'blocked');
  engine.setMuted(false); engine.setVolume(0);
  assert.equal((await engine.playChord([60, 64, 67])).status, 'blocked');
  assert.equal(context.oscillators.length, 2);
  engine.dispose();
});

test('invalid MIDI is an error without creating audio sources', async () => {
  const { context, engine } = setup();
  assert.equal((await engine.playSingle(NaN)).status, 'error');
  assert.equal((await engine.playSequence([])).status, 'error');
  assert.equal(context.oscillators.length, 0);
  engine.dispose();
});
