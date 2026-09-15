import {NextResponse} from 'next/server';import {leaderboard} from '@/lib/progression';
export const runtime='nodejs';
export async function GET(req:Request){const period=new URL(req.url).searchParams.get('period')==='weekly'?'weekly':'daily';return NextResponse.json({items:await leaderboard(period)});}
