'use client';
import {useMemo,useState} from 'react';
import {spendCoins,addCoins,getCoins} from '@/lib/wallet';

const ITEMS=[
 {name:'🪨 Pierre',value:0.2,rarity:'Commun'},
 {name:'🪵 Bois rare',value:0.5,rarity:'Commun'},
 {name:'🔩 Métal',value:0.8,rarity:'Commun'},
 {name:'💎 Diamant',value:1.5,rarity:'Rare'},
 {name:'👑 Couronne',value:3,rarity:'Épique'},
 {name:'🔥 Phoenix',value:5,rarity:'Légendaire'},
 {name:'⚡ Relique BLK',value:10,rarity:'Mythique'},
];
const BETS=[100,250,500,1000];
export function Cases(){
 const [bet,setBet]=useState(100),[coins,setCoins]=useState(getCoins()),[rolling,setRolling]=useState(false),[item,setItem]=useState<typeof ITEMS[number]|null>(null),[msg,setMsg]=useState('Ouvre une caisse et découvre ton item.');
 const preview=useMemo(()=>ITEMS[Math.floor(Math.random()*ITEMS.length)],[rolling]);
 const open=()=>{
  if(rolling)return;
  if(!spendCoins(bet)){setMsg('Pas assez de coins.');setCoins(getCoins());return;}
  setRolling(true);setItem(null);setMsg('Ouverture de la caisse…');
  setTimeout(()=>{
   const won=Math.random()<0.72?ITEMS[Math.floor(Math.random()*ITEMS.length)]:null;
   if(won){const reward=Math.round(bet*won.value);addCoins(reward);setItem(won);setMsg(`${won.name} • ${won.rarity} • +${reward.toLocaleString('fr-FR')} coins`);}
   else {setMsg(`Caisse vide • -${bet.toLocaleString('fr-FR')} coins`);}
   setCoins(getCoins());setRolling(false);
  },1100);
 };
 return <div className="game-panel"><div className="game-head"><div><h2>📦 Cases</h2><p>Ouvre des caisses, découvre un item et gagne ou perds des coins.</p></div><div className="coins-badge">🪙 {coins.toLocaleString('fr-FR')}</div></div><div className="case-box"><div className={`case-crate ${rolling?'case-opening':''}`}>📦</div><div className="case-item">{rolling?'✨ Ouverture…':item?item.name:'❓'}</div>{item&&<div className="case-rarity">{item.rarity}</div>}</div><div className="bet-row">{BETS.map(v=><button key={v} className={bet===v?'active':''} onClick={()=>setBet(v)}>{v.toLocaleString('fr-FR')} 🪙</button>)}</div><button className="primary-action" onClick={open} disabled={rolling}>📦 {rolling?'Ouverture…':`Ouvrir pour ${bet.toLocaleString('fr-FR')} coins`}</button><p className="game-message">{msg}</p><div className="case-table">{ITEMS.map(i=><div key={i.name}><span>{i.name}</span><b>x{i.value}</b></div>)}</div></div>;
}
