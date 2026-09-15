import {NextResponse} from 'next/server';
import {login,sessionCookie} from '@/lib/auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 try{
  const body=await req.json().catch(()=>({}));
  const username=String(body?.username??'').trim();
  const password=String(body?.password??'');
  if(!username||!password)return NextResponse.json({error:'Pseudo et mot de passe requis.'},{status:400});
  const {user,token}=await login(username,password);
  const r=NextResponse.json({user:{id:user.id,username:user.username}});
  r.headers.set('Set-Cookie',sessionCookie(token));
  return r;
 }catch(e){
  const message=e instanceof Error?e.message:'Connexion impossible.';
  const status=message==='Pseudo ou mot de passe incorrect.'?401:500;
  return NextResponse.json({error:message},{status});
 }
}
