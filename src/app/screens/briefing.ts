import { h, type Screen } from '../router';
import type { LessonSession } from '../session';
import { lessonTop, ruleChips } from './common';
import { SpeechBubble } from '../../instructor/bubble';
import { diagram } from '../../ui/diagrams';
import { goHome, next } from '../nav';
import { sfx } from '../../platform/audio';
import { signSvg, signName } from '../../world/signSvg';

export function briefingScreen(s: LessonSession): Screen {
  const slides = s.lesson.briefing;
  let i = 0;
  const bubble = new SpeechBubble({ size: 52 });
  const body = h('div', { class: 'slide scroll' });
  const nextBtn = h('button', { class: 'btn', 'data-testid': 'brief-next' }, 'Next');
  const backBtn = h('button', { class: 'btn secondary small', 'data-testid': 'brief-back' }, '‹ Back');
  const skip = h('button', { class: 'btn secondary small', 'data-testid': 'brief-skip' }, 'Skip briefing');
  const counter = h('span', { class: 'muted', style: { fontWeight: '800' } });

  const render = () => {
    const sl = slides[i];
    const signs = sl.signs?.length
      ? h(
          'div',
          { class: 'sign-gallery' },
          ...sl.signs.map((g) => h('figure', {}, h('div', { html: signSvg({ kind: g.kind, value: g.value, map: g.map }, 64) }), h('figcaption', {}, g.caption ?? signName({ kind: g.kind, value: g.value }))))
        )
      : null;
    body.replaceChildren(
      sl.diagram === 'none' && signs ? h('div', { class: 'diagram' }, signs) : h('div', { class: 'diagram' }, h('div', { html: diagram(sl.diagram), style: { width: '100%' } }), signs),
      h(
        'div',
        {},
        h('h2', {}, sl.title),
        h('ul', {}, ...sl.points.map((p) => h('li', {}, p))),
        i === slides.length - 1 ? h('div', { style: { marginTop: '10px' } }, h('small', { class: 'muted', style: { fontWeight: '800' } }, 'Highway Code rules for today: '), ruleChips(s.lesson.rules)) : null
      )
    );
    bubble.say(sl.say);
    counter.textContent = `${i + 1} / ${slides.length}`;
    nextBtn.textContent = i === slides.length - 1 ? 'Let’s begin' : 'Next';
    backBtn.toggleAttribute('disabled', i === 0);
  };

  nextBtn.addEventListener('click', () => {
    sfx.tap();
    if (i < slides.length - 1) {
      i++;
      render();
    } else next(s);
  });
  backBtn.addEventListener('click', () => {
    sfx.tap();
    if (i > 0) {
      i--;
      render();
    }
  });
  skip.addEventListener('click', () => (sfx.tap(), next(s)));

  const el = h(
    'div',
    { class: 'screen briefing', 'data-testid': 'briefing' },
    lessonTop(s, goHome),
    h('div', { class: 'brief-main' }, body, (bubble.el.classList.add('scroll'), bubble.el)),
    h('div', { class: 'footer-row' }, h('div', { style: { display: 'flex', gap: '8px' } }, backBtn, skip), counter, nextBtn)
  );
  return { el, onShow: render, destroy: () => bubble.stop() };
}
