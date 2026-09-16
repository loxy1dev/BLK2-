'use client';
import {useEffect,useMemo,useState} from 'react';
import {addCoins,getCoins,beginGame,endGame,recordGameResult,spendCoins} from '@/lib/wallet';

const levels=[1.05,1.12,1.22,1.35,1.5,1.7,1.95,2.25,2.6,3.05,3.6,4.3,5.2,6.5,8,10,13,17,22,30];

export function TrainCash(){
 const [coins,setCoins]=useState(0),[bet,setBet]=useState(100),[running,setRunning]=useState(false),[step,setStep]=useState(0),[crashed,setCrashed]=useState(false),[cashed,setCashed]=useState(false),[msg,setMsg]=useState(''),[trainX,setTrainX]=useState(8);
 useEffect(()=>{setCoins(getCoins())},[]);
 const mult=levels[Math.min(step,levels.length-1)] || levels[levels.length-1];
 const progress=useMemo(()=>Math.min(100,(step/(levels.length-1))*100),[step]);
 const start=()=>{
  if(running||bet<=0)return;
  if(!spendCoins(bet)){setMsg('Pas assez de coins.');return}
  beginGame();setCoins(getCoins());setStep(0);setCrashed(false);setCashed(false);setMsg('Le train part… cash out avant le crash !');setTrainX(8);setRunning(true);
 };
 const crash=()=>{
  setRunning(false);setCrashed(true);endGame();recordGameResult('traincash','loss',bet);
  setMsg(`💥 Crash à ×${mult.toFixed(2)} — -${bet.toLocaleString('fr-FR')} coins`);
  window.setTimeout(()=>{setCrashed(false);setStep(0);setTrainX(8)},1800);
 };
 const advance=()=>{
  if(!running)return;
  const next=step+1;
  const danger=Math.min(0.07+next*0.008,0.23);
  if(Math.random()<danger){crash();return}
  setStep(next);setTrainX(8+Math.min(84,(next/levels.length)*76));
  setMsg(`🚂 ×${levels[Math.min(next,levels.length-1)].toFixed(2)} — le train continue !`);
 };
 const cashout=()=>{
  if(!running||step<1)return;
  const payout=Math.round(bet*mult);
  addCoins(payout);setCoins(getCoins());setRunning(false);setCashed(true);endGame();recordGameResult('traincash','win',payout);
  setMsg(`💰 Cash out ×${mult.toFixed(2)} → +${(payout-bet).toLocaleString('fr-FR')} coins`);
  window.setTimeout(()=>setCashed(false),1800);
 };
 return <div className="game-panel" style={{overflow:'hidden'}}>
  <div className="game-header"><div><span className="eyebrow">TRAIN CASH</span><h2>🚂 Train Cash</h2><p>Fais avancer le train et encaisse avant le crash.</p></div><div className="balance-badge">🪙 {coins.toLocaleString('fr-FR')}</div></div>
  <div style={{display:'grid',gap:16}}>
   <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{[100,250,500,1000].map(v=><button key={v} className={bet===v?'primary':''} onClick={()=>!running&&setBet(v)}>{v} 🪙</button>)}</div>
   <div style={{position:'relative',height:300,borderRadius:20,overflow:'hidden',background:'linear-gradient(#17243b 0 55%,#27333a 55% 100%)',border:'1px solid rgba(255,255,255,.12)'}}>
    <div style={{position:'absolute',top:48,left:20,fontSize:28}}>🌙</div><div style={{position:'absolute',top:88,right:45,fontSize:25}}>☁️</div>
    <div style={{position:'absolute',left:0,right:0,bottom:78,height:7,background:'#121820',boxShadow:'0 18px #121820'}}/>
    {[0,1,2,3,4,5,6,7,8,9].map(i=><div key={i} style={{position:'absolute',left:`${i*11}%`,bottom:48,width:58,height:8,background:'#151b20',transform:'skewX(-28deg)'}}/>)}
    <div style={{position:'absolute',left:0,right:0,bottom:0,height:48,background:'repeating-linear-gradient(90deg,rgba(255,255,255,.04) 0 35px,transparent 35px 70px)'}}/>
    <div style={{position:'absolute',left:`${trainX}%`,bottom:86,transform:'translateX(-8%)',fontSize:58,transition:'left .7s cubic-bezier(.2,.8,.2,1)',filter:'drop-shadow(0 8px 10px rgba(0,0,0,.4))'}}>🚂</div>
    <div style={{position:'absolute',top:16,left:16,right:16,display:'flex',justifyContent:'space-between',fontWeight:900}}><span>ROUND {running?'LIVE':'READY'}</span><span style={{fontSize:26}}>×{mult.toFixed(2)}</span></div>
    {(crashed||cashed)&&<div style={{position:'absolute',inset:0,display:'grid',placeItems:'center',background:'rgba(0,0,0,.35)',fontSize:34,fontWeight:1000}}>{crashed?'💥 CRASH !':'💰 CASH OUT !'}</div>}
   </div>
   <div style={{height:10,borderRadius:99,background:'rgba(255,255,255,.08)',overflow:'hidden'}}><div style={{height:'100%',width:`${progress}%`,background:'linear-gradient(90deg,#6ee7ff,#a78bfa)',transition:'width .4s'}}/></div>
   <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:6}}>{levels.slice(0,10).map((m,i)=><div key={m} style={{padding:'8px 4px',textAlign:'center',borderRadius:9,background:i===step?'rgba(110,231,255,.2)':'rgba(255,255,255,.04)',fontSize:12,fontWeight:800}}>×{m.toFixed(2)}</div>)}</div>
   <div style={{display:'grid',gridTemplateColumns:running?'1fr 1fr':'1fr',gap:10}}>{!running?<button className="primary" onClick={start}>🚂 LANCER LE TRAIN · {bet} 🪙</button>:<><button className="primary" onClick={advance}>🚂 FAIRE AVANCER</button><button onClick={cashout} disabled={step<1}>💰 CASH OUT ×{mult.toFixed(2)}</button></>}</div>
   <div style={{minHeight:24,textAlign:'center',fontWeight:800}}>{msg}</div>
  </div>
 </div>;
}
