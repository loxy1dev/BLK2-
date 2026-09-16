'use client';
import {useEffect,useState} from 'react';
import {addCoins,beginGame,endGame,getCoins,recordGameResult,spendCoins} from '@/lib/wallet';

const mults=[1.05,1.12,1.22,1.35,1.5,1.68,1.88,2.1,2.4,2.8,3.4,4.2];
const floors=12;

type Block={x:number;width:number};

export function Towers(){
 const [bet,setBet]=useState(100);
 const [started,setStarted]=useState(false);
 const [floor,setFloor]=useState(0);
 const [tower,setTower]=useState<Block[]>([]);
 const [moving,setMoving]=useState(false);
 const [x,setX]=useState(-78);
 const [dir,setDir]=useState(1);
 const [msg,setMsg]=useState('Mise ta quantité, clique sur JOUER, puis appuie sur POSER quand le bloc est au-dessus de la tour.');
 const [boom,setBoom]=useState(false);
 const [round,setRound]=useState(0);

 useEffect(()=>{
  if(!started||!moving)return;
  const id=window.setInterval(()=>setX(v=>{
   const n=v+dir*2.5;
   if(n>78){setDir(-1);return 78}
   if(n<-78){setDir(1);return -78}
   return n;
  }),30);
  return()=>window.clearInterval(id);
 },[started,moving,dir]);

 const start=()=>{
  const b=Math.floor(Number(bet));
  if(!Number.isFinite(b)||b<10){setMsg('Mise minimum : 10 coins.');return}
  if(!spendCoins(b)){setMsg('Coins insuffisants.');return}
  beginGame();
  setTower([{x:0,width:72}]);
  setFloor(0);
  setX(-78);
  setDir(1);
  setMoving(true);
  setStarted(true);
  setBoom(false);
  setRound(r=>r+1);
  setMsg('🎯 VISE LE CENTRE DE LA TOUR, PUIS CLIQUE sur POSER.');
 };

 const build=()=>{
  if(!started||!moving)return;
  setMoving(false);
  const prev=tower[tower.length-1];
  const width=72;
  const overlap=Math.min(x+width/2,prev.x+prev.width/2)-Math.max(x-width/2,prev.x-prev.width/2);

  if(overlap<16){
   setBoom(true);
   window.setTimeout(()=>setBoom(false),700);
   recordGameResult('Towers','loss',-bet);
   setStarted(false);
   endGame();
   setMsg('💥 TOUR ÉCROULÉE ! Tu perds ta mise.');
   return;
  }

  const newWidth=Math.max(36,Math.min(prev.width,overlap+10));
  const newX=Math.max(-38,Math.min(38,x+(prev.x-x)*0.35));
  const nextFloor=floor+1;
  const next=[...tower,{x:newX,width:newWidth}];
  setTower(next);
  setFloor(nextFloor);
  const mult=mults[nextFloor-1]||mults[mults.length-1];
  const payout=Math.floor(bet*mult);

  if(nextFloor>=floors){
   addCoins(payout);
   recordGameResult('Towers','win',payout-bet);
   setStarted(false);
   endGame();
   setMsg(`🏆 12 ÉTAGES ! Tu encaisses ${payout.toLocaleString('fr-FR')} coins.`);
   return;
  }

  setMsg(`✅ ÉTAGE ${nextFloor} ! Multiplicateur ×${mult.toFixed(2)}. Continue ou encaisse.`);
  window.setTimeout(()=>{
   setX(newX>=0?-78:78);
   setDir(newX>=0?1:-1);
   setMoving(true);
  },450);
 };

 const cash=()=>{
  if(!started)return;
  const mult=floor===0?1:mults[Math.min(floor-1,mults.length-1)];
  const payout=Math.floor(bet*mult);
  addCoins(payout);
  recordGameResult('Towers','win',payout-bet);
  setStarted(false);
  setMoving(false);
  endGame();
  setMsg(`💰 CASHOUT ! ×${mult.toFixed(2)} → ${payout.toLocaleString('fr-FR')} coins.`);
 };

 const current=floor===0?1:(mults[Math.min(floor-1,mults.length-1)]||1);

 return <div className="game-panel tower-game">
  <div className="game-head">
   <div><h2>🏗️ TOWER</h2><p className="muted">Empile les blocs. Plus la tour monte, plus le multiplicateur augmente. Si tu rates, tu perds la mise.</p></div>
   <div className="mult">{started?`×${current.toFixed(2)}`:'×1.00'}</div>
  </div>

  <div className="howto">
   <div><b>1</b><span>Choisis ta mise</span></div>
   <div><b>2</b><span>Attends le bon alignement</span></div>
   <div><b>3</b><span>POSE le bloc</span></div>
   <div><b>4</b><span>CASHOUT avant de rater</span></div>
  </div>

  <div className="betbar">
   <input className="field" type="number" min="10" value={bet} onChange={e=>setBet(Number(e.target.value))} disabled={started}/>
   <button className="maxbtn" onClick={()=>setBet(getCoins())} disabled={started}>MAX</button>
   {!started?<button className="playbtn" onClick={start} disabled={getCoins()<10}>▶ JOUER</button>:<button className="cashbtn" onClick={cash}>💰 CASHOUT ×{current.toFixed(2)}</button>}
  </div>

  <div className={`tower-stage ${boom?'collapse':''}`}>
   <div className="sky"><span className="moon">☾</span><span className="cloud c1">☁</span><span className="cloud c2">☁</span><div className="city">▥ ▦ ▥ ▥ ▦ ▥ ▦ ▥</div></div>

   <div className="crane"><div className="crane-beam"/><div className="crane-cable"/><div className="crane-hook">⌄</div></div>

   <div className="floor-counter">ÉTAGE <b>{floor}</b> / {floors}<span>×{current.toFixed(2)}</span></div>

   <div className="tower-stack">
    {tower.map((b,i)=><div key={`${round}-${i}`} className="block" style={{width:`${b.width}%`,transform:`translateX(${b.x*.55}px)`}}><span>{i===0?'🏢':'🏠'}</span><i>▦ ▦ ▦</i></div>)}
    {started&&moving&&<div className="moving-block" style={{transform:`translateX(${x*.55}px)`}}>🏠</div>}
   </div>

   {!started&&<div className="start-help">🏗️ <b>Construis ta tour</b><small>Aligne les maisons et monte étage par étage.</small></div>}
   {started&&moving&&<div className="aim-line"/>
   }
   {started&&moving&&<button className="build-btn" onClick={build}>🏠 POSER</button>}
   {started&&<div className="risk-note">⚠️ Rater = mise perdue</div>}
   {boom&&<div className="collapse-pop">💥 COLLAPSE</div>}
  </div>

  <div className="ladder">{mults.map((m,i)=><span key={m} className={i<floor?'done':i===floor&&started?'active':''}><small>ÉTAGE {i+1}</small>×{m.toFixed(2)}</span>)}</div>
  <p className="game-message">{msg}</p>

  <style jsx>{`
   .tower-game{overflow:hidden}.howto{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:12px 0}.howto div{display:flex;align-items:center;gap:7px;padding:9px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);border-radius:10px;font-size:11px;color:#b9c0d0}.howto b{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:#7c3aed;color:white;font-size:11px}.betbar{display:flex;gap:8px;align-items:center;margin-bottom:12px}.betbar .field{flex:1}.tower-stage{position:relative;height:540px;border-radius:22px;overflow:hidden;background:linear-gradient(#071326 0%,#17325e 55%,#282631 55%,#111319 100%);border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 -100px 100px rgba(0,0,0,.35)}.sky{position:absolute;inset:0}.moon{position:absolute;right:9%;top:30px;font-size:42px;color:#fff;opacity:.7}.cloud{position:absolute;font-size:44px;opacity:.1}.c1{top:75px;left:8%;animation:cloud 18s linear infinite}.c2{top:135px;left:60%;animation:cloud 22s linear infinite reverse}.city{position:absolute;bottom:72px;width:100%;text-align:center;color:#667085;opacity:.35;font-size:35px;letter-spacing:7px}.crane{position:absolute;right:7%;top:22px;width:190px;height:170px;z-index:3}.crane-beam{position:absolute;top:28px;right:0;width:175px;height:7px;background:#eab308;transform:skewX(-15deg)}.crane-cable{position:absolute;top:33px;right:38px;width:2px;height:115px;background:#d4d4d8}.crane-hook{position:absolute;top:140px;right:31px;color:#facc15;font-size:25px}.floor-counter{position:absolute;top:14px;left:14px;right:14px;display:flex;justify-content:space-between;padding:10px 13px;border-radius:11px;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.08);font-size:11px;z-index:4}.floor-counter span{font-weight:1000;color:#fff}.tower-stack{position:absolute;left:50%;bottom:70px;width:min(500px,84%);height:390px;transform:translateX(-50%);display:flex;flex-direction:column-reverse;align-items:center;justify-content:flex-start;gap:2px}.block,.moving-block{height:32px;min-width:110px;border:1px solid rgba(255,255,255,.28);border-radius:5px;background:linear-gradient(180deg,#64748b,#263548);box-shadow:0 4px 12px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:space-between;padding:0 12px;color:#fff;font-size:13px}.block{animation:place .3s ease-out}.block span,.moving-block{font-size:21px}.block i{font-style:normal;color:#facc15;font-size:10px;letter-spacing:3px}.moving-block{position:absolute;bottom:calc(32px * var(--n,1));left:50%;width:72%;margin-left:-36%;justify-content:center;animation:sway .65s ease-in-out infinite alternate;z-index:5}.aim-line{position:absolute;bottom:102px;left:50%;height:270px;border-left:1px dashed rgba(255,255,255,.2);z-index:1}.build-btn{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);z-index:7;border:1px solid rgba(255,255,255,.25);background:linear-gradient(180deg,#8b5cf6,#5b21b6);color:#fff;font-weight:1000;font-size:19px;padding:14px 52px;border-radius:15px;cursor:pointer;box-shadow:0 8px 30px rgba(91,33,182,.4)}.build-btn:hover{transform:translateX(-50%) translateY(-2px)}.start-help{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);text-align:center;font-size:28px;font-weight:1000;color:#fff}.start-help small{display:block;margin-top:8px;font-size:12px;color:#aeb6c7;font-weight:500;white-space:nowrap}.risk-note{position:absolute;bottom:78px;left:50%;transform:translateX(-50%);font-size:10px;color:#ffb4bd;background:rgba(90,10,20,.35);padding:6px 10px;border-radius:8px;z-index:6}.collapse-pop{position:absolute;z-index:10;left:50%;top:50%;transform:translate(-50%,-50%);font-size:34px;font-weight:1000;color:#ff7180;text-shadow:0 0 25px rgba(255,60,80,.8);animation:pop .6s ease-out}.ladder{display:flex;gap:5px;overflow:auto;padding:9px 0 3px}.ladder span{display:flex;flex-direction:column;gap:2px;min-width:62px;padding:7px 8px;border-radius:8px;background:rgba(255,255,255,.05);font-size:11px;color:#929bad}.ladder small{font-size:8px}.ladder .done{color:#72f1b4;background:rgba(34,197,94,.12)}.ladder .active{color:#fff;background:rgba(124,92,255,.3)}.game-message{margin:8px 0 0;font-weight:700;color:#d7dbea}.collapse{animation:shake .5s ease-in-out}@keyframes place{from{opacity:0;transform:translateY(-20px) scale(.94)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes sway{from{rotate:-2deg}to{rotate:2deg}}@keyframes cloud{from{translate:-50px}to{translate:700px}}@keyframes shake{0%,100%{translate:0}25%{translate:-8px}50%{translate:8px}75%{translate:-5px}}@keyframes pop{from{opacity:0;scale:.6}to{opacity:1;scale:1}}@media(max-width:640px){.howto{grid-template-columns:repeat(2,1fr)}.tower-stage{height:500px}.crane{transform:scale(.7);transform-origin:top right}.tower-stack{width:92%}.start-help{font-size:23px}.start-help small{white-space:normal;width:240px}.build-btn{bottom:14px}}
  `}</style>
 </div>;
}
