import { makeTriad, ROOTS, type Quality } from './music';

export interface Settings {
  volume: number;
  muted: boolean;
  reducedMotion: boolean;
  largeControls: boolean;
}

export interface Evidence {
  completed: boolean;
  independent: boolean;
  explained: boolean;
  audioCompared: boolean;
  visualCompared: boolean;
  bestHintLevel: number;
}

export interface SaveData {
  schemaVersion: 1;
  contentVersion: string;
  updatedAt: string;
  settings: Settings;
  lessons: Record<string, Evidence>;
  recipes: Array<{ id: string; root: string; quality: string; octave: number; unlockedAt: string }>;
  tutorial: { checkpoint: number; evidence: Record<string, boolean> };
  resume?: { lessonId: string; questionIndex?: number; seed?: number; mode?: 'tutorial' | 'practice' | 'order' | 'repair' };
  currentAttempt?: { lessonId: string; maxHintLevel: number; submittedAttempts: number; explained: boolean };
  mixedProgress?: Record<string, {
    seed: number;
    questionOrder: string[];
    currentIndex: number;
    results: Record<string, Evidence>;
  }>;
}

export const STORAGE_KEY = 'chord-recipe-kitchen:save:v1';
export const CONTENT_VERSION = '1.0.0';
export const MAX_IMPORT_BYTES = 1024 * 1024;
const QUALITIES = new Set(['major', 'minor', 'diminished', 'augmented']);
const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
let lastMemorySave: SaveData | null = null;
let persistenceBlocked: string | null = null;

export function freshSave(): SaveData {
  return {
    schemaVersion: 1,
    contentVersion: CONTENT_VERSION,
    updatedAt: new Date().toISOString(),
    settings: { volume: 0.32, muted: false, reducedMotion: false, largeControls: false },
    lessons: {},
    recipes: [],
    tutorial: { checkpoint: 0, evidence: {} },
  };
}

function object(value: unknown, name: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${name} 형식이 올바르지 않아요.`);
  const result = value as Record<string, unknown>;
  if (Object.keys(result).some(key => BLOCKED_KEYS.has(key))) throw new Error('허용되지 않은 데이터 키가 있어요.');
  return result;
}

function text(value: unknown, name: string, max = 120): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > max || /[\u0000-\u001f]/.test(value)) throw new Error(`${name} 값이 올바르지 않아요.`);
  return value;
}

function lessonId(value: unknown, name: string): string {
  const id = text(value, name, 3);
  if (!/^L(?:0[1-9]|1[0-9]|2[0-4])$/.test(id)) throw new Error(`${name}에 알 수 없는 미션이 있어요.`);
  return id;
}

function resultKey(value: unknown, name: string): string {
  if (typeof value === 'string' && /^[0-3]$/.test(value)) return value;
  return lessonId(value, name);
}

function bool(value: unknown, name: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${name} 값이 올바르지 않아요.`);
  return value;
}

function number(value: unknown, name: string, min: number, max: number, integer = true): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) throw new Error(`${name} 범위가 올바르지 않아요.`);
  return value;
}

function date(value: unknown, name: string): string {
  const str = text(value, name, 40);
  if (!/^\d{4}-\d\d-\d\dT/.test(str) || !Number.isFinite(Date.parse(str))) throw new Error(`${name} 날짜가 올바르지 않아요.`);
  return str;
}

function record<T>(value: unknown, name: string, decode: (value: unknown, name: string) => T, limit = 500, keyDecoder = text): Record<string, T> {
  const source = object(value, name);
  if (Object.keys(source).length > limit) throw new Error(`${name} 항목이 너무 많아요.`);
  return Object.fromEntries(Object.entries(source).map(([key, val]) => [keyDecoder(key, `${name} 키`), decode(val, `${name}.${key}`)]));
}

