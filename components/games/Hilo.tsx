'use client';
import {useState} from 'react';
import {addCoins,beginGame,endGame,getCoins,recordGameResult,spendCoins} from '@/lib/wallet';

const drawDifferent=(current:number)=>{
 const possible=Array.from({length:13},(_,i)=>i+1).filter(n=>n!==current);
 return possible[Math.floor(Math.random()*possible.length)];
};

export function Hilo(){
 const [bet,setBet]=useState(100),[card,setCard]=useState(7),[active,setActive]=useState(false),[msg,setMsg]=useState('Mise puis choisis plus haut ou plus bas.');
 const start=()=>{const b=Math.floor(Number(bet));if(!Number.isFinite(b)||b<10){setMsg('Mise minimum : 10 coins.');return}if(!spendCoins(b)){setMsg('Coins insuffisants.');return}beginGame();setCard(1+Math.floor(Math.random()*13));setActive(true);setMsg('Carte tirée ! Choisis plus haut ou plus bas.')};
 const pick=(up:boolean)=>{
  if(!active)return;
  const b=Math.floor(Number(bet));
  const current=card;
  const next=drawDifferent(current);
  const win=up ? next>current : next<current;
  setCard(next);
  if(win){const p=Math.floor(b*1.8);addCoins(p);recordGameResult('Hi-Lo','win',p-b);setMsg(`🃏 ${next} — gagné +${p} coins`)}
  else{recordGameResult('Hi-Lo','loss',-b);setMsg(`🃏 ${next} — perdu`)}
  setActive(false);endGame();
 };
 return <div className="game-panel"><div className="game-head"><div><h2>🃏 Hi-Lo</h2><p className="muted">La prochaine carte sera toujours différente. Plus haute ou plus basse ?</p></div><div className="mult">×1.8</div></div><div className="dice-face">{card}</div><div className="betbar"><input className="field" type="number" min="10" value={bet} onChange={e=>setBet(Number(e.target.value))} disabled={active}/><button className="maxbtn" onClick={()=>setBet(getCoins())} disabled={active||getCoins()<10}>MAX</button>{!active?<button className="playbtn" onClick={start} disabled={getCoins()<10}>Tirer</button>:<><button className="playbtn" onClick={()=>pick(true)}>Plus haut</button><button className="cashbtn" onClick={()=>pick(false)}>Plus bas</button></>}</div><p className="muted">{msg}</p></div>
}
