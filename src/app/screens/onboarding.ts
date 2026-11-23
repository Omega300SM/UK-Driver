import { h, type Screen } from '../router';
import { app, persist, applySettings } from '../state';
import { DISCLAIMERS } from '../../content/disclaimers';
import { maggieSvg, MAGGIE } from '../../instructor/maggie';
import { unlockAudio, sfx } from '../../platform/audio';
import { unlockSpeech, speak } from '../../platform/speech';
import { goHome } from '../nav';

export function onboardingScreen(): Screen {
  const go = h('button', { class: 'btn wide', disabled: 'true', 'data-testid': 'onboard-start' }, 'Right then, let’s go');
  const box = h('input', { type: 'checkbox', id: 'agree', 'data-testid': 'onboard-agree' }) as HTMLInputElement;
  box.addEventListener('change', () => {
    if (box.checked) go.removeAttribute('disabled');
    else go.setAttribute('disabled', 'true');
  });
  go.addEventListener('click', () => {
    // First user gesture: unlock audio and speech for iOS.
    unlockAudio();
    unlockSpeech();
    app.save.onboarded = true;
    persist();
    applySettings();
    sfx.good();
    goHome();
    // Speak after the screen change (which stops any old line), still inside this tap.
    speak('Hello, I’m Maggie. Lovely to meet you. Pop the kettle on, we’ve got thirty days.');
  });

  const el = h(
    'div',
    { class: 'screen onboard scroll', 'data-testid': 'onboarding' },
    h(
      'div',
      { class: 'hero' },
      h('span', { class: 'title-badge' }, '30 days to expert'),
      h('h1', { style: { marginTop: '8px' } }, 'Drive England'),
      h('p', { class: 'muted', style: { margin: '6px 0 0' } }, 'From total beginner to confident on English roads, one lesson a day.')
    ),
    h(
      'div',
      { class: 'card bubble-wrap', style: { alignItems: 'center' } },
      h('div', { html: maggieSvg('happy', 76) }),
      h(
        'div',
        {},
        h('b', {}, `I’m ${MAGGIE.name}.`),
        h('p', { style: { margin: '4px 0 0' } }, `${MAGGIE.bio} I’ll be in the passenger seat for all thirty days.`)
      )
    ),
    h(
      'div',
      { class: 'card disclaimer' },
      h('h2', { style: { fontSize: '18px' } }, 'Before we start'),
      h('ul', { style: { paddingLeft: '20px', margin: '8px 0 0' } }, ...DISCLAIMERS.map((d) => h('li', {}, d))),
      h('label', { class: 'check', for: 'agree' }, box, 'I understand')
    ),
    go,
    h('p', { class: 'small-print', style: { textAlign: 'center', margin: '0 0 8px' } }, 'Sound on? Maggie talks. Sound off? Subtitles are always on.')
  );
  return { el };
}
