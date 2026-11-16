import { test } from 'node:test';
import assert from 'node:assert/strict';
import { homeDestination } from '../src/navigation';
import { freshSave } from '../src/storage';

test('home entry resumes tutorial checkpoint rather than starting over', () => {
  const saved = freshSave();
  saved.resume = { mode: 'tutorial', lessonId: 'L01' };
  saved.tutorial.checkpoint = 8;
  assert.deepEqual(homeDestination(saved), { mode: 'tutorial', id: 'L01', resume: true });
});
test('home entry starts the next order after completing tutorial', () => {
  const saved = freshSave();
  saved.resume = { mode: 'tutorial', lessonId: 'L01' };
  saved.tutorial.checkpoint = 13;
  assert.deepEqual(homeDestination(saved), { mode: 'order', id: 'L04', resume: false });
});
test('home entry preserves mixed order resumption and first start', () => {
  const saved = freshSave();
  assert.deepEqual(homeDestination(saved), { mode: 'tutorial', id: 'L01', resume: false });
  saved.resume = { mode: 'order', lessonId: 'L23', seed: 42, questionIndex: 2 };
  assert.deepEqual(homeDestination(saved), { mode: 'order', id: 'L23', resume: true });
});
