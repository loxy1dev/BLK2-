import {NextResponse} from 'next/server';
import {register,sessionCookie,login} from '@/lib/auth';
export const runtime='nodejs';
export async function POST(req:Request){
 try{
  const body=await req.json().catch(()=>({}));
  const username=String(body?.username??'').trim();
  const password=String(body?.password??'');
  const u=await register(username,password);
  const {token}=await login(u.username,password);
  const r=NextResponse.json({user:{id:u.id,username:u.username}});
  r.headers.set('Set-Cookie',sessionCookie(token));
  return r;
 }catch(e){
  return NextResponse.json({error:e instanceof Error?e.message:'Inscription impossible.'},{status:400});
 }
}
