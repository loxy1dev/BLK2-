'use client';
import {useEffect,useState} from 'react';

type AuthUser={id:string;username:string};

export function AuthControls(){
 const [user,setUser]=useState<AuthUser|null>(null);
 const [open,setOpen]=useState<'login'|'register'|null>(null);
 const [username,setUsername]=useState('');
 const [password,setPassword]=useState('');
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);

 const load=async()=>{
  try{
   const r=await fetch('/api/auth/me',{cache:'no-store',credentials:'include'});
   const d=await r.json().catch(()=>({user:null}));
   setUser(d.user||null);
  }catch{
   setUser(null);
  }
 };

 useEffect(()=>{
  load();
  const f=()=>load();
  window.addEventListener('blox:auth',f);
  return()=>window.removeEventListener('blox:auth',f);
 },[]);

 async function submit(){
  if(busy)return;
  setBusy(true);
  setError('');
  try{
   const action=open;
   if(!action)return;
   const r=await fetch(`/api/auth/${action}`,{
    method:'POST',
    credentials:'include',
    headers:{'Content-Type':'application/json'},
    cache:'no-store',
    body:JSON.stringify({username:username.trim(),password})
   });
   const d=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(d.error||'Connexion impossible.');
   setUser(d.user||null);
   setOpen(null);
   setUsername('');
   setPassword('');
   window.dispatchEvent(new Event('blox:auth'));
 }catch(e){
  setError(e instanceof Error?e.message:'Erreur de connexion.');
 }finally{
  setBusy(false);
 }
 }

 async function logout(){
  try{await fetch('/api/auth/logout',{method:'POST',credentials:'include',cache:'no-store'});}finally{
   setUser(null);
   window.dispatchEvent(new Event('blox:auth'));
  }
 }

 return <div className="auth-area">
  <a href="/admin" className="pill" style={{textDecoration:'none'}}>⚙ Admin</a>
  {user?<><span className="pill">👤 {user.username}</span><button className="pill" onClick={logout}>Déconnexion</button></>:<><button className="pill" onClick={()=>{setOpen('login');setError('')}}>Login</button><button className="pill" onClick={()=>{setOpen('register');setError('')}}>Register</button></>}
  {open&&<div className="auth-pop">
   <strong>{open==='login'?'Connexion':'Créer un compte'}</strong>
   <input className="field" autoComplete={open==='login'?'username':'username'} placeholder="Pseudo" value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')submit()}}/>
   <input className="field" type="password" autoComplete={open==='login'?'current-password':'new-password'} placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')submit()}}/>
   {error&&<small>{error}</small>}
   <button className="playbtn" onClick={submit} disabled={busy}>{busy?'...':open==='login'?'Se connecter':'Créer le compte'}</button>
  </div>}
 </div>;
}