function evidence(value: unknown, name: string): Evidence {
  const source = object(value, name);
  return {
    completed: bool(source.completed, name),
    independent: bool(source.independent, name),
    explained: bool(source.explained, name),
    audioCompared: bool(source.audioCompared, name),
    visualCompared: bool(source.visualCompared, name),
    bestHintLevel: number(source.bestHintLevel, name, 0, 3),
  };
}

function decode(value: unknown): SaveData {
  const data = object(value, '저장 파일');
  if (typeof data.schemaVersion === 'number' && data.schemaVersion > 1) throw new Error('더 새로운 버전의 저장 파일이에요. 원래 기록을 보존하려면 앱을 업데이트해 주세요.');
  if (data.schemaVersion !== 1) throw new Error('지원하지 않는 저장 파일 버전이에요.');
  const settings = object(data.settings, '설정');
  const tutorial = object(data.tutorial, '튜토리얼');
  if (!Array.isArray(data.recipes) || data.recipes.length > 500) throw new Error('레시피 목록이 올바르지 않아요.');
  const recipeIds = new Set<string>();
  const recipes = data.recipes.map((value: unknown) => {
    const item = object(value, '레시피');
    const id = text(item.id, '레시피 ID');
    if (recipeIds.has(id)) throw new Error('같은 레시피가 중복되어 있어요.');
    recipeIds.add(id);
    const root = text(item.root, '근음', 6);
    if (!ROOTS.includes(root)) throw new Error('게임에서 제공하는 근음만 가져올 수 있어요.');
    const quality = text(item.quality, '화음 종류');
    if (!QUALITIES.has(quality)) throw new Error('알 수 없는 화음 종류예요.');
    const octave = number(item.octave, '옥타브', 0, 8);
    let notes;
    try { notes = makeTriad(root, quality as Quality, octave); }
    catch { throw new Error('이 레시피의 음높이 또는 표기를 사용할 수 없어요.'); }
    const expectedId = `${notes[0].letter}:${notes[0].accidental}:${quality}`;
    if (id !== expectedId) throw new Error('레시피 ID와 근음·화음 종류가 일치하지 않아요.');
    return { id, root, quality, octave, unlockedAt: date(item.unlockedAt, '레시피 획득') };
  });
  const result: SaveData = {
    schemaVersion: 1,
    contentVersion: text(data.contentVersion, '콘텐츠 버전', 40),
    updatedAt: date(data.updatedAt, '저장 시각'),
    settings: {
      volume: number(settings.volume, '음량', 0, 1, false),
      muted: bool(settings.muted, '음소거'),
      reducedMotion: bool(settings.reducedMotion, '모션 줄이기'),
      largeControls: bool(settings.largeControls, '큰 버튼'),
    },
    lessons: record(data.lessons, '미션 진도', evidence, 24, lessonId),
    recipes,
    tutorial: {
      checkpoint: number(tutorial.checkpoint, '튜토리얼 단계', 0, 13),
      evidence: record(tutorial.evidence, '튜토리얼 기록', bool, 100),
    },
  };
  if (data.resume !== undefined) {
    const resume = object(data.resume, '이어하기');
    result.resume = { lessonId: lessonId(resume.lessonId, '이어하기 미션') };
    if (resume.questionIndex !== undefined) result.resume.questionIndex = number(resume.questionIndex, '문항 번호', 0, 3);
    if (resume.seed !== undefined) result.resume.seed = number(resume.seed, '순서 시드', 0, 0xffffffff);
    if (resume.mode !== undefined) {
      if (!['tutorial', 'practice', 'order', 'repair'].includes(String(resume.mode))) throw new Error('이어하기 모드가 올바르지 않아요.');
      result.resume.mode = resume.mode as NonNullable<SaveData['resume']>['mode'];
    }
  }
  if (data.currentAttempt !== undefined) {
    const attempt = object(data.currentAttempt, '현재 시도');
    result.currentAttempt = {
      lessonId: lessonId(attempt.lessonId, '시도 미션'),
      maxHintLevel: number(attempt.maxHintLevel, '힌트 수준', 0, 3),
      submittedAttempts: number(attempt.submittedAttempts, '제출 횟수', 0, 1000000),
      explained: bool(attempt.explained, '원리 확인'),
    };
  }
  if (data.mixedProgress !== undefined) result.mixedProgress = record(data.mixedProgress, '혼합 주문', (value, name) => {
    const mixed = object(value, name);
    if (!Array.isArray(mixed.questionOrder) || mixed.questionOrder.length > 4 || mixed.questionOrder.length === 0) throw new Error('혼합 문항 순서가 올바르지 않아요.');
    const order = mixed.questionOrder.map((id: unknown) => lessonId(id, '문항 ID'));
    if (new Set(order).size !== order.length) throw new Error('혼합 주문의 문항 ID가 중복돼요.');
    return {
      seed: number(mixed.seed, '혼합 주문 시드', 0, 0xffffffff),
      questionOrder: order,
      currentIndex: number(mixed.currentIndex, '진행 문항', 0, order.length - 1),
      results: record(mixed.results, '혼합 문항 결과', evidence, 4, resultKey),
    };
  }, 24, lessonId);
  return result;
}

