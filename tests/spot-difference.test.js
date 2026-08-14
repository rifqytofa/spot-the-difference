// Automated regression tests for the Spot the Difference game.
// Run with: node tests/spot-difference.test.js
// This intentionally tests the game data and coordinate/hit-test rules without
// requiring a browser. Browser/device rendering still needs a final smoke test.
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

function assert(ok, msg){ if(!ok) throw new Error('FAIL: '+msg); console.log('PASS: '+msg); }
function extractLevels(){
  const m = html.match(/const levels=([\s\S]*?)\nlet current=/);
  if(!m) throw new Error('Cannot locate levels data');
  return Function('return ('+m[1].trim().replace(/;$/, '')+')')();
}
const levels = extractLevels();
assert(Array.isArray(levels) && levels.length === 10, '10 levels exist');
levels.forEach((level, li) => {
  assert(level.d.length >= 4 && level.d.length <= 7, `level ${li+1}: 4-7 differences`);
  const keys = new Set();
  level.d.forEach((d, i) => {
    assert(Number.isFinite(d.x) && Number.isFinite(d.y) && Number.isFinite(d.r), `level ${li+1} diff ${i+1}: numeric coordinates/radius`);
    assert(d.x >= 0 && d.x <= 1200 && d.y >= 0 && d.y <= 720, `level ${li+1} diff ${i+1}: inside canvas`);
    assert(d.r > 0 && d.r < 250, `level ${li+1} diff ${i+1}: sensible target size`);
    const k = `${d.x},${d.y}`;
    assert(!keys.has(k), `level ${li+1}: no duplicate target centers`);
    keys.add(k);
    assert(typeof d.t === 'string' && d.t.length > 0, `level ${li+1} diff ${i+1}: has description`);
  });
});

// Reproduce the game's nearest-target hit test with its tolerance.
function hit(level, x, y, found=[]){
  let best=-1, bd=Infinity;
  level.d.forEach((d,i)=>{
    if(found.includes(i)) return;
    const q=Math.hypot(x-d.x,y-d.y);
    if(q <= d.r+24 && q < bd){best=i;bd=q;}
  });
  return best;
}
levels.forEach((level, li) => {
  level.d.forEach((d, i) => {
    assert(hit(level,d.x,d.y)===i, `level ${li+1} diff ${i+1}: center click finds itself`);
    assert(hit(level,d.x,d.y,Array.from({length:i},(_,k)=>k))===i, `level ${li+1} diff ${i+1}: remains discoverable after earlier finds`);
    assert(hit(level,d.x,d.y,[i])===-1, `level ${li+1} diff ${i+1}: cannot score twice`);
  });
});

// Source-level regression checks for the bugs previously reported.
assert(/score=Math\.max\(0,score-100\)/.test(html), 'hint subtracts 100 points');
assert(/Math\.max\(400,1000-Math\.floor\(s-20\)\*25\)/.test(html), 'score decays after 20 seconds and floors at 400');
assert(/if\(wrong>=5\)over\(\)/.test(html), 'five wrong clicks trigger Game Over');
assert(/save\.coins\+=100/.test(html), 'completed level awards 100 coins');
assert(/mark\(ac,ds\[i\]\);mark\(bc,ds\[i\]\)/.test(html), 'found differences are marked on both images');
assert(/d\.r\+12/.test(html), 'circle size is derived from target radius');
assert(/\(canvas\.width\/r\.width\)/.test(html) && /\(canvas\.height\/r\.height\)/.test(html), 'pointer coordinates scale with displayed canvas size');

console.log('\nALL AUTOMATED REGRESSION TESTS PASSED.');
console.log('Note: this does not replace a real browser/Android touch smoke test.');
