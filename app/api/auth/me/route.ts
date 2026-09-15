import {NextResponse} from 'next/server';import {getSession} from '@/lib/auth';
export async function GET(req:Request){const s=await getSession(req);return NextResponse.json({user:s?{id:s.user.id,username:s.user.username}:null});}
