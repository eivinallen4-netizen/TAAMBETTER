// Call Flow Score scoring and routing tests (the /score acceptance checklist).
// Run: node --test --experimental-strip-types scripts/score-quiz.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUIZ, scoreQuiz, routeLead, computeResult, tierFor, callBrief, cleanAnswers, isComplete } from '../lib/score-quiz.ts';

const ids = QUIZ.pillars.map((p) => p.id);
const scores = (vals: number[]) => Object.fromEntries(ids.map((id, i) => [id, vals[i]]));

test('all 100s score 100', () => {
  assert.equal(scoreQuiz(scores([100, 100, 100, 100, 100, 100, 100])), 100);
});

test('one pillar at 20 and six at 100 scores 34', () => {
  assert.equal(scoreQuiz(scores([20, 100, 100, 100, 100, 100, 100])), 34);
});

test('[65, 65, 50, 65, 35, 65, 50] scores 39, Starting from the basics, #1 gap Speed to lead', () => {
  const vals = [65, 65, 50, 65, 35, 65, 50];
  assert.equal(scoreQuiz(scores(vals)), 39);
  assert.equal(tierFor(39).label, 'Starting from the basics');
  // Same answers through the full result path (option index = position of that score in the list).
  const answers: Record<string, string> = { revenue: '750-1.5m', team: '6-15', trade: 'hvac', role: 'owner', timing: 'now' };
  QUIZ.pillars.forEach((p, i) => { answers[p.id] = String(p.options.findIndex((o) => o.score === vals[i])); });
  const r = computeResult(answers);
  assert.equal(r.score, 39);
  assert.equal(r.weakest.label, 'Speed to lead');
  assert.equal(r.route, 'hot');
  assert.ok(isComplete(answers));
  const brief = callBrief({ firstName: 'Mike', lastName: 'Reyes', business: 'Desert Air HVAC' }, answers, r);
  assert.equal(
    brief,
    'Mike Reyes, owner at Desert Air HVAC (HVAC, $750K–$1.5M, 6–15 people). Call Flow Score 39 (Starting from the basics). ' +
      '#1 gap: Speed to lead (35). They said "When someone gets to it, sometimes the next day". Timing: Right away, if the plan makes sense. ' +
      'Open with: "I saw your answer on speed to lead. How many calls went to voicemail last week?"'
  );
});

test('tiers', () => {
  assert.equal(tierFor(86).label, 'Booked solid');
  assert.equal(tierFor(85).label, 'Strong, with one gap');
  assert.equal(tierFor(72).label, 'Strong, with one gap');
  assert.equal(tierFor(71).label, 'Leaking calls');
  assert.equal(tierFor(56).label, 'Leaking calls');
  assert.equal(tierFor(55).label, 'Big gaps');
  assert.equal(tierFor(41).label, 'Big gaps');
  assert.equal(tierFor(40).label, 'Starting from the basics');
});

test('routing', () => {
  const rank = (v: string) => QUIZ.qualifiers[0].options.find((o) => o.value === v)!.rank!;
  const auth = (v: string) => QUIZ.qualifiers[3].options.find((o) => o.value === v)!.authority!;
  const q = QUIZ.config.qualifyRevenueRank;
  assert.equal(routeLead(rank('750-1.5m'), auth('owner'), 'now', q), 'hot');
  assert.equal(routeLead(rank('300-749'), auth('manager'), 'now', q), 'qualified');
  assert.equal(routeLead(rank('150-299'), auth('owner'), 'now', q), 'nurture');
  assert.equal(routeLead(rank('300-749'), auth('partner'), '30days', q), 'hot');
  assert.equal(routeLead(rank('1.5m+'), auth('owner'), 'notnow', q), 'qualified');
});

test('cleanAnswers drops unknown ids and bad values', () => {
  const clean = cleanAnswers({ revenue: '1.5m+', role: 'ceo', website: '9', google: '2', evil: 'x' });
  assert.deepEqual(clean, { revenue: '1.5m+', google: '2' });
});
