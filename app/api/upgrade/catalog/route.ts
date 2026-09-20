import {NextResponse} from 'next/server';
export const revalidate=300;

type MarketItem={market_hash_name:string;price?:number;image?:string;type?:string;rarity?:string};
let cache:{at:number;items:MarketItem[]}|null=null;

export async function GET(){
  try{
    if(cache && Date.now()-cache.at<5*60*1000) return NextResponse.json({items:cache.items,updatedAt:cache.at});
    const [pricesRes,catalogRes]=await Promise.all([
      fetch('https://api.skincash.gg/v1/prices',{next:{revalidate:300}}),
      fetch('https://api.skincash.gg/v1/catalog',{next:{revalidate:300}})
    ]);
    if(!pricesRes.ok||!catalogRes.ok) throw new Error('Market data unavailable');
    const prices=await pricesRes.json();
    const catalog=await catalogRes.json();
    const byName=new Map<string,any>((catalog.items||[]).map((x:any)=>[x.market_hash_name,x]));
    const allowed=/^(★ )?(AK-47|AUG|AWP|CZ75-Auto|Desert Eagle|Dual Berettas|FAMAS|Five-SeveN|G3SG1|Galil AR|Glock-18|M249|M4A1-S|M4A4|MAC-10|MAG-7|MP5-SD|MP7|MP9|Negev|Nova|P2000|P250|P90|PP-Bizon|R8 Revolver|SCAR-20|SG 553|SSG 08|Sawed-Off|Tec-9|UMP-45|USP-S|XM1014|★ .*|Bayonet|Butterfly Knife|Karambit|M9 Bayonet|Talon Knife|Skeleton Knife|Sport Gloves|Specialist Gloves|Driver Gloves|Moto Gloves|Hand Wraps|Hydra Gloves) \|/;
    const out=(prices.items||[]).map((p:any)=>{
      const meta=byName.get(p.market_hash_name);
      return {market_hash_name:p.market_hash_name,price:Number(p.price),image:meta?.image,type:meta?.type,rarity:meta?.rarity};
    }).filter((x:any)=>Number.isFinite(x.price)&&x.price>0&&x.image&&allowed.test(x.market_hash_name))
      .sort((a:any,b:any)=>a.price-b.price).slice(0,2000);
    cache={at:Date.now(),items:out};
    return NextResponse.json({items:out,updatedAt:cache.at});
  }catch(e){
    return NextResponse.json({error:'Impossible de récupérer les prix CS2 actuellement.'},{status:503});
  }
}
