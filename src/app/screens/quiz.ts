import { h, type Screen } from '../router';
import type { LessonSession } from '../session';
import { lessonTop, ruleChips } from './common';
import { SpeechBubble } from '../../instructor/bubble';
import { LINES, pick } from '../../instructor/maggie';
import { goHome, next } from '../nav';
import { sfx } from '../../platform/audio';
import { signSvg } from '../../world/signSvg';

export function quizScreen(s: LessonSession): Screen {
  const qs = s.lesson.quiz;
  let i = 0;
  let correct = 0;
  const bubble = new SpeechBubble({ size: 48 });
  const body = h('div', { class: 'scroll', style: { flex: '1', minHeight: '0', display: 'flex', flexDirection: 'column', gap: '12px' } });

  const render = () => {
    const q = qs[i];
    const opts = h('div', { class: 'options' });
    const after = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } });
    let answered = false;
    q.options.forEach((o, k) => {
      const b = h('button', { class: 'opt', 'data-testid': `opt-${k}`, 'data-correct': String(k === q.answer) }, o);
      b.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const right = k === q.answer;
        if (right) correct++;
        b.classList.add(right ? 'right' : 'wrong');
        opts.querySelectorAll<HTMLElement>('.opt')[q.answer].classList.add('right');
        if (right) sfx.good();
        else sfx.fault();
        bubble.say(right ? pick(LINES.praise) : `Not quite. It’s “${q.options[q.answer]}”.`, right ? 'happy' : 'neutral');
        after.append(
          h('div', { class: 'explain' }, q.explain, h('div', { style: { marginTop: '6px' } }, ruleChips(q.rules))),
          h(
            'button',
            {
              class: 'btn',
              'data-testid': 'quiz-next',
              onclick: () => {
                sfx.tap();
                if (i < qs.length - 1) {
                  i++;
                  render();
                } else {
                  s.quizCorrect = correct;
                  s.quizTotal = qs.length;
                  next(s);
                }
              }
            },
            i < qs.length - 1 ? 'Next question' : 'See my result'
          )
        );
        after.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
      opts.append(b);
    });
    const sign = q.sign ? h('div', { class: 'quiz-sign', html: signSvg({ kind: q.sign.kind, value: q.sign.value }, 96, 'Road sign for this question') }) : null;
    body.replaceChildren(
      h('div', { class: 'muted', style: { fontWeight: '800' } }, `Question ${i + 1} of ${qs.length}`),
      h('div', { class: 'q-row' }, sign, h('div', { class: 'q' }, q.question)),
      opts,
      after
    );
    if (i === 0) bubble.say('A few Highway Code questions. Take your time, there’s no clock.');
    else bubble.say(q.question);
  };

  const el = h('div', { class: 'screen quiz', 'data-testid': 'quiz' }, lessonTop(s, goHome), bubble.el, body);
  return { el, onShow: render, destroy: () => bubble.stop() };
}
