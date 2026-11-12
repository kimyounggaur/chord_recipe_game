import type { Quality } from './music';

export interface Lesson {
  id: string;
  title: string;
  kind: 'build' | 'transform' | 'compare' | 'repair' | 'mixed';
  root: string;
  quality: Quality;
  initial: number[] | null;
  hint: 0 | 1 | 2;
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
}

export const LESSONS: Lesson[] = [
  { id: 'L01', title: '첫 주문', kind: 'build', root: 'C', quality: 'major', initial: null, hint: 2,
    question: 'C 장3화음을 아래부터 쌓는 순서는?', choices: ['장3도 + 단3도', '단3도 + 장3도', '장3도 + 장3도'], answer: 0,
    explanation: 'C→E는 4반음인 장3도, E→G는 3반음인 단3도예요. 두 번째 간격은 E에서 셉니다.' },
  { id: 'L02', title: '가운데 재료 바꾸기', kind: 'transform', root: 'C', quality: 'minor', initial: [60, 64, 67], hint: 2,
    question: 'C와 G를 유지하고 E를 E♭로 내리면 두 간격은?', choices: ['4+3 그대로', '3+4로 바뀌어요', '3+3으로 바뀌어요'], answer: 1,
    explanation: '가운데 음 하나를 내리면 아래는 4→3반음, 위는 3→4반음으로 두 간격이 함께 달라져요.' },
  { id: 'L03', title: '두 맛 비교', kind: 'compare', root: 'C', quality: 'minor', initial: [60, 64, 67], hint: 2,
    question: 'C 장3화음과 C 단3화음에서 다른 음은?', choices: ['근음 C', '맨 위 음 G', '가운데 음 E와 E♭'], answer: 2,
    explanation: '두 화음은 C와 G를 공유하고 가운데 음만 달라요. 느낌에는 정답이 없고, 구성음과 간격을 확인해요.' },
  { id: 'L04', title: 'D 장3화음', kind: 'build', root: 'D', quality: 'major', initial: null, hint: 2,
    question: 'D 위에 장3도(4반음)를 쌓으면?', choices: ['F', 'F♯', 'G'], answer: 1,
    explanation: 'D→F♯은 4반음이에요. F♯에서 3반음 더 올라가 A를 놓으면 D–F♯–A가 됩니다.' },
  { id: 'L05', title: 'D 단3화음', kind: 'transform', root: 'D', quality: 'minor', initial: [62, 66, 69], hint: 1,
    question: 'D 장3화음을 D 단3화음으로 바꿀 때 필요한 변화는?', choices: ['F♯를 F로 내려요', 'A를 A♯로 올려요', 'D만 E로 올려요'], answer: 0,
    explanation: 'D와 A를 두고 가운데 F♯를 반음 내리면 D–F–A, 3+4반음의 단3화음이 돼요.' },
  { id: 'L06', title: '위 옥타브로', kind: 'build', root: 'G', quality: 'major', initial: null, hint: 1,
    question: 'G4–B4 다음에 놓을 음은?', choices: ['D4', 'D5', 'G5'], answer: 1,
    explanation: 'B4에서 위로 3반음 쌓으면 D5예요. 음이름뿐 아니라 옥타브를 확인해야 기본위치로 쌓을 수 있어요.' },
  { id: 'L07', title: 'G 단3화음', kind: 'build', root: 'G', quality: 'minor', initial: null, hint: 1,
    question: 'G 단3화음의 가운데 음은?', choices: ['B', 'A♯', 'B♭'], answer: 2,
    explanation: 'G에서 3도인 음이름은 B예요. 3반음 간격을 만드는 B♭로 적어 G–B♭–D의 쌓기를 보여 줍니다.' },
  { id: 'L08', title: 'F 장3화음', kind: 'build', root: 'F', quality: 'major', initial: null, hint: 1,
    question: 'F–A–C에서 A→C의 간격은?', choices: ['장3도 · 4반음', '단3도 · 3반음', '완전5도 · 7반음'], answer: 1,
    explanation: 'F→A는 장3도 4반음이고, A→C는 단3도 3반음이에요. 근음 F→C의 7반음과 구분해요.' },
  { id: 'L09', title: 'F 단3화음', kind: 'build', root: 'F', quality: 'minor', initial: null, hint: 1,
    question: 'F–A♭–C의 위쪽 간격 A♭→C는?', choices: ['장3도 · 4반음', '단3도 · 3반음', '2반음'], answer: 0,
    explanation: '단3화음은 아래가 3반음, 위가 4반음이에요. A♭→C는 장3도입니다.' },
  { id: 'L10', title: '스스로 A minor', kind: 'build', root: 'A', quality: 'minor', initial: null, hint: 0,
    question: 'A4–C5–E5의 근음 기준 간격은?', choices: ['0·4·7반음', '0·3·6반음', '0·3·7반음'], answer: 2,
    explanation: 'A→C는 3반음, C→E는 4반음이에요. 근음 A에서 보면 0·3·7반음입니다.' },
  { id: 'L11', title: 'A major', kind: 'build', root: 'A', quality: 'major', initial: null, hint: 0,
    question: 'A minor에서 A major로 바꾸려면?', choices: ['C를 C♯로 올려요', 'E를 E♭로 내려요', 'A를 A♭로 내려요'], answer: 0,
    explanation: 'A와 E는 유지하고 C를 C♯로 올리면 3+4에서 4+3으로 바뀝니다.' },
  { id: 'L12', title: 'E major', kind: 'build', root: 'E', quality: 'major', initial: null, hint: 0,
    question: 'E 장3화음의 구성음은?', choices: ['E–G–B', 'E–G♯–B', 'E–G♯–C'], answer: 1,
    explanation: 'E 위 4반음은 G♯, G♯ 위 3반음은 B예요. 근음부터 0·4·7반음입니다.' },
  { id: 'L13', title: 'E minor', kind: 'build', root: 'E', quality: 'minor', initial: null, hint: 0,
    question: 'E 단3화음을 만드는 인접 간격은?', choices: ['4+3반음', '4+4반음', '3+4반음'], answer: 2,
    explanation: 'E→G는 3반음, G→B는 4반음이에요. 근음을 바꿔도 단3화음 레시피는 같습니다.' },
  { id: 'L14', title: '검은 건반에서 시작', kind: 'build', root: 'B♭', quality: 'major', initial: null, hint: 1,
    question: 'B♭ 장3화음에서 근음과 맨 위 음의 간격은?', choices: ['완전5도 · 7반음', '단3도 · 3반음', '장3도 · 4반음'], answer: 0,
    explanation: 'B♭–D–F는 4+3반음이에요. 근음 B♭에서 F까지는 두 간격을 합한 7반음, 완전5도입니다.' },
  { id: 'L15', title: 'B♭ minor', kind: 'build', root: 'B♭', quality: 'minor', initial: null, hint: 0,
    question: 'B♭ 단3화음의 가운데 음 표기는?', choices: ['C♯', 'D♭', 'D'], answer: 1,
    explanation: '같은 검은 건반이라도 3도 쌓기에서는 B♭–D♭–F로 적어요. 건반 선택은 음높이로 판단합니다.' },
  { id: 'L16', title: '한 음 수리', kind: 'repair', root: 'C', quality: 'minor', initial: [60, 64, 67], hint: 0,
    question: 'C–E–G를 C minor 주문에 맞게 고치려면?', choices: ['G를 G♯로 올려요', 'C를 D로 올려요', 'E를 E♭로 내려요'], answer: 2,
    explanation: '가운데 E를 반음 내리면 C–E♭–G가 돼요. 아래와 위 간격이 함께 3+4로 바뀝니다.' },
  { id: 'L17', title: 'D 요리 수리', kind: 'repair', root: 'D', quality: 'major', initial: [62, 65, 69], hint: 0,
    question: 'D–F–A를 D major로 수리하는 방법은?', choices: ['F를 F♯로 올려요', 'A를 A♭로 내려요', 'D만 C로 내려요'], answer: 0,
    explanation: 'F를 반음 올리면 D→F♯가 4반음, F♯→A가 3반음이 되어 장3화음입니다.' },
  { id: 'L18', title: '맨 위 음 수리', kind: 'repair', root: 'F', quality: 'major', initial: [65, 69, 73], hint: 0,
    question: 'F–A–C♯를 F major로 수리하려면?', choices: ['A를 A♭로 내려요', 'C♯를 C로 내려요', 'F를 F♯로 올려요'], answer: 1,
    explanation: 'F와 A는 이미 맞아요. 맨 위 C♯를 반음 내려 A→C의 단3도 3반음을 만듭니다.' },
  { id: 'L19', title: '단3도 두 번', kind: 'build', root: 'C', quality: 'diminished', initial: null, hint: 2,
    question: '감3화음의 레시피는?', choices: ['4+3반음', '3+4반음', '3+3반음'], answer: 2,
    explanation: '단3도를 두 번 쌓으면 감3화음이에요. C–E♭–G♭의 근음 기준 간격은 0·3·6반음입니다.' },
  { id: 'L20', title: '다른 감3화음', kind: 'build', root: 'B', quality: 'diminished', initial: null, hint: 1,
    question: 'B–D–F의 근음에서 맨 위 음까지는?', choices: ['감5도 · 6반음', '완전5도 · 7반음', '증5도 · 8반음'], answer: 0,
    explanation: 'B→D가 3반음, D→F도 3반음이에요. 합하면 6반음으로 감5도입니다.' },
  { id: 'L21', title: '장3도 두 번', kind: 'build', root: 'C', quality: 'augmented', initial: null, hint: 2,
    question: 'C 증3화음의 구성음은?', choices: ['C–E–G', 'C–E–G♯', 'C–E♭–G♭'], answer: 1,
    explanation: 'C→E와 E→G♯가 각각 장3도 4반음이에요. 근음부터 0·4·8반음입니다.' },
  { id: 'L22', title: '다른 증3화음', kind: 'build', root: 'F', quality: 'augmented', initial: null, hint: 1,
    question: 'F–A–C♯에서 A→C♯의 간격은?', choices: ['단3도 · 3반음', '완전5도 · 7반음', '장3도 · 4반음'], answer: 2,
    explanation: 'F→A도, A→C♯도 4반음이에요. 근음을 바꿔도 증3화음은 4+4반음입니다.' },
  { id: 'L23', title: '주방장 네 주문', kind: 'mixed', root: 'C', quality: 'major', initial: null, hint: 0,
    question: '네 종류 중 아래와 위가 모두 장3도인 화음은?', choices: ['증3화음', '장3화음', '감3화음'], answer: 0,
    explanation: '증3화음은 4+4, 감3화음은 3+3, 장3화음은 4+3, 단3화음은 3+4반음입니다.' },
  { id: 'L24', title: '마지막 수리', kind: 'repair', root: 'C', quality: 'diminished', initial: [60, 64, 67], hint: 0,
    question: 'C–E–G에서 Cdim으로 바꾸려면 몇 개의 음을 바꾸나요?', choices: ['근음 하나', '가운데와 맨 위, 두 음', '바꿀 음이 없어요'], answer: 1,
    explanation: 'E를 E♭로, G를 G♭로 각각 반음 내립니다. C–E♭–G♭는 3+3반음이고 근음은 유지해요.' },
];

/** L23 reuses targets only; each question is a fresh H0 build task. */
export const MIXED_LESSON_IDS = ['L01', 'L05', 'L20', 'L22'] as const;
