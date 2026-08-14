// Automated regression tests for the Spot the Difference game.
// Run with: node tests/spot-difference.test.js
// These tests validate game data and deterministic gameplay rules without a browser.
const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
function assert(ok,msg){if(!ok)throw new Error('FAIL: '+msg);console.log('PASS: '+msg)}
function extractData(){
  const m=html.match(/const DATA=([\\s\\S]*?)\\];\\nconst levels=/);
  if(!m)throw new Error('Cannot locate DATA');
  return Function('return ('+m[1]+'])')();
}
const data=extractData();
assert(Array.isArray(data)&&data.length===10,'10 levels exist');
data.forEach((level,li)=>{
  const [name,count,hits]=level;
  assert(typeof name==='string'&&name.length>0,`level ${li+1}: has name`);
  assert(Number.isInteger(count)&&count>=4&&count<=7,`level ${li+1}: 4-7 differences`);
  assert(Array.isArray(hits)&&hits.length===count,`level ${li+1}: difference count matches data`);
  const centers=new Set();
  hits.forEach((h,i)=>{
    assert(Array.isArray(h)&&h.length>=4,`level ${li+1} diff ${i+1}: valid target record`);
    const [shape,x,y,r]=h;
    assert(typeof shape==='string'&&shape.length>0,`level ${li+1} diff ${i+1}: has shape`);
    assert(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(r),`level ${li+1} diff ${i+1}: numeric geometry`);
    assert(x>=0&&x<=1200&&y>=0&&y<=720,`level ${li+1} diff ${i+1}: center inside canvas`);
    assert(r>0&&r<250,`level ${li+1} diff ${i+1}: sensible target size`);
    const key=`${x},${y}`;assert(!centers.has(key),`level ${li+1}: no duplicate centers`);centers.add(key);
  });
});

// Deterministic hit-test model: target centers must be accepted, found targets must be ignored.
function hit(hits,x,y,found=[]){
  let best=-1,bd=Infinity;
  hits.forEach((h,i)=>{if(found.includes(i))return;const q=Math.hypot(x-h[1],y-h[2]);if(q<=Math.max(18,h[3]*0.45)+24&&q<bd){best=i;bd=q}});
  return best;
}
data.forEach((level,li)=>{
  const hits=level[2];
  hits.forEach((h,i)=>{
    assert(hit(hits,h[1],h[2])===i,`level ${li+1} diff ${i+1}: center click finds target`);
    assert(hit(hits,h[1],h[2],hits.map((_,k)=>k).filter(k=>k!==i))===i,`level ${li+1} diff ${i+1}: target remains discoverable`);
    assert(hit(hits,h[1],h[2],[i])===-1,`level ${li+1} diff ${i+1}: cannot score twice`);
  });
});

// Regression checks for previously reported rules.
assert(/score=Math\.max\(0,score-100\)/.test(html),'hint subtracts 100 points');
assert(/Math\.max\(400,1000-Math\.floor\(s-20\)\*25\)/.test(html),'score decays after 20 seconds and floors at 400');
assert(/if\(wrong>=5\)over\(\)/.test(html),'five wrong clicks trigger Game Over');
assert(/save\.coins\+=100/.test(html),'completed level awards 100 coins');
assert(/d\.r\+12/.test(html),'circle size is derived from target radius');
assert(/canvas\.width\/r\.width/.test(html)&&/canvas\.height\/r\.height/.test(html),'pointer coordinates scale with displayed canvas size');
assert(/const DATA=/.test(html)&&/const levels=DATA\.map/.test(html),'game uses structured level data');

console.log('\nALL AUTOMATED REGRESSION TESTS PASSED.');
console.log('Note: this does not replace a real browser/Android touch smoke test.');
