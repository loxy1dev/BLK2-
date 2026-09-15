import {NextResponse} from 'next/server';
import {login,sessionCookie} from '@/lib/auth';
export const runtime='nodejs';
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
  return NextResponse.json({error:e instanceof Error?e.message:'Connexion impossible.'},{status:401});
 }
}
