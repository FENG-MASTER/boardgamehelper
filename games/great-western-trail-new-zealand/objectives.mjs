import {OBJECTIVES} from './rule-data.mjs';
import {cardInfo} from './data.mjs';
import {buildingData} from './component-data.mjs';
export function objectiveDefinition(catalog,c){const g=catalog.cards[c.def].group,i=catalog.groups.objective.indexOf(c.def);return i>=0?{needs:OBJECTIVES[i],vp:3}:({bonus8:{needs:{small:1,warehouse:1},vp:4},bonus9:{needs:{pioneer:3,warehouse:1},vp:4},bonus10:{needs:{ferry:1,warehouse:1},vp:4}}[g]);}
// A completed objective reserves its objects. Unplayed objectives may be omitted without penalty.
// Search all feasible allocations and retain the best score; memoization merges equivalent pools.
export function objectiveScore(s,p,catalog){
 const deck=[...p.hand,...p.deck,...p.discard],all=[...p.objectives.map(c=>({...c,mandatory:true})),...deck.filter(c=>cardInfo(catalog.cards[c.def]).kind==='objective').map(c=>({...c,mandatory:false}))];
 const resources={small:0,big:0,purple:0,ferry:0,hazard:0,shearer:p.workers[3],pioneer:p.pioneer,warehouse:0,delivery:0,b1:0,b2:0,b4:0};
 for(const c of deck){const d=cardInfo(catalog.cards[c.def]);if(['red','yellow'].includes(d.color))resources.small++;if(['blue','brown'].includes(d.color))resources.big++;if(d.color==='purple')resources.purple++;if(['ferry','bonus1'].includes(d.group))resources.ferry++;}
 resources.hazard=p.collected.filter(t=>['flood','rockfall'].includes(catalog.tiles[t.def]?.name)).length;
 for(const t of s.boardPieces.filter(t=>s.players[t.owner]===p)){if(t.type==='warehouse')resources.warehouse++;if(t.type==='disk'&&p.built.some(b=>b.station===t.station&&b.value>=13))resources.delivery++;if(t.type==='building'){const n=buildingData(catalog,t.def,t.side).craftsmen;resources[n>=4?'b4':n>=2?'b2':'b1']++;}}
 const keys=Object.keys(resources),memo=new Map();
 function consume(pool,needs){const next={...pool};for(const [k,n] of Object.entries(needs)){if(k.startsWith('building'))continue;if(next[k]<n)return null;next[k]-=n;}
 for(const [key,types] of [['building4',['b4']],['building2',['b2','b4']],['building',['b1','b2','b4']]]){let count=needs[key]||0;for(const type of types){const take=Math.min(count,next[type]);next[type]-=take;count-=take;}if(count)return null;}return next;}
 function solve(i,pool){if(i===all.length)return {total:0,completed:[]};const key=i+':'+keys.map(k=>pool[k]).join(',');if(memo.has(key))return memo.get(key);const c=all[i],def=objectiveDefinition(catalog,c);if(!def)throw new Error('目标卡缺少条件数据');const skip=solve(i+1,pool);let best={total:skip.total-(c.mandatory?def.vp:0),completed:skip.completed};const rest=consume(pool,def.needs);if(rest){const result=solve(i+1,rest);if(result.total+def.vp>best.total)best={total:result.total+def.vp,completed:[c.uid,...result.completed]};}memo.set(key,best);return best;}
 return solve(0,resources);
}
