import {SHEEP_OFFERS} from './rule-data.mjs';
import {cardInfo} from './data.mjs';
import {buildingCost} from './automation.mjs';
import {buildSites} from './map-rules.mjs';
import {SEA_NODES,PORTS,seaDistances} from './map-data.mjs';

export function matchingSheepOffers(s,catalog,uids){
 const p=s.players[s.active],task=s.ruleTasks?.[0];
 if(task?.kind!=='market'||!uids.length||new Set(uids).size!==uids.length)return [];
 const cards=uids.map(uid=>s.sheepMarket.find(c=>c.uid===uid));if(cards.some(c=>!c))return [];
 const colors=cards.map(c=>cardInfo(catalog.cards[c.def]).color);
 return SHEEP_OFFERS.filter(o=>o.count===cards.length&&o.workers<=(task.remaining??p.workers[0])&&o.cost<=p.money&&colors.every(c=>o.colors.includes(c)));
}
export function buildingTargets(s,catalog,uid){
 const task=s.ruleTasks[0],p=s.players[s.active],result=[];
 for(const old of [null,...s.boardPieces.filter(t=>t.type==='building'&&t.owner===s.active)]){
  try{const b=buildingCost(s,catalog,uid,old?.uid,task.kind==='cardReplace'?0:task.rate);
   if(b.cost>p.money||task.kind==='cardReplace'&&(!old||b.n!==1))continue;
   for(const node of old?[old]:buildSites(s,catalog))result.push({id:old?'replace:'+old.uid:node.id,x:node.x,y:node.y,label:old?'替换已有建筑':node.label,cost:b.cost,workers:b.n,action:{type:'ruleTask',uid,...(old?{oldUid:old.uid}:{node:node.id})}});
  }catch{/* This building cannot replace this particular tile. */}
 }
 return result;
}
export function sailingTargets(s){
 const p=s.players[s.active],task=s.ruleTasks[0],distances=seaDistances(p.seaNode||'0'),limit=task.count||task.remaining||p.workers[2];
 return [...(task.kind==='ship'?SEA_NODES.filter(n=>distances[n.id]<=limit).map(n=>({...n,id:'sea:'+n.id,label:`航行 ${distances[n.id]} 步`,steps:distances[n.id],action:{type:'ruleTask',node:n.id}})):[]),
 ...PORTS.filter(t=>!p.ports.includes(t.id)&&Math.min(...t.nodes.map(n=>distances[n]??Infinity))+1<=limit&&(task.kind!=='remoteWarehouse'||t.kind!=='medium')&&(t.cost||0)<=p.money).map(t=>({...t,id:'port:'+t.id,port:t,steps:Math.min(...t.nodes.map(n=>distances[n]))+1,action:{type:'ruleTask',port:t.id}}))];
}
