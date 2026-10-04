// Рисует превью для соцсетей и мессенджеров: assets/projects/<слаг>/og.jpg
// (1200×630, иконка кейса из thumb.svg по центру и подпись). Их подхватывает
// _tools/build-case-pages.mjs. Перезапускать, когда меняется thumb.svg или
// название кейса; потом — build-case-pages.mjs.
//
// Нужны Google Chrome и локальный сервер из корня сайта:
//   python3 -m http.server 8765 --bind 127.0.0.1
//   node _tools/build-og-images.mjs
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(ROOT);
const TPL = '_og-tmp.html';
fs.writeFileSync(TPL, `<!doctype html><meta charset="utf-8"><style>
html,body{margin:0;width:1200px;height:630px;background:#0a0a0a;overflow:hidden}
.t{position:absolute;left:50%;top:282px;width:1000px;height:1000px;margin:-500px 0 0 -500px;object-fit:contain}
.n{position:absolute;left:0;right:0;bottom:44px;text-align:center;color:#fff;font:400 22px/1 ui-monospace,'SF Mono',Menlo,monospace;letter-spacing:.18em;text-transform:uppercase}
.n span{color:rgba(255,255,255,.45)}
</style><img class="t" id="t"><div class="n" id="n"></div>
<script>const q=new URLSearchParams(location.search);document.getElementById('t').src='assets/projects/'+q.get('f')+'/thumb.svg';document.getElementById('n').innerHTML=q.get('t')+' <span>— Sasha Mindrin</span>';</script>`);
const port=9300+Math.floor(Math.random()*500);
const chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new',`--remote-debugging-port=${port}`,'--user-data-dir=/tmp/cdp-prof-'+port,'--hide-scrollbars','about:blank'],{stdio:'ignore'});
const kill=()=>{try{chrome.kill('SIGKILL')}catch{}};process.on('exit',kill);setTimeout(()=>process.exit(2),90000);
const sl=ms=>new Promise(r=>setTimeout(r,ms));let ws;
for(let i=0;i<50;i++){try{const j=await (await fetch(`http://127.0.0.1:${port}/json`)).json();const p=j.find(x=>x.type==='page');if(p){ws=new WebSocket(p.webSocketDebuggerUrl);break;}}catch{}await sl(200);}
await new Promise(r=>ws.onopen=r);let id=0;const pend=new Map();
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}));});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id);}};
await send('Runtime.enable');await send('Page.enable');
const ev=async x=>(await send('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true})).result.result?.value;
const W=+process.argv[2];
await send('Emulation.setDeviceMetricsOverride',{width:W,height:900,deviceScaleFactor:1,mobile:W<500});
const js=fs.readFileSync('main.js','utf8');const ps=new Function('return '+js.match(/const projectsData = (\[[\s\S]*?\n\]);/)[1])();
await send('Emulation.setDeviceMetricsOverride',{width:1200,height:630,deviceScaleFactor:1,mobile:false});
for(const p of ps){
  await send('Page.navigate',{url:'http://127.0.0.1:8765/'+TPL+'?f='+p.folder+'&t='+encodeURIComponent(p.titleEn)});await sl(900);
  const sh=await send('Page.captureScreenshot',{format:'jpeg',quality:88});
  fs.writeFileSync(`assets/projects/${p.folder}/og.jpg`,Buffer.from(sh.result.data,'base64'));
}
fs.unlinkSync(TPL);
console.log(`превью: ${ps.length}`);
kill();process.exit(0);
