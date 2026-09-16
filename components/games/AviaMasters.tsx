'use client';

import {useCallback,useEffect,useRef,useState} from 'react';
import {addCoins,getCoins,spendCoins} from '@/lib/wallet';

type Speed=1|2|3|4;
type Item={id:number;kind:'plus'|'multi'|'rocket';value:number;x:number;y:number};

const BETS=[10,25,50,100,250,500,1000];
const SPEEDS:[Speed,string][]=[[1,'🐢'],[2,'🚶'],[3,'🏃'],[4,'⚡']];
const ITEMS=[1,2,5,10,2,3,4,5] as const;

export function AviaMasters(){
  const [bet,setBet]=useState(100);
  const [running,setRunning]=useState(false);
  const [balance,setBalance]=useState(0);
  const [counter,setCounter]=useState(100);
  const [altitude,setAltitude]=useState(18);
  const [distance,setDistance]=useState(0);
  const [speed,setSpeed]=useState<Speed>(2);
  const [items,setItems]=useState<Item[]>([]);
  const [message,setMessage]=useState('Set your bet and send the aircraft into the sky.');
  const [lastWin,setLastWin]=useState<number|null>(null);
  const [autoplay,setAutoplay]=useState(false);
  const [autoRounds,setAutoRounds]=useState(10);
  const [autoLeft,setAutoLeft]=useState(0);

  const timerRef=useRef<ReturnType<typeof setInterval>|null>(null);
  const counterRef=useRef(100);
  const speedRef=useRef<Speed>(2);
  const autoRef=useRef(false);
  const runningRef=useRef(false);
  const itemsRef=useRef<Item[]>([]);
  const altitudeRef=useRef(18);
  const flightRef=useRef(0);

  useEffect(()=>{setBalance(getCoins())},[]);
  useEffect(()=>{speedRef.current=speed},[speed]);
  useEffect(()=>{autoRef.current=autoplay},[autoplay]);
  useEffect(()=>()=>{if(timerRef.current)clearInterval(timerRef.current)},[]);

  const finish=useCallback((landed:boolean)=>{
    if(timerRef.current)clearInterval(timerRef.current);
    timerRef.current=null;
    runningRef.current=false;
    setRunning(false);
    setDistance(100);
    if(landed){
      const payout=Math.max(0,Math.round(counterRef.current));
      addCoins(payout);
      setBalance(getCoins());
      setLastWin(payout);
      const label=payout>=bet*80?'SUPER MEGA WIN':payout>=bet*40?'MEGA WIN':payout>=bet*20?'BIG WIN':'LAND!';
      setMessage(`🛬 ${label} · +${payout.toLocaleString('fr-BE')} coins`);
    }else{
      setLastWin(0);
      setMessage('🌊 SPLASH! The aircraft missed the carrier. Round lost.');
    }
    if(autoRef.current){
      setAutoLeft(v=>Math.max(0,v-1));
      window.setTimeout(()=>{
        setAutoLeft(left=>{if(left<=1){setAutoplay(false);return 0} return left});
        start();
      },900);
    }
  },[bet]);

  const start=useCallback(()=>{
    if(runningRef.current)return;
    if(autoRef.current && autoLeft<=0){setAutoplay(false);return}
    const amount=Math.floor(Number(bet));
    if(!Number.isFinite(amount)||amount<10){setMessage('Minimum bet: 10 coins.');return}
    if(!spendCoins(amount)){setMessage('Not enough coins.');setAutoplay(false);return}

    if(timerRef.current)clearInterval(timerRef.current);
    runningRef.current=true;
    counterRef.current=amount;
    altitudeRef.current=19;
    flightRef.current=0;
    itemsRef.current=[];
    setItems([]);
    setCounter(amount);
    setAltitude(19);
    setDistance(0);
    setLastWin(null);
    setBalance(getCoins());
    setRunning(true);
    setMessage('✈️ FLIGHT STARTED — follow the path and LAND!');

    // Each round has its own randomized flight profile. The final altitude
    // determines whether the plane reaches the carrier or falls into water.
    const landingBias=Math.random();
    let elapsed=0;
    timerRef.current=setInterval(()=>{
      const step=0.045*speedRef.current;
      elapsed+=step;
      const progress=Math.min(100,(elapsed/9.2)*100);
      flightRef.current=progress;

      let alt=altitudeRef.current;
      alt += 0.22 + Math.sin(elapsed*1.7)*0.42;
      if(alt<10)alt+=0.7;
      if(alt>72)alt-=0.55;

      if(itemsRef.current.length<8 && Math.random() < 0.055*speedRef.current){
        const rocket=Math.random()<0.24;
        const isMulti=!rocket && Math.random()<0.42;
        const value=rocket?0:isMulti?[2,3,4,5][Math.floor(Math.random()*4)]:[1,2,5,10][Math.floor(Math.random()*4)];
        const item:Item={id:Date.now()+Math.random(),kind:rocket?'rocket':isMulti?'multi':'plus',value,x:17+Math.random()*69,y:15+Math.random()*54};
        itemsRef.current=[...itemsRef.current,item];
        setItems([...itemsRef.current]);

        if(rocket){
          counterRef.current=Math.max(0,Math.round(counterRef.current/2));
          alt-=9;
          setMessage(`🚀 ROCKET HIT · Counter Balance ÷ 2`);
        }else if(isMulti){
          counterRef.current=Math.round(counterRef.current*value);
          alt+=4+value*0.9;
          setMessage(`🔥 ×${value} MULTIPLIER · altitude rising`);
        }else{
          counterRef.current+=value;
          alt+=1.2+value*0.35;
          setMessage(`✨ +${value} BONUS · altitude rising`);
        }
        altitudeRef.current=alt;
        setCounter(counterRef.current);
      }

      // The carrier approach: a low trajectory near the end can miss the deck.
      const finalShape=progress>72 ? 26 + landingBias*34 + Math.sin(progress/8)*7 : alt;
      const displayAlt=progress>72 ? Math.max(7,Math.min(78,finalShape)) : alt;
      altitudeRef.current=displayAlt;
      setAltitude(displayAlt);
      setDistance(progress);

      if(progress>=100){
        // A high enough final trajectory lands; a low trajectory splashes.
        const landed=displayAlt>24;
        finish(landed);
      }
    },45);
  },[autoLeft,bet,finish]);

  const toggleAutoplay=()=>{
    if(running)return;
    if(autoplay){setAutoplay(false);setAutoLeft(0);return}
    const rounds=Math.max(1,Math.min(100,Math.floor(Number(autoRounds)||10)));
    setAutoLeft(rounds);
    setAutoplay(true);
    window.setTimeout(()=>start(),40);
  };

  const planeX=Math.max(7,Math.min(83,distance*.78));
  const planeY=Math.max(13,Math.min(68,74-altitude*.72));
  const carrierGlow=distance>88 && altitude>24;

  return <div className="game-panel" style={{overflow:'hidden',background:'linear-gradient(180deg,rgba(15,26,45,.98),rgba(7,14,27,.98))'}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:18,alignItems:'center',flexWrap:'wrap'}}>
      <div>
        <div className="game-kicker">AVIAMASTERS / LAND!</div>
        <h2 style={{marginBottom:4}}>✈️ Aviamasters</h2>
        <p className="muted">Random flight path · Counter Balance · rockets · multipliers · automatic landing.</p>
      </div>
      <div style={{fontSize:26,fontWeight:950}}>🪙 {balance.toLocaleString('fr-BE')}</div>
    </div>

    <div style={{position:'relative',height:470,marginTop:18,borderRadius:22,overflow:'hidden',border:'1px solid rgba(255,255,255,.12)',background:'linear-gradient(180deg,#071a38 0%,#124a7b 45%,#1686a1 62%,#07526b 100%)'}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at 70% 20%,rgba(255,255,255,.13),transparent 25%),linear-gradient(180deg,transparent 60%,rgba(0,0,0,.28))'}}/>
      <div style={{position:'absolute',top:0,left:0,right:0,height:'45%',background:'repeating-linear-gradient(175deg,rgba(255,255,255,.035) 0 2px,transparent 2px 28px)'}}/>

      <div style={{position:'absolute',top:12,left:12,right:12,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,zIndex:5}}>
        {[['ALTITUDE',`${Math.round(altitude)}%`],['DISTANCE',`${Math.round(distance)}%`],['COUNTER BALANCE',counter.toLocaleString('fr-BE')]].map(([a,b])=><div key={a} style={{padding:'9px 12px',borderRadius:12,background:'rgba(3,10,22,.72)',border:'1px solid rgba(255,255,255,.1)',backdropFilter:'blur(8px)'}}><div style={{fontSize:10,color:'rgba(255,255,255,.55)',fontWeight:800}}>{a}</div><div style={{fontWeight:950,fontSize:18}}>{b}{a==='COUNTER BALANCE'?' 🪙':''}</div></div>)}
      </div>

      <div style={{position:'absolute',left:'7%',right:'7%',top:'61%',height:2,background:'rgba(255,255,255,.14)'}}/>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{position:'absolute',inset:'20% 7% 22%',width:'86%',height:'58%',overflow:'visible'}}>
        <path d="M0 68 C12 54 18 72 29 50 S46 27 56 45 S70 65 79 38 S91 22 100 48" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="1.3" strokeDasharray="3 3"/>
      </svg>

      {items.map(item=><div key={item.id} style={{position:'absolute',left:`${item.x}%`,top:`${item.y}%`,transform:'translate(-50%,-50%)',zIndex:3,textAlign:'center',fontWeight:950,filter:'drop-shadow(0 5px 8px rgba(0,0,0,.45))'}}>
        <div style={{fontSize:item.kind==='rocket'?34:26}}>{item.kind==='rocket'?'🚀':item.kind==='multi'?'💥':'✦'}</div>
        <div style={{fontSize:14,color:item.kind==='rocket'?'#ff6969':'#ffe56b'}}>{item.kind==='rocket'?'÷2':item.kind==='multi'?`×${item.value}`:`+${item.value}`}</div>
      </div>)}

      <div style={{position:'absolute',left:`${planeX}%`,top:`${planeY}%`,transform:`translate(-50%,-50%) rotate(${running?Math.sin(distance/7)*9:-3}deg)`,transition:'left .09s linear,top .09s linear',zIndex:6}}>
        <div style={{position:'absolute',right:'78%',top:'48%',width:70,height:3,background:'linear-gradient(90deg,transparent,rgba(255,255,255,.6))',filter:'blur(1px)'}}/>
        <div style={{fontSize:56,filter:'drop-shadow(0 10px 10px rgba(0,0,0,.45))'}}>✈️</div>
        <div style={{position:'absolute',left:'50%',bottom:'105%',transform:'translateX(-50%)',whiteSpace:'nowrap',padding:'5px 10px',borderRadius:10,background:'rgba(4,10,20,.82)',border:'1px solid rgba(255,255,255,.15)',fontSize:13,fontWeight:950}}>🪙 {counter.toLocaleString('fr-BE')}</div>
      </div>

      <div style={{position:'absolute',left:'6%',right:'6%',bottom:30,height:62,borderRadius:'16px 16px 25px 25px',background:'linear-gradient(180deg,#d7dde1,#737d85)',boxShadow:carrierGlow?'0 0 35px rgba(87,255,190,.55),0 8px 20px rgba(0,0,0,.4)':'0 8px 20px rgba(0,0,0,.4)',transition:'box-shadow .25s'}}>
        <div style={{height:8,margin:'13px 22px 0',borderRadius:8,background:'repeating-linear-gradient(90deg,#d95b52 0 28px,#eee 28px 56px)'}}/>
        <div style={{textAlign:'center',marginTop:5,fontSize:12,fontWeight:950,color:'#17212a',letterSpacing:2}}>AIRCRAFT CARRIER · LAND ZONE</div>
      </div>

      <div style={{position:'absolute',left:12,right:12,bottom:10,textAlign:'center',fontSize:12,fontWeight:900,letterSpacing:1,color:'rgba(255,255,255,.7)'}}>{running?'✈️ IN FLIGHT':'🛬 READY FOR TAKEOFF'}</div>
      {lastWin!==null && !running && <div style={{position:'absolute',inset:0,display:'grid',placeItems:'center',pointerEvents:'none'}}><div style={{padding:'16px 28px',borderRadius:18,background:'rgba(5,10,20,.84)',border:'1px solid rgba(255,255,255,.16)',boxShadow:'0 12px 40px rgba(0,0,0,.35)',textAlign:'center'}}><div style={{fontSize:26,fontWeight:1000}}>{lastWin>0?'🛬 LAND!':'🌊 SPLASH'}</div>{lastWin>0&&<div style={{marginTop:4,fontSize:18,fontWeight:900}}>+{lastWin.toLocaleString('fr-BE')} coins</div>}</div></div>}
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:14,marginTop:15,alignItems:'end'}}>
      <div>
        <label>BET</label>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:7}}>
          {BETS.map(v=><button key={v} className={`maxbtn ${bet===v?'active':''}`} onClick={()=>setBet(v)} disabled={running||autoplay}>{v}</button>)}
          <input className="field" type="number" min={10} value={bet} onChange={e=>setBet(Number(e.target.value))} disabled={running||autoplay} style={{width:95}}/>
        </div>
      </div>
      <button className="playbtn" onClick={start} disabled={running||autoplay} style={{minWidth:150,height:48}}>{running?'✈️ FLYING':'✈️ PLAY'}</button>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:12}}>
      <div style={{padding:12,borderRadius:14,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)'}}>
        <label>SPEED</label>
        <div style={{display:'flex',gap:6,marginTop:7}}>{SPEEDS.map(([v,icon])=><button key={v} className={`maxbtn ${speed===v?'active':''}`} onClick={()=>setSpeed(v)} disabled={!running}>{icon} {v}</button>)}</div>
      </div>
      <div style={{padding:12,borderRadius:14,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)'}}>
        <label>AUTOPLAY</label>
        <div style={{display:'flex',gap:7,alignItems:'center',marginTop:7}}><input className="field" type="number" min={1} max={100} value={autoRounds} onChange={e=>setAutoRounds(Number(e.target.value))} disabled={running||autoplay} style={{width:72}}/><button className={`maxbtn ${autoplay?'active':''}`} onClick={toggleAutoplay}>{autoplay?`🔁 ${autoLeft} LEFT`:'🔁 START'}</button></div>
      </div>
    </div>

    <div style={{marginTop:12,padding:12,borderRadius:14,background:'rgba(255,255,255,.035)',border:'1px solid rgba(255,255,255,.07)',display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
      <span className="muted">{message}</span>
      <span className="muted">+1 +2 +5 +10 · ×2 ×3 ×4 ×5 · rockets ÷2 · max ×250</span>
    </div>
  </div>;
}
