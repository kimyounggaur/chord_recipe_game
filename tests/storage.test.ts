import test from 'node:test';
import assert from 'node:assert/strict';
import { freshSave, parseImport, mergeSave, saveData, loadSave, resetStoredSave, STORAGE_KEY, MAX_IMPORT_BYTES, type Evidence } from '../src/storage.ts';

const ev = (overrides: Partial<Evidence> = {}): Evidence => ({ completed: false, independent: false, explained: false, audioCompared: false, visualCompared: false, bestHintLevel: 3, ...overrides });

class MemoryStorage {
  map = new Map<string, string>();
  throwWrites = false;
  getItem(key: string) { return this.map.get(key) ?? null; }
  setItem(key: string, value: string) { if (this.throwWrites) throw new Error('quota'); this.map.set(key, value); }
  removeItem(key: string) { this.map.delete(key); }
}
const storage = new MemoryStorage();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });

test('fresh data exports and imports without changing lesson evidence', () => {
  const data = freshSave();
  data.lessons.L01 = ev({ completed: true, audioCompared: true, bestHintLevel: 2 });
  data.recipes.push({ id: 'C:0:major', root: 'C', quality: 'major', octave: 4, unlockedAt: data.updatedAt });
  data.resume = { lessonId: 'L23', seed: 123, questionIndex: 2, mode: 'order' };
  data.currentAttempt = { lessonId: 'L23', maxHintLevel: 3, submittedAttempts: 1, explained: false };
  data.mixedProgress = { L23: { seed: 123, questionOrder: ['L01', 'L05', 'L20', 'L22'], currentIndex: 2, results: { L01: ev({ completed: true }), L05: ev({ completed: true }) } } };
  assert.deepEqual(parseImport(JSON.stringify(data)), data);
});

test('import rejects invalid nested values, unknown qualities, future versions and oversized files', () => {
  const data = freshSave();
  const invalid = (mutate: (value: any) => void) => { const copy = structuredClone(data); mutate(copy); assert.throws(() => parseImport(JSON.stringify(copy))); };
  invalid(d => { d.settings.volume = 1.1; });
  invalid(d => { d.tutorial.evidence.bad = 'true'; });
  invalid(d => { d.lessons.L01 = ev({ bestHintLevel: 4 }); });
  invalid(d => { d.recipes = [{ id: 'bad', root: 'H', quality: 'major', octave: 4, unlockedAt: d.updatedAt }]; });
  invalid(d => { d.recipes = [{ id: 'bad', root: 'C', quality: 'dominant', octave: 4, unlockedAt: d.updatedAt }]; });
  invalid(d => { d.schemaVersion = 2; });
  invalid(d => { d.currentAttempt = { lessonId: 'L01', maxHintLevel: 1, submittedAttempts: -1, explained: false }; });
  invalid(d => { d.currentAttempt = { lessonId: 'L99', maxHintLevel: 1, submittedAttempts: 0, explained: false }; });
  invalid(d => { d.tutorial.checkpoint = 14; });
  invalid(d => { d.lessons.L25 = ev(); });
  invalid(d => { d.resume = { lessonId: 'L25' }; });
  invalid(d => { d.resume = { lessonId: 'L23', questionIndex: 4 }; });
  invalid(d => { d.resume = { lessonId: 'L01', mode: 'admin' }; });
  invalid(d => { d.recipes = [{ id: 'C:0:major', root: 'B##', quality: 'augmented', octave: 4, unlockedAt: d.updatedAt }]; });
  invalid(d => { d.recipes = [{ id: 'D:0:major', root: 'C', quality: 'major', octave: 4, unlockedAt: d.updatedAt }]; });
  invalid(d => { d.recipes = [{ id: 'C:0:major', root: 'C', quality: 'major', octave: 9, unlockedAt: d.updatedAt }]; });
  invalid(d => { d.mixedProgress = { L23: { seed: 2, questionOrder: ['L01'], currentIndex: 2, results: {} } }; });
  assert.throws(() => parseImport('{broken'));
  assert.throws(() => parseImport(' '.repeat(MAX_IMPORT_BYTES + 1)));
  assert.throws(() => parseImport(JSON.stringify(data).replace('"lessons":{}', '"lessons":{"__proto__":{}}')));
});