/** Only the explicitly documented legacy v0 shape is migrated. Unknown versions are never guessed. */
function migrate(value: unknown): { value: unknown; migrated: boolean } {
  const data = object(value, '저장 파일');
  if (data.schemaVersion === 0) {
    return { value: { ...freshSave(), ...data, schemaVersion: 1, contentVersion: data.contentVersion ?? CONTENT_VERSION }, migrated: true };
  }
  return { value, migrated: false };
}

export function parseImport(textValue: string): SaveData {
  if (new TextEncoder().encode(textValue).byteLength > MAX_IMPORT_BYTES) throw new Error('가져올 파일은 1MB 이하여야 해요.');
  let parsed: unknown;
  try { parsed = JSON.parse(textValue); } catch { throw new Error('JSON 파일을 읽지 못했어요. 백업 파일을 확인해 주세요.'); }
  return decode(migrate(parsed).value);
}

export function loadSave(): { data: SaveData; warning: string | null } {
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { data: lastMemorySave ?? freshSave(), warning: null };
    try {
      const parsed = JSON.parse(raw) as unknown;
      const migration = migrate(parsed);
      const data = decode(migration.value);
      lastMemorySave = data;
      persistenceBlocked = null;
      return { data, warning: migration.migrated ? '이전 버전의 기록을 새 형식으로 복원했어요.' : null };
    } catch (error) {
      const reason = error instanceof SyntaxError ? '저장 기록의 JSON이 손상되어 읽지 못했어요.' : error instanceof Error ? error.message : '저장 기록을 읽지 못했어요.';
      let future = false;
      try { future = Number((JSON.parse(raw) as { schemaVersion?: number }).schemaVersion) > 1; } catch { /* corrupted JSON */ }
      if (future) persistenceBlocked = reason;
      else {
        try { globalThis.localStorage.setItem(`${STORAGE_KEY}:recovery`, raw); }
        catch { persistenceBlocked = '기존 기록을 백업하지 못해 자동 덮어쓰기를 멈췄어요.'; }
      }
      return { data: lastMemorySave ?? freshSave(), warning: `${reason} 이 세션에서는 계속 학습할 수 있어요. ${persistenceBlocked ?? '손상된 원본은 복구용으로 보관했어요.'}` };
    }
  } catch {
    return { data: lastMemorySave ?? freshSave(), warning: '이 브라우저에서 저장 공간을 사용할 수 없어요. 학습은 계속할 수 있으며 백업 파일로 기록을 보관할 수 있어요.' };
  }
}

