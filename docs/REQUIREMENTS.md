# 원문 요구사항 추적

기준: 사용자와 작성한 「코드 레시피 키친 바이브코딩 프롬프트북 v1.0」. 날짜: 2026-11-12.

이 표는 실제 구현 위치를 기록합니다. 구현 파일이 있다는 사실과 브라우저·실기기 검수가 통과했다는 사실은 구분합니다. 최종 검수 상태는 `QA_REPORT.md`에 추가합니다.

| 요구 | 원문 내용 | 구현 위치 | 현재 확인/후속 검수 |
|---|---|---|---|
| REQ-01 | 근음에서 기본위치 3화음 쌓기 | `src/music.ts`, `src/game.ts` | 독립 음악 기대값 테스트 통과; 전체 UI 완료 경로 검수 대기 |
| REQ-02 | 인접 간격과 근음 기준 간격 분리 | `src/music.ts`, `src/App.tsx` | 두 종류를 별도 UI로 표시; 모바일 표시 검수 대기 |
| REQ-03 | E♭ 등 올바른 철자 | `src/music.ts`, `src/game.ts`, `src/App.tsx` | 음문자+2/+4 생성, 이명동음·겹임시표 fixture 통과; 글리프 실화면 검수 대기 |
| REQ-04 | C 장3화음 첫 주문 | `src/game.ts`, `src/App.tsx` | 튜토리얼 입력 가드 구현; 사용자 입력 완주 검수 대기 |
| REQ-05 | E만 내려 C 단3화음, A/B 비교 | `src/game.ts`, `src/App.tsx`, `src/audio.ts` | C/G 고정·두 간격 변경 구현; 실제 비교 청취 대기 |
| REQ-06 | 건반·악보·구성음·소리 동기화 | `src/game.ts`, `src/App.tsx`, `src/audio.ts` | 같은 MIDI·표기 selector 사용; 화면 전환·연타 검수 대기 |
| REQ-07 | 자유 연습과 음 수정 | `src/game.ts`, `src/App.tsx` | 슬롯/반음/undo/스냅샷/레시피 펼치기 구현; 자유 조합과 전이 검수 대기 |
| REQ-08 | 주문과 점진적 힌트 | `src/lessons.ts`, `src/game.ts`, `src/App.tsx` | H0~H3, 24개 데이터 구현; 해금·도장 반복 검수 대기 |
| REQ-09 | 틀린 음만 수리 | `src/lessons.ts`, `src/game.ts`, `src/App.tsx` | 단일·두 음 수리, before 보존 구현; 수리 UI 검수 대기 |
| REQ-10 | 레시피북과 재접속 복원 | `src/storage.ts`, `src/App.tsx` | 스키마·저장·중복·백업 구현; 브라우저 재접속 검수 대기 |
| REQ-11 | D 전이, 감·증3화음 | `src/music.ts`, `src/lessons.ts`, `src/App.tsx` | D 장/단과 네 품질 고정 테스트 통과; 전체 미션 완주 대기 |
| REQ-12 | 느낌을 정답으로 판정하지 않음 | `src/lessons.ts`, `src/App.tsx` | 24개 구조 질문은 구성음·간격을 채점; 감정 판정 없음 |
| REQ-13 | 7화음은 후속 학습 | 기본 버전에서 제외 | X01을 별도 범위로 보존; 3화음 3슬롯에 혼합하지 않음 |
| REQ-14 | 따뜻한 주방과 단계별 설명 삽화 | `src/visual.tsx`, `src/styles.css`, `src/App.tsx`, `public/assets/` | 5개 생성 원본+2개 제공 삽화 바이트 동일 확인; 12장면·데모·확대 검수 대기 |

## 구현 제안으로 추가된 기능

24미션, 세로 반응형 화면, 큰 대체 음 버튼, 학습 도장, 상단 룰북, JSON 백업, service worker는 원문의 음악 학습 흐름을 제품으로 구체화한 프롬프트북의 제안입니다. 미션별 음악 기대값은 원문 이론에서 도출한 독립 fixture로 확인합니다.

## 제외 범위

X01 7화음, X02 교실용 모드, 전위·임의 보이싱 정답, 서버·계정·결제·랭킹·마이크 분석은 구현하지 않았습니다. 기존 음악 학습 범위의 완료 검수와 섞지 않습니다.

## 원문

- [게임 시나리오](https://docs.google.com/document/d/1YlVyNv_zrFZgOLYKkt1-YW3uNCvS_sWttPSpVUHB3kE/edit)
- [게임 설계](https://docs.google.com/document/d/1tVRIHBQinw31zty0yknL00gCPRPLFJ7ttOTQ7w2bZcI/edit)
- [프롬프트북 v1.0](https://chatgpt.com/library?file_id=libfile_19a4f6b394008191a4c783e17d35e7b0&account_id=personal)
