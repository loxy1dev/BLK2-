import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getProfile } from '@/lib/progression';

export const runtime='nodejs';
const redis=new Redis({url:process.env.UPSTASH_REDIS_REST_URL!,token:process.env.UPSTASH_REDIS_REST_TOKEN!});
const KEY='blox:public:chat';
const MAX=100;
type ChatMessage={id:string;username:string;message:string;createdAt:number;level:number;badge:string};

export async function GET(){
  const messages=await redis.lrange<ChatMessage>(KEY,0,49);
  return NextResponse.json({messages:(messages||[]).slice(0,50)});
}

export async function POST(req:Request){
  const session=await getSession(req);
  if(!session)return NextResponse.json({error:'Connecte-toi pour participer au chat.'},{status:401});
  try{
    const body=await req.json();
    const message=String(body.message||'').trim().replace(/[\u0000-\u001F\u007F]/g,'').slice(0,250);
    if(message.length<1)return NextResponse.json({error:'Message vide.'},{status:400});
    const cooldown=await redis.set(`blox:chat:cooldown:${session.user.id}`,'1',{nx:true,ex:1});
    if(!cooldown)return NextResponse.json({error:'Attends une seconde avant de renvoyer un message.'},{status:429});
    const p=await getProfile(session.user.id,session.user.username,session.user.createdAt);
    const item:ChatMessage={id:crypto.randomUUID(),username:session.user.username,message,createdAt:Date.now(),level:p.level,badge:p.badge};
    await redis.lpush(KEY,item);
    await redis.ltrim(KEY,0,MAX-1);
    return NextResponse.json({item});
  }catch{return NextResponse.json({error:'Requête invalide.'},{status:400});}
}