/** Returns null on a durable save and a readable warning when only the in-memory record was updated. */
export function saveData(value: SaveData): string | null {
  try {
    const data = decode(value);
    data.updatedAt = new Date().toISOString();
    lastMemorySave = data;
    if (persistenceBlocked) return `${persistenceBlocked} 기록은 현재 세션에 보관하고 있어요.`;
    const existing = globalThis.localStorage.getItem(STORAGE_KEY);
    if (existing) {
      try {
        if (Number((JSON.parse(existing) as { schemaVersion?: number }).schemaVersion) > 1) return '새 버전 기록이 있어 자동으로 덮어쓰지 않았어요. 현재 학습은 백업 파일로 보관해 주세요.';
      } catch { /* loadSave already offered a recovery copy; normal writes remain scoped */ }
    }
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return null;
  } catch {
    return '지금은 이 기기에 저장하지 못했어요. 현재 학습은 계속할 수 있어요. 백업 파일로 기록을 보관해 주세요.';
  }
}

/** Call only after the app has confirmed the user intends to reset/replace this app's record. */
export function resetStoredSave(): string | null {
  try {
    globalThis.localStorage.removeItem(STORAGE_KEY);
    persistenceBlocked = null;
    lastMemorySave = null;
    return null;
  } catch { return '이 기기의 기록을 지우지 못했어요.'; }
}

function mergeEvidence(a: Evidence | undefined, b: Evidence): Evidence {
  if (!a) return { ...b };
  return {
    completed: a.completed || b.completed,
    independent: a.independent || b.independent,
    explained: a.explained || b.explained,
    audioCompared: a.audioCompared || b.audioCompared,
    visualCompared: a.visualCompared || b.visualCompared,
    bestHintLevel: a.completed && b.completed ? Math.min(a.bestHintLevel, b.bestHintLevel) : a.completed ? a.bestHintLevel : b.bestHintLevel,
  };
}

/** Keep this device's settings; merge durable achievements by union. A later attempt keeps its hint evidence intact. */
export function mergeSave(current: SaveData, incoming: SaveData): SaveData {
  const a = decode(current), b = decode(incoming);
  const later = Date.parse(b.updatedAt) > Date.parse(a.updatedAt) ? b : a;
  const result: SaveData = {
    ...a,
    contentVersion: CONTENT_VERSION,
    updatedAt: new Date().toISOString(),
    settings: { ...a.settings },
    lessons: { ...a.lessons },
    recipes: [...new Map([...a.recipes, ...b.recipes].map(item => [item.id, item])).values()],
    tutorial: { checkpoint: Math.max(a.tutorial.checkpoint, b.tutorial.checkpoint), evidence: { ...a.tutorial.evidence } },
  };
  for (const [id, ev] of Object.entries(b.lessons)) result.lessons[id] = mergeEvidence(a.lessons[id], ev);
  for (const [key, ev] of Object.entries(b.tutorial.evidence)) result.tutorial.evidence[key] = !!a.tutorial.evidence[key] || ev;
  if (later.resume) result.resume = { ...later.resume }; else delete result.resume;
  if (later.currentAttempt) result.currentAttempt = { ...later.currentAttempt }; else delete result.currentAttempt;
  result.mixedProgress = { ...a.mixedProgress };
  for (const [id, mixed] of Object.entries(b.mixedProgress ?? {})) {
    const previous = a.mixedProgress?.[id];
    if (!previous) { result.mixedProgress[id] = structuredClone(mixed); continue; }
    // A different shuffled run is an independent attempt. Preserve the later complete run as a unit.
    if (previous.seed !== mixed.seed || previous.questionOrder.join('|') !== mixed.questionOrder.join('|')) {
      result.mixedProgress[id] = structuredClone(later === b ? mixed : previous);
      continue;
    }
    const results = { ...previous.results };
    for (const [qid, ev] of Object.entries(mixed.results)) results[qid] = mergeEvidence(results[qid], ev);
    result.mixedProgress[id] = { ...mixed, currentIndex: Math.max(previous.currentIndex, mixed.currentIndex), results };
  }
  return decode(result);
}
