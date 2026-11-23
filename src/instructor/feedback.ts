import type { Fault } from '../rules/types';
import type { LessonResult } from '../scoring/lessonScore';
import { groupFaults, type TestTally } from '../scoring/dvsa';
import type { QuizQuestion } from '../content/schema';

/**
 * Maggie's debrief: specific, kind, and always citing the Highway Code.
 * Pure function so it can be unit-tested.
 */
export function debriefLines(r: LessonResult, tally: TestTally, faults: readonly Fault[], quiz: { correct: number; total: number; questions: QuizQuestion[] }): string[] {
  const out: string[] = [];
  const groups = groupFaults(faults);
  const worst = groups[0];
  const cite = (f: Fault) => (f.rules.length ? ` (Highway Code rule${f.rules.length > 1 ? 's' : ''} ${f.rules.join(' and ')})` : '');

  if (r.passed) {
    if (!faults.length) out.push('Not a single fault on the drive. I’ve marked tests for thirty-one years and that doesn’t happen often. Lovely.');
    else
      out.push(
        `That’s a pass, with ${tally.minors} driving fault${tally.minors === 1 ? '' : 's'}. The one I’d work on is ${worst.fault.category.toLowerCase()}${cite(worst.fault)}. ${worst.fault.message}`
      );
  } else if (tally.dangerous || tally.serious) {
    out.push(`Not this time, I’m afraid. ${worst.fault.message}${cite(worst.fault)}`);
    out.push('Everything else is fixable in one more go. Have a look at the replay, then try the test again.');
  } else if (tally.minors > 15) {
    out.push(`Lots of small things added up: ${tally.minors} driving faults, and the limit is fifteen. The most common was ${worst.fault.category.toLowerCase()}${cite(worst.fault)}.`);
  } else {
    out.push(`So close. You scored ${r.scorePct}% and you need 80% to move on.`);
  }

  if (quiz.total) {
    if (quiz.correct === quiz.total) out.push('Full marks on the questions, too. Somebody’s been reading their Highway Code.');
    else {
      const rules = [...new Set(quiz.questions.flatMap((q) => q.rules))].slice(0, 3);
      out.push(`On the questions, you got ${quiz.correct} out of ${quiz.total}. Have a quick read of rule${rules.length > 1 ? 's' : ''} ${rules.join(', ')} before next time.`);
    }
  }
  if (r.passed) out.push('See you tomorrow. Same time, same car park, and I’ll bring the biscuits.');
  return out;
}
