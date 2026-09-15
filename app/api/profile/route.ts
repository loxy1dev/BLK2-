import {NextResponse} from 'next/server'; import {getSession} from '@/lib/auth'; import {getProfile,getInventory} from '@/lib/progression';
export const runtime='nodejs';
export async function GET(req:Request){const s=await getSession(req);if(!s)return NextResponse.json({user:null},{status:401});const profile=await getProfile(s.user.id,s.user.username,s.user.createdAt);return NextResponse.json({profile,inventory:await getInventory(s.user.id)});}
