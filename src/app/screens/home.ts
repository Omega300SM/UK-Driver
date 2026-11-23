import { h, type Screen } from '../router';
import { app, now } from '../state';
import { CURRICULUM, WORLDS } from '../../content/curriculum';
import { lockState, levelFor } from '../../scoring/progress';
import { ENGLAND_PATH } from '../../ui/diagrams';
import { maggieSvg } from '../../instructor/maggie';
import { startLesson, goSettings } from '../nav';
import { toast } from './common';
import { sfx, unlockAudio } from '../../platform/audio';
import { unlockSpeech } from '../../platform/speech';

export function homeScreen(): Screen {
  const save = app.save;
  const lv = levelFor(save.xp);
  const today = now();

  const top = h(
    'div',
    { class: 'topbar' },
    h('div', { html: maggieSvg('happy', 40) }),
    h('div', { style: { flex: '1', minWidth: '0' } }, h('div', { style: { fontWeight: '900', fontSize: '19px' } }, 'Drive England'), h('div', { class: 'small-print' }, '30 days to expert')),
    h('div', { class: 'stat', title: 'Daily streak', 'data-testid': 'streak' }, '🔥', String(save.streak.count)),
    h(
      'div',
      { class: 'stat', title: `${save.xp} XP`, 'data-testid': 'xp' },
      `Lv ${lv.level}`,
      h('span', { class: 'xpbar' }, h('i', { style: { width: `${Math.round((100 * lv.into) / lv.span)}%` } }))
    ),
    h('button', { class: 'icon-btn', 'aria-label': 'Settings', 'data-testid': 'open-settings', onclick: () => (sfx.tap(), goSettings()) }, '⚙︎')
  );

  // Progress map.
  const passedCount = CURRICULUM.filter((d) => save.days[d.day]?.passed).length;
  const pins = WORLDS.map((w) => {
    const days = CURRICULUM.filter((d) => d.world === w.id);
    const done = days.filter((d) => save.days[d.day]?.passed).length;
    const reached = lockState(save, days[0].day, today) === 'unlocked';
    return `<g transform="translate(${w.pin.x},${w.pin.y})">
      <circle r="11" fill="${done === days.length ? '#2f8a5f' : reached ? '#ffd23f' : '#fffdf8'}" stroke="#1d2327" stroke-width="2"/>
      <text y="4.5" text-anchor="middle" font-size="12" font-weight="900" font-family="system-ui" fill="#1d2327">${w.id}</text>
      <text x="14" y="4" font-size="9" font-weight="800" font-family="system-ui" fill="#1d2327">${w.name}</text></g>`;
  }).join('');
  const route = WORLDS.map((w) => `${w.pin.x},${w.pin.y}`).join(' ');
  const map = h(
    'div',
    { class: 'card map-card' },
    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' } }, h('h2', { style: { fontSize: '17px' } }, 'Your England'), h('small', { class: 'muted', style: { fontWeight: '800' } }, `${passedCount}/30 days`)),
    h('div', {
      html: `<svg viewBox="0 0 230 270" role="img" aria-label="Progress map of England">
        <path d="${ENGLAND_PATH}" fill="#b9d89a" stroke="#5d8a3c" stroke-width="2" stroke-linejoin="round"/>
        <polyline points="${route}" fill="none" stroke="#1f6f4a" stroke-width="2.5" stroke-dasharray="5 4"/>
        ${pins}</svg>`,
      style: { flex: '1', minHeight: '0', display: 'grid', placeItems: 'center' }
    })
  );

  // Days list.
  const list = h('div', { class: 'days scroll' });
  for (const w of WORLDS) {
    list.append(h('div', { class: 'world-head' }, h('h2', { style: { fontSize: '17px' } }, `Week ${w.id}: ${w.name}`), h('small', {}, w.place)));
    const row = h('div', { class: 'day-row' });
    for (const d of CURRICULUM.filter((x) => x.world === w.id)) {
      const rec = save.days[d.day];
      const ls = lockState(save, d.day, today);
      const open = ls === 'unlocked' && d.available;
      const stars = rec?.stars ? '⭐'.repeat(rec.stars) : '';
      const lockText =
        ls === 'locked-tomorrow' ? '🔒 Opens tomorrow' : ls === 'locked-previous' ? '🔒 Pass the day before' : !d.available ? '🛠 Coming soon' : rec?.passed ? `Best ${rec.bestScore}%` : 'Start';
      const btn = h(
        'button',
        {
          class: `day ${open ? 'open' : 'locked'} ${d.boss ? 'boss' : ''}`,
          'data-testid': `day-${d.day}`,
          'data-lock': ls,
          onclick: () => {
            unlockAudio();
            unlockSpeech();
            sfx.tap();
            if (open) return startLesson(d.day);
            if (ls === 'locked-tomorrow') return toast('One new lesson a day. Come back tomorrow, or switch on Sprint mode in Settings.');
            if (ls === 'locked-previous') return toast(`Pass Day ${d.day - 1} first.`);
            toast('This lesson is still being built. Day 1 is ready to play.');
          }
        },
        h('div', { class: 'n' }, `DAY ${d.day}${d.boss ? ' · BOSS' : ''}`),
        h('div', { class: 't' }, d.title),
        h('div', { class: 'lock' }, lockText),
        h('div', { class: 's' }, stars)
      );
      row.append(btn);
    }
    list.append(row);
  }

  const el = h('div', { class: 'screen home', 'data-testid': 'home' }, top, h('div', { class: 'home-body' }, map, list));
  return { el };
}