test('canonical roots and recipe IDs retain spelling, including double accidentals in generated chord tones', () => {
  const data = freshSave();
  data.recipes = [
    { id: 'F:1:augmented', root: 'F♯', quality: 'augmented', octave: 4, unlockedAt: data.updatedAt },
    { id: 'D:-1:diminished', root: 'D♭', quality: 'diminished', octave: 4, unlockedAt: data.updatedAt },
  ];
  assert.equal(parseImport(JSON.stringify(data)).recipes.length, 2);
});

test('merge preserves earned stamps and this device settings, unions recipes and comparison evidence', () => {
  const a = freshSave(), b = freshSave();
  a.settings.muted = true; b.settings.volume = 0.9;
  a.lessons.L01 = ev({ completed: true, independent: true, audioCompared: true, bestHintLevel: 1 });
  b.lessons.L01 = ev({ completed: true, explained: true, visualCompared: true, bestHintLevel: 3 });
  a.recipes = [{ id: 'C:0:major', root: 'C', quality: 'major', octave: 4, unlockedAt: a.updatedAt }];
  b.recipes = [{ id: 'C:0:minor', root: 'C', quality: 'minor', octave: 4, unlockedAt: b.updatedAt }];
  a.tutorial.checkpoint = 6; b.tutorial.checkpoint = 4;
  const result = mergeSave(a, b);
  assert.deepEqual(result.lessons.L01, ev({ completed: true, independent: true, explained: true, audioCompared: true, visualCompared: true, bestHintLevel: 1 }));
  assert.equal(result.settings.muted, true);
  assert.equal(result.settings.volume, a.settings.volume);
  assert.equal(result.recipes.length, 2);
  assert.equal(result.tutorial.checkpoint, 6);
});

test('storage round trip, corruption recovery, future-version preservation, quota fallback and scoped reset', () => {
  storage.map.clear(); storage.throwWrites = false; resetStoredSave();
  storage.setItem('unrelated-app', 'keep me');
  const data = freshSave(); data.lessons.L01 = ev({ completed: true });
  assert.equal(saveData(data), null);
  assert.equal(loadSave().data.lessons.L01.completed, true);
  storage.setItem(STORAGE_KEY, '{broken');
  assert.match(loadSave().warning ?? '', /기록|파일/);
  assert.equal(storage.getItem(`${STORAGE_KEY}:recovery`), '{broken');
  assert.equal(saveData(data), null);
  storage.setItem(STORAGE_KEY, '{"schemaVersion":99}');
  assert.match(loadSave().warning ?? '', /새로운 버전/);
  assert.ok(saveData(data));
  assert.equal(storage.getItem(STORAGE_KEY), '{"schemaVersion":99}');
  assert.equal(resetStoredSave(), null);
  storage.throwWrites = true;
  assert.ok(saveData(data));
  assert.equal(loadSave().data.lessons.L01.completed, true);
  storage.throwWrites = false; resetStoredSave();
  assert.equal(storage.getItem('unrelated-app'), 'keep me');
});

test('mixed progress merge keeps fixed order and already completed per-question results', () => {
  const a = freshSave(), b = freshSave();
  a.mixedProgress = { L23: { seed: 5, questionOrder: ['L01', 'L05'], currentIndex: 1, results: { L01: ev({ completed: true, bestHintLevel: 3 }) } } };
  b.mixedProgress = { L23: { seed: 5, questionOrder: ['L01', 'L05'], currentIndex: 1, results: { L05: ev({ completed: true, independent: true, bestHintLevel: 1 }) } } };
  const merged = mergeSave(a, b).mixedProgress!.L23;
  assert.equal(merged.currentIndex, 1);
  assert.equal(merged.results.L01.completed, true);
  assert.equal(merged.results.L01.bestHintLevel, 3);
  assert.equal(merged.results.L05.independent, true);
});

test('known v0 data migrates and unsupported older schemas are rejected', () => {
  const data = { ...freshSave(), schemaVersion: 0 };
  assert.equal(parseImport(JSON.stringify(data)).schemaVersion, 1);
  assert.throws(() => parseImport(JSON.stringify({ ...data, schemaVersion: -1 })));
});
