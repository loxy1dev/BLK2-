'use client';

import Link from 'next/link';
import {Cases} from '@/components/games/Cases';

export default function CasesPage(){
  return (
    <main className="container">
      <section className="hero premium-hero">
        <div>
          <span className="eyebrow">BLOX ARCADE • CASE OPENING</span>
          <h1>Open <span>Cases.</span></h1>
          <p>Ouvre tes caisses sur une page dédiée, sans afficher le jeu directement dans l’arcade principale.</p>
          <div className="hero-pills">
            <span>📦 CASES</span><span>⚡ ANIMATION LIVE</span><span>🪙 COINS VIRTUELS</span>
          </div>
        </div>
        <div className="hero-orb"><span>📦</span><small>OPEN<br/>CASE</small></div>
      </section>

      <div style={{display:'flex',justifyContent:'flex-start',margin:'18px 0'}}>
        <Link href="/" className="game-card" style={{maxWidth:260,textDecoration:'none'}}>
          <div className="game-icon">←</div>
          <div><h3>Retour à l’arcade</h3><p>Revenir à la liste des jeux</p></div>
          <span>›</span>
        </Link>
      </div>

      <section className="play-area">
        <Cases/>
      </section>

      <div className="notice">🪙 Les coins sont virtuels et n'ont aucune valeur monétaire.</div>
    </main>
  );
}
