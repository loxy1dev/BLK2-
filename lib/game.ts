export const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export const randInt=(min:number,max:number)=>Math.floor(Math.random()*(max-min+1))+min;
export const towersMultipliers=[1.18,1.42,1.76,2.2,2.8,3.65,4.8,6.5];
export const minesMultiplier=(safe:number,mines:number=3)=>Math.max(1,Number((Math.pow(25/(25-mines),safe)*0.94).toFixed(2)));
