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
    case 'roundabout-giveway':
      return rbGiveway();
    case 'roundabout-signals':
      return rbSignals();
    case 'roundabout-lanes':
      return rbLanes();
    case 'magic':
      return magicDiagram();
    case 'zebra':
      return zebraDiagram();
    case 'signal-crossings':
      return signalCrossings();
    case 'lights-sequence':
      return lightsSequence();
    case 'box-junction':
      return boxJunction();
    case 'bus-lane':
      return busLaneDiagram();
    case 'bay-park':
      return bayPark();
    case 'hierarchy':
      return hierarchy();
    case 'passing-distances':
      return passingDistances();
    case 'h2-junction':
      return h2Junction();
    case 'parallel-park':
      return parallelPark();
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

// ---- Week 2: roundabouts --------------------------------------------------
/** Roundabout seen from above with you approaching from the bottom (clockwise flow, island on your right). */
function rbBase(extra: string, label: string): string {
  return `<svg viewBox="0 0 340 200" role="img" aria-label="${label}"><rect width="340" height="200" rx="12" fill="#78a656"/>
    <rect x="148" y="0" width="44" height="200" fill="#50545a"/><rect x="0" y="78" width="340" height="44" fill="#50545a"/>
    <circle cx="170" cy="100" r="54" fill="#50545a"/><circle cx="170" cy="100" r="26" fill="#7fb35a" stroke="#d8d4c8" stroke-width="4"/>
    <path d="M 170 52 A 48 48 0 0 1 218 100" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-dasharray="5 4" opacity="0.7"/>
    ${extra}</svg>`;
}
function rbGiveway(): string {
  return rbBase(
    `${car(181, 178, '#2f8a5f', -90)}${car(214, 128, '#b8352f', 180 + 45)}
    <path d="M150 156 L190 156" stroke="#fff" stroke-width="3" stroke-dasharray="4 3"/>
    <path d="M196 150 Q205 132 214 128" stroke="#ffd23f" stroke-width="3" fill="none" stroke-dasharray="5 4"/>
    <text x="226" y="160" ${F} font-size="13" fill="#fff">Give way to</text><text x="226" y="176" ${F} font-size="13" fill="#fff">the right</text>
    <text x="12" y="22" ${F} font-size="13" fill="#fff">Clockwise: island on your right</text>`,
    'Approaching a roundabout from the bottom: give way to traffic coming from your right'
  );
}
function rbSignals(): string {
  return `<svg viewBox="0 0 340 170" role="img" aria-label="Roundabout signals: first exit left, straight on no signal then left, right exit signal right then left"><rect width="340" height="170" rx="12" fill="#1f6f4a"/>
    ${[
      ['First exit', 'Left on approach,', 'keep it on', 60, -90],
      ['Ahead', 'No signal, then left', 'after the exit before', 170, 0],
      ['Right', 'Right on approach,', 'then left to leave', 280, 90]
    ]
      .map(
        ([title, a, b, x, rel]) => `<g transform="translate(${x},60)">
        <circle r="22" fill="none" stroke="#fff" stroke-width="7"/><circle r="9" fill="#7fb35a"/>
        <line x1="0" y1="56" x2="0" y2="22" stroke="#fff" stroke-width="7"/>
        <line x1="${Math.round(Math.sin(((rel as number) * Math.PI) / 180) * 22)}" y1="${Math.round(-Math.cos(((rel as number) * Math.PI) / 180) * 22)}" x2="${Math.round(Math.sin(((rel as number) * Math.PI) / 180) * 44)}" y2="${Math.round(-Math.cos(((rel as number) * Math.PI) / 180) * 44)}" stroke="#ffd23f" stroke-width="7"/>
        <text y="80" ${F} font-size="13" text-anchor="middle" fill="#fff">${title}</text>
        <text y="96" font-family="system-ui" font-size="10.5" text-anchor="middle" fill="#e8f3ec">${a}</text>
        <text y="108" font-family="system-ui" font-size="10.5" text-anchor="middle" fill="#e8f3ec">${b}</text></g>`
      )
      .join('')}</svg>`;
}
function rbLanes(): string {
  return rbBase(
    `<rect x="148" y="122" width="66" height="78" fill="#50545a"/><line x1="192" y1="130" x2="192" y2="200" stroke="#fff" stroke-width="2" stroke-dasharray="6 5"/>
    <text x="196" y="190" ${F} font-size="20" fill="#fff">↑↱</text><text x="160" y="190" ${F} font-size="20" fill="#fff">↰↑</text>
    <text x="222" y="150" ${F} font-size="12" fill="#fff">Right lane:</text><text x="222" y="165" ${F} font-size="12" fill="#fff">right / ahead</text>
    <text x="12" y="150" ${F} font-size="12" fill="#fff">Left lane:</text><text x="12" y="165" ${F} font-size="12" fill="#fff">left / ahead</text>`,
    'Two-lane approach: left lane for left or ahead, right lane for right or ahead, following the arrows'
  );
}
function magicDiagram(): string {
  return `<svg viewBox="0 0 340 190" role="img" aria-label="The Magic Roundabout: a ring road with several mini-roundabouts, each treated separately"><rect width="340" height="190" rx="12" fill="#78a656"/>
    <rect x="95" y="30" width="150" height="130" fill="none" stroke="#50545a" stroke-width="22"/>
    <rect x="159" y="0" width="22" height="30" fill="#50545a"/><rect x="245" y="84" width="95" height="22" fill="#50545a"/><rect x="0" y="84" width="95" height="22" fill="#50545a"/>
    ${[
      [170, 30],
      [245, 95],
      [95, 95]
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="17" fill="#50545a"/><circle cx="${x}" cy="${y}" r="6" fill="#fff"/>`)
      .join('')}
    <text x="170" y="100" ${F} font-size="13" text-anchor="middle" fill="#fff">Treat each</text><text x="170" y="116" ${F} font-size="13" text-anchor="middle" fill="#fff">mini separately</text>
    <text x="170" y="182" ${F} font-size="11" text-anchor="middle" fill="#fff">Rules 189 and 190</text></svg>`;
}

const person = (x: number, y: number, c = '#ffd23f') => `<g transform="translate(${x},${y})"><circle r="5" cy="-12" fill="${c}"/><rect x="-4" y="-7" width="8" height="14" rx="3" fill="${c}"/></g>`;
const zigzag = (x0: number, x1: number, y: number) => {
  let d = `M${x0} ${y}`;
  for (let x = x0, i = 0; x < x1; x += 8, i++) d += ` L${x + 8} ${y + (i % 2 ? -4 : 4)}`;
  return `<path d="${d}" stroke="#fff" stroke-width="2" fill="none"/>`;
};

function zebraDiagram(): string {
  const stripes = Array.from({ length: 7 }, (_, i) => `<rect x="160" y="${52 + i * 10}" width="26" height="5" fill="#fff"/>`).join('');
  return svg(
    `${road(50, 70)}${stripes}${zigzag(70, 150, 56)}${zigzag(70, 150, 114)}${zigzag(196, 276, 56)}${zigzag(196, 276, 114)}
    <circle cx="156" cy="36" r="7" fill="#f2a20c"/><circle cx="190" cy="134" r="7" fill="#f2a20c"/>
    ${car(118, 102, '#2f8a5f', 0)}${person(172, 40)}
    <path d="M146 102 L152 102" stroke="#fff" stroke-width="3" stroke-dasharray="3 2"/>
    <text x="12" y="22" ${F} font-size="13" fill="#fff">Zebra: no lights. Flashing amber beacons.</text>
    <text x="12" y="160" ${F} font-size="12" fill="#fff">Waiting? Be ready to stop. On it? You MUST stop.</text>`,
    'Zebra crossing: stripes, flashing beacons and zig-zags. Give way to people waiting, and you must stop for anyone on it'
  );
}

function signalCrossings(): string {
  const head = (x: number, lamps: string[], label: string, sub: string) => `<g transform="translate(${x},28)">
    <rect x="-13" y="0" width="26" height="70" rx="6" fill="#161718"/>
    ${lamps.map((c, i) => `<circle cx="0" cy="${13 + i * 22}" r="8" fill="${c}"/>`).join('')}
    <text y="92" ${F} font-size="11" text-anchor="middle" fill="#fff">${label}</text>
    <text y="106" font-family="system-ui" font-size="9.5" text-anchor="middle" fill="#e8f3ec">${sub}</text></g>`;
  const off = '#3a3a3a';
  return `<svg viewBox="0 0 340 170" role="img" aria-label="Pelican crossings have a flashing amber phase: give way to anyone on the crossing. Puffin and toucan crossings go red and amber, like traffic lights."><rect width="340" height="170" rx="12" fill="#1f6f4a"/>
    <text x="12" y="18" ${F} font-size="12" fill="#fff">Pelican</text>
    ${head(36, ['#ff2a1a', off, off], 'Red', 'Stop')}${head(92, [off, '#ffa514', off], 'Flashing amber', 'Give way to anyone')}${head(150, [off, off, '#2bff6a'], 'Green', 'Go if clear')}
    <line x1="180" y1="10" x2="180" y2="160" stroke="#fff" stroke-opacity=".4"/>
    <text x="192" y="18" ${F} font-size="12" fill="#fff">Puffin / toucan</text>
    ${head(214, ['#ff2a1a', off, off], 'Red', 'Stop')}${head(262, ['#ff2a1a', '#ffa514', off], 'Red + amber', 'Still stop')}${head(310, [off, off, '#2bff6a'], 'Green', 'Go if clear')}
    <text x="12" y="160" font-family="system-ui" font-size="10.5" fill="#e8f3ec">Rules 196–199: give way to anyone still crossing, whatever your light.</text></svg>`;
}

function lightsSequence(): string {
  const steps: Array<[string[], string, string]> = [
    [['#ff2a1a', '', ''], 'Red', 'Stop behind the line'],
    [['#ff2a1a', '#ffa514', ''], 'Red + amber', 'Still stop'],
    [['', '', '#2bff6a'], 'Green', 'Go, if clear'],
    [['', '#ffa514', ''], 'Amber', 'Stop, unless too close']
  ];
  return `<svg viewBox="0 0 340 170" role="img" aria-label="Traffic light sequence: red, red and amber, green, amber, then red again"><rect width="340" height="170" rx="12" fill="#1f6f4a"/>
    ${steps
      .map(
        ([lamps, a, b], i) => `<g transform="translate(${46 + i * 82},22)">
      <rect x="-15" y="0" width="30" height="80" rx="7" fill="#161718"/>
      ${lamps.map((c, k) => `<circle cx="0" cy="${15 + k * 25}" r="9" fill="${c || '#3a3a3a'}"/>`).join('')}
      <text y="100" ${F} font-size="12" text-anchor="middle" fill="#fff">${a}</text>
      <text y="115" font-family="system-ui" font-size="10" text-anchor="middle" fill="#e8f3ec">${b}</text>
      ${i < 3 ? `<text x="41" y="44" ${F} font-size="16" text-anchor="middle" fill="#ffd23f">→</text>` : ''}</g>`
      )
      .join('')}
    <text x="12" y="160" font-family="system-ui" font-size="10.5" fill="#e8f3ec">Rules 175–176. After amber comes red again.</text></svg>`;
}

function boxJunction(): string {
  return svg(
    `${road(50, 70)}<rect x="135" y="0" width="70" height="170" fill="#50545a"/>
    <clipPath id="bx"><rect x="135" y="50" width="70" height="70"/></clipPath><g clip-path="url(#bx)">${Array.from({ length: 18 }, (_, i) => `<line x1="${100 + i * 10}" y1="50" x2="${170 + i * 10}" y2="120" stroke="#f2c21b" stroke-width="2"/><line x1="${170 + i * 10}" y1="50" x2="${100 + i * 10}" y2="120" stroke="#f2c21b" stroke-width="2"/>`).join('')}</g>
    <rect x="135" y="50" width="70" height="70" fill="none" stroke="#f2c21b" stroke-width="3"/>
    ${car(100, 102, '#2f8a5f', 0)}${car(240, 102, '#b8352f', 0)}${car(290, 102, '#2e5c8a', 0)}
    <text x="12" y="22" ${F} font-size="13" fill="#fff">Don’t enter until your exit is clear</text>
    <text x="12" y="160" ${F} font-size="11.5" fill="#fff">Exception: waiting to turn right, held by oncoming traffic</text>`,
    'Box junction: do not enter the yellow box until your exit is clear, unless turning right and only blocked by oncoming traffic'
  );
}

function busLaneDiagram(): string {
  return svg(
    `<rect x="0" y="42" width="340" height="96" fill="#50545a"/><rect x="0" y="34" width="340" height="8" fill="#b9b5aa"/><rect x="0" y="138" width="340" height="8" fill="#b9b5aa"/>
    <rect x="0" y="110" width="340" height="28" fill="#8f3a30"/><rect x="0" y="108" width="340" height="3" fill="#fff"/>
    ${centre(76)}<text x="60" y="130" ${F} font-size="13" fill="#fff">BUS LANE</text>
    ${car(160, 96, '#2f8a5f', 0)}<g transform="translate(260,124)"><rect x="-34" y="-11" width="68" height="22" rx="4" fill="#d9a22e"/></g>
    <g transform="translate(300,6) scale(0.28)">${signSvg({ kind: 'bus-lane', text: 'Mon–Fri 7–10am' }, 100).replace('<svg ', '<svg x="0" y="0" ')}</g>
    <text x="12" y="22" ${F} font-size="13" fill="#fff">Keep out during its hours</text>
    <text x="12" y="162" font-family="system-ui" font-size="10.5" fill="#e8f3ec">The sign gives the times. "At any time" means 24/7.</text>`,
    'Bus lane: keep out during the times shown on the sign',
    170
  );
}

function bayPark(): string {
  const bays = Array.from({ length: 7 }, (_, i) => `<line x1="${40 + i * 40}" y1="110" x2="${40 + i * 40}" y2="168" stroke="#fff" stroke-width="2.5"/>`).join('');
  return `<svg viewBox="0 0 340 170" role="img" aria-label="Reverse bay parking: stop about a car length past the bay, then reverse in on full lock and straighten up"><rect width="340" height="170" rx="12" fill="#50545a"/>
    ${bays}<rect x="120" y="110" width="40" height="58" fill="#ffd23f" opacity=".25"/>
    ${car(100, 132, '#9aa3ab', 90)}${car(180, 140, '#9aa3ab', 90)}
    ${car(214, 72, '#2f8a5f', 180)}
    <path d="M196 72 Q140 74 140 134" stroke="#ffd23f" stroke-width="3" fill="none" stroke-dasharray="6 4"/>
    <polygon points="134,124 146,124 140,136" fill="#ffd23f"/>
    <text x="12" y="22" font-family="system-ui" font-weight="800" font-size="13" fill="#fff">1. Stop a car length past the bay</text>
    <text x="12" y="40" font-family="system-ui" font-weight="800" font-size="13" fill="#fff">2. Look all round, reverse on full lock</text>
    <text x="12" y="58" font-family="system-ui" font-weight="800" font-size="13" fill="#fff">3. Straighten up inside the lines</text></svg>`;
}

function parallelPark(): string {
  return `<svg viewBox="0 0 340 170" role="img" aria-label="Parallel parking: stop alongside the car in front of the gap, reverse, steer in, then steer out to straighten close to the kerb"><rect width="340" height="170" rx="12" fill="#78a656"/>
    <rect x="0" y="28" width="340" height="112" fill="#50545a"/><rect x="0" y="140" width="340" height="10" fill="#b9b5aa"/>
    ${car(60, 122, '#2e5c8a', 0)}${car(250, 122, '#b8352f', 0)}
    ${car(254, 84, '#2f8a5f', 0)}
    <path d="M230 84 Q190 86 170 104 Q150 122 120 122" stroke="#ffd23f" stroke-width="3" fill="none" stroke-dasharray="6 4"/>
    <polygon points="122,116 122,128 110,122" fill="#ffd23f"/>
    <text x="12" y="20" font-family="system-ui" font-weight="800" font-size="12.5" fill="#fff">Alongside the red car, a metre out → reverse → steer in → steer out</text>
    <text x="12" y="164" font-family="system-ui" font-size="10.5" fill="#fff">Finish close to the kerb, straight, facing the traffic flow (rule 239)</text></svg>`;
}

function hierarchy(): string {
  const rows: Array<[string, string, number]> = [
    ['Pedestrians', '#2f8a5f', 300],
    ['Cyclists · horse riders', '#2e5c8a', 250],
    ['Motorcyclists', '#7a4f9a', 200],
    ['Cars · taxis', '#d9a22e', 150],
    ['Vans · buses · lorries', '#b8352f', 100]
  ];
  return `<svg viewBox="0 0 340 170" role="img" aria-label="The hierarchy of road users: those who can do the greatest harm have the greatest responsibility. Pedestrians at the top, then cyclists and horse riders, motorcyclists, cars, and large vehicles."><rect width="340" height="170" rx="12" fill="#1f6f4a"/>
    ${rows
      .map(([label, col, w], i) => `<rect x="${170 - w / 2}" y="${14 + i * 28}" width="${w}" height="24" rx="5" fill="${col}"/><text x="170" y="${31 + i * 28}" font-family="system-ui" font-weight="800" font-size="12" text-anchor="middle" fill="#fff">${label}</text>`)
      .join('')}
    <text x="12" y="30" font-family="system-ui" font-size="10" fill="#e8f3ec">Most at risk</text>
    <text x="12" y="146" font-family="system-ui" font-size="10" fill="#e8f3ec">Most</text><text x="12" y="158" font-family="system-ui" font-size="10" fill="#e8f3ec">responsibility</text></svg>`;
}

function passingDistances(): string {
  const bike = (x: number, y: number) => `<g transform="translate(${x},${y})"><rect x="-14" y="-3" width="28" height="6" rx="3" fill="#2b2f36"/><circle r="6" cy="-6" fill="#d6f22b"/></g>`;
  const horse = (x: number, y: number) => `<g transform="translate(${x},${y})"><rect x="-20" y="-6" width="40" height="12" rx="5" fill="#6b4a2e"/><circle r="6" cy="-9" fill="#d6f22b"/></g>`;
  return svg(
    `<rect x="0" y="28" width="340" height="120" fill="#50545a"/>${centre(88)}
    ${bike(90, 132)}${car(90, 96, '#2f8a5f', 0)}
    <line x1="64" y1="108" x2="64" y2="128" stroke="#ffd23f" stroke-width="2"/><text x="20" y="122" font-family="system-ui" font-weight="800" font-size="12" fill="#ffd23f">1.5 m</text>
    ${horse(250, 132)}${car(250, 90, '#2f8a5f', 0)}
    <line x1="222" y1="102" x2="222" y2="126" stroke="#ffd23f" stroke-width="2"/><text x="178" y="118" font-family="system-ui" font-weight="800" font-size="12" fill="#ffd23f">2 m</text>
    <text x="12" y="20" font-family="system-ui" font-weight="800" font-size="12.5" fill="#fff">Cyclists: 1.5 m+ at up to 30 mph</text>
    <text x="190" y="20" font-family="system-ui" font-weight="800" font-size="12.5" fill="#fff">Horses: 2 m+, under 10 mph</text>
    <text x="12" y="164" font-family="system-ui" font-size="10.5" fill="#fff">Not enough room? Wait behind (rules 163, 212, 215).</text>`,
    'Passing distances: at least 1.5 metres for cyclists at up to 30 mph, and at least 2 metres at under 10 mph for horse riders',
    170
  );
}

function h2Junction(): string {
  return svg(
    `${road(96, 60)}<rect x="140" y="0" width="60" height="96" fill="#50545a"/>${centre(126)}
    <rect x="128" y="36" width="12" height="14" fill="#c9a27a"/><rect x="200" y="36" width="12" height="14" fill="#c9a27a"/>
    ${person(158, 46)}${person(176, 46, '#9fc3d6')}
    ${car(96, 140, '#2f8a5f', 0)}
    <path d="M120 140 Q166 136 170 104" stroke="#ffd23f" stroke-width="3" fill="none" stroke-dasharray="6 4"/>
    <text x="210" y="40" font-family="system-ui" font-weight="800" font-size="12" fill="#fff">People crossing</text>
    <text x="210" y="56" font-family="system-ui" font-weight="800" font-size="12" fill="#fff">the side road</text>
    <text x="210" y="72" font-family="system-ui" font-weight="800" font-size="12" fill="#ffd23f">go first (H2)</text>`,
    'Rule H2: when turning into or out of a side road, give way to pedestrians crossing or waiting to cross it',
    170
  );
}
