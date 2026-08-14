const fs=require('fs');
const path='index.html';
let s=fs.readFileSync(path,'utf8');
const start=s.indexOf('let visualTargets=[];');
const end=s.indexOf('start.onclick=()=>',start);
if(start<0||end<0) throw new Error('Gameplay detection block not found');
const replacement=`let visualTargets=[];
function renderBase(){background(a,cur);scene(a,cur,0);background(b,cur);scene(b,cur,1)}
function buildVisualTargets(){
  const ia=a.getImageData(0,0,W,H).data, ib=b.getImageData(0,0,W,H).data;
  const step=4, gw=Math.ceil(W/step), gh=Math.ceil(H/step), seen=new Uint8Array(gw*gh), hot=new Uint8Array(gw*gh);
  for(let gy=0;gy<gh;gy++) for(let gx=0;gx<gw;gx++){
    const x=Math.min(W-1,gx*step+2), y=Math.min(H-1,gy*step+2), k=(y*W+x)*4;
    const d=Math.abs(ia[k]-ib[k])+Math.abs(ia[k+1]-ib[k+1])+Math.abs(ia[k+2]-ib[k+2]);
    hot[gy*gw+gx]=d>48?1:0;
  }
  const comps=[];
  for(let gy=0;gy<gh;gy++) for(let gx=0;gx<gw;gx++){
    const id=gy*gw+gx;if(!hot[id]||seen[id])continue;
    const q=[id];seen[id]=1;let minx=gx,maxx=gx,miny=gy,maxy=gy,count=0;
    while(q.length){const z=q.pop(),zx=z%gw,zy=(z-zx)/gw;count++;minx=Math.min(minx,zx);maxx=Math.max(maxx,zx);miny=Math.min(miny,zy);maxy=Math.max(maxy,zy);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=zx+dx,ny=zy+dy;if(nx<0||ny<0||nx>=gw||ny>=gh)continue;const ni=ny*gw+nx;if(hot[ni]&&!seen[ni]){seen[ni]=1;q.push(ni)}}
    }
    if(count>=3) comps.push({x:minx*step,y:miny*step,w:(maxx-minx+1)*step,h:(maxy-miny+1)*step,area:count});
  }
  const used=new Set(), targets=[];
  levels[cur].hits.forEach((h,idx)=>{
    const hx=h[1],hy=h[2],hr=h[3];let best=-1,bd=Infinity;
    comps.forEach((c,i)=>{if(used.has(i))return;const cx=c.x+c.w/2,cy=c.y+c.h/2;const d=Math.hypot(cx-hx,cy-hy);if(d<=Math.max(80,hr+70)&&d<bd){best=i;bd=d}});
    if(best>=0){const c=comps[best];used.add(best);targets.push({id:idx,x:c.x+c.w/2,y:c.y+c.h/2,rx:Math.max(10,c.w/2),ry:Math.max(10,c.h/2),r:Math.max(10,Math.hypot(c.w,c.h)/2),area:c.area});}
    else targets.push({id:idx,x:hx,y:hy,rx:Math.max(10,hr),ry:Math.max(10,hr),r:Math.max(10,hr),area:0});
  });
  visualTargets=targets;
}
function drawAll(){renderBase();if(!visualTargets.length||visualTargets.length!==levels[cur].n)buildVisualTargets();for(const i of found){const t=visualTargets[i];if(t){marker(a,t);marker(b,t)}}if(running&&hintIdx>=0&&performance.now()<hintEnd){const t=visualTargets[hintIdx];if(t){hintMarker(a,t);hintMarker(b,t)}requestAnimationFrame(drawAll)}else hintIdx=-1}
function marker(c,t){c.save();c.strokeStyle='#ff264f';c.lineWidth=6;c.setLineDash([13,8]);c.beginPath();c.ellipse(t.x,t.y,t.rx+8,t.ry+8,0,0,Math.PI*2);c.stroke();c.restore()}
function hintMarker(c,t){c.save();c.strokeStyle='#ffe066';c.lineWidth=8;c.setLineDash([15,9]);c.beginPath();c.ellipse(t.x,t.y,t.rx+12,t.ry+12,0,0,Math.PI*2);c.stroke();c.setLineDash([]);c.fillStyle='#ffe066';c.font='700 22px system-ui';c.textAlign='center';c.fillText('PETUNJUK',t.x,t.y-t.ry-18);c.restore()}
function pointer(canvas,e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
function click(e,canvas){if(!running)return;e.preventDefault();sClick();const p=pointer(canvas,e);let best=-1,bd=Infinity;for(let i=0;i<visualTargets.length;i++){if(found.includes(i))continue;const t=visualTargets[i];const dx=(p.x-t.x)/(t.rx+14),dy=(p.y-t.y)/(t.ry+14);if(dx*dx+dy*dy<=1){const d=Math.hypot(p.x-t.x,p.y-t.y);if(d<bd){best=i;bd=d}}}if(best>=0){found.push(best);sGood();ui();drawAll();if(found.length===levels[cur].n)finish()}else{wrong++;sBad();ui();if(wrong>=5)over()}}
A.addEventListener('pointerdown',e=>click(e,A));B.addEventListener('pointerdown',e=>click(e,B));
`;
s=s.slice(0,start)+replacement+s.slice(end);
s=s.replace('function resetLevel(){clearInterval(timer);found=[];wrong=0;score=1000;hintCount=0;hintIdx=-1;running=false;ui();drawAll()}','function resetLevel(){clearInterval(timer);found=[];wrong=0;score=1000;hintCount=0;hintIdx=-1;visualTargets=[];running=false;ui();drawAll()}');
s=s.replace("hintIdx=rem[Math.floor(Math.random()*rem.length)];hintEnd=performance.now()+2800", "if(!visualTargets.length||visualTargets.length!==levels[cur].n)buildVisualTargets();hintIdx=rem[Math.floor(Math.random()*rem.length)];hintEnd=performance.now()+2800");
fs.writeFileSync(path,s);
console.log('Patched gameplay detection, coordinate scaling, and target-sized markers.');
