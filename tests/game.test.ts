import test from 'node:test';
import assert from 'node:assert/strict';
import { startGame, reducer, isCorrect, target, displayedNotes, lessonFor, shuffled, mixedIds, getActionPolicy } from '../src/game.ts';
import { LESSONS } from '../src/lessons.ts';

test('guided C major input keeps prior correct notes after an error', () => {
  let s = startGame('tutorial');
  s = reducer(s, { type: 'NEXT_STEP' });
  assert.equal(s.step, 2);
  s = reducer(s, { type: 'TRY', midi: 60 });
  assert.deepEqual(s.notes, [60, null, null]);
  assert.equal(s.step, 3);
  s = reducer(s, { type: 'TRY', midi: 63 });
  assert.deepEqual(s.notes, [60, null, null]);
  assert.equal(s.step, 3);
  assert.equal(s.attempts, 1);
  s = reducer(s, { type: 'TRY', midi: 64 });
  s = reducer(s, { type: 'TRY', midi: 67 });
  assert.equal(s.step, 5);
  assert.equal(isCorrect(s), true);
  assert.deepEqual(displayedNotes(s).map(n => n?.midi), [60, 64, 67]);
});

test('guided input steps cannot be skipped with NEXT_STEP', () => {
  for (const step of [2, 3, 4, 8]) {
    const s = startGame('tutorial', 'L01', step);
    const next = reducer(s, { type: 'NEXT_STEP' });
    assert.equal(next.step, step, `step ${step} requires real note input`);
  }
});

test('guided slots stay tied to the current learning objective', () => {
  for (const [step, slot] of [[2, 0], [3, 1], [4, 2], [8, 1]]) {
    const s = startGame('tutorial', 'L01', step);
    assert.equal(s.active, slot, `resume step ${step} activates its required role`);
    for (const wrongSlot of [0, 1, 2].filter(n => n !== slot)) {
      assert.equal(reducer(s, { type: 'SELECT', slot: wrongSlot }).active, slot);
    }
  }
});

test('tutorial transform changes only the middle note and spells E flat correctly', () => {
  let s = startGame('tutorial', 'L01', 8);
  s = reducer(s, { type: 'TRY', midi: 63 });
  assert.deepEqual(s.notes, [60, 63, 67]);
  assert.equal(s.step, 9);
  assert.equal(isCorrect(s), true);
  assert.equal(displayedNotes(s)[1]?.letter, 'E');
  assert.equal(displayedNotes(s)[1]?.accidental, -1);
});

test('both major and minor review require completed audio or current visual evidence', () => {
  for (const step of [5, 9]) {
    let s = startGame('tutorial', 'L01', step);
    assert.equal(reducer(s, { type: 'NEXT_STEP' }).step, step);
    s = reducer(s, { type: 'LISTEN', kind: 'sequence' });
    assert.equal(reducer(s, { type: 'NEXT_STEP' }).step, step);
    s = reducer(s, { type: 'LISTEN', kind: 'chord' });
    assert.equal(reducer(s, { type: 'NEXT_STEP' }).step, step + 1);
    const visual = reducer(startGame('tutorial', 'L01', step), { type: 'VISUAL' });
    assert.equal(reducer(visual, { type: 'NEXT_STEP' }).step, step + 1);
  }
});

test('modifying a guided chord invalidates visual evidence from the previous chord', () => {
  let s = reducer(startGame('tutorial', 'L01', 8), { type: 'VISUAL' });
  s = reducer(s, { type: 'TRY', midi: 63 });
  assert.equal(s.visual, false);
});

test('comparison and explanation guards cannot be bypassed', () => {
  let s = startGame('tutorial', 'L01', 10);
  assert.equal(reducer(s, { type: 'NEXT_STEP' }).step, 10);
  s = reducer(s, { type: 'LISTEN', kind: 'a' });
  assert.equal(reducer(s, { type: 'NEXT_STEP' }).step, 10);
  s = reducer(s, { type: 'LISTEN', kind: 'b' });
  s = reducer(s, { type: 'NEXT_STEP' });
  assert.equal(s.step, 11);
  assert.equal(reducer(s, { type: 'NEXT_STEP' }).step, 11);
  s = reducer(s, { type: 'ANSWER', correct: false });
  assert.equal(reducer(s, { type: 'NEXT_STEP' }).step, 11);
  s = reducer(s, { type: 'ANSWER', correct: true });
  assert.equal(reducer(s, { type: 'NEXT_STEP' }).step, 12);
});

