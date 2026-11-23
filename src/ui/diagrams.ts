import type { DiagramId } from '../content/schema';
import { maggieSvg } from '../instructor/maggie';
import { signSvg } from '../world/signSvg';

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
    case 'moveoff':
      return moveoff();
    case 'normal-stop':
      return normalStop();
    case 'road-position':
      return roadPosition();
    case 'meeting':
      return meeting();
    case 'speed-limits':
      return speedLimits();
    case 'sign-shapes':
      return signShapes();
    case 'road-lines':
      return roadLines();
    case 'yellow-lines':
      return yellowLines();
    case 'giveway-stop':
      return givewayStop();
    case 'emerging':
      return emerging();
    case 'turn-right':
      return turnRight();
    case 'boss':
      return bossMap();
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

// ---- Week 1 diagrams ------------------------------------------------------
const F = 'font-family="system-ui" font-weight="800"';
const road = (y = 50, h = 70) => `<rect x="0" y="${y}" width="340" height="${h}" fill="#50545a"/><rect x="0" y="${y - 8}" width="340" height="8" fill="#b9b5aa"/><rect x="0" y="${y + h}" width="340" height="8" fill="#b9b5aa"/>`;
const centre = (y: number) => Array.from({ length: 12 }, (_, i) => `<rect x="${i * 30}" y="${y - 1.5}" width="14" height="3" fill="#eee"/>`).join('');
const car = (x: number, y: number, c = '#2f8a5f', rot = 0) => `<g transform="translate(${x},${y}) rotate(${rot})"><rect x="-22" y="-11" width="44" height="22" rx="5" fill="${c}"/><rect x="-6" y="-9" width="16" height="18" rx="3" fill="#9fc3d6"/></g>`;
const svg = (body: string, label: string, h = 170) => `<svg viewBox="0 0 340 ${h}" role="img" aria-label="${label}"><rect width="340" height="${h}" rx="12" fill="#78a656"/>${body}</svg>`;

function moveoff(): string {
  return svg(
    `${road()}${centre(85)}${car(60, 102)}${car(150, 102, '#b8352f')}
    <path d="M85 100 Q120 72 190 68 L320 68" stroke="#ffd23f" stroke-width="4" fill="none" stroke-dasharray="8 6"/>
    <path d="M86 84 L40 60 L40 95 Z" fill="#cfe4f0" opacity="0.6"/>
    <text x="190" y="152" ${F} font-size="13" fill="#fff">Mirrors · look right · signal · go</text>`,
    'Moving off from behind a parked car: mirrors, blind spot, signal, then steer out with plenty of room'
  );
}

function normalStop(): string {
  return svg(
    `${road()}${centre(85)}${car(250, 104)}
    <path d="M40 68 Q150 70 220 102 L262 104" stroke="#ffd23f" stroke-width="4" fill="none" stroke-dasharray="8 6"/>
    <rect x="226" y="113" width="70" height="4" fill="#ffd23f"/>
    <text x="16" y="34" ${F} font-size="13" fill="#fff">Mirror · signal left · brake gently</text>
    <text x="196" y="150" ${F} font-size="12" fill="#fff">Close and parallel to the kerb</text>`,
    'A normal stop: mirror, signal left, brake gently and stop close and parallel to the kerb'
  );
}

function roadPosition(): string {
  return svg(
    `${road()}${centre(85)}${car(90, 103)}
    <rect x="160" y="108" width="44" height="12" fill="#3c3f44"/><rect x="214" y="108" width="44" height="12" fill="#d9a22e"/>
    <path d="M115 103 Q150 103 170 94 L250 94 Q275 94 300 103" stroke="#ffd23f" stroke-width="4" fill="none" stroke-dasharray="8 6"/>
    <text x="150" y="88" ${F} font-size="12" fill="#fff">a door’s width</text>
    <text x="14" y="36" ${F} font-size="13" fill="#fff">Keep left · about 1 m from the kerb</text>`,
    'Road position: keep left, about a metre from the kerb, and leave a door’s width when passing parked cars'
  );
}

function meeting(): string {
  return svg(
    `${road()}${centre(85)}${car(70, 103)}${car(270, 68, '#2e5c8a', 180)}
    <rect x="150" y="108" width="44" height="12" fill="#3c3f44"/><rect x="200" y="108" width="44" height="12" fill="#b8352f"/>
    <rect x="98" y="92" width="40" height="22" rx="6" fill="none" stroke="#ffd23f" stroke-width="3"/>
    <text x="16" y="36" ${F} font-size="13" fill="#fff">Parked cars on YOUR side → you wait (rule 163)</text>
    <text x="210" y="150" ${F} font-size="12" fill="#fff">Let them through first</text>`,
    'Meeting: when parked cars are on your side, give way to oncoming traffic'
  );
}

