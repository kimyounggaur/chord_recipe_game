import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { RULEBOOK_PAGES, RULEBOOK_SECTIONS } from '../src/rulebook/content.ts';
import { makeTriad, midiNote, noteLabel, type Quality } from '../src/music.ts';

test('every lesson has a local instructional illustration and accessible description', () => {
  assert.ok(RULEBOOK_PAGES.length >= 20, 'the guide should cover the game with a broad set of illustrations');
  assert.equal(new Set(RULEBOOK_PAGES.map(page => page.id)).size, RULEBOOK_PAGES.length);
  const usedAssets = new Set<string>();
  for (const page of RULEBOOK_PAGES) {
    assert.ok(RULEBOOK_SECTIONS.includes(page.section), `${page.id}: section must be in the navigation`);
    assert.ok(page.title.trim() && page.subtitle.trim() && page.alt.trim(), `${page.id}: accessible text is required`);
    assert.ok(page.paragraphs.some(paragraph => paragraph.trim()), `${page.id}: explanatory text is required`);
    assert.match(page.image, /^[a-z0-9-]+$/, `${page.id}: asset must be local`);
    const file = join('public/assets/rulebook', `${page.image}.svg`);
    assert.ok(existsSync(file), `${page.id}: missing ${file}`);
    usedAssets.add(`${page.image}.svg`);
    const svg = readFileSync(file, 'utf8');
    assert.match(svg, /<svg\b[^>]*\bviewBox=/, `${file}: must scale to screen size`);
    assert.match(svg, /<title[\s>]/, `${file}: missing title`);
    assert.match(svg, /<desc[\s>]/, `${file}: missing description`);
    assert.doesNotMatch(svg, /<script\b|\son\w+\s*=|(?:href|src)\s*=\s*["'](?:https?:|\/\/|javascript:)/i, `${file}: external or executable content`);
  }
  const assetNames = readdirSync('public/assets/rulebook').filter(name => name.endsWith('.svg'));
  assert.deepEqual(assetNames.filter(name => !usedAssets.has(name)), [], 'every created diagram should be placed alongside relevant content');
});

test('navigation sections are unique, populated, and in the intended order', () => {
  assert.deepEqual(RULEBOOK_SECTIONS, ['시작하기', '음과 간격', '화음 레시피', '도전과 학습', '설정과 기록']);
  for (const section of RULEBOOK_SECTIONS) assert.ok(RULEBOOK_PAGES.some(page => page.section === section), `${section}: empty`);
  const order = RULEBOOK_PAGES.map(page => RULEBOOK_SECTIONS.indexOf(page.section));
  assert.deepEqual(order, [...order].sort((a, b) => a - b), 'navigation should not jump between sections');
});

test('major, minor, diminished and augmented illustrated formulas match the music engine', () => {
  for (const quality of ['major', 'minor', 'diminished', 'augmented'] as Quality[]) {
    const page = RULEBOOK_PAGES.find(item => item.id === quality);
    assert.ok(page, `missing ${quality} lesson`);
    const parsed = page.formula?.match(/^([A-G][♯♭]?)\s*—\s*(\d+)\s*—\s*([A-G][♯♭]?)\s*—\s*(\d+)\s*—\s*([A-G][♯♭]?)$/);
    assert.ok(parsed, `${quality}: formula must show the three spelled notes and both adjacent intervals`);
    const notes = makeTriad(parsed[1], quality);
    assert.deepEqual([parsed[1], parsed[3], parsed[5]], notes.map(note => noteLabel(note)), `${quality}: written chord spelling`);
    assert.deepEqual([Number(parsed[2]), Number(parsed[4])], [notes[1].midi - notes[0].midi, notes[2].midi - notes[1].midi], `${quality}: adjacent intervals`);
    assert.ok(page.audio?.some(example => example.quality === quality && example.root === parsed[1]), `${quality}: matching playback example`);
  }
});

test('the octave and enharmonic examples agree with the notes used by the game', () => {
  const octave = RULEBOOK_PAGES.find(page => page.id === 'octave');
  assert.ok(octave);
  const gMajor = makeTriad('G', 'major').map(note => noteLabel(note, true));
  assert.deepEqual(gMajor, ['G4', 'B4', 'D5']);
  for (const note of gMajor) assert.ok(octave.formula?.includes(note), `octave explanation must include ${note}`);
  const spelling = RULEBOOK_PAGES.find(page => page.id === 'spelling');
  assert.ok(spelling?.formula?.includes('D♯') && spelling.formula.includes('E♭'));
  const third = makeTriad('C', 'minor')[1];
  assert.equal(noteLabel(third), 'E♭');
  assert.equal(midiNote(third.midi).midi, third.midi);
});

test('all audible examples are playable and legacy demo/illustration mappings are valid', () => {
  for (const page of RULEBOOK_PAGES) {
    for (const example of page.audio || []) {
      assert.ok(example.label.trim(), `${page.id}: audio needs an accessible label`);
      assert.equal(makeTriad(example.root, example.quality).length, 3, `${page.id}: example should be playable`);
    }
    if (page.demoIndex !== undefined) assert.ok(Number.isInteger(page.demoIndex) && page.demoIndex >= 0 && page.demoIndex <= 11, `${page.id}: demo index outside legacy demo range`);
    if (page.originalGuide !== undefined) assert.ok(existsSync(`public/assets/guide${page.originalGuide}.png`), `${page.id}: missing legacy guide`);
  }
  assert.deepEqual(new Set(RULEBOOK_PAGES.filter(page => page.originalGuide).map(page => page.originalGuide)), new Set([1, 2]));
});
