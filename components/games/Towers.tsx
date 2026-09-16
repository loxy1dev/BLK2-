'use client';
import {useMemo,useState} from 'react';
import {addCoins,beginGame,endGame,getCoins,recordGameResult,spendCoins} from '@/lib/wallet';

const mults=[1.05,1.12,1.22,1.35,1.5,1.68,1.88,2.1,2.4,2.8];
const floors=10;

export function Towers(){
  const [bet,setBet]=useState(100),[started,setStarted]=useState(false),[row,setRow]=useState(0);
  const [revealed,setRevealed]=useState<Record<number,number>>({});
  const [bombs,setBombs]=useState<number[]>([]);
  const [msg,setMsg]=useState('Choisis une porte à chaque maison.');
  const [flash,setFlash]=useState<'safe'|'boom'|null>(null);
  const [round,setRound]=useState(0);

  const start=()=>{
    const b=Math.floor(Number(bet));
    if(!Number.isFinite(b)||b<10){setMsg('Mise minimum : 10 coins.');return;}
    if(!spendCoins(b)){setMsg('Coins insuffisants.');return;}
    beginGame();
    setBombs(Array.from({length:floors},()=>Math.floor(Math.random()*3)));
    setRevealed({});setRow(0);setStarted(true);setFlash(null);setRound(v=>v+1);
    setMsg('La première maison t’attend… choisis une porte.');
  };

  const pick=(choice:number)=>{
    if(!started)return;
    setRevealed(v=>({...v,[row]:choice}));
    if(choice===bombs[row]){
      setFlash('boom');
      recordGameResult('Towers','loss',-bet);setStarted(false);endGame();
      setMsg('💥 Mauvaise maison ! La tour s’effondre.');
      return;
    }
    setFlash('safe');
    if(row===floors-1){
      const payout=Math.floor(bet*mults[floors-1]);
      addCoins(payout);recordGameResult('Towers','win',payout-bet);setStarted(false);endGame();
      setMsg(`🏆 Sommet atteint ! +${payout.toLocaleString('fr-FR')} coins`);return;
    }
    setRow(row+1);setMsg(`✓ Maison sécurisée · multiplicateur ${mults[row].toFixed(2)}x`);
  };

  const cash=()=>{
    if(!started)return;
    const m=row===0?1:mults[row-1];const payout=Math.floor(bet*m);
    addCoins(payout);recordGameResult('Towers','win',payout-bet);setStarted(false);endGame();setFlash('safe');
    setMsg(`🎉 Gain sécurisé : +${payout.toLocaleString('fr-FR')} coins`);
  };

  const currentMult=useMemo(()=>row===0?1:mults[row-1],[row]);

  return <div className="game-panel towers-game">
    <div className="game-head">
      <div><h2>🏠 Towers</h2><p className="muted">Monte de maison en maison. Une porte est piégée à chaque étage.</p></div>
      <div className="mult">{started?`Étage ${row+1}/${floors} · ×${currentMult.toFixed(2)}`:'10 maisons'}</div>
    </div>

    <div className="tower-stage">
      <div className={`tower-sky ${flash==='boom'?'sky-boom':''}`}>
        <span className="cloud c1">☁</span><span className="cloud c2">☁</span><span className="moon">✦</span>
      </div>
      <div className="tower-building">
        {Array.from({length:floors},(_,r)=>{
          const active=started&&r===row;
          const picked=revealed[r];
          const safe=picked!==undefined&&picked!==bombs[r];
          const boom=picked!==undefined&&picked===bombs[r];
          return <div className={`house-floor ${r===row?'current-floor':''} ${r<row?'passed-floor':''}`} key={`${round}-${r}`}>
            <div className="floor-number">{r+1}</div>
            <div className="house-roof"><span>⌂</span></div>
            <div className="house-wall">
              {[0,1,2].map(i=><button key={i}
                disabled={!active}
                className={`house-door ${picked===i?'picked':''} ${picked===i&&safe?'door-safe':''} ${picked===i&&boom?'door-boom':''}`}
                onClick={()=>pick(i)}
              >
                <span className="door-window">{picked===i?(safe?'✓':'💥'):'?'}</span>
                <span className="door-knob"/>
              </button>)}
            </div>
            <div className="house-ground"/>
          </div>;
        })}
      </div>
      {flash==='boom'&&<div className="tower-result boom-result">💥 BOOM</div>}
      {!started&&flash!=='boom'&&<div className="tower-result idle-result">🏠 PRÊT À MONTER</div>}
    </div>

    <div className="tower-controls">
      <div className="betbar">
        <input className="field" type="number" min="10" value={bet} onChange={e=>setBet(Number(e.target.value))} disabled={started}/>
        <button className="maxbtn" onClick={()=>setBet(getCoins())} disabled={started||getCoins()<10}>MAX</button>
        {!started?<button className="playbtn" onClick={start} disabled={getCoins()<10}>🏠 Commencer</button>:<button className="cashbtn" onClick={cash}>💰 Encaisser ×{currentMult.toFixed(2)}</button>}
      </div>
      <div className="tower-steps">{mults.map((m,i)=><span key={m} className={i<row?'step-done':i===row&&started?'step-current':''}>×{m.toFixed(2)}</span>)}</div>
    </div>
    <p className="muted">{msg}</p>

    <style jsx>{`
      .towers-game{overflow:hidden}
      .tower-stage{position:relative;height:590px;margin:18px 0;border-radius:24px;overflow:hidden;background:linear-gradient(180deg,#10152d 0%,#1a2350 48%,#30233d 100%);border:1px solid rgba(255,255,255,.1);box-shadow:inset 0 0 60px rgba(0,0,0,.35)}
      .tower-sky{position:absolute;inset:0;overflow:hidden;background:radial-gradient(circle at 78% 14%,rgba(255,255,255,.12),transparent 4%),linear-gradient(180deg,rgba(91,107,190,.15),transparent 55%);transition:.3s}
      .sky-boom{animation:skyshake .45s ease-in-out}
      .cloud{position:absolute;font-size:48px;opacity:.12;animation:cloud 13s linear infinite}
      .c1{top:38px;left:9%}.c2{top:110px;right:12%;animation-delay:-6s}.moon{position:absolute;right:8%;top:32px;font-size:34px;color:#fff;opacity:.7;animation:twinkle 1.8s ease-in-out infinite}
      .tower-building{position:absolute;bottom:0;left:50%;width:min(760px,94%);height:555px;transform:translateX(-50%);display:flex;flex-direction:column-reverse;justify-content:flex-start;gap:2px}
      .house-floor{position:relative;height:54px;flex:1;min-height:50px;transform-origin:center bottom;transition:.35s;filter:drop-shadow(0 5px 5px rgba(0,0,0,.3))}
      .current-floor{animation:pulsehouse 1.2s ease-in-out infinite}
      .passed-floor{filter:drop-shadow(0 3px 4px rgba(0,0,0,.25))}
      .floor-number{position:absolute;left:-3px;top:17px;width:26px;height:22px;border-radius:7px;background:rgba(0,0,0,.35);color:#fff;font-size:11px;display:grid;place-items:center;z-index:4}
      .house-roof{position:absolute;left:7%;right:7%;top:0;height:18px;background:linear-gradient(135deg,#7646d6,#46309b);clip-path:polygon(50% 0,100% 100%,0 100%);display:flex;align-items:flex-end;justify-content:center;color:#fff;font-size:14px}
      .house-wall{position:absolute;left:10%;right:10%;top:14px;bottom:5px;border:1px solid rgba(255,255,255,.14);border-radius:7px 7px 3px 3px;background:linear-gradient(180deg,#252b45,#171b2c);display:flex;gap:9px;padding:7px 11%;align-items:center}
      .house-door{position:relative;flex:1;height:100%;min-width:42px;border:1px solid rgba(255,255,255,.13);border-radius:5px;background:linear-gradient(180deg,#33405f,#202943);color:#aeb9d8;cursor:pointer;transition:.2s;box-shadow:inset 0 0 0 1px rgba(255,255,255,.03)}
      .house-door:not(:disabled):hover{transform:translateY(-3px);border-color:rgba(255,255,255,.45);box-shadow:0 7px 18px rgba(120,100,255,.22)}
      .house-door:disabled{cursor:default;opacity:.82}
      .door-window{position:absolute;left:50%;top:20%;transform:translateX(-50%);font-size:15px}.door-knob{position:absolute;right:12%;top:58%;width:5px;height:5px;border-radius:50%;background:#f0c96a}
      .door-safe{background:linear-gradient(180deg,#1f9d6c,#14664b)!important;border-color:#45e0a5!important;animation:doorpop .35s ease-out}.door-boom{background:linear-gradient(180deg,#c63c52,#65202e)!important;border-color:#ff6878!important;animation:boomdoor .45s ease-out}
      .house-ground{position:absolute;left:3%;right:3%;bottom:0;height:5px;background:linear-gradient(90deg,transparent,#77659d,transparent);opacity:.7}
      .tower-result{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);padding:14px 22px;border-radius:16px;background:rgba(12,14,26,.86);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.14);font-weight:900;letter-spacing:.08em;z-index:10;animation:resultin .35s ease-out}.boom-result{color:#ff8794}.idle-result{color:#b8a8ff}
      .tower-controls{display:grid;gap:10px}.tower-steps{display:flex;gap:5px;overflow:auto;padding-bottom:2px}.tower-steps span{font-size:10px;padding:5px 7px;border-radius:7px;background:rgba(255,255,255,.05);color:#8e96ad;white-space:nowrap}.tower-steps .step-done{color:#6ff0b8;background:rgba(52,211,153,.12)}.tower-steps .step-current{color:#fff;background:rgba(124,92,255,.28);box-shadow:0 0 14px rgba(124,92,255,.18)}
      @keyframes pulsehouse{0%,100%{transform:scale(1)}50%{transform:scale(1.012)}}@keyframes doorpop{0%{transform:scale(.9)}70%{transform:scale(1.06)}100%{transform:scale(1)}}@keyframes boomdoor{0%,100%{transform:translateX(0) rotate(0)}25%{transform:translateX(-5px) rotate(-3deg)}50%{transform:translateX(5px) rotate(3deg)}75%{transform:translateX(-3px) rotate(-2deg)}}@keyframes resultin{from{opacity:0;transform:translate(-50%,-42%) scale(.85)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}@keyframes skyshake{0%,100%{transform:translateX(0)}25%{transform:translateX(-7px)}50%{transform:translateX(7px)}75%{transform:translateX(-4px)}}@keyframes cloud{from{transform:translateX(-80px)}to{transform:translateX(900px)}}@keyframes twinkle{0%,100%{opacity:.45;transform:scale(.9)}50%{opacity:1;transform:scale(1.1)}}
      @media(max-width:640px){.tower-stage{height:500px}.tower-building{height:470px}.house-wall{gap:5px;padding:6px 9%}.house-door{min-width:30px}.door-window{font-size:12px}.floor-number{left:0}.tower-steps span{font-size:9px;padding:4px 6px}}
    `}</style>
  </div>
}
