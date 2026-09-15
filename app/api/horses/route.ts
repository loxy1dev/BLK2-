import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { addResult } from '@/lib/progression';

export const runtime='nodejs';
const redis=new Redis({url:process.env.UPSTASH_REDIS_REST_URL!,token:process.env.UPSTASH_REDIS_REST_TOKEN!});
const ROUND_MS=10_000, BETTING_MS=5_000, MIN_BET=10, MAX_BET=250_000;
const HISTORY_KEY='blox:horses:history'; const LOCK_PREFIX='blox:horses:lock:';
const HORSES=[
 {id:'aurora',name:'Aurora',emoji:'🦄',odds:4.20},
 {id:'blaze',name:'Blaze',emoji:'🔥',odds:4.50},
 {id:'bolt',name:'Bolt',emoji:'⚡',odds:5.00},
 {id:'phantom',name:'Phantom',emoji:'👻',odds:5.50},
 {id:'royal',name:'Royal',emoji:'👑',odds:6.00},
] as const;
type Round={id:string;index:number;startAt:number;bettingEndsAt:number;endsAt:number;winnerId:string};
type BetMap=Record<string,number>;
type HorseHistory={id:string;roundId:string;username:string;horse:string;type:'win'|'loss';amount:number;payout:number;bet:number;odds:number;createdAt:number};
function roundFor(now:number){const index=Math.floor(now/ROUND_MS);return {index,startAt:index*ROUND_MS};}
function roundKey(index:number){return `blox:horses:round:${index}`;}
function betKey(roundId:string,userId:string){return `blox:horses:bets:${roundId}:${userId}`;}
function claimKey(roundId:string,userId:string){return `blox:horses:claim:${roundId}:${userId}`;}
function lockKey(roundId:string,userId:string){return `${LOCK_PREFIX}${roundId}:${userId}`;}
function validBet(v:unknown){const n=Number(v);return Number.isSafeInteger(n)&&n>=MIN_BET&&n<=MAX_BET?n:null;}
function pickWinner(){const weights=[1.10,1.00,0.90,0.82,0.72];const total=weights.reduce((a,b)=>a+b,0);let roll=Math.random()*total;for(let i=0;i<weights.length;i++){roll-=weights[i];if(roll<=0)return HORSES[i].id;}return HORSES[0].id;}
async function ensureRound(now:number){const {index,startAt}=roundFor(now);const key=roundKey(index);let round=await redis.get(key) as Round | null;if(!round){const candidate:Round={id:`horses-${index}`,index,startAt,bettingEndsAt:startAt+BETTING_MS,endsAt:startAt+ROUND_MS,winnerId:pickWinner()};const created=await redis.set(key,candidate,{nx:true,ex:120});round=created?candidate:await redis.get(key) as Round | null;}if(!round)throw new Error('ROUND_CREATE_FAILED');return round;}
async function readBets(roundId:string,userId:string):Promise<BetMap>{const raw=await redis.hgetall(betKey(roundId,userId)) as unknown as Record<string,string>;const out:BetMap={};if(raw)for(const [horseId,value] of Object.entries(raw)){const n=Number(value);if(Number.isFinite(n)&&n>0)out[horseId]=Math.floor(n);}return out;}
async function history():Promise<HorseHistory[]>{const rows=await redis.lrange(HISTORY_KEY,0,29) as unknown as string[];return rows.map(row=>{try{return typeof row==='string'?JSON.parse(row) as HorseHistory:row as unknown as HorseHistory}catch{return null;}}).filter(Boolean) as HorseHistory[];}
async function addHistory(item:Omit<HorseHistory,'id'>){const entry={...item,id:crypto.randomUUID()};await redis.lpush(HISTORY_KEY,JSON.stringify(entry));await redis.ltrim(HISTORY_KEY,0,49);}
function phaseOf(round:Round,now:number):'betting'|'running'|'finished'{if(now<round.bettingEndsAt)return'betting';if(now<round.endsAt)return'running';return'finished';}
async function baseResponse(round:Round,userId:string,username:string,now=Date.now()){
 const bets=await readBets(round.id,userId), phase=phaseOf(round,now), saved=await redis.get(claimKey(round.id,userId));
 return {id:round.id,index:round.index,startAt:round.startAt,bettingEndsAt:round.bettingEndsAt,endsAt:round.endsAt,phase,winnerId:phase==='finished'?round.winnerId:null,horses:HORSES,bets,claimed:Boolean(saved),username,history:await history()};
}
export async function GET(req:Request){try{const s=await getSession(req);if(!s)return NextResponse.json({error:'LOGIN_REQUIRED'},{status:401});const round=await ensureRound(Date.now());return NextResponse.json(await baseResponse(round,s.user.id,s.user.username));}catch(e){console.error(e);return NextResponse.json({error:'Horse server unavailable'},{status:500});}}
export async function POST(req:Request){
 try{
  const s=await getSession(req);if(!s)return NextResponse.json({error:'LOGIN_REQUIRED'},{status:401});
  const body=await req.json().catch(()=>({}));const action=String(body?.action||'bet');const uid=s.user.id;const username=s.user.username;const now=Date.now();const round=await ensureRound(now);
  if(action==='bet'){
   const horseId=String(body?.horseId||''),horse=HORSES.find(x=>x.id===horseId),bet=validBet(body?.bet);
   if(!horse)return NextResponse.json({error:'Cheval invalide.'},{status:400});if(bet===null)return NextResponse.json({error:`Mise entre ${MIN_BET} et ${MAX_BET.toLocaleString('fr-BE')} coins.`},{status:400});
   if(phaseOf(round,now)!=='betting')return NextResponse.json({error:'La course a déjà démarré. Attends la prochaine manche.'},{status:409});
   const key=betKey(round.id,uid),current=Number(await redis.hget(key,horse.id)||0);if(current+bet>MAX_BET)return NextResponse.json({error:`Maximum ${MAX_BET.toLocaleString('fr-BE')} coins sur ce cheval.`},{status:400});
   await redis.hincrby(key,horse.id,bet);await redis.expire(key,120);return NextResponse.json(await baseResponse(round,uid,username,now));
  }
  if(action==='claim'){
   const targetId=String(body?.roundId||round.id),targetIndex=Number(body?.roundIndex??round.index);if(!Number.isSafeInteger(targetIndex)||Math.abs(targetIndex-round.index)>1)return NextResponse.json({error:'Course introuvable.'},{status:404});
   const target=await redis.get(roundKey(targetIndex)) as Round | null;if(!target||target.id!==targetId)return NextResponse.json({error:'Course introuvable.'},{status:404});if(phaseOf(target,now)!=='finished')return NextResponse.json({error:'La course n’est pas encore terminée.'},{status:409});
   const result=await withLock(lockKey(target.id,uid),async()=>{
    const existing=await redis.get(claimKey(target.id,uid)) as {payout:number;net:number;bet:number;winnerId:string;odds:number;horseName:string} | null;if(existing)return existing;
    const bets=await readBets(target.id,uid),totalBet=Object.values(bets).reduce((a,b)=>a+b,0);if(totalBet<=0){const empty={payout:0,net:0,bet:0,winnerId:target.winnerId,odds:0,horseName:''};await redis.set(claimKey(target.id,uid),empty,{ex:120});return empty;}
    const winner=HORSES.find(h=>h.id===target.winnerId)!;const winningBet=Number(bets[target.winnerId]||0);const payout=winningBet>0?Math.floor(winningBet*winner.odds):0;const net=payout-totalBet;const type:'win'|'loss'=payout>0?'win':'loss';
    await addResult(uid,username,s.user.createdAt,'Horses',type,net);await addHistory({roundId:target.id,username,horse:winner.name,type,amount:net,payout,bet:totalBet,odds:winner.odds,createdAt:now});
    const saved={payout,net,bet:totalBet,winnerId:target.winnerId,odds:winner.odds,horseName:winner.name};await redis.set(claimKey(target.id,uid),saved,{ex:120});return saved;
   });
   return NextResponse.json({...result,roundId:target.id,roundIndex:target.index});
  }
  return NextResponse.json({error:'Action inconnue.'},{status:400});
 }catch(e){console.error(e);if(e instanceof Error&&e.message==='HORSES_BUSY')return NextResponse.json({error:'Une opération est déjà en cours.'},{status:409});return NextResponse.json({error:'Horse server unavailable'},{status:500});}
}
async function withLock<T>(key:string,fn:()=>Promise<T>,seconds=3){const token=crypto.randomUUID();const ok=await redis.set(key,token,{nx:true,ex:seconds});if(!ok)throw new Error('HORSES_BUSY');try{return await fn();}finally{try{await redis.eval("if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",[key],[token]);}catch{}}}
