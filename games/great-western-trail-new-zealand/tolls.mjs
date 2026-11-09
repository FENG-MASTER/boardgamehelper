import {buildingData,hazardData} from './component-data.mjs';

export const HAZARD_POSITIONS={flood:[[6.5,46.5],[24,51.7],[30.5,57],[36.2,61.5]],rockfall:[[23.8,87.5],[31.2,87.2],[40,79],[33,79],[26.8,79]]};
export function tollSites(s,catalog){
 const hazards=s.hazards.map(t=>{const d=hazardData(catalog,t.def),[x,y]=HAZARD_POSITIONS[d.type][t.slot];return {...t,x,y,owner:-1,fee:d.hand==='green'?2:d.hand==='black'?1:0,label:`${d.type==='flood'?'洪水':'落石'} ${t.slot+1}`};});
 const buildings=s.boardPieces.filter(t=>t.type==='building').map(t=>({...t,fee:buildingData(catalog,t.def,t.side)?.toll||0,label:`${s.players[t.owner].name} · 建筑 ${catalog.groups.private.indexOf(t.def)+1}${t.side||'a'}`}));
 return [...hazards,...buildings].filter(t=>t.fee>0);
}
// Route order matters when a player cannot afford every hand encountered.
export function quoteTolls(s,catalog,route,{actor=s.active,exempt=s.players[actor].tollExempt||false}={}){
 if(!Array.isArray(route)||new Set(route).size!==route.length)throw new Error('经过地点不能重复');
 const sites=tollSites(s,catalog),p=s.players[actor];let money=p.money;
 return route.map(uid=>{
  const site=sites.find(t=>t.uid===uid);if(!site)throw new Error('收费地点已移除或不存在，请重新选择路线');
  let due=site.owner===actor||(!p.isSarah&&exempt)?0:site.fee;
  if(p.isSarah&&site.owner===-1)due=0;
  const paid=p.isSarah?due:Math.min(money,due);if(!p.isSarah)money-=paid;
  return {...site,due,paid};
 });
}
export function settleTolls(s,catalog,route,options){
 const actor=options?.actor??s.active,items=quoteTolls(s,catalog,route,options);
 for(const t of items){if(!s.players[actor].isSarah)s.players[actor].money-=t.paid;if(t.owner>=0&&!s.players[t.owner].isSarah)s.players[t.owner].money+=t.paid;}
 return items;
}
