'use client';
import {useEffect,useState} from 'react';
import {addCoins,getCoins,recordGameResult,spendCoins} from '@/lib/wallet';

type Choice='rock'|'paper'|'scissors';
const choices:[Choice,string,string][]=[['rock','Pierre','✊'],['paper','Feuille','✋'],['scissors','Ciseau','✌️']];
const beats=(a:Choice,b:Choice)=>(a==='rock'&&b==='scissors')||(a==='paper'&&b==='rock')||(a==='scissors'&&b==='paper');

export function MagicRPS(){
 const [bet,setBet]=useState(100);const [player,setPlayer]=useState<Choice|null>(null);const [enemy,setEnemy]=useState<Choice|null>(null);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('Choisis Pierre, Feuille ou Ciseau.');const [coins,setCoins]=useState(0);
 useEffect(()=>{const sync=()=>setCoins(getCoins());sync();window.addEventListener('blox:coins:update',sync);return()=>window.removeEventListener('blox:coins:update',sync)},[]);
 useEffect(()=>{if(!busy)return;let n=0;const timer=setInterval(()=>{setEnemy(choices[n%3][0]);n++},120);return()=>clearInterval(timer)},[busy]);
 const play=(pick:Choice)=>{
  if(busy)return;
  const amount=Math.floor(Number(bet));
  if(!Number.isFinite(amount)||amount<10){setMessage('Mise minimum : 10 coins.');return}
  if(!spendCoins(amount)){setCoins(getCoins());setMessage('Coins insuffisants.');return}
  setCoins(getCoins());setPlayer(pick);setEnemy(null);setBusy(true);setMessage('🪄 La main magique prépare son sort…');
  const result=choices[Math.floor(Math.random()*choices.length)][0];
  window.setTimeout(()=>{
   setEnemy(result);setMessage('⚡ La main magique révèle son choix !');
   window.setTimeout(()=>{
    // The player's choice is always the reference for the result.
    if(pick===result){
      // Draw = return exactly the original stake. No profit, no loss.
      addCoins(amount);setMessage(`🤝 ÉGALITÉ — ${amount} coins remboursés.`);
    }else if(beats(pick,result)){
      // Player wins: stake was already removed, so return 2x the stake.
      const payout=amount*2;addCoins(payout);recordGameResult('Magic RPS','win',amount);setMessage(`🏆 GAGNÉ — ${payout} coins récupérés (+${amount})`);
    }else{
      // Player loses: stake stays lost and nothing is added back.
      recordGameResult('Magic RPS','loss',-amount);setMessage('💥 PERDU — la main magique gagne.');
    }
    setCoins(getCoins());setBusy(false);
   },650);
  },1400);
 };
 const reset=()=>{setPlayer(null);setEnemy(null);setMessage('Choisis Pierre, Feuille ou Ciseau.');setCoins(getCoins())};
 const label=(c:Choice|null)=>choices.find(x=>x[0]===c)?.[1]??'—';const icon=(c:Choice|null)=>choices.find(x=>x[0]===c)?.[2]??'❔';
 return <div className="game-panel magic-rps">
  <div className="magic-rps-head"><div><h2>🪄 Magic RPS</h2><p className="muted">Pierre • Feuille • Ciseau contre la main magique.</p></div><div className="mult">×2</div></div>
  <div className={`magic-stage ${busy?'is-busy':''} ${enemy&&!busy?'is-result':''}`}>
   <div className="magic-side"><span>TOI</span><div className="magic-hand player-hand">{icon(player)}</div><b>{label(player)}</b></div><div className="magic-vs">VS</div>
   <div className="magic-side"><span>MAIN MAGIQUE</span><div className="magic-hand enemy-hand">{busy&&!enemy?'🖐️':icon(enemy)}</div><b>{busy&&!enemy?'Elle choisit…':label(enemy)}</b></div>
   <div className="magic-message">{message}</div>
  </div>
  <div className="magic-bet"><label>Mise<input className="field" type="number" min="10" value={bet} onChange={e=>setBet(Number(e.target.value))}/></label><button className="maxbtn" onClick={()=>setBet(getCoins())} disabled={coins<10||busy}>MAX</button><span>🪙 {coins}</span></div>
  <div className="magic-choices">{choices.map(([id,name,emoji])=><button key={id} onClick={()=>play(id)} disabled={busy||coins<10} className={player===id?'chosen':''}><i>{emoji}</i><strong>{name}</strong></button>)}</div>
  {!busy&&enemy&&<button className="magic-replay" onClick={reset}>🔄 Rejouer</button>}
  <style jsx>{`
   .magic-rps{overflow:hidden}.magic-rps-head{display:flex;justify-content:space-between;gap:15px;align-items:flex-start}.magic-stage{position:relative;margin:22px 0;padding:30px 16px 24px;border:1px solid #303b5b;border-radius:22px;background:radial-gradient(circle at 50% 30%,rgba(124,92,255,.2),transparent 42%),linear-gradient(180deg,#121b30,#0a101c);display:grid;grid-template-columns:1fr 90px 1fr;align-items:center;gap:8px;text-align:center;min-height:265px}.magic-stage:after{content:'';position:absolute;inset:-60%;background:linear-gradient(100deg,transparent 46%,rgba(255,255,255,.07) 50%,transparent 54%);animation:sweep 2.2s linear infinite;pointer-events:none}.magic-side{position:relative;z-index:1;display:grid;justify-items:center;gap:8px}.magic-side>span{font-size:10px;letter-spacing:.16em;color:#7f8baa;font-weight:900}.magic-hand{width:112px;height:112px;border-radius:50%;display:grid;place-items:center;font-size:60px;border:1px solid #394667;background:radial-gradient(circle,#202b49,#0d1424);box-shadow:0 0 30px rgba(124,92,255,.16)}.player-hand{animation:float 1.8s ease-in-out infinite}.enemy-hand{animation:magic 650ms ease-in-out infinite}.is-result .enemy-hand{animation:reveal .5s ease-out}.magic-vs{position:relative;z-index:2;font-size:26px;font-weight:1000;color:#a394ff;text-shadow:0 0 20px rgba(139,124,255,.65)}.magic-message{grid-column:1/-1;position:relative;z-index:2;margin-top:8px;padding:10px 14px;border-radius:999px;background:#111a2d;border:1px solid #2d3958;color:#dbe3f7;font-size:12px;font-weight:800}.magic-bet{display:flex;align-items:end;gap:10px;flex-wrap:wrap}.magic-bet label{min-width:170px;flex:1}.magic-bet label .field{margin-top:7px}.magic-bet>span{padding:12px 2px;color:#8190ad;font-size:12px;font-weight:800}.magic-choices{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px}.magic-choices button{border:1px solid #2d3855;border-radius:16px;padding:14px 10px;background:#111a2c;color:#edf2ff;display:grid;gap:5px;justify-items:center;transition:.18s}.magic-choices button:hover:not(:disabled){transform:translateY(-4px);border-color:#8375ff;box-shadow:0 12px 28px rgba(99,102,241,.2)}.magic-choices button.chosen{border-color:#a394ff;background:#1b2140;box-shadow:0 0 0 2px rgba(163,148,255,.12)}.magic-choices i{font-style:normal;font-size:34px}.magic-choices strong{font-size:13px}.magic-replay{display:block;margin:14px auto 0;border:1px solid #35415f;border-radius:12px;padding:11px 16px;background:#151e32;color:#e8edff;font-weight:900}@keyframes sweep{from{transform:translateX(-35%)}to{transform:translateX(35%)}}@keyframes float{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-8px) rotate(2deg)}}@keyframes magic{0%,100%{transform:scale(1) rotate(-4deg)}50%{transform:scale(1.1) rotate(4deg)}}@keyframes reveal{0%{transform:scale(.5) rotate(-15deg);opacity:.3}65%{transform:scale(1.15) rotate(5deg)}100%{transform:scale(1) rotate(0);opacity:1}}@media(max-width:650px){.magic-stage{grid-template-columns:1fr 42px 1fr;padding:22px 8px}.magic-hand{width:84px;height:84px;font-size:45px}.magic-vs{font-size:18px}.magic-choices{gap:6px}.magic-choices button{padding:12px 5px}}
  `}</style>
 </div>;
}
