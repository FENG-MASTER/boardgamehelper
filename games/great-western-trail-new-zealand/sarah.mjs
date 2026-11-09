/** Official Sarah policies. Actual card definitions are in sarah-cards.mjs. */
export const SARAH_DIFFICULTIES={
 easy:{name:'简单',exclude:[1,6,8,14,15,16,17],firstDelivery:3},
 medium:{name:'中等',exclude:[14,15,16,17],firstDelivery:6},
 hard:{name:'困难',exclude:[10,11,12,13],firstDelivery:9},
};
export const SARAH_WORKERS=['shepherd','craftsman','sailor','shearer'];
const check=(ok,text)=>{if(!ok)throw new Error(text);};
export function cardNumbers(difficulty){const d=SARAH_DIFFICULTIES[difficulty];check(d,'未知莎拉难度');return Array.from({length:17},(_,i)=>i+1).filter(n=>!d.exclude.includes(n));}
export function createSarah({difficulty='easy',worker='shepherd'}={}){
 check(SARAH_DIFFICULTIES[difficulty],'未知莎拉难度');check(SARAH_WORKERS.includes(worker),'起始必须是一名工人');
 return {difficulty,workers:Object.fromEntries(SARAH_WORKERS.map(w=>[w,1+(w===worker?1:0)])),specialization:worker,disks:15,pioneer:0,delivery:0,cards:[],objectives:[],buildings:[],hazards:[],bonusCards:[],position:'start',ship:'start',deck:cardNumbers(difficulty),discard:[]};
}
export function specialization(workers,previous){const max=Math.max(...SARAH_WORKERS.map(w=>workers[w]));if(workers[previous]===max)return previous;const choices=SARAH_WORKERS.filter(w=>workers[w]===max);check(choices.length===1,'新专精并列，需要依据之前的雇用顺序确定');return choices[0];}
/** Equal priorities remain explicit choices, as the rulebook assigns ties to the player. */
export function hireChoices(market,workers,specialty,preference='cheapest'){
 check(['cheapest','specialty'].includes(preference),'未知雇用优先度');let options=market.filter(t=>SARAH_WORKERS.includes(t.worker)&&workers[t.worker]<5);
 if(!options.length)return [];
 const cheap=items=>{const minimum=Math.min(...items.map(t=>t.cost));return items.filter(t=>t.cost===minimum);};
 if(preference==='cheapest'){options=cheap(options);const exact=options.filter(t=>t.worker===specialty);return exact.length?exact:options;}
 const exact=options.filter(t=>t.worker===specialty);return cheap(exact.length?exact:options);
}
export function nextDelivery(sarah){return Math.min(21,SARAH_DIFFICULTIES[sarah.difficulty].firstDelivery+3*sarah.delivery);}
export function moveCount(rule,sarah){check(rule&&['fixed','worker','specialty'].includes(rule.kind),'缺少经核对的卡牌移动数据');let count;
 if(rule.kind==='fixed'){check(Number.isInteger(rule.value)&&rule.value>=1&&rule.value<=5,'卡牌固定移动必须为 1～5');count=rule.value;}
 if(rule.kind==='worker'){check(SARAH_WORKERS.includes(rule.worker),'未知工人种类');count=sarah.workers[rule.worker];}
 if(rule.kind==='specialty')count=sarah.workers[sarah.specialization];
 return Math.max(1,Math.min(5,count));
}
export function routeChoices(routes){if(!routes.length)return [];let best=routes;for(const key of ['stepsToWellington','totalToll','playerToll']){const v=Math.min(...best.map(r=>r[key]));best=best.filter(r=>r[key]===v);}return best;}
export function hazardChoices(hazards){if(!hazards.length)return [];const max=Math.max(...hazards.map(t=>t.vp));let options=hazards.filter(t=>t.vp===max);const counts=Object.fromEntries(['rockfall','flood'].map(type=>[type,hazards.filter(t=>t.type===type).length]));const count=Math.max(...options.map(t=>counts[t.type]));options=options.filter(t=>counts[t.type]===count);if(options.some(t=>t.hand==='black'))options=options.filter(t=>t.hand==='black');return options;}
export function bonusTileChoices(tiles){if(!tiles.length)return [];const cost=Math.min(...tiles.map(t=>t.rowCost));let candidates=tiles.filter(t=>t.rowCost===cost);const row=Math.min(...candidates.map(t=>t.row));candidates=candidates.filter(t=>t.row===row);const col=Math.min(...candidates.map(t=>t.col));return candidates.filter(t=>t.col===col);}
export function takeObjective(display){return display.length?{taken:display[0],remaining:display.slice(1)}:{taken:null,remaining:[]};}
const purchasePatterns={1:[[['red','yellow']],[['orange']]],2:[[['red','yellow'],['red','yellow']],[['orange']]],3:[[['red','yellow'],['red','yellow']],[['blue','brown']]],4:[[['purple']],[['blue','brown'],['orange']]],5:[[['purple'],['orange']]]};
/** Returns tied optimal purchase combinations. Empty = allocate one shepherd to draw 2 market cards, then retry with one fewer shepherd. */
export function sheepPurchases(market,workers){check(Number.isInteger(workers)&&workers>=1&&workers<=5,'莎拉牧羊人数必须为 1～5');const candidates=[];
 for(const pattern of purchasePatterns[workers]){
  const expand=(index,chosen)=>{if(index===pattern.length){const key=chosen.map(c=>c.uid).sort().join('|');if(!candidates.some(c=>c.key===key))candidates.push({key,cards:chosen,points:chosen.reduce((n,c)=>n+c.vp,0)});return;}
   for(const c of market)if(pattern[index].includes(c.color)&&!chosen.some(x=>x.uid===c.uid))expand(index+1,[...chosen,c]);
  };expand(0,[]);
 }
 if(!candidates.length)return [];
 let best=candidates.filter(c=>c.points===Math.max(...candidates.map(c=>c.points)));
 const frequencies=Object.fromEntries([...new Set(market.map(c=>c.color))].map(color=>[color,market.filter(c=>c.color===color).length]));
 // Lexicographic scarcity comparison: prefer the rarest breed, then remaining breeds.
 for(let i=0;i<Math.max(...best.map(c=>c.cards.length));i++){
  const rank=c=>c.cards.map(x=>frequencies[x.color]).sort((a,b)=>a-b)[i]??Infinity;
  const minimum=Math.min(...best.map(rank));best=best.filter(c=>rank(c)===minimum);
 }
 return best.map(c=>c.cards);
}
export function workerBonus(sarah,worker,newCount){check(SARAH_WORKERS.includes(worker),'未知工人');check(Number.isInteger(newCount)&&newCount>=2&&newCount<=5,'新工人数无效');const rewards=['wheel','barrel','bell','compass'];return rewards[newCount-2];}
export function sailorBonus(workers){return workers>=2&&workers<=5?['wheel','barrel','bell','compass'][workers-2]:null;}
/** The printed book specifies that Sarah ignores money, harbourmasters, hand-limit scoring. */
export function sarahScore(categories,objectivePoints=0){check(Array.isArray(categories)&&categories.length===12&&categories.every(Number.isFinite),'需要十二项分数');const scores=[...categories];for(const i of [0,8,9])scores[i]=0;scores[7]=objectivePoints;return {values:scores,total:scores.reduce((a,b)=>a+b,0)};}
export function validateSarahDeck(cards){
 check(Array.isArray(cards)&&cards.length===17,'必须提供全部 17 张莎拉卡的数据');check(new Set(cards.map(c=>c.number)).size===17,'莎拉卡编号不能重复');
 for(const c of cards){check(Number.isInteger(c.number)&&c.number>=1&&c.number<=17,'卡号必须为 1～17');check(c.source&&typeof c.source==='string','每张卡须记录核对来源');check(Array.isArray(c.actions)&&c.actions.length>0,'卡牌缺少完整行动组合');moveCount(c.move,createSarah());}
 return structuredClone(cards);
}