test('general order needs exact MIDI including octave and retains selected notes on error', () => {
  let s = startGame('order', 'L01');
  for (const [slot, midi] of [[0, 60], [1, 64], [2, 79]]) {
    s = reducer(s, { type: 'SELECT', slot });
    s = reducer(s, { type: 'TRY', midi });
  }
  s = reducer(s, { type: 'SUBMIT' });
  assert.equal(s.complete, false);
  assert.deepEqual(s.notes, [60, 64, 79]);
  assert.match(s.feedback, /옥타브/);
  s = reducer(s, { type: 'SELECT', slot: 2 });
  s = reducer(s, { type: 'TRY', midi: 67 });
  assert.equal(reducer(s, { type: 'SUBMIT' }).complete, true);
});

test('transform orders preserve root and fifth while middle note is editable', () => {
  const base = startGame('order', 'L05');
  for (const slot of [0, 2]) {
    const selected = reducer(base, { type: 'SELECT', slot });
    assert.equal(selected.active, 1);
    assert.match(selected.feedback, /가운데 음/);
    const s = reducer({ ...base, active: slot }, { type: 'SHIFT', delta: 1 });
    assert.deepEqual(s.notes, base.notes);
  }
  let s = reducer(base, { type: 'SELECT', slot: 1 });
  s = reducer(s, { type: 'SHIFT', delta: -1 });
  assert.deepEqual(s.notes, [62, 65, 69]);
  assert.equal(reducer(s, { type: 'SUBMIT' }).complete, true);
});

test('repair locks root but keeps both upper slots editable and requires all repairs', () => {
  let s = startGame('repair', 'L24');
  const selected = reducer(s, { type: 'SELECT', slot: 0 });
  assert.equal(selected.active, 1);
  assert.match(selected.feedback, /근음/);
  const root = reducer({ ...s, active: 0 }, { type: 'SHIFT', delta: 1 });
  assert.deepEqual(root.notes, s.notes);
  s = reducer(s, { type: 'SELECT', slot: 1 });
  s = reducer(s, { type: 'SHIFT', delta: -1 });
  assert.equal(reducer(s, { type: 'SUBMIT' }).complete, false);
  s = reducer(s, { type: 'SELECT', slot: 2 });
  s = reducer(s, { type: 'SHIFT', delta: -1 });
  assert.equal(reducer(s, { type: 'SUBMIT' }).complete, true);
});

test('L23 reuses four targets as empty H0 build questions, including D minor', () => {
  assert.deepEqual(new Set(shuffled(17)), new Set(mixedIds));
  assert.deepEqual(shuffled(17), shuffled(17));
  for (let index = 0; index < 4; index++) {
    const s = startGame('order', 'L23', 1, 17, index);
    const lesson = lessonFor(s);
    assert.equal(lesson.kind, 'build');
    assert.equal(lesson.hint, 0);
    assert.equal(s.hint, 0);
    assert.deepEqual(s.notes, [null, null, null]);
    assert.ok(target(s).every(n => n.midi >= 60 && n.midi <= 83));
  }
});

test('all 24 missions have valid targets and repair initial state is not already correct', () => {
  assert.equal(LESSONS.length, 24);
  for (const l of LESSONS) {
    const s = startGame(l.kind === 'repair' ? 'repair' : 'order', l.id);
    assert.ok(target(s).every(n => Number.isInteger(n.midi) && n.midi >= 60 && n.midi <= 83), l.id);
    if (l.kind === 'repair') assert.equal(isCorrect(s), false, l.id);
  }
});

