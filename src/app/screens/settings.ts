import { h, type Screen } from '../router';
import { app, setSetting, persist } from '../state';
import type { Settings } from '../../scoring/progress';
import { newSave } from '../../scoring/progress';
import { DISCLAIMERS } from '../../content/disclaimers';
import { requestMotionPermission, startTilt, stopTilt } from '../../platform/motion';
import { hasEnGbVoice, speak, speechSupported, unlockSpeech, voiceName } from '../../platform/speech';
import { unlockAudio } from '../../platform/audio';
import { sfx } from '../../platform/audio';
import { toast } from './common';
import { goOnboarding } from '../nav';

type BoolKey = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings];

export function settingsScreen(back: () => void): Screen {
  const s = app.save.settings;

  const toggle = (key: BoolKey, title: string, sub: string, onChange?: (v: boolean) => Promise<boolean> | boolean | void) => {
    const t = h('button', { class: `toggle ${s[key] ? 'on' : ''}`, role: 'switch', 'aria-checked': String(s[key]), 'aria-label': title, 'data-testid': `set-${key}` });
    t.addEventListener('click', async () => {
      sfx.tap();
      let v = !s[key];
      if (onChange) {
        const r = await onChange(v);
        if (r === false) v = false;
      }
      setSetting(key, v);
      t.classList.toggle('on', v);
      t.setAttribute('aria-checked', String(v));
    });
    return h('div', { class: 'row' }, h('div', {}, h('b', {}, title), h('small', {}, sub)), t);
  };

  const el = h(
    'div',
    { class: 'screen settings scroll', 'data-testid': 'settings' },
    h('div', { class: 'topbar' }, h('button', { class: 'icon-btn', 'aria-label': 'Back', 'data-testid': 'settings-back', onclick: () => (sfx.tap(), back()) }, '‹'), h('h1', { style: { fontSize: '24px' } }, 'Settings')),
    h(
      'div',
      { class: 'card', style: { marginTop: '12px' } },
      h('h2', { style: { fontSize: '17px' } }, 'Sound and voice'),
      toggle('voice', 'Maggie’s voice', hasEnGbVoice() ? 'Spoken with a British English voice. Subtitles always show.' : 'Uses your device’s voice. Subtitles always show.', (v) => {
        if (v) setTimeout(() => speak('Lovely, you can hear me now.'), 50);
      }),
      toggle('sound', 'Sound effects', 'Engine, indicator ticks, chimes.'),
      h(
        'div',
        { class: 'row' },
        h(
          'div',
          {},
          h('b', {}, 'Test Maggie’s voice'),
          h('small', {}, speechSupported() ? `Voice: ${voiceName() ?? 'device default'}. No sound? Check the volume buttons and that voice is on above.` : 'This browser has no speech support. Subtitles still show everything.')
        ),
        h(
          'button',
          {
            class: 'btn small',
            'data-testid': 'test-voice',
            onclick: () => {
              unlockAudio();
              unlockSpeech();
              sfx.good();
              if (!app.save.settings.voice) setSetting('voice', true);
              speak('Right then. If you can hear me, we’re all set. Lovely.');
            }
          },
          '▶ Play'
        )
      )
    ),
    h(
      'div',
      { class: 'card', style: { marginTop: '12px' } },
      h('h2', { style: { fontSize: '17px' } }, 'Pace'),
      toggle('sprint', 'Sprint mode', 'Removes the one-lesson-a-day gate. You still need 80% to unlock the next day.')
    ),
    h(
      'div',
      { class: 'card', style: { marginTop: '12px' } },
      h('h2', { style: { fontSize: '17px' } }, 'Driving assists'),
      toggle('steeringAssist', 'Steering help', 'Gently keeps you in lane on roads.'),
      toggle('lineHints', 'Route hints', 'Green dashes show where to go next.'),
      toggle('speedHud', 'Speed limit display', 'Shows the current limit beside your speed.'),
      toggle('tilt', 'Tilt to steer', 'Steer by tilting your phone. The on-screen wheel always works too.', async (v) => {
        if (!v) {
          stopTilt();
          return true;
        }
        const ok = await requestMotionPermission();
        if (!ok) toast('Motion access wasn’t allowed, so we’ll stick with the wheel.');
        else startTilt();
        return ok;
      }),
      toggle('lowPower', 'Battery saver', 'Lower resolution for older or hot phones.'),
      h('div', { class: 'row' }, h('div', {}, h('b', {}, 'Camera'), h('small', {}, 'Behind the car, or from the driver’s seat.')), cameraPicker())
    ),
    h(
      'div',
      { class: 'card', style: { marginTop: '12px' } },
      h('h2', { style: { fontSize: '17px' } }, 'Coming later'),
      h('div', { class: 'row' }, h('div', {}, h('b', {}, 'Manual gearbox'), h('small', {}, 'Clutch and gear stick. Arrives after the core 30 days.')), h('span', { class: 'muted', style: { fontWeight: '800' } }, 'Soon'))
    ),
    h(
      'div',
      { class: 'card', style: { marginTop: '12px' } },
      h('h2', { style: { fontSize: '17px' } }, 'Important'),
      h('ul', { style: { paddingLeft: '20px', margin: '8px 0' }, class: 'small-print' }, ...DISCLAIMERS.map((d) => h('li', { style: { margin: '6px 0' } }, d))),
      h('p', { class: 'small-print' }, 'Highway Code: ', h('a', { href: 'https://www.gov.uk/guidance/the-highway-code', target: '_blank', rel: 'noopener' }, 'gov.uk/guidance/the-highway-code'))
    ),
    h(
      'div',
      { class: 'card', style: { margin: '12px 0 24px' } },
      h('h2', { style: { fontSize: '17px' } }, 'Progress'),
      h('p', { class: 'small-print' }, 'Everything is saved on this device only. No accounts, no tracking.'),
      h(
        'button',
        {
          class: 'btn secondary small',
          'data-testid': 'reset-progress',
          onclick: () => {
            if (!confirm('Reset all progress, streaks and badges? This can’t be undone.')) return;
            app.save = newSave();
            persist();
            goOnboarding();
          }
        },
        'Reset progress'
      )
    )
  );
  return { el };
}

function cameraPicker(): HTMLElement {
  const wrap = h('div', { class: 'gear' });
  const mk = (v: 'chase' | 'cockpit', label: string) => {
    const b = h('button', { class: app.save.settings.camera === v ? 'on' : '', style: { width: '74px' } }, label);
    b.addEventListener('click', () => {
      sfx.tap();
      setSetting('camera', v);
      wrap.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
    });
    return b;
  };
  wrap.append(mk('chase', 'Behind'), mk('cockpit', 'Seat'));
  return wrap;
}
