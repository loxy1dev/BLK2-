import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { addResult } from '@/lib/progression';

export const runtime = 'nodejs';
const redis = new Redis({url:process.env.UPSTASH_REDIS_REST_URL!,token:process.env.UPSTASH_REDIS_REST_TOKEN!});
const KEY='blox:live:history';
const MAX=100;
type Item={id:string;game:string;type:'win'|'loss';amount:number;username:string;createdAt:number};

export async function GET(){
  const items=await redis.lrange<Item>(KEY,0,49);
  return NextResponse.json({items:(items||[]).slice(0,5)});
}

export async function POST(req:Request){
  const session=await getSession(req);
  if(!session) return NextResponse.json({error:'Connexion requise.'},{status:401});
  try{
    const body=await req.json();
    const game=String(body.game||'').trim().slice(0,30);
    const type=body.type==='win'?'win':body.type==='loss'?'loss':null;
    const amount=Math.trunc(Number(body.amount));
    if(!game||!type||!Number.isFinite(amount)) return NextResponse.json({error:'Résultat invalide.'},{status:400});
    const item:Item={id:crypto.randomUUID(),game,type,amount,username:session.user.username,createdAt:Date.now()};
    await redis.lpush(KEY,item);
    await addResult(session.user.id, session.user.username, session.user.createdAt, game, type, amount);
    await redis.ltrim(KEY,0,MAX-1);
    return NextResponse.json({item});
  }catch{return NextResponse.json({error:'Requête invalide.'},{status:400});}
}