test('invalid slots and non-integer MIDI cannot corrupt application state', () => {
  const s = startGame('practice');
  for (const slot of [-1, 3, NaN]) assert.equal(reducer(s, { type: 'SELECT', slot }).active, 0);
  for (const midi of [NaN, 60.5, -1, 999]) assert.deepEqual(reducer(s, { type: 'TRY', midi }).notes, s.notes);
});

test('tutorial completion is terminal and cannot be toggled away by duplicate next events', () => {
  const finished = { ...startGame('tutorial', 'L01', 13), complete: true };
  const duplicate = reducer(finished, { type: 'NEXT_STEP' });
  assert.equal(duplicate.step, 13);
  assert.equal(duplicate.complete, true);
});

test('guided flow reaches completion only after input, two reviews, comparison, and explanation', () => {
  let s = startGame('tutorial');
  s = reducer(s, { type: 'NEXT_STEP' }); // 2: choose root
  for (const midi of [60, 64, 67]) s = reducer(s, { type: 'TRY', midi });
  assert.equal(s.step, 5);
  s = reducer(s, { type: 'VISUAL' });
  s = reducer(s, { type: 'NEXT_STEP' }); // 6: recipe
  s = reducer(s, { type: 'NEXT_STEP' }); // 7: minor order
  s = reducer(s, { type: 'NEXT_STEP' }); // 8: transform
  s = reducer(s, { type: 'TRY', midi: 63 });
  assert.deepEqual(s.notes, [60, 63, 67]);
  assert.equal(s.step, 9);
  s = reducer(s, { type: 'VISUAL' });
  s = reducer(s, { type: 'NEXT_STEP' }); // 10: compare pair
  assert.equal(s.visual, false, 'new comparison requires its own evidence');
  s = reducer(s, { type: 'VISUAL' });
  s = reducer(s, { type: 'NEXT_STEP' }); // 11: explanation
  s = reducer(s, { type: 'ANSWER', correct: true });
  s = reducer(s, { type: 'NEXT_STEP' }); // 12: recipe pair
  s = reducer(s, { type: 'NEXT_STEP' }); // 13: complete
  assert.equal(s.step, 13);
  assert.equal(s.complete, true);
  assert.equal(s.audioA, false, 'visual path is never recorded as audio listening');
  assert.equal(s.audioB, false);
});

test('practice uses identified chord spelling when notes change quality', () => {
  let s = startGame('practice');
  for (const [slot, midi] of [[0, 60], [1, 63], [2, 67]]) {
    s = reducer(s, { type: 'SELECT', slot });
    s = reducer(s, { type: 'TRY', midi });
  }
  assert.equal(displayedNotes(s)[1]?.letter, 'E');
  assert.equal(displayedNotes(s)[1]?.accidental, -1);
});

test('practice helpers cannot fill or reconfigure a graded lesson', () => {
  for (const mode of ['tutorial', 'order', 'repair'] as const) {
    const s = startGame(mode);
    assert.deepEqual(reducer(s, { type: 'FILL' }), s);
    assert.deepEqual(reducer(s, { type: 'CONFIG', root: 'D', quality: 'minor' }), s);
  }
});

test('resume clamps mixed index and tutorial checkpoint to supported ranges', () => {
  assert.equal(startGame('order', 'L23', 1, 17, 100).questionIndex, 3);
  assert.equal(startGame('order', 'L23', 1, 17, -1).questionIndex, 0);
  const end = startGame('tutorial', 'L01', 100);
  assert.equal(end.step, 13);
  assert.equal(end.complete, true);
});

test('after filling all three notes, an extra note edits the selected slot instead of the root', () => {
  let s = startGame('order', 'L01');
  for (const midi of [60, 64, 67]) s = reducer(s, { type: 'TRY', midi });
  assert.deepEqual(s.notes, [60, 64, 67]);
  assert.equal(s.active, 2);
  s = reducer(s, { type: 'TRY', midi: 69 });
  assert.deepEqual(s.notes, [60, 64, 69]);
  s = reducer(s, { type: 'SELECT', slot: 1 });
  s = reducer(s, { type: 'TRY', midi: 63 });
  assert.deepEqual(s.notes, [60, 63, 69]);
  assert.equal(s.active, 1);
  s = reducer(s, { type: 'UNDO' });
  assert.deepEqual(s.notes, [60, 64, 69]);
});

