import type { CSSProperties } from 'react';

const ASSET = '/assets/';

/** The supplied atlases stay unchanged; a CSS window selects each sprite. */
function Atlas({ file, width, height, rect, className = '' }: {
  file: string; width: number; height: number;
  rect: [number, number, number, number]; className?: string;
}) {
  const [x, y, w, h] = rect;
  return <span className={`asset-sprite ${className}`} aria-hidden="true"
    style={{ aspectRatio: `${w} / ${h}` }}>
    <img src={`${ASSET}${file}`} alt="" draggable="false" loading="lazy"
      style={{ width: `${width / w * 100}%`, height: `${height / h * 100}%`, left: `${-x / w * 100}%`, top: `${-y / h * 100}%` }} />
  </span>;
}

export function Chef({ pose = 'welcome' }: { pose?: 'welcome' | 'point' | 'success' | 'hint' }) {
  const index = { welcome: 0, point: 1, success: 2, hint: 3 }[pose];
  return <Atlas file="chef.png" width={1312} height={1199}
    rect={[(index % 2) * 656, Math.floor(index / 2) * 599.5, 656, 599.5]}
    className={`chef chef-${pose}`} />;
}

export function Token({ midi, label, slot = 0, active = false }: {
  midi?: number | null; label: string; slot?: number; active?: boolean;
}) {
  // Preserve the reference's C=red, E=gold, G=teal and E-flat=berry palette.
  const palette = [0, 4, 5, 3, 1, 6, 7, 2, 8, 9, 10, 11];
  const index = midi == null ? [0, 1, 2][slot % 3] : palette[((midi % 12) + 12) % 12];
  const style = {
    '--token-x': `${(index % 4) / 3 * 100}%`,
    '--token-y': `${Math.floor(index / 4) / 2 * 100}%`,
  } as CSSProperties;
  return <span className={`token${active ? ' token-active' : ''}${midi == null ? ' token-empty' : ''}`} style={style}>
    <span className="token-art" aria-hidden="true" />
    <span className="token-label">{label}</span>
  </span>;
}

const RECTS: Record<string, { file: string; rect: [number, number, number, number] }> = {
  plaque: { file: 'ui.png', rect: [439, 0, 1097, 210] },
  order: { file: 'ui.png', rect: [482, 354, 338, 418] },
  book: { file: 'ui.png', rect: [826, 342, 710, 428] },
  plate: { file: 'ui.png', rect: [0, 776, 449, 248] },
  board: { file: 'props.png', rect: [951, 60, 585, 237] },
  bell: { file: 'props.png', rect: [387, 731, 252, 248] },
  jar: { file: 'props.png', rect: [0, 706, 229, 318] },
};

export function Sprite({ kind }: { kind: 'book' | 'order' | 'plate' | 'board' | 'bell' | 'plaque' | 'jar' }) {
  const { file, rect } = RECTS[kind];
  return <Atlas file={file} width={1536} height={1024} rect={rect} className={`sprite-${kind}`} />;
}
