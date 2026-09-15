import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { addResult } from '@/lib/progression';

export const runtime='nodejs';
const redis=new Redis({url:process.env.UPSTASH_REDIS_REST_URL!,token:process.env.UPSTASH_REDIS_REST_TOKEN!});
const ROUND_MS=10_000, BETTING_MS=5_000, MIN_BET=10, MAX_BET=250_000;
const HISTORY_KEY='blox:horses:history';
const HORSE_META=[{id:'aurora',name:'Aurora',emoji:'🦄'},{id:'blaze',name:'Blaze',emoji:'🔥'},{id:'bolt',name:'Bolt',emoji:'⚡'},{id:'phantom',name:'Phantom',emoji:'👻'},{id:'royal',name:'Royal',emoji:'👑'}] as const;
const ODDS_POOL=[1.65,1.9,2.15,2.5,3.1,3.6,4.2];
type Horse={id:string;name:string;emoji:string;odds:number};
type Round={id:string;index:number;startAt:number;bettingEndsAt:number;endsAt:number;winnerId:string;horses:Horse[]};
type BetMap=Record<string,number>;
type HorseHistory={id:string;roundId:string;username:string;horse:string;type:'win'|'loss';amount:number;payout:number;bet:number;odds:number;createdAt:number};
function roundFor(now:number){const index=Math.floor(now/ROUND_MS);return {index,startAt:index*ROUND_MS};}
function roundKey(index:number){return `blox:horses:round:${index}`;}
function betKey(roundId:string,userId:string){return `blox:horses:bets:${roundId}:${userId}`;}
function claimKey(roundId:string,userId:string){return `blox:horses:claim:${roundId}:${userId}`;}
function validBet(v:unknown){const n=Number(v);return Number.isSafeInteger(n)&&n>=MIN_BET&&n<=MAX_BET?n:null;}
function shuffled<T>(items:T[]){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function makeHorses(){const odds=shuffled(ODDS_POOL.slice(0,5));return shuffled([...HORSE_META]).map((h,i)=>({...h,odds:odds[i]}));}
function pickWinner(horses:Horse[],previousWinner?:string){const available=horses.filter(h=>h.id!==previousWinner);const pool=available.length?available:horses;return pool[Math.floor(Math.random()*pool.length)].id;}
async function ensureRound(now:number){const {index,startAt}=roundFor(now);const key=roundKey(index);let round=await redis.get(key) as Round|null;if(!round){const previous=index>0?await redis.get(roundKey(index-1)) as Round|null:null;const horses=makeHorses();const candidate:Round={id:`horses-${index}`,index,startAt,bettingEndsAt:startAt+BETTING_MS,endsAt:startAt+ROUND_MS,horses,winnerId:pickWinner(horses,previous?.winnerId)};const created=await redis.set(key,candidate,{nx:true,ex:120});round=created?candidate:await redis.get(key) as Round|null;}if(!round)throw new Error('ROUND_CREATE_FAILED');return round;}
function phaseOf(round:Round,now:number){return now<round.bettingEndsAt?'betting':now<round.endsAt?'running':'finished';}
async function readBets(roundId:string,userId:string):Promise<BetMap>{const raw=await redis.hgetall(betKey(roundId,userId)) as unknown as Record<string,string>;const out:BetMap={};for(const [id,value] of Object.entries(raw||{})){const n=Number(value);if(Number.isFinite(n)&&n>0)out[id]=Math.floor(n);}return out;}
async function getHistory():Promise<HorseHistory[]>{const rows=await redis.lrange(HISTORY_KEY,0,29) as unknown as string[];return (rows||[]).map(row=>{try{return typeof row==='string'?JSON.parse(row) as HorseHistory:row as unknown as HorseHistory}catch{return null;}}).filter(Boolean) as HorseHistory[];}
async function addHistory(item:Omit<HorseHistory,'id'>){const entry={...item,id:`${Date.now()}-${Math.random().toString(36).slice(2)}`};await redis.lpush(HISTORY_KEY,JSON.stringify(entry));await redis.ltrim(HISTORY_KEY,0,49);}
async function baseResponse(round:Round,userId:string,username:string,now=Date.now()){const bets=await readBets(round.id,userId);const phase=phaseOf(round,now);const claimed=Boolean(await redis.get(claimKey(round.id,userId)));return {id:round.id,index:round.index,startAt:round.startAt,bettingEndsAt:round.bettingEndsAt,endsAt:round.endsAt,phase,winnerId:phase==='finished'?round.winnerId:null,horses:round.horses,bets,claimed,username,history:await getHistory()};}
export async function GET(req:Request){try{const s=await getSession(req);if(!s)return NextResponse.json({error:'LOGIN_REQUIRED'},{status:401});return NextResponse.json(await baseResponse(await ensureRound(Date.now()),s.user.id,s.user.username));}catch(error){console.error(error);return NextResponse.json({error:'Horse server unavailable'},{status:500});}}
export async function POST(req:Request){try{const s=await getSession(req);if(!s)return NextResponse.json({error:'LOGIN_REQUIRED'},{status:401});const body=await req.json().catch(()=>({}));const action=String(body?.action||'bet');const now=Date.now();const round=await ensureRound(now);const uid=s.user.id;const username=s.user.username;
 if(action==='bet'){
  if(phaseOf(round,now)!=='betting')return NextResponse.json({error:'Les mises sont fermées.'},{status:409});
  const horseId=String(body?.horseId||''),horse=round.horses.find(h=>h.id===horseId),bet=validBet(body?.bet);
  if(!horse)return NextResponse.json({error:'Cheval invalide.'},{status:400});if(bet===null)return NextResponse.json({error:`Mise entre ${MIN_BET} et ${MAX_BET.toLocaleString('fr-BE')} coins.`},{status:400});
  const key=betKey(round.id,uid),current=Number(await redis.hget(key,horse.id)||0);if(current+bet>MAX_BET)return NextResponse.json({error:`Maximum ${MAX_BET.toLocaleString('fr-BE')} coins sur ce cheval.`},{status:400});
  await redis.hincrby(key,horse.id,bet);await redis.expire(key,120);return NextResponse.json(await baseResponse(round,uid,username,now));
 }
 if(action==='claim'){
  const targetIndex=Number(body?.roundIndex??round.index),targetId=String(body?.roundId||'');if(!Number.isSafeInteger(targetIndex)||Math.abs(targetIndex-round.index)>1)return NextResponse.json({error:'Course introuvable.'},{status:404});
  const target=await redis.get(roundKey(targetIndex)) as Round|null;if(!target||target.id!==targetId||phaseOf(target,now)!=='finished')return NextResponse.json({error:'Course indisponible.'},{status:409});
  const existing=await redis.get(claimKey(target.id,uid)) as {payout:number;net:number;bet:number;winnerId:string;odds:number;horseName:string}|null;if(existing)return NextResponse.json({...existing,roundId:target.id,roundIndex:target.index});
  const bets=await readBets(target.id,uid),totalBet=Object.values(bets).reduce((a,b)=>a+b,0);if(totalBet<=0){const empty={payout:0,net:0,bet:0,winnerId:target.winnerId,odds:0,horseName:''};await redis.set(claimKey(target.id,uid),empty,{ex:120});return NextResponse.json({...empty,roundId:target.id,roundIndex:target.index});}
  const winner=target.horses.find(h=>h.id===target.winnerId)!;const winningBet=Number(bets[target.winnerId]||0);const payout=winningBet>0?Math.floor(winningBet*winner.odds):0;const net=payout-totalBet;const resultType=payout>0?'win':'loss';
  await addResult(uid,username,s.user.createdAt,'Horses',resultType,net);await addHistory({roundId:target.id,username,horse:winner.name,type:resultType,amount:net,payout,bet:totalBet,odds:winner.odds,createdAt:Date.now()});
  const saved={payout,net,bet:totalBet,winnerId:target.winnerId,odds:winner.odds,horseName:winner.name};await redis.set(claimKey(target.id,uid),saved,{ex:120});return NextResponse.json({...saved,roundId:target.id,roundIndex:target.index});
 }
 return NextResponse.json({error:'Action inconnue.'},{status:400});
}catch(error){console.error(error);return NextResponse.json({error:'Horse server unavailable'},{status:500});}}
