'use client';
import {useState} from 'react';
import {Towers} from '@/components/games/Towers';
import {HorseRacing} from '@/components/games/HorseRacing';
import {Plinko} from '@/components/games/Plinko';
import {Blackjack} from '@/components/games/Blackjack';
import {Roulette} from '@/components/games/Roulette';
import {Shop} from '@/components/Shop';
import {Rocket} from '@/components/games/Rocket';
import {Dice} from '@/components/games/Dice';
import {Hilo} from '@/components/games/Hilo';
import {Cases} from '@/components/games/Cases';
import {LiveHistory} from '@/components/LiveHistory';
import {PublicChat} from '@/components/PublicChat';
const games=[
 {id:'shop',name:'Shop',icon:'🛒',desc:'Échange tes points contre des clés uniques.'},
 {id:'towers',name:'Towers',icon:'🗼',desc:'Monte étage par étage sans toucher la bombe.'},
 {id:'horses',name:'Chevaux',icon:'🏇',desc:'5 chevaux, courses LIVE toutes les 10 secondes.'},
 {id:'plinko',name:'Plinko',icon:'🔵',desc:'Lâche la bille et regarde le multiplicateur.'},
 {id:'blackjack',name:'Blackjack',icon:'🂡',desc:'Affronte le croupier et vise 21.'},
 {id:'roulette',name:'Roulette',icon:'🎡',desc:'Fais tourner la roue et mise sur une couleur.'},
 {id:'rocket',name:'Rocket',icon:'🚀',desc:'Fais monter la fusée et encaisse avant le crash.'},
 {id:'dice',name:'Dice',icon:'🎲',desc:'Devine le résultat exact du dé.'},
 {id:'hilo',name:'Hi-Lo',icon:'🃏',desc:'Plus haut ou plus bas.'},
 {id:'cases',name:'Cases',icon:'📦',desc:'Ouvre des caisses et découvre des items.'}
];
export default function Home(){const [game,setGame]=useState('towers');return <main className="container"><section className="hero premium-hero"><div><span className="eyebrow">BLOX ARCADE • NEXT GEN</span><h1>Play. Risk. <span>Win.</span></h1><p>Une arcade virtuelle communautaire avec progression XP, récompenses, classement mondial, chat LIVE et jeux instantanés.</p><div className="hero-pills"><span>⚡ LIVE</span><span>🏆 XP & NIVEAUX</span><span>💬 CHAT</span><span>🎁 DAILY</span></div></div><div className="hero-orb"><span>✦</span><small>PLAY<br/>NOW</small></div></section><div className="game-grid">{games.map(g=><button key={g.id} onClick={()=>setGame(g.id)} className={`game-card ${game===g.id?'active':''}`}><div className="game-icon">{g.icon}</div><div><h3>{g.name}</h3><p>{g.desc}</p></div><span>›</span></button>)}</div><div className="arcade-main-layout"><div className="arcade-main-column">{game==='shop'?<Shop/>:<section className="play-area">{game==='towers'&&<Towers/>}{game==='horses'&&<HorseRacing/>}{game==='plinko'&&<Plinko/>}{game==='blackjack'&&<Blackjack/>}{game==='roulette'&&<Roulette/>}{game==='rocket'&&<Rocket/>}{game==='dice'&&<Dice/>}{game==='hilo'&&<Hilo/>}{game==='cases'&&<Cases/>}</section>}<LiveHistory/></div><PublicChat/></div><div className="notice">🪙 Les coins sont virtuels et n'ont aucune valeur monétaire.</div></main>}
