import type { SignKind, RoundaboutMap } from './layout';

/**
 * Original procedural road signs as SVG. They follow UK conventions from the
 * Highway Code's "Traffic signs" section (circles give orders, red circles
 * mostly prohibit, triangles warn, rectangles inform) without copying any
 * artwork. Used for quizzes and briefings (inline) and for 3D sign textures.
 */
const RED = '#d4202b';
const FONT = 'Arial, Helvetica, sans-serif';
let clipId = 0;

export interface SignSpec {
  kind: SignKind;
  value?: number;
  text?: string;
  map?: RoundaboutMap;
}

/** Width/height ratio of each sign's artwork. */
export function signAspect(kind: SignKind): number {
  if (kind === 'zone20' || kind === 'zone20-end') return 0.8;
  if (kind === 'camera') return 0.8;
  if (kind === 'name') return 3.6;
  if (kind === 'roundabout-map') return 1.4;
  if (kind === 'warn-giveway-ahead') return 0.86;
  if (kind === 'bus-lane') return 0.8;
  if (kind === 'passing-place') return 1.7;
  if (kind === 'direction') return 2.4;
  if (kind === 'countdown') return 0.42;
  if (kind === 'motorway' || kind === 'motorway-end') return 1;
  if (kind === 'emergency-area') return 0.8;
  return 1;
}

