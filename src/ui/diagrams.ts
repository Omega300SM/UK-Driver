import type { DiagramId } from '../content/schema';
import { maggieSvg } from '../instructor/maggie';

/** Simple, original teaching diagrams as inline SVG. */
export function diagram(id: DiagramId): string {
  switch (id) {
    case 'dsssm':
      return dsssm();
    case 'pedals':
      return pedals();
    case 'mirrors':
    case 'msm':
      return msm();
    default:
      return `<div style="display:grid;place-items:center;gap:8px">${maggieSvg('proud', 150)}<b>Maggie Hale</b><small class="muted">Ex-DVSA examiner · 31 years</small></div>`;
  }
}

function dsssm(): string {
  const items = [
    ['D', 'Doors', '#2f8a5f'],
    ['S', 'Seat', '#2e5c8a'],
    ['S', 'Steering', '#7a4f9a'],
    ['S', 'Seat belt', '#c8102e'],
    ['M', 'Mirrors', '#d9a22e']
  ];
  return `<svg viewBox="0 0 340 150" role="img" aria-label="Cockpit drill: Doors, Seat, Steering, Seat belt, Mirrors">
    ${items
      .map(
        ([l, w, c], i) => `<g transform="translate(${10 + i * 66},18)">
        <rect width="58" height="70" rx="14" fill="${c}"/>
        <text x="29" y="50" text-anchor="middle" font-size="40" font-weight="900" fill="#fff" font-family="system-ui">${l}</text>
        <text x="29" y="98" text-anchor="middle" font-size="12.5" font-weight="800" fill="#1d2327" font-family="system-ui">${w}</text></g>`
      )
      .join('')}
    <text x="170" y="142" text-anchor="middle" font-size="12" fill="#4a5157" font-family="system-ui">Every time you get in. Rules 97 and 99.</text>
  </svg>`;
}

function pedals(): string {
  return `<svg viewBox="0 0 320 170" role="img" aria-label="Automatic car: brake pedal in the middle, accelerator on the right; gear selector P R D">
    <rect x="10" y="10" width="190" height="150" rx="16" fill="#2b3238"/>
    <rect x="40" y="60" width="70" height="60" rx="10" fill="#4a5157" stroke="#ffd23f" stroke-width="3"/>
    <text x="75" y="96" text-anchor="middle" fill="#fff" font-weight="900" font-size="15" font-family="system-ui">BRAKE</text>
    <rect x="130" y="40" width="44" height="90" rx="10" fill="#4a5157"/>
    <text x="152" y="90" text-anchor="middle" fill="#fff" font-weight="900" font-size="11" font-family="system-ui" transform="rotate(-90 152 90)">ACCELERATOR</text>
    <text x="105" y="152" text-anchor="middle" fill="#cfd5d1" font-size="11" font-family="system-ui">Right foot only</text>
    <g transform="translate(220,20)">
      <rect width="88" height="130" rx="14" fill="#fffdf8" stroke="#e3dccd" stroke-width="2"/>
      ${['P', 'R', 'N', 'D']
        .map(
          (g, i) =>
            `<text x="44" y="${32 + i * 28}" text-anchor="middle" font-size="22" font-weight="900" font-family="system-ui" fill="${g === 'D' ? '#1f6f4a' : '#1d2327'}">${g}</text>`
        )
        .join('')}
    </g>
  </svg>`;
}

function msm(): string {
  return `<svg viewBox="0 0 340 170" role="img" aria-label="Mirrors, signal, manoeuvre, with the blind spot shown over the right shoulder">
    <rect x="0" y="0" width="340" height="170" fill="#78a656" rx="12"/>
    <rect x="0" y="50" width="340" height="70" fill="#50545a"/>
    <rect x="0" y="40" width="340" height="10" fill="#b9b5aa"/>
    <path d="M150 105 L40 70 L40 140 Z" fill="#cfe4f0" opacity="0.55"/>
    <path d="M150 85 L40 52 L40 82 Z" fill="#cfe4f0" opacity="0.55"/>
    <path d="M140 92 L95 60 L120 52 Z" fill="#c8102e" opacity="0.45"/>
    <text x="96" y="47" font-size="11" font-weight="900" fill="#fff" font-family="system-ui">BLIND SPOT</text>
    <g transform="translate(150,72)">
      <rect width="62" height="30" rx="7" fill="#2f8a5f"/>
      <rect x="18" y="4" width="26" height="22" rx="3" fill="#9fc3d6"/>
      <rect x="58" y="2" width="5" height="6" fill="#f2a71b"/>
    </g>
    <path d="M220 87 Q260 87 290 70" stroke="#ffd23f" stroke-width="4" fill="none" stroke-dasharray="8 6"/>
    <g font-family="system-ui" font-weight="900" font-size="15" fill="#fff">
      <rect x="10" y="132" width="320" height="30" rx="10" fill="#1d2327" opacity="0.8"/>
      <text x="22" y="153">1 Mirrors</text><text x="104" y="153">2 Look round</text><text x="208" y="153">3 Signal</text><text x="270" y="153">4 Go</text>
    </g>
  </svg>`;
}

/**
 * Stylised England outline (original, simplified), viewBox 0 0 200 270.
 * Rough coastline only: not a map for navigation.
 */
export const ENGLAND_PATH =
  'M112 8 L124 14 L130 30 L134 50 L140 62 L148 80 L156 100 L158 116 L166 130 L170 142 L162 150 L176 148 L190 156 L196 170 L192 186 L182 196 L190 202 L198 214 L188 226 L170 230 L150 232 L128 236 L104 238 L86 242 L70 246 L54 248 L36 256 L18 264 L14 256 L30 244 L46 232 L60 220 L74 210 L82 200 L86 190 L80 176 L78 160 L80 146 L74 132 L70 116 L76 100 L72 86 L64 70 L68 54 L80 44 L88 34 L100 24 Z';
