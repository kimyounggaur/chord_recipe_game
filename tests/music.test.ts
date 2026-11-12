import test from 'node:test';
import assert from 'node:assert/strict';
import { makeTriad, noteLabel, midiNote, identify, intervalName, ROOTS, RECIPES, type Quality } from '../src/music.ts';
import { LESSONS, MIXED_LESSON_IDS } from '../src/lessons.ts';

const fixtures: [string, Quality, string[], number[]][] = [
  ['C', 'major', ['C4','E4','G4'], [60,64,67]],
  ['C', 'minor', ['C4','E♭4','G4'], [60,63,67]],
  ['C', 'diminished', ['C4','E♭4','G♭4'], [60,63,66]],
  ['C', 'augmented', ['C4','E4','G♯4'], [60,64,68]],
  ['D', 'major', ['D4','F♯4','A4'], [62,66,69]],
  ['D', 'minor', ['D4','F4','A4'], [62,65,69]],
  ['B', 'major', ['B4','D♯5','F♯5'], [71,75,78]],
  ['F♯', 'major', ['F♯4','A♯4','C♯5'], [66,70,73]],
  ['D♭', 'major', ['D♭4','F4','A♭4'], [61,65,68]],
  ['A♭', 'minor', ['A♭4','C♭5','E♭5'], [68,71,75]],
  ['B', 'augmented', ['B4','D♯5','F𝄪5'], [71,75,79]],
  ['E♭', 'diminished', ['E♭4','G♭4','B𝄫4'], [63,66,69]],
];

for (const [root, quality, names, midis] of fixtures) test(`${root} ${quality}: independent spelling, MIDI, intervals`, () => {
  const notes = makeTriad(root, quality);
  assert.deepEqual(notes.map(n => noteLabel(n, true)), names);
  assert.deepEqual(notes.map(n => n.midi), midis);
  assert.equal(identify(midis), quality);
});

test('all 12×4 root recipes preserve spelling and MIDI invariants', () => {
  const naturals: Record<string,number> = {C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  const letters = ['C','D','E','F','G','A','B'];
  for (const root of ROOTS) for (const q of Object.keys(RECIPES) as Quality[]) {
    const notes=makeTriad(root,q);
    for (const n of notes) {
      assert.equal(n.midi,12*(n.octave+1)+naturals[n.letter]+n.accidental);
      assert.ok(n.accidental>=-2 && n.accidental<=2);
    }
    assert.equal(notes[1].octave*7+letters.indexOf(notes[1].letter)-(notes[0].octave*7+letters.indexOf(notes[0].letter)),2);
    assert.equal(notes[2].octave*7+letters.indexOf(notes[2].letter)-(notes[1].octave*7+letters.indexOf(notes[1].letter)),2);
    assert.deepEqual([notes[1].midi-notes[0].midi,notes[2].midi-notes[1].midi],RECIPES[q].adjacent);
  }
});

test('does not recognize arbitrary notes, inversion, gaps, or octave errors', () => {
  for (const tuple of [[60,62,67],[60,64,79],[60,67,76],[64,60,67],[60,60,67],[60,null,67],[60,64],[NaN,64,67]]) assert.equal(identify(tuple),null);
});
test('named thirds require diatonic spelling, not just 4 semitones', () => {
  assert.equal(intervalName(makeTriad('C','major')[0],makeTriad('C','major')[1]),'장3도');
  assert.equal(intervalName(makeTriad('C','minor')[0],makeTriad('C','minor')[1]),'단3도');
  assert.equal(intervalName(midiNote(60),{letter:'D',accidental:2,octave:4,midi:64}),'4반음');
});
test('B sharp and C flat keep notation octave', () => {
  assert.equal(makeTriad('B♯','major')[0].midi,72);
  assert.equal(makeTriad('C♭','major')[0].midi,59);
  assert.equal(noteLabel(makeTriad('C♭','major')[0],true),'C♭4');
});
test('invalid MIDI, roots, excessive accidentals, and quality are rejected', () => {
  for (const m of [-1,128,60.5,NaN]) assert.throws(()=>midiNote(m));
  assert.throws(()=>makeTriad('H','major'));
  assert.throws(()=>makeTriad('C###','major'));
  assert.throws(()=>makeTriad('B♯','augmented'));
  assert.throws(()=>makeTriad('B','major',9));
});

const missionExpected: Record<string,number[]> = {
 L01:[60,64,67],L02:[60,63,67],L04:[62,66,69],L05:[62,65,69],L06:[67,71,74],L07:[67,70,74],L08:[65,69,72],L09:[65,68,72],L10:[69,72,76],L11:[69,73,76],L12:[64,68,71],L13:[64,67,71],L14:[70,74,77],L15:[70,73,77],L16:[60,63,67],L17:[62,66,69],L18:[65,69,72],L19:[60,63,66],L20:[71,74,77],L21:[60,64,68],L22:[65,69,73],L24:[60,63,66]
};
test('24 campaign missions match independent target values and valid questions', () => {
  assert.equal(LESSONS.length,24);
  assert.equal(new Set(LESSONS.map(l=>l.id)).size,24);
  for (const l of LESSONS) {
    if (missionExpected[l.id]) assert.deepEqual(makeTriad(l.root,l.quality).map(n=>n.midi),missionExpected[l.id]);
    assert.ok(l.answer>=0 && l.answer<l.choices.length);
    assert.ok(l.question && l.explanation);
    if(l.kind==='repair') {
      const target=missionExpected[l.id];
      assert.ok(l.initial);
      assert.equal(l.initial[0],target[0]);
      assert.equal(l.initial.filter((m,i)=>m!==target[i]).length,l.id==='L24'?2:1);
    }
  }
  assert.deepEqual(MIXED_LESSON_IDS,['L01','L05','L20','L22']);
});
