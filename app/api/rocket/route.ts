import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { addResult } from '@/lib/progression';
export const runtime='nodejs';
const redis=new Redis({url:process.env.UPSTASH_REDIS_REST_URL!,token:process.env.UPSTASH_REDIS_REST_TOKEN!});
type RocketState={id:string;phase:'waiting'|'running';startedAt:number;runAt?:number;crashAt:number;bet:number;cashedOut:boolean;payout:number};
type HistoryItem={id:string;roundId:string;username:string;type:'win'|'loss';amount:number;payout:number;bet:number;multiplier:number;createdAt:number};
const HISTORY_KEY='blox:rocket:history',ROUND_LOCK_PREFIX='blox:rocket:solo-lock:',ROUND_KEY_PREFIX='blox:rocket:solo:',WAIT=5000,MULTIPLIER_STEP_MS=10500,MIN_BET=10,MAX_BET=1000000;
function roundKey(id:string){return `${ROUND_KEY_PREFIX}${id}`}function roundLockKey(id:string){return `${ROUND_LOCK_PREFIX}${id}`}function validBet(v:unknown){const bet=Number(v);return Number.isSafeInteger(bet)&&bet>=MIN_BET&&bet<=MAX_BET?bet:null}
function newRound(now:number):RocketState{const crashAt=101+Math.floor(Math.random()*899);return{id:crypto.randomUUID(),phase:'waiting',startedAt:now,crashAt,bet:0,cashedOut:false,payout:0}}
async function withLock<T>(key:string,fn:()=>Promise<T>,seconds=4){const token=crypto.randomUUID();const locked=await redis.set(key,token,{nx:true,ex:seconds});if(!locked)throw new Error('ROCKET_BUSY');try{return await fn()}finally{try{await redis.eval("if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",[key],[token])}catch{}}}
async function addHistory(item:Omit<HistoryItem,'id'>){await redis.lpush(HISTORY_KEY,JSON.stringify({...item,id:crypto.randomUUID()}));await redis.ltrim(HISTORY_KEY,0,49)}
async function getHistory():Promise<HistoryItem[]>{const rows=await redis.lrange<string>(HISTORY_KEY,0,29);return rows.map(row=>{try{return typeof row==='string'?JSON.parse(row) as HistoryItem:row as unknown as HistoryItem}catch{return null}}).filter(Boolean) as HistoryItem[]}
function currentMultiplier(state:RocketState,now=Date.now()){const elapsed=Math.max(0,now-(state.runAt??state.startedAt));return Math.min(state.crashAt/100,Number((1+elapsed/MULTIPLIER_STEP_MS).toFixed(2)))}
function runDuration(state:RocketState){return Math.max(100,Math.round((state.crashAt/100-1)*MULTIPLIER_STEP_MS))}
function expired(state:RocketState,now:number){if(state.phase==='waiting')return now-state.startedAt>=WAIT;return now-(state.runAt??state.startedAt)>=runDuration(state)}
async function advanceState(userId:string,username:string,state:RocketState,now:number){if(state.phase==='waiting'){const running={...state,phase:'running' as const,runAt:now};await redis.set(roundKey(userId),running);return running}if(state.bet>0&&!state.cashedOut){const crashMultiplier=state.crashAt/100;await addResult(userId,username,now,'Rocket','loss',-state.bet);await addHistory({roundId:state.id,username,type:'loss',amount:-state.bet,payout:0,bet:state.bet,multiplier:crashMultiplier,createdAt:now})}const next=newRound(now);await redis.set(roundKey(userId),next);return next}
async function getState(userId:string,username:string){const key=roundKey(userId);return await withLock(roundLockKey(userId),async()=>{let state=await redis.get<RocketState>(key);if(!state||!Number.isFinite(state.crashAt)||state.crashAt<101||state.crashAt>999){state=newRound(Date.now());await redis.set(key,state)}let now=Date.now();if(expired(state,now)){state=await advanceState(userId,username,state,now);now=Date.now();if(expired(state,now)){state=await advanceState(userId,username,state,now)}}return{state,history:await getHistory()}})}
function jsonState(state:RocketState,username:string,history:HistoryItem[],extra:Record<string,unknown>={}){return{id:state.id,phase:state.phase,startedAt:state.startedAt,runAt:state.runAt??null,crashAt:state.crashAt,username,history,bet:state.bet,cashedOut:state.cashedOut,payout:state.payout,...extra}}
export async function GET(req:Request){try{const session=await getSession(req);if(!session)return NextResponse.json({error:'LOGIN_REQUIRED'},{status:401});const {state,history}=await getState(session.user.id,session.user.username);return NextResponse.json(jsonState(state,session.user.username,history,{multiplier:state.phase==='running'?currentMultiplier(state):1}))}catch(e){console.error(e);return NextResponse.json({error:'Rocket server unavailable'},{status:500})}}
export async function POST(req:Request){try{const body=await req.json().catch(()=>({}));const action=String(body?.action||'bet');const session=await getSession(req);if(!session)return NextResponse.json({error:'LOGIN_REQUIRED'},{status:401});const id=session.user.id,name=session.user.username,key=roundKey(id);return await withLock(roundLockKey(id),async()=>{let state=await redis.get<RocketState>(key);if(!state||!Number.isFinite(state.crashAt)||state.crashAt<101||state.crashAt>999){state=newRound(Date.now());await redis.set(key,state)}let now=Date.now();
 if(action==='bet'){
  const bet=validBet(body?.bet);if(bet===null)return NextResponse.json({error:`Mise entre ${MIN_BET} et ${MAX_BET.toLocaleString('fr-BE')} coins.`},{status:400});
  // If the UI was a little late on the 5s window, open the next round instead of rejecting a valid click.
  if(state.phase==='waiting'&&expired(state,now)){state=newRound(now);await redis.set(key,state)}
  if(state.phase!=='waiting')return NextResponse.json({error:'Les mises sont fermées. Attends la prochaine manche.'},{status:409});
  if(state.bet>0)return NextResponse.json({error:'Tu as déjà misé sur cette manche.'},{status:409});
  const next={...state,bet,cashedOut:false,payout:0};await redis.set(key,next);return NextResponse.json(jsonState(next,name,await getHistory()))
 }
 if(expired(state,now)&&state.phase==='running')state=await advanceState(id,name,state,now);
 if(action==='cashout'){
  if(state.phase!=='running')return NextResponse.json({error:'La fusée n’est pas encore en vol.'},{status:409});
  if(state.bet<=0)return NextResponse.json({error:'Aucune mise active.'},{status:404});
  if(state.cashedOut)return NextResponse.json({error:'Mise déjà encaissée.'},{status:409});
  const multiplier=currentMultiplier(state,now),crashMultiplier=state.crashAt/100;
  if(multiplier>=crashMultiplier)return NextResponse.json({error:`💥 La fusée a explosé à ×${crashMultiplier.toFixed(2)}. Trop tard.`},{status:409});
  const payout=Math.floor(state.bet*multiplier),next={...state,cashedOut:true,payout};await redis.set(key,next);await addResult(id,name,now,'Rocket','win',payout-state.bet);await addHistory({roundId:state.id,username:name,type:'win',amount:payout-state.bet,payout,bet:state.bet,multiplier,createdAt:now});return NextResponse.json(jsonState(next,name,await getHistory(),{payout,multiplier}))
 }
 return NextResponse.json({error:'Action inconnue.'},{status:400})})}catch(error){console.error(error);if(error instanceof Error&&error.message==='ROCKET_BUSY')return NextResponse.json({error:'Une opération est déjà en cours. Réessaie dans un instant.'},{status:409});return NextResponse.json({error:'Rocket server unavailable'},{status:500})}}
