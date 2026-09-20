export type UpgradeItem = {
  id:string; name:string; weapon:string; collection:string;
  rarity:"CONSUMER"|"INDUSTRIAL"|"MIL-SPEC"|"RESTRICTED"|"CLASSIFIED"|"COVERT"|"KNIFE";
  value:number; image:string;
};
const weapons=["AK-47","AWP","M4A1-S","M4A4","USP-S","Glock-18","Desert Eagle","P250","MP9","MAC-10","FAMAS","Galil AR","SSG 08","P90","Five-SeveN","UMP-45","MP7","Nova","XM1014","MAG-7"];
const finishes=["Neon Grid","Crimson Flux","Nightfall","Arctic Pulse","Solar Flare","Phantom","Cyber Core","Royal Bloom","Voidline","Prism","Hypernova","Ember","Frostbyte","Ultraviolet","Quantum","Obsidian","Eclipse","Spectrum","Genesis","Apex"];
const collections=["DropZone Series","Neon Protocol","Void Collection","Royal Series","Cyberline","Astral Collection","Velocity","Afterglow","Night Ops","Prism Works"];
const rarityByIndex:UpgradeItem["rarity"][]=["CONSUMER","INDUSTRIAL","MIL-SPEC","RESTRICTED","CLASSIFIED","COVERT","KNIFE"];
const multipliers=[1,1,1.05,1.08,1.12,1.18,1.25,1.35,1.5,1.7,1.95,2.25,2.7,3.2,3.8,4.5,5.5,6.5,8,10,12,15,20,25,35,50,75,100];
const imageSeeds=["1519608487953-e999c86e7455","1534791547706-9a9f3a3b9f45","1500534623283-312aade485b7","1444703686981-a3abbc4d4fe3","1462331940025-496dfbfc7564","1518709268805-4e9042af9f23","1446776811953-b23d57bd21aa","1464802686167-b939a6910659","1534447677768-be436bb09401","1516339901601-2e1b62dc0c45"];
export const UPGRADE_ITEMS:UpgradeItem[]=Array.from({length:2000},(_,index)=>{
 const n=index+1,tier=Math.min(rarityByIndex.length-1,Math.floor(index/310)),rarity=rarityByIndex[tier],weapon=weapons[index%weapons.length],finish=finishes[Math.floor(index/weapons.length)%finishes.length],collection=collections[Math.floor(index/200)%collections.length],value=Math.max(10,Math.round(10*multipliers[Math.min(multipliers.length-1,Math.floor(index/70))]*(1+((index*17)%19)/100)));
 return {id:`item-${String(n).padStart(4,"0")}`,name:`${weapon} | ${finish} ${n}`,weapon,collection,rarity,value,image:`https://images.unsplash.com/photo-${imageSeeds[index%imageSeeds.length]}?auto=format&fit=crop&w=700&q=80&sig=${n}`};
});