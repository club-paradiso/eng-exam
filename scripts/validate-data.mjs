import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../data.js', import.meta.url), 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'data.js' });

const data = sandbox.window.DIAG_DATA;
if (!data) throw new Error('window.DIAG_DATA was not created');

const fail = (message) => { throw new Error(message); };
const assert = (condition, message) => { if (!condition) fail(message); };

const objective = data.objectiveItems ?? [];
const foundation = data.foundation ?? [];
const ceiling = data.ceiling ?? [];
const performance = data.performanceTasks ?? [];
const all = [...objective, ...foundation, ...ceiling, ...performance];

assert(objective.length === data.meta?.objectiveCount,
  `objectiveCount mismatch: meta=${data.meta?.objectiveCount}, actual=${objective.length}`);
assert(performance.length === data.meta?.performanceCount,
  `performanceCount mismatch: meta=${data.meta?.performanceCount}, actual=${performance.length}`);

const ids = all.map((item) => item.id);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
assert(duplicates.length === 0, `duplicate item ids: ${[...new Set(duplicates)].join(', ')}`);

for (const item of [...objective, ...foundation, ...ceiling]) {
  assert(item.id && item.section && item.format, `missing required fields: ${JSON.stringify(item)}`);
  if (item.format === 'mcq') {
    assert(Array.isArray(item.choices) && item.choices.length >= 2,
      `${item.id}: MCQ choices missing`);
    assert(Number.isInteger(item.answer) && item.answer >= 0 && item.answer < item.choices.length,
      `${item.id}: answer index out of range`);
  } else if (item.format === 'short') {
    assert(typeof item.answer_guide === 'string' && item.answer_guide.length > 0,
      `${item.id}: short response answer_guide missing`);
  } else {
    fail(`${item.id}: unsupported objective format ${item.format}`);
  }
}

for (const task of performance) {
  assert(data.rubrics?.[task.id], `${task.id}: rubric missing`);
  assert(Object.keys(data.rubrics[task.id]).length >= 4, `${task.id}: rubric too small`);
}

const requiredGrammarEvidence = {
  1: ['G09', 'G10'],
  2: ['G11', 'G12'],
  3: ['G01', 'G17', 'G18'],
  4: ['G02', 'G03', 'G04', 'G05'],
  5: ['G13', 'G14'],
  6: ['G15', 'G16'],
  7: ['G06', 'G07'],
};
const objectiveIds = new Set(objective.map((item) => item.id));
for (const [part, required] of Object.entries(requiredGrammarEvidence)) {
  const missing = required.filter((id) => !objectiveIds.has(id));
  assert(missing.length === 0, `혼공 Part ${part} evidence missing: ${missing.join(', ')}`);
  assert(required.length >= 2, `혼공 Part ${part} has fewer than 2 evidence units`);
}

for (const item of objective) {
  assert(Array.isArray(item.kr2022) && item.kr2022.length > 0, `${item.id}: KR2022 tag missing`);
  assert(typeof item.cefr === 'string' && item.cefr.length > 0, `${item.id}: CEFR/evidence tag missing`);
  assert(typeof item.skill === 'string' && item.skill.length > 0, `${item.id}: diagnostic skill missing`);
}

console.log(`Validated ${objective.length} objective items, ${foundation.length} foundation items, ${ceiling.length} ceiling items, and ${performance.length} performance tasks.`);
