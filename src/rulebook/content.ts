import type { Quality } from '../music';

export type RulebookSection = '시작하기' | '음과 간격' | '화음 레시피' | '도전과 학습' | '설정과 기록';

export interface RulePage {
  id: string;
  section: RulebookSection;
  title: string;
  subtitle: string;
  image: string;
  alt: string;
  paragraphs: string[];
  steps?: string[];
  formula?: string;
  tip?: string;
  demoIndex?: number;
  audio?: { quality: Quality; root: string; label: string }[];
  originalGuide?: 1 | 2;
  keywords?: string[];
}

/** Page content describes the shipped game rules, not generic harmony exercises. */
export const RULEBOOK_PAGES: RulePage[] = [
  {
    id: 'kitchen', section: '시작하기', title: '코드 레시피 키친에 오신 것을 환영해요',
    subtitle: '음 세 개를 차곡차곡 쌓아 화음을 만들어요.', image: 'kitchen',
    alt: '주문을 확인하고 세 음을 쌓아 완성하는 코드 요리의 전체 흐름',
    paragraphs: ['주문에 알맞은 근음, 가운데 음, 맨 위 음을 골라 3화음을 완성하는 게임이에요.', '한 음씩 들어 보고 간격을 살펴보며 장·단·감·증3화음의 구조를 배워요.'],
    steps: ['주문과 목표를 확인해요.', '접시 세 칸에 알맞은 음을 놓아요.', '소리나 그림으로 살펴보고 완성해요.'],
    demoIndex: 0, originalGuide: 1, keywords: ['게임 목표', '화음', '주방'],
  },
  {
    id: 'orders', section: '시작하기', title: '나에게 맞는 모드 고르기',
    subtitle: '처음 배우기, 주문 모드, 자유 연습, 수리 모드', image: 'orders',
    alt: 'C 장3화음 주문 카드에 근음, 3음, 5음이 표시된 그림',
    paragraphs: ['처음이라면 처음 배우기에서 C 장3화음부터 차근차근 익혀요.', '주문 모드는 순서대로 과제를 풀고, 자유 연습은 근음과 화음 종류를 골라 탐색해요. 수리 주문은 L15를 완성하면 열려요.'],
    steps: ['홈에서 원하는 모드를 선택해요.', '이어하기로 저장된 학습을 계속할 수 있어요.', '수리 주문이 아직 잠겼다면 자유 연습에서 먼저 음을 바꿔 보세요.'],
    keywords: ['메뉴', '잠금', '시작', '이어하기'],
  },
  {
    id: 'slots', section: '시작하기', title: '접시 세 칸 살펴보기',
    subtitle: '근음 · 가운데 음 · 맨 위 음', image: 'slots',
    alt: '근음, 가운데 3음, 맨 위 5음 순서로 배치된 세 개의 음 접시',
    paragraphs: ['왼쪽 접시는 기준이 되는 근음, 가운데는 근음 위의 3음, 오른쪽은 맨 위 5음이에요.', '테두리가 강조된 칸이 현재 선택한 칸이에요. 음을 고르면 빈칸을 순서대로 채웁니다.'],
    steps: ['바꾸고 싶은 접시를 선택해요.', '음 버튼이나 건반으로 알맞은 음을 골라요.', '세 칸이 채워지면 간격과 음을 확인해요.'],
    tip: '잠긴 칸은 현재 문제에서 바꿀 수 없어요. 안내 문구를 살펴보세요.', demoIndex: 1, originalGuide: 1, keywords: ['근음', '3음', '5음', '선택'],
  },
  {
    id: 'key-input', section: '시작하기', title: '건반과 큰 버튼으로 음 고르기',
    subtitle: '내게 편한 방법을 선택해요.', image: 'key-input',
    alt: '건반과 큰 음 버튼을 이용해 선택한 접시에 음을 넣는 방법',
    paragraphs: ['큰 버튼 또는 건반을 눌러 현재 접시에 음을 넣어요. 같은 음높이는 두 입력 방식에서 동일하게 선택할 수 있어요.', '위쪽 C4 / C5 버튼으로 음역을 바꿀 수 있어요. 수정 도구를 펼치면 반음 이동, 재료 빼기와 되돌리기를 사용할 수 있어요.'],
    tip: '드래그하지 않아도 접시 선택과 버튼 누르기만으로 학습할 수 있어요.', demoIndex: 2, originalGuide: 1, keywords: ['건반', '음 버튼', '터치', '수정', '되돌리기'],
  },
  {
    id: 'intervals', section: '음과 간격', title: '두 간격은 어디서 셀까요?',
    subtitle: '아래 간격과 위 간격은 출발점이 달라요.', image: 'intervals',
    alt: 'C에서 E까지 4반음, E에서 G까지 3반음인 두 인접 간격',
    paragraphs: ['두 이웃 음 사이의 거리를 인접 간격이라고 해요. C–E–G에서는 C→E와 E→G를 따로 살펴봐요.', '두 번째 간격을 셀 때는 근음 C가 아니라 가운데 음 E에서 시작해요. 근음에서 각 음까지의 거리와도 구별해요.'],
    formula: 'C→E 4반음 + E→G 3반음   |   근음 기준 0 · 4 · 7반음',
    demoIndex: 3, originalGuide: 1, keywords: ['음정', '인접 간격', '근음 기준', '반음'],
  },
  {
    id: 'semitone', section: '음과 간격', title: '반음 한 칸씩 세기',
    subtitle: '흰 건반과 검은 건반을 모두 포함해요.', image: 'semitone',
    alt: '인접한 건반 사이를 반음으로 세며 E와 F, B와 C도 반음임을 보여 주는 건반',
    paragraphs: ['서로 바로 이웃한 건반 사이를 한 반음으로 세어요. 시작 건반은 세지 않고 이동 횟수를 셉니다.', 'E와 F 사이, B와 C 사이에는 검은 건반이 없어도 바로 이웃한 반음이에요.'],
    formula: 'C → C♯ → D → E♭ → E = 위로 4반음',
    tip: 'C에서 E까지 네 칸 이동한 것이지 건반 다섯 개를 세는 것이 아니에요.', originalGuide: 1, keywords: ['반음', '검은 건반', 'E F', 'B C'],
  },
  {
    id: 'octave', section: '음과 간격', title: '같은 음이름도 높이가 달라요',
    subtitle: 'C4와 C5는 서로 다른 옥타브예요.', image: 'octave',
    alt: 'G4에서 B4를 거쳐 높은 옥타브의 D5를 선택하는 예',
    paragraphs: ['옥타브 숫자는 음의 높이 범위를 알려줘요. 게임은 C4부터 B5까지 선택할 수 있어요.', '음이름이 같더라도 필요한 옥타브가 다르면 주문의 정답이 되지 않아요.'],
    formula: 'G4 → B4 → D5',
    steps: ['G4와 B4를 먼저 선택해요.', 'C5 버튼으로 높은 음역을 열어요.', 'D5를 골라 위로 쌓아요.'],
    tip: 'D4와 D5는 다른 높이예요. 맨 위 음을 고를 때 숫자도 확인하세요.', keywords: ['옥타브', 'C4', 'C5', 'D5'],
  },
  {
    id: 'accidental', section: '음과 간격', title: '올림표와 내림표 알아보기',
    subtitle: '♯는 반음 위, ♭는 반음 아래', image: 'accidental',
    alt: '올림표는 음을 반음 올리고 내림표는 반음 내린다는 표시',
    paragraphs: ['올림표 ♯는 기준 음을 반음 올리고, 내림표 ♭는 반음 내려요.', 'E에서 한 반음 내려가면 E♭, G에서 한 반음 올라가면 G♯예요. 건반 위의 위치와 음이름을 함께 확인해요.'],
    formula: 'E → E♭ : −1반음   |   G → G♯ : +1반음',
    demoIndex: 7, originalGuide: 2, keywords: ['임시표', '샵', '플랫', '올림표', '내림표'],
  },
  {
    id: 'major', section: '화음 레시피', title: '장3화음: 장3도 + 단3도',
    subtitle: '아래 4반음, 위 3반음', image: 'major',
    alt: 'C 장3화음 C E G와 인접 간격 4반음 3반음',
    paragraphs: ['근음 위에 장3도 4반음을 쌓고, 그 음 위에 단3도 3반음을 쌓으면 장3화음이 돼요.', 'C 장3화음은 C–E–G예요. 근음 C에서 본 거리는 0·4·7반음이에요.'],
    formula: 'C — 4 — E — 3 — G', demoIndex: 5,
    audio: [{ quality: 'major', root: 'C', label: 'C 장3화음 듣기' }], originalGuide: 1, keywords: ['major', '장화음', '4+3'],
  },
  {
    id: 'minor', section: '화음 레시피', title: '단3화음: 단3도 + 장3도',
    subtitle: '아래 3반음, 위 4반음', image: 'minor',
    alt: 'C 단3화음 C E플랫 G와 인접 간격 3반음 4반음',
    paragraphs: ['근음 위에 단3도 3반음, 그 위에 장3도 4반음을 쌓으면 단3화음이 돼요.', 'C 단3화음은 C–E♭–G예요. 근음 C에서 본 거리는 0·3·7반음이에요.'],
    formula: 'C — 3 — E♭ — 4 — G', demoIndex: 6,
    audio: [{ quality: 'minor', root: 'C', label: 'C 단3화음 듣기' }], originalGuide: 2, keywords: ['minor', '단화음', '3+4'],
  },
  {
    id: 'diminished', section: '화음 레시피', title: '감3화음: 단3도를 두 번',
    subtitle: '아래 3반음, 위 3반음', image: 'diminished',
    alt: 'C 감3화음 C E플랫 G플랫과 인접 간격 3반음 3반음',
    paragraphs: ['단3도를 두 번 쌓으면 감3화음이 돼요.', 'C 감3화음은 C–E♭–G♭이며 근음 기준 간격은 0·3·6반음이에요. C에서 G♭까지는 감5도예요.'],
    formula: 'C — 3 — E♭ — 3 — G♭', audio: [{ quality: 'diminished', root: 'C', label: 'C 감3화음 듣기' }], keywords: ['diminished', 'dim', '감화음', '3+3'],
  },
  {
    id: 'augmented', section: '화음 레시피', title: '증3화음: 장3도를 두 번',
    subtitle: '아래 4반음, 위 4반음', image: 'augmented',
    alt: 'C 증3화음 C E G샵과 인접 간격 4반음 4반음',
    paragraphs: ['장3도를 두 번 쌓으면 증3화음이 돼요.', 'C 증3화음은 C–E–G♯이며 근음 기준 간격은 0·4·8반음이에요. C에서 G♯까지는 증5도예요.'],
    formula: 'C — 4 — E — 4 — G♯', audio: [{ quality: 'augmented', root: 'C', label: 'C 증3화음 듣기' }], keywords: ['augmented', 'aug', '증화음', '4+4'],
  },
  {
    id: 'comparison', section: '화음 레시피', title: '장3화음과 단3화음 비교하기',
    subtitle: '가운데 음을 바꾸면 두 간격이 달라져요.', image: 'comparison',
    alt: 'C E G와 C E플랫 G에서 가운데 음이 바뀌고 인접 간격이 달라지는 비교',
    paragraphs: ['C 장3화음 C–E–G와 C 단3화음 C–E♭–G는 근음 C와 맨 위 G가 같아요.', '가운데 E를 E♭로 내리면 아래 간격은 4→3반음, 위 간격은 3→4반음으로 함께 바뀌어요.'],
    formula: 'C–E–G  4+3  ↔  C–E♭–G  3+4', demoIndex: 9,
    audio: [{ quality: 'major', root: 'C', label: '장3화음 듣기' }, { quality: 'minor', root: 'C', label: '단3화음 듣기' }], originalGuide: 2,
    tip: '두 소리가 주는 느낌은 사람마다 다를 수 있어요. 정답은 음과 간격을 기준으로 확인해요.', keywords: ['장단 비교', '가운데 음'],
  },
  {
    id: 'spelling', section: '화음 레시피', title: '같은 건반, 알맞은 음이름',
    subtitle: '소리 높이와 악보 표기를 함께 살펴봐요.', image: 'spelling',
    alt: '한 건반에서 D샵과 E플랫이 같은 높이지만 C 단3화음의 가운데 음은 E플랫으로 표기되는 예',
    paragraphs: ['피아노의 한 건반은 상황에 따라 D♯ 또는 E♭로 부를 수 있어요. 이 게임의 건반 선택은 음높이를 기준으로 판정해요.', 'C 단3화음은 C에서 세는 세 번째 음이 E이므로 C–E♭–G로 적어요. 음이름까지 함께 보면 3도 쌓기가 명확해져요.'],
    formula: '같은 건반: D♯ = E♭   |   C단3화음 표기: C–E♭–G',
    demoIndex: 8, originalGuide: 2, keywords: ['이명동음', '엔하모닉', 'E♭', 'D♯', '철자'],
  },
  {
    id: 'transpose', section: '화음 레시피', title: '다른 근음에도 레시피 적용하기',
    subtitle: '기준음을 바꾸면 세 음을 새로 쌓아요.', image: 'transpose',
    alt: 'D 장3화음 D F샵 A와 D 단3화음 D F A의 간격을 비교한 그림',
    paragraphs: ['근음이 바뀌어도 화음의 간격 레시피는 같아요. 다만 각 음은 새로운 근음에서 다시 찾아야 해요.', 'D 장3화음은 D–F♯–A, D 단3화음은 D–F–A예요. C만 D로 바꾸고 나머지 음을 그대로 두지는 않아요.'],
    formula: 'D–F♯–A: 4+3   |   D–F–A: 3+4', demoIndex: 11,
    audio: [{ quality: 'major', root: 'D', label: 'D 장3화음 듣기' }, { quality: 'minor', root: 'D', label: 'D 단3화음 듣기' }], originalGuide: 2, keywords: ['전이', '다른 근음', 'D', '전조'],
  },
  {
    id: 'tutorial', section: '도전과 학습', title: '첫 요리 수업 따라가기',
    subtitle: '13단계로 장·단3화음을 배워요.', image: 'tutorial',
    alt: '주문을 받고 음을 쌓고 비교해 첫 레시피를 완성하는 학습 단계',
    paragraphs: ['주문 확인 후 C4·E4·G4를 차례로 놓고, 소리 또는 그림으로 확인해요.', '이어서 E를 E♭로 바꾸고 두 화음을 비교한 뒤 원리 질문을 풀어요. 안내되는 단계의 접시부터 선택해 주세요.'],
    steps: ['C 장3화음 만들기와 확인', '가운데 음을 바꿔 C 단3화음 만들기', '두 화음 비교와 원리 질문', '첫 레시피 기록 후 다음 주문'],
    demoIndex: 0, originalGuide: 1, keywords: ['튜토리얼', '처음 배우기', '13단계'],
  },
  {
    id: 'repair', section: '도전과 학습', title: '틀린 음을 찾아 수리하기',
    subtitle: '이미 맞는 음은 두고 필요한 음만 고쳐요.', image: 'repair',
    alt: 'C E G에서 가운데 E를 E플랫으로 바꾸어 C단3화음을 만드는 수리 예',
    paragraphs: ['수리 주문은 이미 놓인 재료 중 주문과 다른 음을 고치는 방식이에요. 근음은 고정되고 위 두 음을 살펴봐요.', 'C–E–G를 C 단3화음으로 수리한다면 가운데 E를 E♭로 내리면 돼요. 어떤 주문에서는 두 음을 모두 고쳐야 해요.'],
    formula: 'C–E–G → C–E♭–G', demoIndex: 7, originalGuide: 2, keywords: ['수리 모드', '바꾸기', '오답', '수정'],
  },
  {
    id: 'feedback', section: '도전과 학습', title: '틀려도 괜찮아요',
    subtitle: '안내를 읽고 해당 접시를 다시 고쳐요.', image: 'feedback',
    alt: '오답 안내를 보고 이전 음을 유지한 채 잘못된 음을 수정하는 과정',
    paragraphs: ['주문을 확인했는데 음이 맞지 않으면 어느 역할과 간격을 살펴볼지 알려줘요.', '일반 주문에서는 입력한 음이 남고, 첫 수업에서는 맞지 않은 새 음이 놓이지 않아요. 앞에서 맞힌 음은 유지되므로 다시 시도할 수 있어요. 음이름이 맞아도 옥타브가 다르면 숫자를 확인해요.'],
    steps: ['피드백을 읽어요.', '해당 접시를 선택해 음을 바꿔요.', '다시 완성 확인을 눌러요.'],
    keywords: ['틀림', '오답', '다시', '피드백'],
  },
  {
    id: 'listening', section: '도전과 학습', title: '차례로 듣기와 함께 듣기',
    subtitle: '구성음과 어울림을 각각 확인해요.', image: 'listening',
    alt: 'C E G 음을 차례로 듣는 방법과 세 음을 동시에 듣는 방법 비교',
    paragraphs: ['차례로 듣기는 선택한 음을 하나씩 들려줘요. 함께 듣기는 선택한 음들을 한꺼번에 들려줘요.', '첫 수업의 확인 단계에서는 두 재생을 모두 끝까지 듣거나, 소리 대신 그림으로 확인할 수 있어요. 재생 도중에는 정지할 수 있어요.'],
    demoIndex: 4, audio: [{ quality: 'major', root: 'C', label: 'C 장3화음 함께 듣기' }], originalGuide: 1, keywords: ['소리', '재생', '청음', '정지'],
  },
  {
    id: 'silent', section: '도전과 학습', title: '소리 없이도 배울 수 있어요',
    subtitle: '그림과 음정으로 확인해요.', image: 'silent',
    alt: '음소거 상태에서 음과 간격 그림을 비교해 학습하는 방법',
    paragraphs: ['홈의 소리 없이 시작 또는 소리 없이 이어하기로 조용히 학습할 수 있어요.', '소리를 재생할 수 없다면 확인 단계에서 “소리 대신 그림으로 확인했어요”를 눌러 구성음과 간격을 비교해요.'],
    tip: '그림 확인 기록과 실제로 소리를 들은 기록은 따로 관리돼요.', keywords: ['무음', '음소거', '대체', '그림 확인'],
  },
  {
    id: 'hints', section: '도전과 학습', title: '힌트와 음 수정 도구',
    subtitle: '필요할 때 한 걸음씩 도움받아요.', image: 'hints',
    alt: '첫 번째부터 세 번째까지 단계별로 자세해지는 힌트',
    paragraphs: ['힌트 버튼은 현재 문제의 도움말을 단계적으로 보여 줘요. 힌트 수준이 높아지면 필요한 음을 볼 수도 있어요.', '음 수정 도구에서 반음 위·아래, 재료 빼기와 되돌리기를 사용할 수 있어요. 일부 수업 단계에서는 안내된 조작만 사용할 수 있어요.'],
    tip: '같은 시도에서 처음 상태로 돌아가도 사용한 힌트 이력은 유지돼요.', keywords: ['힌트', '도움말', '반음 이동', '삭제', 'undo'],
  },
  {
    id: 'missions', section: '도전과 학습', title: '24개의 주문과 도장',
    subtitle: '한 주문씩 완성하며 다음 도전을 열어요.', image: 'missions',
    alt: '완성한 주문과 열린 주문, 잠긴 주문의 상태와 도장',
    paragraphs: ['주문은 보통 앞 주문을 완성하면 다음 주문이 열려요. 수리 주문은 L15 이후에 시작할 수 있어요.', 'L23은 네 가지 주문을 차례로 풀어요. 마지막 L24는 감3화음으로 고치는 수리 주문이에요.'],
    steps: ['주문 목록에서 열린 주문을 선택해요.', '조건에 맞는 음을 놓고 완성 확인을 해요.', '완성 후 다음 주문 또는 다시 도전을 선택해요.'],
    tip: '완성, 정답 표시 없이 완성, 원리 확인 도장은 서로 다른 성취를 나타내요.', keywords: ['스테이지', '미션', '잠금', 'L23', 'L24'],
  },
  {
    id: 'recipe-book', section: '도전과 학습', title: '나만의 레시피북',
    subtitle: '완성한 화음을 다시 살펴봐요.', image: 'recipe-book',
    alt: '완성한 화음의 구성음과 두 간격을 모아 보는 레시피북',
    paragraphs: ['완성한 주문의 화음은 레시피북에서 구성음, 인접 간격과 근음 기준 간격으로 다시 볼 수 있어요. 자유 연습에서는 알맞은 화음을 만든 뒤 레시피 저장을 눌러야 기록돼요.', '근음과 종류로 필터하고, 함께 듣거나 해당 레시피를 자유 연습으로 열 수 있어요. 같은 레시피는 중복해 쌓이지 않아요.'],
    demoIndex: 10, originalGuide: 2, keywords: ['도감', '레시피북', '필터', '기록'],
  },
  {
    id: 'settings', section: '설정과 기록', title: '설정과 학습 기록',
    subtitle: '소리, 큰 버튼, 움직임과 백업', image: 'settings',
    alt: '소리, 큰 버튼, 움직임 줄이기를 선택하는 설정 그림',
    paragraphs: ['설정에서 음량, 소리 없이 학습하기, 큰 버튼 사용, 움직임 줄이기를 선택해요.', '진도와 레시피는 이 브라우저에 저장돼요. 기록을 옮기거나 지우기 전에는 설정의 기록 백업을 이용해요.'],
    tip: '기록 가져오기는 병합과 교체 중 선택할 수 있으며, 기존 기록을 먼저 백업하려고 시도해요.', keywords: ['설정', '백업', '복원', '가져오기', '접근성'],
  },
  {
    id: 'offline', section: '설정과 기록', title: '오프라인과 새 버전',
    subtitle: '인터넷이 없는 상황도 준비해요.', image: 'offline',
    alt: '온라인으로 앱을 먼저 연 후 오프라인 학습과 새 버전 적용을 안내하는 그림',
    paragraphs: ['처음 온라인으로 앱과 필수 파일을 불러온 뒤에는 기본 학습과 이 기기의 기록을 오프라인에서도 사용할 수 있어요.', '아직 열어 보지 않은 삽화는 인터넷 연결이 필요할 수 있어요. 설정에 새 버전 적용 버튼이 나타나면 기록을 저장하고 업데이트할 수 있어요.'],
    tip: '처음부터 오프라인이면 앱이 준비되지 않았을 수 있어요. 먼저 온라인으로 열어 주세요.', keywords: ['오프라인', '업데이트', '와이파이', '설치'],
  },
];

export const RULEBOOK_SECTIONS: RulebookSection[] = ['시작하기', '음과 간격', '화음 레시피', '도전과 학습', '설정과 기록'];
