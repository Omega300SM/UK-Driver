import { h, type Screen } from '../router';
import type { LessonSession } from '../session';
import { app, now, persist } from '../state';
import { tally, groupFaults } from '../../scoring/dvsa';
import { scoreLesson, type LessonResult } from '../../scoring/lessonScore';
import { recordResult, type RecordOutcome } from '../../scoring/progress';
import { debriefLines } from '../../instructor/feedback';
import { SpeechBubble } from '../../instructor/bubble';
import { badge } from '../../content/badges';
import { ruleChips } from './common';
import { openReplay } from './replay';
import { goHome, runStage } from '../nav';
import { confetti } from '../../ui/confetti';
import { sfx } from '../../platform/audio';

export function debriefScreen(s: LessonSession): Screen {
  const t = tally(s.testFaults);
  const prevPassed = !!app.save.days[s.lesson.day]?.passed;
  const result: LessonResult = scoreLesson({ tally: t, quizCorrect: s.quizCorrect, quizTotal: s.quizTotal, guidedCompletion: s.guidedCompletion }, !prevPassed);
  const outcome: RecordOutcome = recordResult(app.save, s.lesson.day, result, s.testFaults, now(), s.lesson.badge);
  persist();

  const lines = debriefLines(result, t, s.testFaults, { correct: s.quizCorrect, total: s.quizTotal, questions: s.lesson.quiz }, { boss: s.lesson.boss });
  const bubble = new SpeechBubble({ size: 56, mood: result.passed ? 'proud' : 'concerned' });

  const stars = h('div', { class: 'stars', 'aria-label': `${result.stars} of 3 stars`, 'data-testid': 'stars', 'data-stars': String(result.stars) });
  for (let i = 0; i < 3; i++) stars.append(h('span', { class: i < result.stars ? 'lit' : '', style: { animationDelay: `${0.3 + i * 0.35}s` } }, '⭐'));

  const faultList = h('div', { class: 'fault-list' });
  const groups = groupFaults(s.testFaults);
  if (!groups.length) faultList.append(h('div', { class: 'fault', style: { borderLeftColor: '#4fbf74' } }, h('div', { class: 'cat' }, 'No faults recorded'), h('p', {}, 'A clean drive. Lovely.')));
  for (const g of groups) {
    const clip = s.clips.find((c) => c.fault.code === g.fault.code);
    faultList.append(
      h(
        'div',
        { class: `fault ${g.fault.severity}` },
        h('div', { class: 'sev' }, g.fault.severity === 'minor' ? 'Driving fault' : g.fault.severity === 'serious' ? 'Serious fault' : 'Dangerous fault', g.count > 1 ? ` ×${g.count}` : ''),
        h('div', { class: 'cat' }, g.fault.category),
        h('p', {}, g.fault.message),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } }, ruleChips(g.fault.rules), clip ? h('button', { class: 'btn small secondary', 'data-testid': `replay-${g.fault.code}`, onclick: () => openReplay(clip) }, '▶ Here’s what happened') : null)
      )
    );
  }

  const badgesEl = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } });
  for (const id of outcome.newBadges) {
    const b = badge(id);
    if (b) badgesEl.append(h('div', { class: 'badge-earned' }, h('span', { class: 'ico' }, b.icon), h('div', {}, h('div', {}, `Badge earned: ${b.name}`), h('small', { class: 'muted' }, b.description))));
  }

  const nextDay = s.lesson.day + 1;
  const nextInfo = result.passed
    ? outcome.unlockedNext === 'unlocked'
      ? `Day ${nextDay} is unlocked.`
      : `Day ${nextDay} unlocks tomorrow. (Sprint mode in Settings removes the daily gate.)`
    : `You need 80% and no serious or dangerous faults to unlock Day ${nextDay}.`;

  const retry = h(
    'button',
    {
      class: `btn ${result.passed ? 'secondary' : ''}`,
      'data-testid': 'retry',
      onclick: () => {
        sfx.tap();
        s.resetForRetest();
        runStage(s);
      }
    },
    result.passed ? 'Retake the test' : 'Have another go'
  );
  const home = h('button', { class: `btn ${result.passed ? '' : 'secondary'}`, 'data-testid': 'debrief-home', onclick: () => (sfx.tap(), goHome()) }, 'Back to the map');

  const el = h(
    'div',
    { class: 'screen debrief scroll', 'data-testid': 'debrief', 'data-passed': String(result.passed), 'data-score': String(result.scorePct) },
    h(
      'div',
      { class: 'result-head' },
      stars,
      h('div', { class: 'score-big' }, `${result.scorePct}%`),
      h('span', { class: `verdict ${result.passed ? 'pass' : 'fail'}` }, result.passed ? 'PASSED' : 'NOT YET'),
      h('span', { class: 'stat' }, `+${result.xp} XP`)
    ),
    bubble.el,
    h(
      'div',
      { class: 'breakdown' },
      h('div', {}, h('b', {}, `${Math.round(result.testPct)}%`), h('small', {}, `Test · ${t.minors} DF / ${t.serious} S / ${t.dangerous} D`)),
      h('div', {}, h('b', {}, `${s.quizCorrect}/${s.quizTotal}`), h('small', {}, 'Quiz')),
      h('div', {}, h('b', {}, `${Math.round(result.guidedPct)}%`), h('small', {}, 'Guided drive'))
    ),
    h('p', { class: 'small-print', style: { margin: '0' } }, nextInfo),
    badgesEl,
    h('h2', { style: { fontSize: '18px' } }, 'Maggie’s notes'),
    faultList,
    h('div', { class: 'small-print' }, 'Today’s Highway Code rules: ', ruleChips(s.lesson.rules)),
    h('div', { class: 'footer-row', style: { padding: '6px 0 24px', flexWrap: 'wrap' } }, retry, home)
  );

  let timer = 0;
  return {
    el,
    onShow: () => {
      // One line at a time, paced for reading (and for the voice to finish).
      let i = 0;
      const step = () => {
        if (i >= lines.length) return;
        const line = lines[i++];
        bubble.say(line, result.passed ? 'proud' : 'concerned', app.save.settings.voice);
        timer = window.setTimeout(step, Math.max(3200, line.split(' ').length * 420 + 600));
      };
      step();
      if (result.passed) {
        sfx.fanfare();
        for (let k = 0; k < result.stars; k++) setTimeout(() => sfx.star(k), 400 + k * 350);
        setTimeout(() => confetti(), 300);
      } else sfx.fault();
    },
    destroy: () => {
      clearTimeout(timer);
      bubble.stop();
    }
  };
}
