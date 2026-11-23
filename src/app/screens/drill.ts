import { h, type Screen } from '../router';
import type { LessonSession } from '../session';
import type { DrillItem } from '../../content/schema';
import { lessonTop } from './common';
import { SpeechBubble } from '../../instructor/bubble';
import { goHome, next } from '../nav';
import { sfx } from '../../platform/audio';
import { LINES, pick } from '../../instructor/maggie';

/**
 * Interactive cockpit drill (DSSSM) on a stylised right-hand-drive interior.
 * The steering wheel is on the right: this is a UK car.
 */
export function drillScreen(s: LessonSession): Screen {
  const drill = s.lesson.drill!;
  const items = drill.items;
  let idx = 0;
  const mirrorsDone = new Set<string>();
  const bubble = new SpeechBubble({ size: 52 });

  const cockpit = h('div', { class: 'cockpit', 'data-testid': 'cockpit' });
  cockpit.innerHTML = `<svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Inside the car, right-hand drive">
    <defs><linearGradient id="sky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#bcd9ea"/><stop offset="1" stop-color="#e6f0f5"/></linearGradient></defs>
    <rect width="400" height="240" fill="url(#sky)"/>
    <rect y="96" width="400" height="40" fill="#78a656"/>
    <path d="M150 136 L250 136 L330 96 L70 96 Z" fill="#50545a"/>
    <path d="M0 0 L400 0 L400 22 Q200 10 0 22 Z" fill="#2b3238"/>
    <path d="M0 0 L36 0 L60 140 L0 160 Z" fill="#2b3238"/><path d="M400 0 L364 0 L340 140 L400 160 Z" fill="#2b3238"/>
    <path d="M0 140 Q200 118 400 140 L400 240 L0 240 Z" fill="#3a4148"/>
    <rect x="118" y="150" width="104" height="24" rx="8" fill="#20252a"/>
    <text x="170" y="167" text-anchor="middle" fill="#7be08f" font-size="13" font-weight="800" font-family="system-ui">P · 0 mph</text>
    <g class="hot" data-id="mirror-interior"><rect class="hit" x="150" y="4" width="100" height="42"/><rect x="160" y="14" width="80" height="22" rx="8" fill="#cfdde6" stroke="#20252a" stroke-width="4"/><rect class="ring" x="152" y="8" width="96" height="34" rx="12"/></g>
    <g class="hot" data-id="mirror-left"><rect class="hit" x="0" y="96" width="62" height="54"/><rect x="8" y="108" width="44" height="30" rx="8" fill="#cfdde6" stroke="#20252a" stroke-width="4"/><rect class="ring" x="2" y="102" width="56" height="42" rx="12"/></g>
    <g class="hot" data-id="mirror-right"><rect class="hit" x="338" y="96" width="62" height="50"/><rect x="348" y="108" width="44" height="30" rx="8" fill="#cfdde6" stroke="#20252a" stroke-width="4"/><rect class="ring" x="342" y="102" width="56" height="42" rx="12"/></g>
    <g class="hot" data-id="seatbelt"><rect class="hit" x="292" y="22" width="44" height="72"/><path d="M326 30 L302 90" stroke="#2a2f34" stroke-width="11" stroke-linecap="round"/><rect x="316" y="24" width="20" height="14" rx="4" fill="#9aa3ab"/><rect class="ring" x="290" y="18" width="50" height="80" rx="12"/></g>
    <g class="hot" data-id="doors"><rect class="hit" x="352" y="150" width="48" height="90"/><rect x="360" y="160" width="34" height="68" rx="8" fill="#4a5157"/><rect x="367" y="185" width="20" height="8" rx="3" fill="#c9ccd1"/><rect class="ring" x="354" y="154" width="46" height="80" rx="12"/></g>
    <g class="hot" data-id="steering"><circle class="hit" cx="270" cy="184" r="56"/><circle cx="270" cy="184" r="44" fill="none" stroke="#1b1f23" stroke-width="12"/><circle cx="270" cy="184" r="13" fill="#1b1f23"/><path d="M226 184 L257 184 M283 184 L314 184 M270 197 L270 228" stroke="#1b1f23" stroke-width="9"/><circle class="ring" cx="270" cy="184" r="54"/></g>
    <g class="hot" data-id="seat"><rect class="hit" x="100" y="190" width="100" height="50"/><rect x="110" y="200" width="80" height="32" rx="10" fill="#555d64"/><text x="150" y="221" text-anchor="middle" fill="#fff" font-size="12" font-weight="800" font-family="system-ui">SEAT</text><rect class="ring" x="102" y="192" width="96" height="48" rx="14"/></g>
  </svg>`;

  const list = h('div', { class: 'drill-list' });
  const extra = h('div');
  const done = h('button', { class: 'btn', 'data-testid': 'drill-done', disabled: 'true' }, 'Let’s drive');
  done.addEventListener('click', () => {
    sfx.tap();
    s.beltOn = true;
    next(s);
  });

  const renderList = () => {
    list.replaceChildren(
      ...items.map((it, i) =>
        h(
          'div',
          { class: `drill-item ${i < idx ? 'done' : i === idx ? 'next' : ''}` },
          h('span', { class: 'letter' }, i < idx ? '✓' : it.label[0]),
          it.label,
          it.id === 'mirrors' && i === idx ? h('small', { class: 'muted' }, ` ${mirrorsDone.size}/3`) : null
        )
      )
    );
    const svg = cockpit.querySelector('svg')!;
    svg.querySelectorAll<SVGGElement>('.hot').forEach((g) => {
      const id = g.dataset.id!;
      const item = items[idx];
      const isNext = item && (id === item.id || (item.id === 'mirrors' && id.startsWith('mirror-') && !mirrorsDone.has(id)));
      const isDone = items.slice(0, idx).some((x) => x.id === id) || mirrorsDone.has(id);
      g.classList.toggle('next', !!isNext);
      g.classList.toggle('done', isDone);
    });
  };

  const complete = (it: DrillItem) => {
    sfx.good();
    bubble.say(it.done);
    idx++;
    extra.replaceChildren();
    renderList();
    if (idx >= items.length) {
      setTimeout(() => bubble.say(drill.outro, 'proud'), 1400);
      done.removeAttribute('disabled');
      return;
    }
    setTimeout(() => {
      if (items[idx]) bubble.say(items[idx].say);
    }, 1300);
  };

  const seatSlider = () => {
    const slider = h('input', { type: 'range', min: '0', max: '100', value: '15', class: 'seat-slider', 'aria-label': 'Seat position', 'data-testid': 'seat-slider' }) as HTMLInputElement;
    const label = h('div', { class: 'small-print', style: { fontWeight: '800' } }, 'Too far back: you can’t reach the pedals.');
    slider.addEventListener('input', () => {
      const v = Number(slider.value);
      if (v < 50) label.textContent = 'Too far back: you can’t reach the pedals.';
      else if (v > 80) label.textContent = 'Too close: your knees are touching the dash!';
      else label.textContent = 'Just right. Let go to set it.';
    });
    slider.addEventListener('change', () => {
      const v = Number(slider.value);
      if (v >= 50 && v <= 80) complete(items[idx]);
      else {
        sfx.fault();
        bubble.say(v < 50 ? 'A bit further forward. You want a slight bend in your knee.' : 'Ooh, steady on, that’s a bit close. Back a touch.', 'neutral');
      }
    });
    return h('div', { class: 'card', style: { padding: '10px 14px' } }, h('b', {}, 'Slide your seat'), slider, label);
  };

  cockpit.addEventListener('click', (e) => {
    const g = (e.target as Element).closest('.hot') as SVGGElement | null;
    if (!g || idx >= items.length) return;
    const id = g.dataset.id!;
    const item = items[idx];
    if (item.id === 'mirrors' && id.startsWith('mirror-')) {
      sfx.tap();
      mirrorsDone.add(id);
      renderList();
      if (mirrorsDone.size === 3) complete(item);
      return;
    }
    if (id === item.id) {
      if (item.id === 'seat') {
        sfx.tap();
        extra.replaceChildren(seatSlider());
        return;
      }
      complete(item);
    } else {
      sfx.fault();
      bubble.say(`Not quite. We do ${item.label.toLowerCase()} next. ${pick(LINES.retry)}`, 'neutral');
    }
  });

  const el = h(
    'div',
    { class: 'screen drill', 'data-testid': 'drill' },
    lessonTop(s, goHome),
    bubble.el,
    h('div', { class: 'drill-stage' }, cockpit, h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '0' }, class: 'scroll' }, list, extra, done))
  );
  return {
    el,
    onShow: () => {
      renderList();
      bubble.say(drill.intro);
      setTimeout(() => idx === 0 && bubble.say(items[0].say), 5200);
    },
    destroy: () => bubble.stop()
  };
}
