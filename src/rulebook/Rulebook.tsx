import { useEffect, useRef, useState } from 'react';
import type { Quality } from '../music';
import type { PlaybackResult } from '../audio';
import { RULEBOOK_PAGES, RULEBOOK_SECTIONS, type RulePage } from './content';
import './rulebook.css';

export interface RulebookProps {
  index: number;
  onIndex: (index: number) => void;
  onDemo: (legacyIndex: number) => void;
  onImage: (page: 1 | 2) => void;
  onPlay: (quality: Quality, root: string) => Promise<PlaybackResult>;
}

/** A navigable, illustrated manual. Its index lives with the host so demo return keeps context. */
export function Rulebook({ index, onIndex, onDemo, onImage, onPlay }: RulebookProps) {
  const [query, setQuery] = useState('');
  const [zoom, setZoom] = useState<RulePage | null>(null);
  const [soundStatus, setSoundStatus] = useState('');
  const soundRequest = useRef(0);
  const [brokenImages, setBrokenImages] = useState<string[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const zoomCloseRef = useRef<HTMLButtonElement>(null);
  const zoomOriginRef = useRef<HTMLElement | null>(null);
  const safeIndex = Math.min(Math.max(Number.isInteger(index) ? index : 0, 0), RULEBOOK_PAGES.length - 1);
  const page = RULEBOOK_PAGES[safeIndex];
  const term = query.trim().toLocaleLowerCase('ko-KR');
  const matches = RULEBOOK_PAGES.map((item, pageIndex) => ({ item, pageIndex })).filter(({ item }) =>
    !term || [item.title, item.subtitle, item.section, ...item.paragraphs, ...(item.keywords ?? [])].join(' ').toLocaleLowerCase('ko-KR').includes(term)
  );

  useEffect(() => {
    if (zoom) zoomCloseRef.current?.focus();
  }, [zoom]);

  const goTo = (next: number) => {
    soundRequest.current += 1;
    setSoundStatus('');
    onIndex(Math.max(0, Math.min(RULEBOOK_PAGES.length - 1, next)));
    requestAnimationFrame(() => headingRef.current?.focus());
  };
  const openZoom = (item: RulePage) => {
    zoomOriginRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setZoom(item);
  };
  const closeZoom = () => {
    setZoom(null);
    requestAnimationFrame(() => zoomOriginRef.current?.focus());
  };
  const markBroken = (image: string) => setBrokenImages(prev => prev.includes(image) ? prev : [...prev, image]);
  const playExample = async (quality: Quality, root: string) => {
    const request = ++soundRequest.current;
    setSoundStatus('소리를 재생하고 있어요.');
    try {
      const result = await onPlay(quality, root);
      if (request !== soundRequest.current) return;
      setSoundStatus(result.status === 'completed' ? '재생을 마쳤어요.' : result.status === 'cancelled' ? '재생이 중지됐어요.' : '소리를 재생하지 못했어요. 설정에서 소리와 음량을 확인해 주세요.');
    } catch {
      if (request === soundRequest.current) setSoundStatus('소리를 재생하지 못했어요. 설정에서 소리와 음량을 확인해 주세요.');
    }
  };

  return (
    <div className="rb-manual">
      <div className="rb-content" aria-hidden={zoom ? true : undefined}>
        <div className="rb-intro">
          <span className="rb-kicker">CHORD RECIPE GUIDE</span>
          <h3>소리로 배우는 코드 요리</h3>
          <p>그림으로 보고, 소리로 듣고, 직접 만들어 보세요.</p>
          <span className="rb-count">삽화 {new Set(RULEBOOK_PAGES.map(item => item.image)).size}종 · {RULEBOOK_PAGES.length}개 이야기</span>
        </div>
        <label className="rb-search">
          <span>룰북 검색</span>
          <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="예: 장3화음, 수리, 옥타브" />
        </label>
        <div className="rb-layout">
          <nav className="rb-toc" aria-label="룰북 목차">
            {RULEBOOK_SECTIONS.map(section => {
              const pages = matches.filter(({ item }) => item.section === section);
              if (!pages.length) return null;
              return <div className="rb-toc-group" key={section}>
                <p>{section}</p>
                {pages.map(({ item, pageIndex }) => <button type="button" key={item.id} className="rb-toc-button" aria-current={pageIndex === safeIndex ? 'page' : undefined} onClick={() => goTo(pageIndex)}>
                  <span className="rb-toc-number">{String(pageIndex + 1).padStart(2, '0')}</span><span>{item.title}</span>
                </button>)}
              </div>;
            })}
            {matches.length === 0 && <p className="rb-no-results" role="status">검색 결과가 없어요. 다른 단어로 찾아보세요.</p>}
          </nav>
          <article className="rb-page" aria-labelledby="rb-page-title">
            <div className="rb-page-meta"><span>{page.section}</span><span>{safeIndex + 1} / {RULEBOOK_PAGES.length}</span></div>
            <h3 id="rb-page-title" tabIndex={-1} ref={headingRef}>{page.title}</h3>
            <p className="rb-subtitle">{page.subtitle}</p>
            <figure className="rb-figure">
              {brokenImages.includes(page.image) ? <p className="rb-image-error">그림을 불러오지 못했어요. 아래의 설명을 읽거나 인터넷 연결을 확인해 주세요.</p> :
                <button type="button" className="rb-image-button" onClick={() => openZoom(page)} aria-label={`삽화 확대: ${page.alt}`}>
                  <img src={`/assets/rulebook/${page.image}.svg`} alt={page.alt} loading="lazy" onError={() => markBroken(page.image)} />
                  <span className="rb-zoom-label" aria-hidden="true">확대 ↗</span>
                </button>}
              <figcaption>{page.alt}</figcaption>
            </figure>
            <div className="rb-copy">{page.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div>
            {page.formula && <p className="rb-formula">{page.formula}</p>}
            {page.steps && <div className="rb-steps"><h4>이렇게 해 보세요</h4><ol>{page.steps.map(step => <li key={step}>{step}</li>)}</ol></div>}
            {page.tip && <aside className="rb-tip"><strong>주방장 한마디</strong><p>{page.tip}</p></aside>}
            {(page.demoIndex !== undefined || page.originalGuide || page.audio?.length) && <div className="rb-actions" aria-label="이 페이지 활동">
              {page.demoIndex !== undefined && <button type="button" className="primary" onClick={() => onDemo(page.demoIndex!)}>직접 해보기</button>}
              {page.audio?.map(sound => <button type="button" key={sound.quality + sound.root} onClick={() => void playExample(sound.quality, sound.root)}>{sound.label}</button>)}
              {page.originalGuide && <button type="button" onClick={() => onImage(page.originalGuide!)}>기존 설명 그림 전체 보기</button>}
            </div>}
            {page.audio?.length ? <p className="rb-sound-status" role="status" aria-live="polite">{soundStatus}</p> : null}
            <div className="rb-page-nav" aria-label="룰북 페이지 이동">
              <button type="button" disabled={safeIndex === 0} onClick={() => goTo(safeIndex - 1)}>← 이전</button>
              <span>{safeIndex + 1} / {RULEBOOK_PAGES.length}</span>
              <button type="button" disabled={safeIndex === RULEBOOK_PAGES.length - 1} onClick={() => goTo(safeIndex + 1)}>다음 →</button>
            </div>
          </article>
        </div>
      </div>
      {zoom && <div className="rb-zoom-backdrop" onClick={event => { if (event.target === event.currentTarget) closeZoom(); }} onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeZoom(); }
        if (event.key === 'Tab') { event.preventDefault(); event.stopPropagation(); zoomCloseRef.current?.focus(); }
      }}>
        <div className="rb-zoom-dialog" role="dialog" aria-modal="true" aria-labelledby="rb-zoom-title">
          <div className="rb-zoom-header"><h3 id="rb-zoom-title">{zoom.title} · 그림 확대</h3><button type="button" ref={zoomCloseRef} onClick={closeZoom} aria-label="확대 그림 닫기">닫기 ✕</button></div>
          <img src={`/assets/rulebook/${zoom.image}.svg`} alt={zoom.alt} />
          <p>{zoom.alt}</p>
        </div>
      </div>}
    </div>
  );
}
