/**
 * Margaret "Maggie" Hale — the instructor.
 * Ex-DVSA examiner from Leicestershire, 31 years in the passenger seat.
 * Silver bob, red reading glasses, mustard cardigan, flask of tea. Warm,
 * patient, dry. Never condescending; always specific.
 */
export type Mood = 'happy' | 'neutral' | 'concerned' | 'proud';

export const MAGGIE = {
  name: 'Maggie Hale',
  short: 'Maggie',
  bio: 'Ex-DVSA examiner. 31 years, four flasks of tea a day, and not one raised voice.'
};

export function maggieSvg(mood: Mood = 'happy', size = 64): string {
  const mouth = {
    happy: '<path d="M40 66 Q50 74 60 66" stroke="#7a3a2a" stroke-width="3" fill="none" stroke-linecap="round"/>',
    proud: '<path d="M38 64 Q50 78 62 64 Z" fill="#7a3a2a"/><path d="M41 65 Q50 70 59 65" fill="#fff"/>',
    neutral: '<path d="M42 68 L58 68" stroke="#7a3a2a" stroke-width="3" stroke-linecap="round"/>',
    concerned: '<path d="M41 70 Q50 64 59 70" stroke="#7a3a2a" stroke-width="3" fill="none" stroke-linecap="round"/>'
  }[mood];
  const brows =
    mood === 'concerned'
      ? '<path d="M30 40 L41 37" stroke="#8b8f94" stroke-width="3" stroke-linecap="round"/><path d="M70 40 L59 37" stroke="#8b8f94" stroke-width="3" stroke-linecap="round"/>'
      : '<path d="M30 38 Q36 34 42 37" stroke="#8b8f94" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M58 37 Q64 34 70 38" stroke="#8b8f94" stroke-width="3" fill="none" stroke-linecap="round"/>';
  return `<svg class="maggie" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="Maggie Hale, your instructor">
  <rect width="100" height="100" fill="#cfe4f0"/>
  <path d="M10 100 Q14 78 34 76 L66 76 Q86 78 90 100 Z" fill="#d9a22e"/>
  <path d="M40 76 L50 92 L60 76 Z" fill="#fff"/>
  <circle cx="64" cy="86" r="3.5" fill="#2f8a5f"/>
  <rect x="44" y="66" width="12" height="12" fill="#f1c7a3"/>
  <path d="M22 50 Q20 18 50 16 Q80 18 78 50 Q80 62 74 66 L74 46 Q50 40 26 46 L26 66 Q20 62 22 50 Z" fill="#c9ccd1"/>
  <ellipse cx="50" cy="50" rx="23" ry="26" fill="#f6d2b1"/>
  <path d="M27 44 Q38 26 62 30 Q72 34 74 44 Q60 32 44 34 Q32 36 27 44 Z" fill="#d8dbe0"/>
  ${brows}
  <circle cx="39" cy="48" r="8" fill="none" stroke="#b8352f" stroke-width="2.6"/>
  <circle cx="61" cy="48" r="8" fill="none" stroke="#b8352f" stroke-width="2.6"/>
  <path d="M47 48 L53 48" stroke="#b8352f" stroke-width="2.6"/>
  <circle cx="39" cy="49" r="2.6" fill="#2b2b2b"/>
  <circle cx="61" cy="49" r="2.6" fill="#2b2b2b"/>
  <circle cx="33" cy="60" r="4" fill="#f2a8a0" opacity="0.55"/>
  <circle cx="67" cy="60" r="4" fill="#f2a8a0" opacity="0.55"/>
  <path d="M50 52 Q48 58 51 59" stroke="#d9a98a" stroke-width="2" fill="none" stroke-linecap="round"/>
  ${mouth}
</svg>`;
}

/** Small variety so Maggie doesn't sound like a recording. */
export const LINES = {
  praise: ['Lovely.', 'Spot on.', 'That’s it.', 'Very nice.', 'Textbook.', 'Smashing.'],
  retry: ['Not to worry, have another go.', 'Happens to everyone. Again, nice and calm.', 'No harm done. Let’s try that once more.'],
  passed: [
    'Well, I’d sign that off. Lovely driving.',
    'That’s a pass in my book. Put the kettle on.',
    'Very tidy indeed. You should be pleased with that.'
  ],
  failed: [
    'Not this time, but that’s what practice is for. We’ll get there.',
    'Close, but not quite. Let’s look at what happened, then have another go.',
    'Don’t be disheartened. I failed my first one too, and I’ve been driving for fifty years.'
  ]
};

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