function speedLimits(): string {
  const item = (x: number, kind: 'limit' | 'nsl' | 'zone20', value: number | undefined, label: string, sub: string) =>
    `<g transform="translate(${x},16)">${signSvg({ kind, value }, 64).replace('<svg ', '<svg x="0" y="0" ')}<text x="32" y="88" ${F} font-size="12" text-anchor="middle" fill="#fff">${label}</text><text x="32" y="104" font-family="system-ui" font-size="10" text-anchor="middle" fill="#e8f3ec">${sub}</text></g>`;
  return `<svg viewBox="0 0 340 130" role="img" aria-label="Speed limits: 20 zone, 30 on lit roads, national speed limit 60 on single carriageways for cars"><rect width="340" height="130" rx="12" fill="#1f6f4a"/>
    ${item(20, 'zone20', undefined, '20 zone', 'set locally')}${item(110, 'limit', 30, '30 mph', 'street lights')}${item(200, 'nsl', undefined, 'National', '60 single c’way')}
    <g transform="translate(276,24)"><rect width="48" height="64" rx="6" fill="#fff"/><rect x="8" y="20" width="32" height="18" rx="3" fill="#111"/><circle cx="18" cy="29" r="4" fill="#fff"/></g>
    <text x="300" y="104" ${F} font-size="12" text-anchor="middle" fill="#fff">Cameras</text></svg>`;
}

function signShapes(): string {
  const g = (x: number, kind: 'limit' | 'giveway' | 'warn-tjunction' | 'name' | 'no-entry', value: number | undefined, label: string, w = 60) =>
    `<g transform="translate(${x},18)">${signSvg({ kind, value, text: 'Mill Lane' }, 56).replace('<svg ', `<svg x="${(w - 56 * (kind === 'name' ? 3.6 : 1)) / 2}" `)}<text x="${w / 2}" y="82" ${F} font-size="11" text-anchor="middle" fill="#fff">${label}</text></g>`;
  return `<svg viewBox="0 0 340 120" role="img" aria-label="Sign shapes: circles give orders, triangles warn, rectangles inform"><rect width="340" height="120" rx="12" fill="#1f6f4a"/>
    ${g(10, 'no-entry', undefined, 'Circles: orders')}${g(120, 'warn-tjunction', undefined, 'Triangles: warn')}
    <g transform="translate(220,30)"><rect width="104" height="32" rx="4" fill="#fff" stroke="#111" stroke-width="3"/><text x="52" y="22" font-family="Arial" font-weight="700" font-size="14" text-anchor="middle">Mill Lane</text><text x="52" y="70" ${F} font-size="11" text-anchor="middle" fill="#fff">Rectangles: inform</text></g></svg>`;
}

function roadLines(): string {
  return svg(
    `${road(30, 110)}
    ${Array.from({ length: 4 }, (_, i) => `<rect x="${10 + i * 26}" y="83" width="12" height="3" fill="#eee"/>`).join('')}
    ${Array.from({ length: 3 }, (_, i) => `<rect x="${118 + i * 26}" y="83" width="22" height="3" fill="#eee"/>`).join('')}
    <rect x="200" y="80" width="130" height="3" fill="#eee"/><rect x="200" y="87" width="130" height="3" fill="#eee"/>
    <text x="14" y="58" ${F} font-size="11" fill="#fff">Centre line</text><text x="116" y="58" ${F} font-size="11" fill="#fff">Hazard line</text>
    <text x="204" y="58" ${F} font-size="11" fill="#fff">Double white: solid = MUST NOT cross</text>
    <text x="204" y="125" ${F} font-size="11" fill="#fff">and MUST NOT stop (rules 129, 240)</text>`,
    'Road lines: broken centre line, longer hazard warning line, and solid double white lines you must not cross'
  );
}

function yellowLines(): string {
  return svg(
    `${road()}
    <rect x="10" y="114" width="140" height="2.5" fill="#f2c230"/><rect x="10" y="110" width="140" height="2.5" fill="#f2c230"/>
    <rect x="190" y="112" width="140" height="3" fill="#f2c230"/>
    <text x="16" y="146" ${F} font-size="12" fill="#fff">Double yellow: no waiting</text><text x="16" y="160" font-family="system-ui" font-size="11" fill="#e8f3ec">at any time</text>
    <text x="196" y="146" ${F} font-size="12" fill="#fff">Single yellow: check</text><text x="196" y="160" font-family="system-ui" font-size="11" fill="#e8f3ec">the plate for times</text>
    <text x="16" y="34" ${F} font-size="12" fill="#fff">Never within 10 m of a junction (rule 243)</text>`,
    'Yellow lines: double yellow means no waiting at any time; single yellow applies at the times on the plate'
  );
}