export function signSvg(spec: SignSpec, size = 100, label?: string): string {
  const { kind } = spec;
  const ar = signAspect(kind);
  const vbW = 100 * ar;
  const w = size * ar;
  const inner = body(spec);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} 100" width="${w}" height="${size}" role="img" aria-label="${esc(label ?? signName(spec))}">${inner}</svg>`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function roundel(cx: number, cy: number, r: number, text: string, fs: number): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${RED}"/><circle cx="${cx}" cy="${cy}" r="${r * 0.77}" fill="#fff"/>
  <text x="${cx}" y="${cy + fs * 0.36}" font-family="${FONT}" font-weight="700" font-size="${fs}" text-anchor="middle" fill="#111">${text}</text>`;
}

function triangle(inner: string, inverted = false): string {
  const pts = inverted ? '4,8 96,8 50,94' : '50,5 96,90 4,90';
  const ptsIn = inverted ? '17,16 83,16 50,74' : '50,22 82,80 18,80';
  return `<polygon points="${pts}" fill="${RED}" stroke="${RED}" stroke-width="5" stroke-linejoin="round"/>
  <polygon points="${ptsIn}" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>${inner}`;
}

function body(spec: SignSpec): string {
  switch (spec.kind) {
    case 'limit':
      return roundel(50, 50, 48, String(spec.value ?? 30), 42);
    case 'nsl':
    {
      // Unique clip id: several NSL signs can share one page.
      const id = `nslc${++clipId}`;
      return `<circle cx="50" cy="50" r="47" fill="#fff" stroke="#222" stroke-width="2"/>
        <clipPath id="${id}"><circle cx="50" cy="50" r="46"/></clipPath>
        <rect x="-20" y="38" width="140" height="24" fill="#111" transform="rotate(-45 50 50)" clip-path="url(#${id})"/>`;
    }
    case 'zone20':
    case 'zone20-end': {
      const end = spec.kind === 'zone20-end';
      return `<rect x="2" y="2" width="76" height="96" rx="6" fill="#fff" stroke="#222" stroke-width="3"/>
        ${roundel(40, 38, 28, '20', 26)}
        <text x="40" y="${end ? 80 : 86}" font-family="${FONT}" font-weight="700" font-size="${end ? 15 : 18}" text-anchor="middle" fill="#111">${end ? 'ZONE' : 'ZONE'}</text>
        ${end ? `<text x="40" y="94" font-family="${FONT}" font-weight="700" font-size="11" text-anchor="middle" fill="#111">END</text><rect x="0" y="34" width="80" height="8" fill="#111" opacity="0.75" transform="rotate(-35 40 40)"/>` : ''}`;
    }
    case 'giveway':
      return triangle(
        `<text x="50" y="38" font-family="${FONT}" font-weight="700" font-size="15" text-anchor="middle" fill="#111">GIVE</text>
         <text x="50" y="55" font-family="${FONT}" font-weight="700" font-size="15" text-anchor="middle" fill="#111">WAY</text>`,
        true
      );
    case 'stop':
      return `<polygon points="30,3 70,3 97,30 97,70 70,97 30,97 3,70 3,30" fill="${RED}" stroke="#fff" stroke-width="4"/>
        <text x="50" y="61" font-family="${FONT}" font-weight="700" font-size="30" text-anchor="middle" fill="#fff">STOP</text>`;
    case 'no-entry':
      return `<circle cx="50" cy="50" r="48" fill="${RED}"/><rect x="16" y="41" width="68" height="18" fill="#fff"/>`;
    case 'warn-tjunction':
      return triangle(`<rect x="45" y="45" width="10" height="30" fill="#111"/><rect x="30" y="40" width="40" height="8" fill="#111"/>`);
    case 'warn-narrows':
      return triangle(`<path d="M38 78 L42 58 L42 40 M62 78 L58 58 L58 40" stroke="#111" stroke-width="6" fill="none"/>`);
    case 'warn-giveway-ahead':
      return `<g transform="scale(0.86 0.78)">${triangle(`<polygon points="36,48 64,48 50,72" fill="#fff" stroke="${RED}" stroke-width="5"/>`)}</g>
        <rect x="8" y="76" width="70" height="22" rx="3" fill="#fff" stroke="#222" stroke-width="2"/>
        <text x="43" y="93" font-family="${FONT}" font-weight="700" font-size="15" text-anchor="middle" fill="#111">50 yds</text>`;
    case 'camera':
      return `<rect x="2" y="2" width="76" height="96" rx="6" fill="#fff" stroke="#222" stroke-width="3"/>
        <rect x="16" y="40" width="40" height="24" rx="3" fill="#111"/><polygon points="56,46 66,40 66,64 56,58" fill="#111"/>
        <circle cx="30" cy="52" r="6" fill="#fff"/><rect x="34" y="64" width="6" height="18" fill="#111"/>`;
    case 'no-waiting':
      return `<circle cx="50" cy="50" r="47" fill="${RED}"/><circle cx="50" cy="50" r="37" fill="#1d4f9c"/>
        <rect x="10" y="44" width="80" height="12" fill="${RED}" transform="rotate(45 50 50)"/>`;
    case 'warn-roundabout': {
      // Three arrows chasing each other clockwise (seen from above), as on the UK sign.
      const arrows = [0, 120, 240]
        .map((a) => `<g transform="rotate(${a} 50 60)"><path d="M50 44 A16 16 0 0 1 64 52" stroke="#111" stroke-width="6" fill="none"/><polygon points="62,44 71,55 58,57" fill="#111"/></g>`)
        .join('');
      return triangle(arrows);
    }
    case 'mini-roundabout': {
      const arrows = [0, 120, 240]
        .map((a) => `<g transform="rotate(${a} 50 50)"><path d="M50 22 A28 28 0 0 1 74 36" stroke="#fff" stroke-width="8" fill="none"/><polygon points="70,26 84,42 64,44" fill="#fff"/></g>`)
        .join('');
      return `<circle cx="50" cy="50" r="48" fill="#1d4f9c"/>${arrows}`;
    }
    case 'roundabout-map': {
      // Local direction sign: white with a black border, the roundabout as a ring,
      // and each exit with its destination. You approach from the bottom.
      const exits = spec.map?.exits ?? [];
      const cx = 70;
      const cy = 52;
      const arms = exits
        .map((e) => {
          const a = ((e.rel - 90) * Math.PI) / 180; // 0° = up on the sign
          const x2 = cx + Math.cos(a) * 32;
          const y2 = cy + Math.sin(a) * 32;
          const lx = cx + Math.cos(a) * 44;
          const ly = cy + Math.sin(a) * 38;
          const anchor = Math.abs(e.rel) < 20 ? 'middle' : e.rel < 0 ? 'end' : 'start';
          return `<line x1="${cx + Math.cos(a) * 11}" y1="${cy + Math.sin(a) * 11}" x2="${x2}" y2="${y2}" stroke="#111" stroke-width="7"/>
            <text x="${Math.abs(e.rel) < 20 ? lx : lx + (e.rel < 0 ? -2 : 2)}" y="${Math.abs(e.rel) < 20 ? ly - 2 : ly + 4}" font-family="${FONT}" font-weight="700" font-size="10" text-anchor="${anchor}" fill="#111">${esc(e.label)}</text>`;
        })
        .join('');
      return `<rect x="2" y="2" width="136" height="96" rx="6" fill="#fff" stroke="#111" stroke-width="3"/>
        <line x1="${cx}" y1="96" x2="${cx}" y2="${cy + 11}" stroke="#111" stroke-width="7"/>
        <circle cx="${cx}" cy="${cy}" r="10" fill="none" stroke="#111" stroke-width="6"/>${arms}`;
    }
    case 'warn-bend':
      // Road bends to the right (sharp bend warning).
      return triangle(`<path d="M44 80 L44 58 Q44 46 56 46 L60 46" stroke="#111" stroke-width="7" fill="none"/><polygon points="58,38 70,46 58,54" fill="#111"/>`);
    case 'dual-ahead':
      // Dual carriageway ahead: two arrows either side of a central reserve.
      return triangle(`<path d="M40 80 L40 46 M60 80 L60 46" stroke="#111" stroke-width="7"/><polygon points="33,50 40,38 47,50" fill="#111"/><polygon points="53,50 60,38 67,50" fill="#111"/><rect x="48" y="56" width="4" height="24" fill="#111"/>`);
    case 'passing-place':
      return `<rect x="3" y="12" width="164" height="76" rx="5" fill="#fff" stroke="#111" stroke-width="4"/>
        <text x="85" y="46" font-family="${FONT}" font-weight="700" font-size="26" text-anchor="middle" fill="#111">Passing</text>
        <text x="85" y="76" font-family="${FONT}" font-weight="700" font-size="26" text-anchor="middle" fill="#111">place</text>`;
    case 'motorway':
    case 'motorway-end': {
      // Motorway symbol: carriageways meeting under a bridge.
      const end = spec.kind === 'motorway-end';
      return `<rect x="2" y="2" width="96" height="96" rx="8" fill="#1d4f9c" stroke="#fff" stroke-width="3"/>
        <rect x="14" y="26" width="72" height="9" fill="#fff"/>
        <path d="M24 86 L42 40 M76 86 L58 40" stroke="#fff" stroke-width="7" fill="none"/>
        <path d="M50 86 L50 74 M50 64 L50 54" stroke="#fff" stroke-width="4"/>
        ${end ? `<line x1="12" y1="88" x2="88" y2="12" stroke="${RED}" stroke-width="9"/>` : ''}`;
    }
    case 'countdown': {
      // Blue board with 1–3 diagonal white bars (300, 200, 100 yards to the exit).
      const n = Math.max(1, Math.min(3, spec.value ?? 3));
      let bars = '';
      for (let i = 0; i < n; i++) bars += `<polygon points="6,${74 - i * 26} 36,${54 - i * 26} 36,${66 - i * 26} 6,${86 - i * 26}" fill="#fff"/>`;
      return `<rect x="1" y="1" width="40" height="98" fill="#1d4f9c" stroke="#fff" stroke-width="2"/>${bars}`;
    }
    case 'direction': {
      // Direction board: blue on motorways (value 1), green on primary roads (value 2), white elsewhere.
      const fill = spec.value === 1 ? '#1d4f9c' : spec.value === 2 ? '#15623e' : '#fff';
      const ink = spec.value === 1 || spec.value === 2 ? '#fff' : '#111';
      const lines = (spec.text ?? '').split('|');
      return `<rect x="3" y="3" width="234" height="94" rx="6" fill="${fill}" stroke="${ink}" stroke-width="4"/>
        ${lines.map((l, i) => `<text x="120" y="${(lines.length === 1 ? 62 : 44 + i * 34)}" font-family="${FONT}" font-weight="700" font-size="${lines.length === 1 ? 34 : 28}" text-anchor="middle" fill="${spec.value === 2 && i === 0 ? '#ffd23f' : ink}">${esc(l)}</text>`).join('')}`;
    }
    case 'emergency-area':
      return `<rect x="2" y="2" width="76" height="96" rx="6" fill="#1d4f9c" stroke="#fff" stroke-width="3"/>
        <rect x="18" y="14" width="44" height="40" rx="5" fill="#f28c1b"/>
        <path d="M30 26 Q40 18 50 26 L48 30 L44 28 L44 42 L36 42 L36 28 L32 30 Z" fill="#fff"/>
        <text x="40" y="74" font-family="${FONT}" font-weight="700" font-size="11" text-anchor="middle" fill="#fff">Emergency</text>
        <text x="40" y="88" font-family="${FONT}" font-weight="700" font-size="11" text-anchor="middle" fill="#fff">area</text>`;
    case 'warn-school':
      // Two children walking.
      return triangle(`<circle cx="42" cy="40" r="5" fill="#111"/><circle cx="60" cy="44" r="4.2" fill="#111"/>
        <path d="M42 46 L40 62 L34 76 M40 62 L46 76 M42 50 L50 56 M58 49 L57 63 L52 76 M57 63 L62 76 M58 52 L51 56" stroke="#111" stroke-width="4.5" stroke-linecap="round" fill="none"/>`);
    case 'warn-signals':
      return triangle(`<rect x="41" y="34" width="18" height="44" rx="4" fill="#111"/>
        <circle cx="50" cy="43" r="5.5" fill="${RED}"/><circle cx="50" cy="56" r="5.5" fill="#f2b705"/><circle cx="50" cy="69" r="5.5" fill="#1f9d55"/>`);
    case 'warn-pedestrians':
      // A person walking across a striped crossing.
      return triangle(`<circle cx="52" cy="38" r="5" fill="#111"/>
        <path d="M51 44 L47 60 M50 50 L58 56 M50 50 L42 54 M47 60 L54 72 M47 60 L40 70" stroke="#111" stroke-width="5" stroke-linecap="round" fill="none"/>
        <rect x="26" y="74" width="48" height="4" fill="#111"/>`);
    case 'bus-lane':
      return `<rect x="2" y="2" width="76" height="96" rx="6" fill="#1d4f9c" stroke="#fff" stroke-width="3"/>
        <rect x="14" y="20" width="40" height="26" rx="4" fill="#fff"/><rect x="18" y="24" width="10" height="9" fill="#1d4f9c"/><rect x="31" y="24" width="10" height="9" fill="#1d4f9c"/><rect x="44" y="24" width="7" height="9" fill="#1d4f9c"/>
        <circle cx="23" cy="48" r="4" fill="#fff"/><circle cx="45" cy="48" r="4" fill="#fff"/>
        <path d="M64 50 L64 20 M58 28 L64 18 L70 28" stroke="#fff" stroke-width="4" fill="none"/>
        <text x="40" y="70" font-family="${FONT}" font-weight="700" font-size="13" text-anchor="middle" fill="#fff">BUS LANE</text>
        <text x="40" y="88" font-family="${FONT}" font-weight="700" font-size="10" text-anchor="middle" fill="#fff">${esc(spec.text ?? 'At any time')}</text>`;
    case 'name':
      return `<rect x="3" y="12" width="354" height="76" rx="6" fill="#fff" stroke="#111" stroke-width="5"/>
        <text x="180" y="64" font-family="${FONT}" font-weight="700" font-size="40" text-anchor="middle" fill="#111">${esc(spec.text ?? '')}</text>`;
  }
}

export function signName(spec: SignSpec): string {
  switch (spec.kind) {
    case 'limit':
      return `Maximum speed ${spec.value} mph`;
    case 'nsl':
      return 'National speed limit applies';
    case 'zone20':
      return 'Entry to 20 mph zone';
    case 'zone20-end':
      return 'End of 20 mph zone';
    case 'giveway':
      return 'Give way to traffic on major road';
    case 'stop':
      return 'Stop and give way';
    case 'no-entry':
      return 'No entry for vehicular traffic';
    case 'warn-tjunction':
      return 'T-junction ahead';
    case 'warn-narrows':
      return 'Road narrows on both sides';
    case 'warn-giveway-ahead':
      return 'Distance to Give Way line ahead';
    case 'camera':
      return 'Speed cameras in use';
    case 'no-waiting':
      return 'No waiting';
    case 'warn-roundabout':
      return 'Roundabout ahead';
    case 'mini-roundabout':
      return 'Mini-roundabout (give way to traffic from the immediate right)';
    case 'roundabout-map':
      return 'Advance direction sign for a roundabout';
    case 'warn-signals':
      return 'Traffic signals ahead';
    case 'warn-school':
      return 'Children going to or from school';
    case 'warn-bend':
      return 'Bend to the right ahead';
    case 'dual-ahead':
      return 'Dual carriageway ahead';
    case 'passing-place':
      return 'Passing place';
    case 'motorway':
      return 'Start of motorway regulations';
    case 'motorway-end':
      return 'End of motorway regulations';
    case 'countdown':
      return `Countdown marker: ${(spec.value ?? 3) * 100} yards to the exit`;
    case 'direction':
      return (spec.text ?? 'Direction sign').replace(/\|/g, ', ');
    case 'emergency-area':
      return 'Emergency area ahead (SOS telephone)';
    case 'warn-pedestrians':
      return 'Pedestrian crossing ahead';
    case 'bus-lane':
      return 'Bus lane ahead (times shown)';
    case 'name':
      return spec.text ?? 'Street name';
  }
}
