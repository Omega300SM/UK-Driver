import { h } from '../router';
import type { LessonSession, Stage } from '../session';
import { rule } from '../../content/ruleRefs';
import { sfx } from '../../platform/audio';

const LABEL: Record<Stage, string> = {
  briefing: 'Briefing',
  drill: 'Cockpit drill',
  guided: 'Guided drive',
  free: 'Free drive',
  test: 'Test drive',
  quiz: 'Quiz',
  debrief: 'Debrief'
};

export function stageLabel(s: Stage): string {
  return LABEL[s];
}

/** Top bar for lesson screens: close button + stage pips. */
export function lessonTop(s: LessonSession, onClose: () => void): HTMLElement {
  const pips = h('div', { class: 'pips', 'aria-label': `Stage ${s.index + 1} of ${s.stages.length}: ${LABEL[s.stage]}` });
  s.stages.forEach((_, i) => pips.append(h('i', { class: i < s.index ? 'done' : i === s.index ? 'now' : '' })));
  return h(
    'div',
    { class: 'lesson-top' },
    h('button', { class: 'icon-btn', 'aria-label': 'Leave lesson', onclick: () => (sfx.tap(), onClose()) }, '✕'),
    h('div', { style: { fontWeight: '900', fontSize: '14px', whiteSpace: 'nowrap' } }, `Day ${s.lesson.day} · ${LABEL[s.stage]}`),
    pips
  );
}

export function ruleChips(nums: number[]): HTMLElement {
  const wrap = h('div');
  for (const n of nums) {
    const r = rule(n);
    wrap.append(h('a', { class: 'rule-chip', href: r.url, target: '_blank', rel: 'noopener', title: r.summary }, `Rule ${r.label ?? n}`));
  }
  return wrap;
}

export function toast(text: string, ms = 2600): void {
  const t = h('div', { class: 'fault-toast', style: { position: 'fixed', zIndex: '40', whiteSpace: 'normal', maxWidth: '90vw', textAlign: 'center' } }, text);
  document.body.append(t);
  setTimeout(() => t.remove(), ms);
}