function givewayStop(): string {
  return `<svg viewBox="0 0 340 150" role="img" aria-label="Give way: broken double line, slow and give way. Stop: solid line, you must stop."><rect width="340" height="150" rx="12" fill="#78a656"/>
    <rect x="0" y="20" width="340" height="44" fill="#50545a"/>
    <rect x="40" y="64" width="80" height="86" fill="#50545a"/><rect x="220" y="64" width="80" height="86" fill="#50545a"/>
    ${Array.from({ length: 5 }, (_, i) => `<rect x="${42 + i * 8}" y="68" width="5" height="3" fill="#eee"/><rect x="${42 + i * 8}" y="74" width="5" height="3" fill="#eee"/>`).join('')}
    <rect x="222" y="68" width="38" height="6" fill="#eee"/>
    <g transform="translate(130,70)">${signSvg({ kind: 'giveway' }, 44).replace('<svg ', '<svg x="0" y="0" ')}</g>
    <g transform="translate(176,70)">${signSvg({ kind: 'stop' }, 40).replace('<svg ', '<svg x="0" y="0" ')}</g>
    <text x="80" y="138" ${F} font-size="12" text-anchor="middle" fill="#fff">Give way: slow, look</text>
    <text x="260" y="138" ${F} font-size="12" text-anchor="middle" fill="#fff">Stop: wheels MUST stop</text></svg>`;
}

function emerging(): string {
  return `<svg viewBox="0 0 340 160" role="img" aria-label="Emerging from a junction: look right, left, right again, and wait for a safe gap"><rect width="340" height="160" rx="12" fill="#78a656"/>
    <rect x="0" y="20" width="340" height="56" fill="#50545a"/>${centre(48)}<rect x="146" y="76" width="56" height="84" fill="#50545a"/>
    ${car(180, 104, '#2f8a5f', -90)}${car(40, 62, '#b8352f')}${car(300, 34, '#2e5c8a', 180)}
    <path d="M172 82 L60 62" stroke="#ffd23f" stroke-width="3" stroke-dasharray="5 4"/><path d="M188 82 L292 36" stroke="#ffd23f" stroke-width="3" stroke-dasharray="5 4"/>
    <text x="10" y="120" ${F} font-size="13" fill="#fff">1 Right</text><text x="260" y="120" ${F} font-size="13" fill="#fff">2 Left</text>
    <text x="96" y="150" ${F} font-size="13" fill="#fff">3 Right again · wait for a gap</text></svg>`;
}

function turnRight(): string {
  return `<svg viewBox="0 0 340 160" role="img" aria-label="Turning right: mirror, signal, position just left of centre, wait for a gap in oncoming traffic, then turn without cutting the corner"><rect width="340" height="160" rx="12" fill="#78a656"/>
    <rect x="0" y="70" width="340" height="60" fill="#50545a"/>${centre(100)}<rect x="210" y="0" width="56" height="70" fill="#50545a"/>
    ${car(120, 110)}${car(310, 84, '#b8352f', 180)}
    <path d="M140 108 Q200 104 226 70 L230 10" stroke="#ffd23f" stroke-width="4" fill="none" stroke-dasharray="8 6"/>
    <text x="10" y="150" ${F} font-size="12" fill="#fff">Mirror · signal right · just left of centre · wait for a gap</text></svg>`;
}

function bossMap(): string {
  return `<svg viewBox="0 0 340 170" role="img" aria-label="The Market Town Test route around Little Ashby"><rect width="340" height="170" rx="12" fill="#b9d89a"/>
    <path d="M10 40 L330 40" stroke="#50545a" stroke-width="10"/><path d="M230 40 L230 150 M120 40 L120 150 M120 150 L230 150 M290 40 L290 10" stroke="#50545a" stroke-width="8"/>
    <path d="M232 140 L232 46 L124 46 L124 146 L226 146 L226 60" stroke="#ffd23f" stroke-width="3" fill="none" stroke-dasharray="6 4"/>
    <text x="240" y="100" ${F} font-size="11">Mill Lane</text><text x="60" y="100" ${F} font-size="11">Tannery Rd</text><text x="150" y="30" ${F} font-size="11">Market St · Ashby Rd</text><text x="150" y="165" ${F} font-size="11">Back Lane</text>
    <circle cx="232" cy="140" r="6" fill="#2f8a5f"/><text x="242" y="144" ${F} font-size="11">Start</text></svg>`;
}
