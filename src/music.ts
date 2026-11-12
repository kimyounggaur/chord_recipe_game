/** Pure, notation-aware basic-position triad engine. C4 = MIDI 60. */
export type Quality = 'major' | 'minor' | 'diminished' | 'augmented';
export interface Note { letter: string; accidental: number; octave: number; midi: number }
export interface Recipe {
  label: string;
  en: string;
  adjacent: [number, number];
  offsets: [number, number, number];
}
export const RECIPES: Record<Quality, Recipe> = {
  major: { label: '장3화음', en: 'major', adjacent: [4, 3], offsets: [0, 4, 7] },
  minor: { label: '단3화음', en: 'minor', adjacent: [3, 4], offsets: [0, 3, 7] },
  diminished: { label: '감3화음', en: 'dim', adjacent: [3, 3], offsets: [0, 3, 6] },
  augmented: { label: '증3화음', en: 'aug', adjacent: [4, 4], offsets: [0, 4, 8] },
};
export const ROOTS = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL = [0, 2, 4, 5, 7, 9, 11];
const ACCIDENTALS: Record<string, number> = { '': 0, '#': 1, '♯': 1, 'b': -1, '♭': -1, '##': 2, '♯♯': 2, 'x': 2, '𝄪': 2, 'bb': -2, '♭♭': -2, '𝄫': -2 };
const ACCIDENTAL_LABELS: Record<number, string> = { [-2]: '𝄫', [-1]: '♭', 0: '', 1: '♯', 2: '𝄪' };
const modulo = (value: number, modulus: number) => ((value % modulus) + modulus) % modulus;
const naturalMidi = (letterIndex: number, octave: number) => 12 * (octave + 1) + NATURAL[letterIndex];

function checkedMidi(midi: number): number {
  if (!Number.isInteger(midi) || midi < 0 || midi > 127) throw new RangeError('MIDI 음높이는 0~127 사이 정수여야 합니다.');
  return midi;
}

export function makeTriad(root: string, quality: Quality, octave = 4): Note[] {
  if (typeof root !== 'string') throw new TypeError('근음 이름이 필요합니다.');
  const match = /^([A-Ga-g])(##|bb|♯♯|♭♭|𝄪|𝄫|♯|♭|#|b|x)?$/u.exec(root.trim());
  if (!match) throw new RangeError('지원하지 않는 근음 표기입니다.');
  if (!Number.isInteger(octave)) throw new RangeError('옥타브는 정수여야 합니다.');
  const recipe = RECIPES[quality];
  if (!recipe) throw new RangeError('지원하지 않는 화음 종류입니다.');
  const letterIndex = LETTERS.indexOf(match[1].toUpperCase());
  const rootAccidental = ACCIDENTALS[match[2] ?? ''];
  const rootMidi = checkedMidi(naturalMidi(letterIndex, octave) + rootAccidental);
  const rootDiatonic = octave * 7 + letterIndex;
  return recipe.offsets.map((offset, role) => {
    const diatonic = rootDiatonic + role * 2;
    const index = modulo(diatonic, 7);
    const noteOctave = Math.floor(diatonic / 7);
    const midi = checkedMidi(rootMidi + offset);
    const accidental = midi - naturalMidi(index, noteOctave);
    if (accidental < -2 || accidental > 2) throw new RangeError('이 근음의 화음에는 지원 범위 밖의 임시표가 필요합니다.');
    return { letter: LETTERS[index], accidental, octave: noteOctave, midi };
  });
}

export function noteLabel(note: Note, withOctave = false): string {
  const accidental = ACCIDENTAL_LABELS[note.accidental];
  if (accidental === undefined || !LETTERS.includes(note.letter)) throw new RangeError('지원하지 않는 음이름입니다.');
  return `${note.letter}${accidental}${withOctave ? note.octave : ''}`;
}

/** Generic keyboard spelling only; use makeTriad() spelling for accepted role notes. */
export function midiNote(value: number): Note {
  const midi = checkedMidi(value);
  const pc = modulo(midi, 12);
  const letterByPitch = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'];
  const accidentalByPitch = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
  return { letter: letterByPitch[pc], accidental: accidentalByPitch[pc], octave: Math.floor(midi / 12) - 1, midi };
}

/** Do not infer a named third solely from semitone distance. */
export function intervalName(a: Note, b: Note): string {
  const ai = LETTERS.indexOf(a.letter);
  const bi = LETTERS.indexOf(b.letter);
  if (ai < 0 || bi < 0) return '음이름 확인';
  const semitones = b.midi - a.midi;
  const diatonic = b.octave * 7 + bi - (a.octave * 7 + ai);
  if (diatonic === 2 && semitones === 4) return '장3도';
  if (diatonic === 2 && semitones === 3) return '단3도';
  if (diatonic === 4 && semitones === 7) return '완전5도';
  if (diatonic === 4 && semitones === 6) return '감5도';
  if (diatonic === 4 && semitones === 8) return '증5도';
  if (diatonic === 0 && semitones === 0) return '같은 음';
  if (diatonic === 7 && semitones === 12) return '완전8도';
  return `${semitones < 0 ? '아래로 ' : ''}${Math.abs(semitones)}반음`;
}

/** Recognize only exact ascending basic-position triads; preserve slot and octave meaning. */
export function identify(midis: (number | null)[]): Quality | null {
  if (midis.length !== 3 || midis.some(m => m === null || !Number.isInteger(m) || m < 0 || m > 127)) return null;
  const [a, b, c] = midis as number[];
  if (!(a < b && b < c)) return null;
  return (Object.keys(RECIPES) as Quality[]).find(q => {
    const [lower, upper] = RECIPES[q].adjacent;
    return b - a === lower && c - b === upper;
  }) ?? null;
}
