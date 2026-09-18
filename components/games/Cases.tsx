'use client';

import {useEffect,useMemo,useState} from 'react';
import {spendCoins,addCoins,getCoins} from '@/lib/wallet';

type Skin={name:string;weapon:string;rarity:string;mult:number;emoji:string};
type CaseConfig={id:string;name:string;emoji:string;price:number;desc:string;accent:string;skins:Skin[]};

const COMMON:Skin[]=[
  {name:'Hideout',weapon:'Dual Berettas',rarity:'blue',mult:.35,emoji:'🔫'},
  {name:'Light Box',weapon:'MAC-10',rarity:'blue',mult:.45,emoji:'🔫'},
  {name:'Just Smile',weapon:'MP7',rarity:'blue',mult:.55,emoji:'🔫'},
  {name:'Irezumi',weapon:'XM1014',rarity:'blue',mult:.7,emoji:'🔫'},
  {name:'Hybrid',weapon:'Five-SeveN',rarity:'purple',mult:1.15,emoji:'🔫'},
  {name:'Block-18',weapon:'Glock-18',rarity:'purple',mult:1.35,emoji:'🔫'},
  {name:'Etch Lord',weapon:'M4A4',rarity:'purple',mult:1.6,emoji:'🔫'},
  {name:'Black Lotus',weapon:'M4A1-S',rarity:'pink',mult:2.8,emoji:'🔫'},
  {name:'Jawbreaker',weapon:'USP-S',rarity:'pink',mult:3.4,emoji:'🔫'},
  {name:'Inheritance',weapon:'AK-47',rarity:'red',mult:7,emoji:'🔫'},
  {name:'Chrome Cannon',weapon:'AWP',rarity:'red',mult:10,emoji:'🎯'},
  {name:'Kukri Knife',weapon:'★ Knife ★',rarity:'gold',mult:35,emoji:'🔪'}
];

const CASES:CaseConfig[]=[
  {id:'basic',name:'Basic Case',emoji:'📦',price:100,desc:'Petit prix, récompenses régulières.',accent:'#3b82f6',skins:COMMON.slice(0,7).concat(COMMON.slice(7,9))},
  {id:'premium',name:'Premium Case',emoji:'💎',price:500,desc:'Plus de skins rouges et de gros multiplicateurs.',accent:'#a855f7',skins:COMMON.slice(3)},
  {id:'rare',name:'Rare Case',emoji:'🔥',price:1000,desc:'Pool réduit, récompenses nettement plus élevées.',accent:'#ef4444',skins:COMMON.slice(6)},
  {id:'knife',name:'Knife Case',emoji:'🔪',price:2500,desc:'Spécialisée dans les gros lots et les couteaux.',accent:'#f5c542',skins:COMMON.filter(s=>s.rarity==='pink'||s.rarity==='red'||s.rarity==='gold')}
];

const RARITY=[{id:'blue',label:'Mil-Spec',weight:79.92},{id:'purple',label:'Restricted',weight:15.98},{id:'pink',label:'Classified',weight:3.2},{id:'red',label:'Covert',weight:.64},{id:'gold',label:'Rare Special',weight:.26}];
const label=(r:string)=>RARITY.find(x=>x.id===r)?.label||r;
const color=(r:string)=>r==='gold'?'#f5c542':r==='red'?'#ef4444':r==='pink'?'#ec4899':r==='purple'?'#a855f7':'#3b82f6';

function pickSkin(pool:Skin[]){
  const weights=pool.map(s=>s.rarity==='gold'?1:s.rarity==='red'?4:s.rarity==='pink'?14:s.rarity==='purple'?30:51);
  const total=weights.reduce((a,b)=>a+b,0);let roll=Math.random()*total;
  for(let i=0;i<pool.length;i++){roll-=weights[i];if(roll<0)return pool[i]}
  return pool[pool.length-1];
}
function makeReel(winner:Skin,pool:Skin[]){const arr=Array.from({length:46},()=>pickSkin(pool));const target=31;arr[target]=winner;return{arr,target}}