test('interaction policy exposes only the allowed tutorial and locked lesson inputs', () => {
  for (let step = 1; step <= 13; step++) {
    const s = startGame('tutorial', 'L01', step);
    const expected: Record<number, number> = {2:0,3:1,4:2,8:1};
    const slots = expected[step] === undefined ? [] : [expected[step]];
    assert.deepEqual(getActionPolicy(s).editableSlots, slots, `step ${step}`);
    assert.equal(getActionPolicy(s).canInput, slots.includes(s.active));
  }
  const transform = startGame('order', 'L05');
  assert.deepEqual(getActionPolicy(transform).editableSlots, [1]);
  const lockedRoot = {...startGame('repair', 'L24'), active: 0};
  assert.equal(getActionPolicy(lockedRoot).canInput, false);
  assert.deepEqual(getActionPolicy(lockedRoot).editableSlots, [1,2]);
  assert.deepEqual(getActionPolicy(startGame('order', 'L03')).editableSlots, []);
  assert.deepEqual(getActionPolicy(startGame('practice')).editableSlots, [0,1,2]);
});

test('stale double-queued tutorial next action does not skip the following step', () => {
  let s = startGame('tutorial', 'L01', 6);
  const next = { type: 'NEXT_STEP', expectedStep: 6 } as const;
  s = reducer(s, next);
  assert.equal(s.step, 7);
  s = reducer(s, next);
  assert.equal(s.step, 7);
  s = reducer(s, {type:'NEXT_STEP', expectedStep:7});
  assert.equal(s.step, 8);
});

test('selecting a locked slot preserves active editable slot and explains why', () => {
  const s = startGame('order', 'L05');
  const locked = reducer(s, {type:'SELECT',slot:0});
  assert.equal(locked.active,s.active);
  assert.equal(getActionPolicy(locked).canInput,true);
  assert.match(locked.feedback,/가운데 음/);
  const completed = {...startGame('order','L01'),complete:true};
  const rejected = reducer(completed,{type:'SELECT',slot:2});
  assert.equal(rejected.active,completed.active);
  assert.equal(getActionPolicy(rejected).canInput,false);
  assert.match(rejected.feedback,/완성/);
});

test('interaction policy reflects review, comparison and required explanation gates', () => {
  let s = startGame('tutorial', 'L01', 5);
  assert.equal(getActionPolicy(s).canAdvance, false);
  s = reducer(s, { type: 'LISTEN', kind: 'sequence' });
  assert.equal(getActionPolicy(s).canAdvance, false);
  s = reducer(s, { type: 'LISTEN', kind: 'chord' });
  assert.equal(getActionPolicy(s).canAdvance, true);
  let comparison = startGame('order', 'L03');
  assert.equal(getActionPolicy(comparison).canSubmit, false);
  comparison = reducer(comparison, { type: 'VISUAL' });
  assert.equal(getActionPolicy(comparison).canSubmit, true);
  let question = startGame('tutorial', 'L01', 11);
  assert.equal(getActionPolicy(question).canAdvance, false);
  question = reducer(question, { type: 'ANSWER', correct: true });
  assert.equal(getActionPolicy(question).canAdvance, true);
});

test('undo and reset keep hint history within an attempt; retry starts a fresh attempt', () => {
  let s = startGame('order', 'L04');
  s = reducer(s, { type: 'HINT' });
  s = reducer(s, { type: 'HINT' });
  s = reducer(s, { type: 'TRY', midi: 62 });
  s = {...s, attempts: 2};
  const undone = reducer(s, { type: 'UNDO' });
  assert.equal(undone.maxHint, 3);
  assert.equal(undone.attempts, 2);
  const reset = reducer(undone, { type: 'RESET' });
  assert.equal(reset.maxHint, 3);
  assert.equal(reset.attempts, 2);
  const retry = startGame('order', 'L04');
  assert.equal(retry.maxHint, 2);
  assert.equal(retry.attempts, 0);
});
