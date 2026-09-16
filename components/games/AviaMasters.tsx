'use client';

import {useCallback,useEffect,useRef,useState} from 'react';
import {addCoins,getCoins,spendCoins} from '@/lib/wallet';

type Speed=1|2|3|4;
type EventItem={id:number;kind:'bonus'|'rocket';value:number;x:number;y:number};

const BETS=[10,25,50,100,250,500];
const BONUSES=[1,2,5,10];
const MULTIPLIERS=[2,3,4,5];

export function AviaMasters(){
  const [bet,setBet]=useState(100);
  const [running,setRunning]=useState(false);
  const [balance,setBalance]=useState(0);
  const [roundBalance,setRoundBalance]=useState(100);
  const [progress,setProgress]=useState(0);
  const [altitude,setAltitude]=useState(22);
  const [speed,setSpeed]=useState<Speed>(2);
  const [events,setEvents]=useState<EventItem[]>([]);
  const [message,setMessage]=useState('Choisis ta mise puis lance l’avion.');
  const [lastWin,setLastWin]=useState<number|null>(null);
  const [autoplay,setAutoplay]=useState(false);

  const timerRef=useRef<ReturnType<typeof setInterval>|null>(null);
  const balanceRef=useRef(100);
  const speedRef=useRef<Speed>(2);
  const autoplayRef=useRef(false);
  const runningRef=useRef(false);
  const eventsRef=useRef<EventItem[]>([]);

  useEffect(()=>{setBalance(getCoins())},[]);
  useEffect(()=>{speedRef.current=speed},[speed]);
  useEffect(()=>{autoplayRef.current=autoplay},[autoplay]);
  useEffect(()=>()=>{if(timerRef.current)clearInterval(timerRef.current)},[]);

  const start=useCallback(()=>{
    if(runningRef.current)return;
    const amount=Math.floor(Number(bet));
    if(!Number.isFinite(amount)||amount<10){setMessage('Mise minimum : 10 coins.');return}
    if(!spendCoins(amount)){setMessage('Coins insuffisants.');return}

    if(timerRef.current)clearInterval(timerRef.current);
    runningRef.current=true;
    balanceRef.current=amount;
    eventsRef.current=[];
    setBalance(getCoins());
    setRoundBalance(amount);
    setProgress(0);
    setAltitude(20);
    setEvents([]);
    setLastWin(null);
    setRunning(true);
    setMessage('✈️ En vol — collecte les bonus et évite les roquettes.');

    let elapsed=0;
    timerRef.current=setInterval(()=>{
      elapsed+=0.05*speedRef.current;
      const p=Math.min(100,(elapsed/8.5)*100);
      let current=balanceRef.current;
      let alt=20+Math.sin(elapsed*1.15)*8+elapsed*2.1;

      if(eventsRef.current.length<7&&Math.random()<0.08){
        const rocket=Math.random()<0.24;
        const value=rocket?0:(Math.random()<0.72?BONUSES[Math.floor(Math.random()*BONUSES.length)]:MULTIPLIERS[Math.floor(Math.random()*MULTIPLIERS.length)]);
        const item:EventItem={id:Date.now()+Math.random(),kind:rocket?'rocket':'bonus',value,x:18+Math.random()*70,y:18+Math.random()*58};
        eventsRef.current=[...eventsRef.current,item];
        setEvents(eventsRef.current);

        if(rocket){
          current=Math.max(0,Math.round(current/2));
          alt-=9;
          setMessage('🚀 ROQUETTE ! Le compteur est divisé par 2.');
        }else if(value<=10){
          current+=value;
          alt+=value*1.2;
          setMessage(`✨ Bonus +${value} coins`);
        }else{
          current=Math.round(current*value);
          alt+=value*1.4;
          setMessage(`🔥 Multiplicateur ×${value} !`);
        }
        balanceRef.current=current;
        setRoundBalance(current);
      }

      setProgress(p);
      setAltitude(Math.max(8,Math.min(88,alt)));

      if(p>=100){
        if(timerRef.current)clearInterval(timerRef.current);
        timerRef.current=null;
        runningRef.current=false;
        setRunning(false);
        setProgress(100);

        const landed=Math.random()>0.15;
        if(landed){
          const payout=Math.max(0,Math.round(balanceRef.current));
          addCoins(payout);
          setBalance(getCoins());
          setLastWin(payout);
          setMessage(`🛬 Atterrissage réussi : +${payout.toLocaleString('fr-BE')} coins`);
        }else{
          setLastWin(0);
          setMessage('🌊 L’avion tombe dans l’eau : mise perdue.');
        }

        if(autoplayRef.current){
          window.setTimeout(()=>start(),900);
        }
      }
    },50);
  },[bet]);

  const coins=balance;

  return <div className="game-panel" style={{overflow:'hidden'}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:16,alignItems:'center',flexWrap:'wrap'}}>
      <div>
        <div className="game-kicker">ARCADE / FLIGHT</div>
        <h2>✈️ Avia Masters</h2>
        <p className="muted">Vol arcade : bonus, multiplicateurs, roquettes et atterrissage.</p>
      </div>
      <div style={{fontSize:28,fontWeight:900}}>🪙 {coins.toLocaleString('fr-BE')}</div>
    </div>

    <div style={{position:'relative',height:430,marginTop:18,borderRadius:24,overflow:'hidden',background:'linear-gradient(180deg,#102c59 0%,#1d5e91 48%,#0b7690 49%,#083f59 100%)',border:'1px solid rgba(255,255,255,.12)',boxShadow:'inset 0 0 80px rgba(0,0,0,.25)'}}>
      <div style={{position:'absolute',inset:'50% 0 0',background:'repeating-linear-gradient(170deg,rgba(255,255,255,.07) 0 2px,transparent 2px 24px)',opacity:.55}}/>
      <div style={{position:'absolute',top:14,left:16,right:16,display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap',fontWeight:800}}>
        <span>ALT {Math.round(altitude)}%</span><span>DIST {Math.round(progress)}%</span><span>COUNTER {roundBalance.toLocaleString('fr-BE')} 🪙</span>
      </div>

      {events.map(e=><div key={e.id} style={{position:'absolute',left:`${e.x}%`,top:`${e.y}%`,fontSize:e.kind==='rocket'?30:22,filter:'drop-shadow(0 5px 8px rgba(0,0,0,.35))'}}>{e.kind==='rocket'?'🚀':e.value>10?`×${e.value}`:`+${e.value}`}</div>)}

      <div style={{position:'absolute',left:`${Math.max(8,Math.min(84,progress*.78))}%`,top:`${Math.max(14,72-altitude*.62)}%`,fontSize:58,transform:`rotate(${running?Math.sin(progress/9)*7:-2}deg)`,transition:'left .08s linear, top .08s linear',filter:'drop-shadow(0 8px 10px rgba(0,0,0,.35))'}}>✈️</div>

      <div style={{position:'absolute',left:'8%',right:'8%',bottom:42,height:28,borderRadius:18,background:'linear-gradient(90deg,#8f979d,#dce4e8)',boxShadow:'0 4px 0 rgba(0,0,0,.25)'}}><div style={{textAlign:'center',color:'#17334b',fontWeight:900,lineHeight:'28px'}}>AIRCRAFT CARRIER</div></div>
      <div style={{position:'absolute',bottom:10,left:16,right:16,textAlign:'center',fontWeight:900,letterSpacing:1}}>{running?'✈️ EN VOL':'🛬 PRÊT AU DÉCOLLAGE'}</div>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'minmax(180px,1fr) auto auto',gap:12,alignItems:'end',marginTop:16}}>
      <div>
        <label>Mise</label>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:7}}>
          {BETS.map(v=><button key={v} className={`maxbtn ${bet===v?'active':''}`} onClick={()=>setBet(v)} disabled={running}>{v}</button>)}
          <input className="field" type="number" min={10} value={bet} onChange={e=>setBet(Number(e.target.value))} disabled={running} style={{maxWidth:100}}/>
        </div>
      </div>
      <div>
        <label>Vitesse</label>
        <div style={{display:'flex',gap:5,marginTop:7}}>
          {([1,2,3,4] as Speed[]).map(v=><button key={v} className={`maxbtn ${speed===v?'active':''}`} onClick={()=>setSpeed(v)} disabled={!running}>×{v}</button>)}
        </div>
      </div>
      <button className="playbtn" onClick={start} disabled={running}>{running?'✈️ EN VOL':'✈️ PLAY'}</button>
    </div>

    <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginTop:12}}>
      <button className={`maxbtn ${autoplay?'active':''}`} onClick={()=>setAutoplay(v=>!v)}>🔁 Autoplay {autoplay?'ON':'OFF'}</button>
      <span className="muted">4 vitesses · +1/+2/+5/+10 · ×2/×3/×4/×5 · roquettes ÷2</span>
    </div>
    <div className="muted" style={{marginTop:12}}>{message}{lastWin!==null&&lastWin>0?` · Gain ${lastWin.toLocaleString('fr-BE')} coins`:''}</div>
  </div>;
}