export function Cases(){
  const [selected,setSelected]=useState('basic');
  const config=useMemo(()=>CASES.find(c=>c.id===selected)||CASES[0],[selected]);
  const [bet,setBet]=useState(config.price),[coins,setCoins]=useState(getCoins()),[rolling,setRolling]=useState(false),[reel,setReel]=useState<Skin[]>([]),[offset,setOffset]=useState(0),[item,setItem]=useState<Skin|null>(null),[msg,setMsg]=useState('Choisis une caisse puis ouvre-la.'),[round,setRound]=useState(0);
  useEffect(()=>{setBet(config.price);setItem(null);setMsg(`Caisse sélectionnée : ${config.name}.`);},[config]);
  useEffect(()=>setCoins(getCoins()),[]);

  const open=()=>{
    if(rolling)return;
    if(!spendCoins(bet)){setMsg('Pas assez de coins pour ouvrir cette caisse.');setCoins(getCoins());return}
    const winner=pickSkin(config.skins),generated=makeReel(winner,config.skins),cardW=154,viewport=Math.max(280,window.innerWidth<700?window.innerWidth-72:760),center=generated.target*cardW+73;
    setRolling(true);setItem(null);setMsg(`Ouverture de ${config.name}… ${label(winner.rarity)}.`);setOffset(0);setReel(generated.arr);setRound(r=>r+1);
    requestAnimationFrame(()=>requestAnimationFrame(()=>setOffset(viewport/2-center)));
    window.setTimeout(()=>{const reward=Math.round(bet*winner.mult);addCoins(reward);setCoins(getCoins());setItem(winner);setMsg(`${winner.emoji} ${winner.weapon} | ${winner.name} • ${label(winner.rarity)} • x${winner.mult} • gain ${reward.toLocaleString('fr-FR')} coins`);setRolling(false)},5200);
  };

  return <div className="game-panel" style={{overflow:'hidden'}}>
    <style>{`@keyframes caseGlow{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-8px) rotate(-1deg)}}@keyframes caseShake{0%,100%{transform:translateY(0) rotate(0)}20%{transform:translateY(-4px) rotate(-2deg)}40%{transform:translateY(3px) rotate(2deg)}60%{transform:translateY(-3px) rotate(-1deg)}80%{transform:translateY(2px) rotate(1deg)}}`}</style>
    <div className="game-head"><div><h2>📦 CASE OPENING</h2><p>Choisis ta caisse : chaque type possède son propre pool de récompenses.</p></div><div className="coins-badge">🪙 {coins.toLocaleString('fr-FR')}</div></div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,margin:'16px 0 20px'}}>
      {CASES.map(c=><button key={c.id} onClick={()=>setSelected(c.id)} disabled={rolling} style={{textAlign:'left',padding:14,borderRadius:14,border:`1px solid ${selected===c.id?c.accent:'rgba(255,255,255,.1)'}`,background:selected===c.id?'rgba(255,255,255,.09)':'rgba(255,255,255,.035)',color:'inherit',cursor:rolling?'not-allowed':'pointer'}}>
        <div style={{fontSize:30}}>{c.emoji}</div><b>{c.name}</b><div style={{fontSize:11,opacity:.7,margin:'5px 0 9px'}}>{c.desc}</div><strong>{c.price.toLocaleString('fr-FR')} 🪙</strong>
      </button>)}
    </div>

    <div style={{display:'flex',justifyContent:'center',margin:'4px 0 18px'}}><div style={{width:240,height:112,borderRadius:18,background:`linear-gradient(145deg,${config.accent},#171717)`,border:`2px solid ${config.accent}`,boxShadow:'0 18px 45px rgba(0,0,0,.4)',display:'grid',placeItems:'center',fontSize:58,animation:rolling?'caseShake .22s infinite':'caseGlow 2.4s ease-in-out infinite',position:'relative'}}><span>{config.emoji}</span><span style={{position:'absolute',bottom:8,fontSize:11,fontWeight:900,letterSpacing:2}}>{config.name.toUpperCase()}</span></div></div>

    <div style={{position:'relative',height:178,borderRadius:16,background:'linear-gradient(180deg,#090d16,#111827)',border:'1px solid rgba(255,255,255,.1)',overflow:'hidden',boxShadow:'inset 0 0 40px rgba(0,0,0,.6)'}}>
      <div style={{position:'absolute',zIndex:3,left:'50%',top:0,bottom:0,width:3,transform:'translateX(-50%)',background:'linear-gradient(#fff,#ffd54a,#fff)',boxShadow:'0 0 18px #ffd54a'}}/><div style={{position:'absolute',zIndex:4,left:'50%',top:4,transform:'translateX(-50%)',fontSize:18}}>▼</div>
      <div key={round} style={{position:'absolute',left:0,top:0,height:'100%',display:'flex',alignItems:'center',gap:8,transform:`translateX(${offset}px)`,transition:rolling?'transform 5s cubic-bezier(.08,.74,.12,1)':'none',width:'max-content'}}>
        {reel.map((s,i)=><div key={`${round}-${i}`} style={{flex:'0 0 146px',height:142,borderRadius:12,border:`1px solid ${color(s.rarity)}`,background:'linear-gradient(180deg,rgba(255,255,255,.07),rgba(0,0,0,.25))',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:8,boxSizing:'border-box'}}><div style={{fontSize:42,marginBottom:8}}>{s.emoji}</div><b style={{fontSize:12}}>{s.weapon}</b><span style={{fontSize:11,opacity:.82}}>{s.name}</span><small style={{marginTop:7,fontWeight:900}}>{label(s.rarity)}</small></div>)}
      </div>
    </div>

    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:14,fontSize:12,opacity:.8}}><span>Pool de {config.name}</span><span>{config.skins.length} récompenses possibles</span></div>
    <div className="bet-row" style={{marginTop:14}}>{[config.price,config.price*2,config.price*5].map(v=><button key={v} className={bet===v?'active':''} onClick={()=>setBet(v)} disabled={rolling}>{v.toLocaleString('fr-FR')} 🪙</button>)}<button className={`maxbtn ${bet===coins?'active':''}`} onClick={()=>setBet(Math.max(config.price,getCoins()))} disabled={rolling||coins<config.price}>MAX</button></div>
    <button className="primary-action" onClick={open} disabled={rolling||coins<bet}>{rolling?'🔓 Ouverture en cours…':'🔑 OUVRIR '+config.name.toUpperCase()} <span style={{opacity:.75}}>• {bet.toLocaleString('fr-FR')} 🪙</span></button>
    {item&&<div style={{marginTop:16,padding:18,borderRadius:16,textAlign:'center',background:'rgba(255,255,255,.05)',border:`1px solid ${color(item.rarity)}`}}><div style={{fontSize:46}}>{item.emoji}</div><h3 style={{margin:'6px 0 2px'}}>{item.weapon} | {item.name}</h3><div style={{fontSize:12,opacity:.8}}>{label(item.rarity)} • x{item.mult} • paiement {Math.round(bet*item.mult).toLocaleString('fr-FR')} 🪙</div></div>}
    <p className="game-message">{msg}</p>
  </div>
}
