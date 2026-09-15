import {NextResponse} from 'next/server';import {getSession} from '@/lib/auth';import {getUserHistory} from '@/lib/progression';
export const runtime='nodejs';
export async function GET(req:Request){const s=await getSession(req);if(!s)return NextResponse.json({items:[]});return NextResponse.json({items:await getUserHistory(s.user.id)});}
