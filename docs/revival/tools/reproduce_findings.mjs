// Local, dependency-free reproductions extracted from reviewed source.
// No imports from application modules, no environment reads, no network or database calls.
// These demonstrate specific logic defects, not deployed-system exploitation.
import assert from 'node:assert/strict';

const normalize = text => text.toLowerCase()
  .replace(/food\s*:\s*/g, '').replace(/quantity\s*:\s*/g, '')
  .replace(/[^\w\s]/g, '').trim();
assert.equal(normalize('food: rice quantity: 1.5 cups'), normalize('food: rice quantity: 15 cups'));
assert.equal(normalize('دجاج'), normalize('تفاح'));
console.log('F24 reproduced: distinct quantities and Arabic food names collide after normalization.');

const cutoff = new Date('2026-09-21T00:00:00Z');
const wouldSendReminder = dates => dates.filter(d => new Date(d) < cutoff).length === 0;
assert.equal(wouldSendReminder(['2026-09-20T00:00:00Z']), false);
assert.equal(wouldSendReminder(['2026-09-21T23:59:00Z']), true);
console.log('F21 reproduced: an old reminder suppresses sending; a recent reminder does not.');

let reportedError = false, reportedSuccess = false;
async function storeSave() {
  try { throw new Error('simulated database error'); }
  catch { reportedError = true; } // matches programstores updateProgram catch behavior
}
await storeSave().then(() => { reportedSuccess = true; });
assert.ok(reportedError && reportedSuccess);
console.log('F17 reproduced: swallowed store error resolves, allowing the UI success callback.');

function eqOrNull(query, column, value) {
  return value != null ? [...query, [column, value]] : query;
}
assert.deepEqual(eqOrNull([], 'id', null), []);
console.log('F14 reproduced: null identity removes the filter; actual row access still depends on grants/RLS.');

function lum(hex) {
  const c = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return c.reduce((s, x, i) => s + x * [0.2126, 0.7152, 0.0722][i], 0);
}
const ratio = (lum('ffffff') + 0.05) / (lum('d7bd21') + 0.05);
assert.ok(ratio < 3);
console.log(`F09 calculated: white on #d7bd21 contrast is ${ratio.toFixed(2)}:1 before opacity/background compositing.`);
