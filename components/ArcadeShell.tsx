'use client';
import {useEffect,useState} from 'react';
import {COINS_EVENT,getCoins,isGameActive,resetCoins} from '@/lib/wallet';
import {AuthControls} from '@/components/AuthControls';
import {ProfileHub} from '@/components/ProfileHub';
export function ArcadeShell({children}:{children:React.ReactNode}){
 const [coins,setCoins]=useState(5000),[resetting,setResetting]=useState(false),[gameActive,setGameActive]=useState(false);
 useEffect(()=>{const presence=async()=>{try{const r=await fetch('/api/auth/me',{cache:'no-store'});const d=await r.json().catch(()=>({user:null}));if(d.user)await fetch('/api/presence',{method:'POST'})}catch{}};presence();const t=setInterval(presence,20000);return()=>clearInterval(t)},[]);
 useEffect(()=>{const refresh=()=>{setCoins(getCoins());setGameActive(isGameActive())};refresh();window.addEventListener(COINS_EVENT,refresh);window.addEventListener('storage',refresh);return()=>{window.removeEventListener(COINS_EVENT,refresh);window.removeEventListener('storage',refresh)}},[]);
 const reset=()=>{if(coins>=50||resetting||isGameActive())return;setResetting(true);resetCoins();setCoins(5000);setTimeout(()=>setResetting(false),250)};
 return <><header className="topbar"><div className="brand">BLOX<span>ARCADE</span></div><div className="version-badge">V3 · FAIT PAR BLK</div><div className="account"><AuthControls/><ProfileHub/><div className="coins">🪙 {coins.toLocaleString('fr-FR')}</div>{coins<50&&<button className="reset" onClick={reset} disabled={resetting||gameActive}>{resetting?'Reset…':gameActive?'Partie en cours…':'↻ Reset 5 000'}</button>}</div></header>{children}</>;
}
