'use client';
import { useState } from 'react';

const services = [
  ['netflix','Netflix'], ['hotmail','Hotmail'], ['crunchyroll','Crunchyroll'], ['steam','Steam'], ['deezer','Deezer']
] as const;

export default function Admin() {
  const [secret,setSecret]=useState('');
  const [key,setKey]=useState('');
  const [result,setResult]=useState<any>(null);
  const [service,setService]=useState('netflix');
  const [accounts,setAccounts]=useState('');
  const [quantity,setQuantity]=useState(10);
  const [stock,setStock]=useState<any>(null);
  const [generated,setGenerated]=useState<string[]>([]);
  const [loading,setLoading]=useState(false);

  async function verify(deliver=false){setLoading(true);setResult(null);try{const r=await fetch('/api/shop/verify',{method:'POST',headers:{'content-type':'application/json','x-admin-secret':secret},body:JSON.stringify({key,deliver})});setResult(await r.json())}finally{setLoading(false)}}
  async function addStock(){setLoading(true);try{const list=accounts.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);const r=await fetch('/api/shop/stock',{method:'POST',headers:{'content-type':'application/json','x-admin-secret':secret},body:JSON.stringify({productId:service,accounts:list})});setResult(await r.json());setAccounts(''); await getStock()}finally{setLoading(false)}}
  async function getStock(){const r=await fetch('/api/shop/stock',{headers:{'x-admin-secret':secret}});setStock(await r.json())}
  async function generate(productId:string, qty=quantity){setLoading(true);setGenerated([]);setResult(null);try{const r=await fetch('/api/shop/keys/generate',{method:'POST',headers:{'content-type':'application/json','x-admin-secret':secret},body:JSON.stringify({productId,quantity:qty})});const data=await r.json();setResult(data);if(Array.isArray(data.keys))setGenerated(data.keys);await getStock()}finally{setLoading(false)}}

  return <main className="container">
    <section className="shop-area"><div className="shop-head"><div><span className="eyebrow">ADMIN</span><h2>Clés & stock</h2><p>Génère tes clés côté serveur, ajoute ton stock et délivre une seule unité par commande.</p></div></div>
      <div className="key-result">
        <input value={secret} onChange={e=>setSecret(e.target.value)} placeholder="Secret admin" type="password" className="field"/>
        <input value={key} onChange={e=>setKey(e.target.value)} placeholder="BLOX-..." className="field" style={{marginTop:10}}/>
        <div style={{display:'flex',gap:10,marginTop:12,flexWrap:'wrap'}}><button className="playbtn" onClick={()=>verify(false)} disabled={loading||!secret||!key}>Vérifier</button><button className="cashbtn" onClick={()=>verify(true)} disabled={loading||!secret||!key}>Vérifier + délivrer 1 compte</button></div>
        {result&&<div style={{marginTop:16}}>{result.valid?<><strong>✅ CLÉ VALIDE</strong><p>Service : {result.product}<br/>Commande : {result.requestId}<br/>{result.delivered||result.alreadyDelivered?<><b>Compte :</b> <code>{result.account}</code></>:result.status==='pending'?'En attente de délivrance.':''}</p></>:<strong>❌ {result.error||'Clé invalide'}</strong>}</div>}
      </div>
    </section>

    <section className="shop-area"><div className="key-result"><h3>🔑 Générer des clés</h3><p>Les clés sont créées avec ton <code>SHOP_KEY_SECRET</code> et enregistrées dans Redis. Elles seront distribuées une seule fois.</p>
      <select className="field" value={service} onChange={e=>setService(e.target.value)}>{services.map(([id,name])=><option value={id} key={id}>{name}</option>)}</select>
      <input className="field" type="number" min={1} max={100} value={quantity} onChange={e=>setQuantity(Math.max(1,Math.min(100,Number(e.target.value)||1)))} style={{marginTop:10}}/>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:10}}><button className="primary" onClick={()=>generate(service)} disabled={loading||!secret}>Générer pour ce service</button><button className="primary" onClick={()=>generate('all')} disabled={loading||!secret}>Générer pour TOUS</button></div>
      {generated.length>0&&<textarea readOnly className="field" style={{marginTop:12,minHeight:180}} value={generated.join('\n')}/>} 
    </div></section>

    <section className="shop-area"><div className="key-result"><h3>📦 Ajouter du stock</h3><select className="field" value={service} onChange={e=>setService(e.target.value)}>{services.map(([id,name])=><option value={id} key={id}>{name}</option>)}</select><textarea className="field" style={{marginTop:10,minHeight:150}} value={accounts} onChange={e=>setAccounts(e.target.value)} placeholder={'1 élément par ligne\nexemple: email:motdepasse'}/><button className="primary" onClick={addStock} disabled={loading||!secret||!accounts.trim()}>Ajouter au stock</button><button className="primary" onClick={getStock} disabled={loading||!secret} style={{marginTop:8}}>Actualiser le stock</button>{stock&&<pre style={{marginTop:12}}>{JSON.stringify(stock,null,2)}</pre>}</div></section>
  </main>
}
