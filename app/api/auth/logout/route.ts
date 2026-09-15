import {NextResponse} from 'next/server';
import {clearSessionCookie,logout} from '@/lib/auth';
export const runtime='nodejs';
export async function POST(req:Request){
 await logout(req);
 const r=NextResponse.json({ok:true});
 r.headers.set('Set-Cookie',clearSessionCookie());
 return r;
}
