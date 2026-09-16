'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {addCoins,getCoins,spendCoins} from '@/lib/wallet';

type Event={id:number;kind:'bonus'|'rocket';value:number;x:number;y:number};
type Speed=1|2|3|4;
const bets=[10,25,50,100,250,500];
const bonuses=[1,2,5,10];
const multipliers=[2,3,4,5];

export function AviaMasters(){
 const [bet,setBet]=useState(100),[running,setRunning]=useState(false),[balance,setBalance]=useState(0),[round,setRound]=useState(0),[roundBalance,setRoundBalance]=useState(100),[progress,setProgress]=useState(0),[altitude,setAltitude]=useState(22),[speed,setSpeed]=useState<Speed>(2),[events,setEvents]=useState<Event[]>([]),[message,setMessage]=useState('Choisis ta mise puis lance l’avion.'),[lastWin,setLastWin]=useState<number|null>(null),[autoplay,setAutoplay]=useState(false);
 const startRef=useRef(0); const timerRef=useRef<ReturnType<typeof setInterval>|null>(null); const eventRef=useRef<Event[]>([]);
 const coins=useMemo(()=>getCoins(),[balance]);
 useEffect(()=>{setBalance(getCoins())},[]);
 useEffect(()=>()=>{if(timerRef.current)clearInterval(timerRef.current)},[]);
 const finish=(landed:boolean,finalBalance:number)=>{if(timerRef.current)clearInterval(timerRef.current);timerRef.current=null;setRunning(false);setProgress(100);if(landed){addCoins(finalBalance);setBalance(getCoins());setLastWin(finalBalance);setMessage(`🛬 Atterrissage réussi : +${finalBalance.toLocaleString('fr-BE')} coins`)}else{setLastWin(0);setMessage('🌊 L’avion tombe dans l’eau : mise perdue.')}if(autoplay)setTimeout(()=>start(),900)};
 const start=()=>{if(running)return;const b=Math.floor(Number(bet));if(!Number.isFinite(b)||b<10){setMessage('Mise minimum : 10 coins.');return}if(!spendCoins(b)){setMessage('Coins insuffisants.');return}setBalance(getCoins());setRound(r=>r+1);setRoundBalance(b);setProgress(0);setAltitude(20);setEvents([]);eventRef.current=[];setLastWin(null);setRunning(true);setMessage('✈️ En vol — collecte les bonus et évite les roquettes.');startRef.current=Date.now();let t=0;timerRef.current=setInterval(()=>{t+=0.05*speed;const p=Math.min(100,t/8.5*100);let current=roundBalanceRef(b);let alt=20+Math.sin(t*1.15)*8+t*2.1;const nextEvent=eventRef.current.length<7&&Math.random()<0.08;if(nextEvent){const rocket=Math.random()<0.24;const value=rocket?0:(Math.random()<0.72?bonuses[Math.floor(Math.random()*bonuses.length)]:multipliers[Math.floor(Math.random()*multipliers.length)]);const e={id:Date.now()+Math.random(),kind:rocket?'rocket':'bonus',value,x:18+Math.random()*70,y:18+Math.random()*58};eventRef.current=[...eventRef.current,e];setEvents([...eventRef.current]);if(rocket){current=Math.max(0,Math.round(current/2));alt-=9;setMessage('🚀 ROQUETTE ! Le compteur est divisé par 2.')}else if(value<=10){current+=value;alt+=value*1.2;setMessage(`✨ Bonus +${value} coins`)}else{current=Math.round(current*value);alt+=value*1.4;setMessage(`🔥 Multiplicateur ×${value} !`)}setRoundBalance(current)}setProgress(p);setAltitude(Math.max(8,Math.min(88,alt)));if(p>=100){finish(Math.random()>0.15,current);}},50)};
 const roundBalanceRef=(fallback:number)=>fallback;
 const toggleAuto=()=>setAutoplay(v=>!v);
 return <div className="game-panel" style={{overflow:'hidden'}}>
  <div style={{display:'flex',justifyContent:'space-between',gap:16,alignItems:'center',flexWrap:'wrap'}}><div><div className="game-kicker">ARCADE / FLIGHT</div><h2>✈️ Avia Masters</h2><p className="muted">Un jeu de vol inspiré des mécaniques BGaming : bonus, multiplicateurs, roquettes et atterrissage.</p></div><div style={{fontSize:28,fontWeight:900}}>🪙 {coins.toLocaleString('fr-BE')}</div></div>
  <div style={{position:'relative',height:430,marginTop:18,borderRadius:24,overflow:'hidden',background:'linear-gradient(180deg,#102c59 0%,#1d5e91 48%,#0b7690 49%,#083f59 100%)',border:'1px solid rgba(255,255,255,.12)',boxShadow:'inset 0 0 80px rgba(0,0,0,.25)'}}>
   <div style={{position:'absolute',inset:'50% 0 0',background:'repeating-linear-gradient(170deg,rgba(255,255,255,.07) 0 2px,transparent 2px 24px)',opacity:.55}}/>
   <div style={{position:'absolute',top:14,left:16,right:16,display:'flex',justifyContent:'space-between',fontWeight:800}}><span>ALT {Math.round(altitude)}%</span><span>DIST {Math.round(progress)}%</span><span>COUNTER {roundBalance.toLocaleString('fr-BE')} 🪙</span></div>
   {events.map(e=><div key={e.id} style={{position:'absolute',left:`${e.x}%`,top:`${e.y}%`,fontSize:e.kind==='rocket'?30:22,filter:'drop-shadow(0 5px 8px rgba(0,0,0,.35))',animation:'pulse 1s infinite'}}>{e.kind==='rocket'?'🚀':e.value>10?`×${e.value}`:`+${e.value}`}</div>)}
   <div style={{position:'absolute',left:`calc(${Math.max(8,Math.min(84,progress*.78))}% )`,top:`${Math.max(14,72-altitude*.62)}%`,fontSize:58,transform:`rotate(${running?Math.sin(progress/9)*7:-2}deg)`,transition:'left .08s linear, top .08s linear',filter:'drop-shadow(0 8px 10px rgba(0,0,0,.35))'}}>✈️</div>
   <div style={{position:'absolute',left:'8%',right:'8%',bottom:42,height:28,borderRadius:18,background:'linear-gradient(90deg,#8f979d,#dce4e8)',boxShadow:'0 4px 0 rgba(0,0,0,.25)'}}><div style={{textAlign:'center',color:'#17334b',fontWeight:900,lineHeight:'28px'}}>AIRCRAFT CARRIER</div></div>
   <div style={{position:'absolute',bottom:10,left:16,right:16,textAlign:'center',fontWeight:900,letterSpacing:1}}>{running?'✈️ EN VOL':'🛬 PRÊT AU DÉCOLLAGE'}</div>
  </div>
  <div style={{display:'grid',gridTemplateColumns:'minmax(180px,1fr) auto auto',gap:12,alignItems:'end',marginTop:16}}>
   <div><label>Mise</label><div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:7}}>{bets.map(v=><button key={v} className={`maxbtn ${bet===v?'active':''}`} onClick={()=>setBet(v)} disabled={running}>{v}</button>)}<input className="field" type="number" min={10} value={bet} onChange={e=>setBet(Number(e.target.value))} disabled={running} style={{maxWidth:100}}/></div></div>
   <div><label>Vitesse</label><div style={{display:'flex',gap:5,marginTop:7}}>{([1,2,3,4] as Speed[]).map(v=><button key={v} className={`maxbtn ${speed===v?'active':''}`} onClick={()=>setSpeed(v)} disabled={!running}>×{v}</button>)}</div></div>
   <button className="playbtn" onClick={start} disabled={running}>{running?'✈️ EN VOL':'✈️ PLAY'}</button>
  </div>
  <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginTop:12}}><button className={`maxbtn ${autoplay?'active':''}`} onClick={toggleAuto}>🔁 Autoplay {autoplay?'ON':'OFF'}</button><span className="muted">4 vitesses · bonus +1/+2/+5/+10 · multiplicateurs ×2/×3/×4/×5 · roquettes ÷2</span></div>
  <div className="muted" style={{marginTop:12}}>{message}{lastWin!==null&&lastWin>0?` · Gain ${lastWin.toLocaleString('fr-BE')} coins`:''}</div>
  <style jsx>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}`}</style>
 </div>
}
