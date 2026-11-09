import {sarahRoutes,sarahBuildSites,sarahPorts} from './sarah-map.mjs';
import {LAND_NODES,SEA_NODES} from './map-data.mjs';
import {settleTolls} from './tolls.mjs';
import {SARAH_CARDS,resolveCard} from './sarah-cards.mjs';
import {SARAH_WORKERS,createSarah,moveCount,hireChoices,specialization,sheepPurchases,hazardChoices,bonusTileChoices,nextDelivery} from './sarah.mjs';
import {cardInfo} from './data.mjs';
import {buildingData,hazardData,isWildcard,BONUS_ROW_COSTS,objectivePoints,LOCAL_TRADE} from './component-data.mjs';
const check=(v,m)=>{if(!v)throw new Error(m);};
const actor=s=>s.players[1];
const workers=s=>Object.fromEntries(SARAH_WORKERS.map((w,i)=>[w,actor(s).workers[i]]));
const remove=(a,uid)=>{const i=a.findIndex(x=>x.uid===uid);check(i>=0,'选中的配件已不存在');return a.splice(i,1)[0];};
const coord=a=>check(Number.isFinite(a.x)&&Number.isFinite(a.y)&&a.x>=0&&a.x<=100&&a.y>=0&&a.y<=100,'请选择有效地图位置');
const log=(s,text)=>{s.log.push({turn:s.turn,player:1,text});if(s.log.length>300)s.log.shift();};
function gainCard(s,catalog,c){if(!c)return;const p=actor(s);(cardInfo(catalog.cards[c.def]).kind==='objective'?p.objectives:p.discard).push(c);log(s,'莎拉获得 '+cardInfo(catalog.cards[c.def]).name);}
function supply(s,catalog,group){gainCard(s,catalog,s.supply[group]?.pop());}
function reward(s,catalog,count){if(count<2||count>5)return;const group=s.bonusGroups[count-2];supply(s,catalog,'bonus'+group);}
function objective(s,catalog){if(s.objectiveMarket.length){gainCard(s,catalog,s.objectiveMarket.shift());if(s.objectiveDeck.length)s.objectiveMarket.push(s.objectiveDeck.pop());}}
function addDisk(s,label,x,y,points){const p=actor(s);if(!p.disks){log(s,'莎拉圆片耗尽，无法在 '+label+' 放置');return false;}p.disks--;s.boardPieces.push({uid:`i${s.nextId++}`,type:'disk',owner:1,label,x,y});p.scores[2]+=points;return true;}
export function setupSarah(s,catalog,difficulty,random,shuffle){
 const p=actor(s),index=s.bagA.findIndex(t=>SARAH_WORKERS.includes(catalog.tiles[t.def].name));check(index>=0,'A 袋没有起始工人');const t=s.bagA.splice(index,1)[0],worker=catalog.tiles[t.def].name;
 s.mode='sarah';s.sarah={...createSarah({difficulty,worker}),stage:'idle',card:null,queue:[],choices:[],move:null};s.sarah.deck=shuffle(s.sarah.deck,random);
 p.name='莎拉';p.isSarah=true;p.money=0;p.gold=0;p.exchange=0;p.deck=[];p.hand=[];p.discard=[];p.disks=15;p.warehouses=0;p.started=true;p.collected=[t];p.workers=SARAH_WORKERS.map(w=>s.sarah.workers[w]);p.position={x:57,y:93};
 log(s,'莎拉起始免费工人为 '+worker+'，不领取起始工人的奖励卡。');
}
export function beginSarah(s,random,shuffle){
 const ai=s.sarah;check(ai,'不是莎拉对局');if(!ai.deck.length){ai.deck=shuffle(ai.discard,random);ai.discard=[];}
 ai.card=ai.deck.pop();check(ai.card,'莎拉卡组为空');const card=SARAH_CARDS[ai.card-1],model={workers:workers(s),specialization:ai.specialization};
 const actions=resolveCard(card,ai.specialization);ai.move={normal:moveCount(card.move,model),extra:actions.filter(a=>a.kind==='extraMove').reduce((n,a)=>n+a.count,0)};
 ai.queue=actions.filter(a=>a.kind!=='extraMove').map(a=>({...a}));ai.stage='move';ai.choices=[];ai.atWellington=false;log(s,`莎拉翻开 #${ai.card}，正常移动 ${ai.move.normal} 步${ai.move.extra?`，额外移动 ${ai.move.extra} 步`:''}`);
}
function marketSheep(s,catalog){return s.sheepMarket.map(c=>({...c,...cardInfo(catalog.cards[c.def])}));}
export function buildingChoices(s,catalog,limit){
 const p=actor(s),count=limit||p.workers[1],available=p.private.map(t=>({...t,...buildingData(catalog,t.def,t.side)}));
 const existing=s.boardPieces.filter(t=>t.owner===1&&t.type==='building');
 const fresh=available.filter(t=>t.craftsmen<=count&&(!s.rulesVersion||sarahBuildSites(s,catalog).length)).map(t=>({...t,cost:t.craftsmen,oldUid:null}));
 const replace=available.flatMap(t=>existing.filter(old=>{const diff=t.craftsmen-buildingData(catalog,old.def,old.side).craftsmen;return diff>0&&diff<=count;}).map(old=>({...t,cost:t.craftsmen-buildingData(catalog,old.def,old.side).craftsmen,oldUid:old.uid,x:old.x,y:old.y})));
 let options;
 if(limit) options=fresh.filter(t=>t.cost===limit);else options=fresh.filter(t=>t.cost===count);
 if(!options.length&&!limit)options=fresh.filter(t=>t.cost===count-1);
 if(!options.length&&replace.length){const best=Math.max(...replace.map(t=>t.cost));options=replace.filter(t=>t.cost===best);const points=Math.max(...options.map(t=>t.vp));options=options.filter(t=>t.vp===points);}
 if(!options.length&&fresh.length){const best=Math.max(...fresh.map(t=>t.cost));options=fresh.filter(t=>t.cost===best);}
 if(!options.length)return [];const hands=Math.max(...options.map(t=>t.toll));return options.filter(t=>t.toll===hands).map(t=>({...t,key:`${t.uid}:${t.oldUid||'new'}`}));
}
function candidates(s,catalog,action){const p=actor(s),ai=s.sarah;
 switch(action.kind){
 case 'hire':{
 const market=s.workers.map(t=>({...t,worker:catalog.tiles[t.def].name,cost:8-t.row,zone:'worker',key:t.uid}));
 for(const t of s.bonuses.filter(t=>isWildcard(catalog,t.def)))for(const w of SARAH_WORKERS)market.push({...t,worker:w,cost:BONUS_ROW_COSTS[t.row]-1,zone:'bonus',key:`${t.uid}:${w}`});
 return hireChoices(market,workers(s),ai.specialization,action.preference);
 }
 case 'buySheep':return sheepPurchases(marketSheep(s,catalog),action.remaining||p.workers[0]).map(cards=>({key:cards.map(c=>c.uid).sort().join('|'),cards}));
 case 'smallSheep':case 'orangeSheep':case 'coloredSheep':{
 let cards=marketSheep(s,catalog).filter(c=>action.kind==='smallSheep'?['red','yellow'].includes(c.color):c.color===(action.color||'orange'));
 if(cards.length){const count=c=>cards.filter(x=>x.color===c.color).length,min=Math.min(...cards.map(count));cards=cards.filter(c=>count(c)===min);}return cards.map(c=>({key:c.uid,cards:[c]}));
 }
 case 'hazard':return hazardChoices(s.hazards.map(t=>({...t,...hazardData(catalog,t.def)}))).map(t=>({...t,key:t.uid}));
 case 'removeBonus':return bonusTileChoices(s.bonuses.map(t=>({...t,rowCost:BONUS_ROW_COSTS[t.row]}))).map(t=>({...t,key:t.uid}));
 case 'build':{const options=buildingChoices(s,catalog,action.limit);return s.rulesVersion?options.flatMap(o=>o.oldUid?[o]:sarahBuildSites(s,catalog).map(n=>({...o,key:o.key+'@'+n.id,node:n.id,x:n.x,y:n.y,grass:n.grass}))):options;}
 default:return [];
 }}
function applyChoice(s,catalog,a,c){const p=actor(s),ai=s.sarah;
 switch(a.kind){
 case 'hire':{const zone=c.zone==='bonus'?s.bonuses:s.workers;const t=remove(zone,c.uid),i=SARAH_WORKERS.indexOf(c.worker);p.collected.push(t);p.workers[i]++;ai.specialization=specialization(workers(s),ai.specialization);reward(s,catalog,p.workers[i]);
 if(c.worker==='craftsman'&&p.workers[i]===3)ai.queue.unshift({kind:'workerPort'});
 if(c.worker==='shearer'&&[3,5].includes(p.workers[i]))ai.queue.unshift({kind:'workerWool',value:p.workers[i]===3?5:9});
 log(s,'莎拉免费雇用 '+c.worker+'；当前专精 '+ai.specialization);break;}
 case 'buySheep':case 'smallSheep':case 'orangeSheep':case 'coloredSheep':for(const card of c.cards)gainCard(s,catalog,remove(s.sheepMarket,card.uid));break;
 case 'hazard':{const t=remove(s.hazards,c.uid);p.collected.push(t);p.scores[5]+=c.vp;supply(s,catalog,c.type==='flood'?'ferry':'dog');log(s,`莎拉移除 ${c.vp} 分天灾`);break;}
 case 'removeBonus':s.removed.push(remove(s.bonuses,c.uid));log(s,'莎拉移除奖励市场最便宜板块；不获取奖励或分数');break;
 case 'build':{const t=remove(p.private,c.uid);if(c.oldUid){const old=remove(s.boardPieces,c.oldUid);s.removed.push(old);p.built=p.built.filter(b=>b.uid!==old.uid);}p.built.push({...t,type:'building',side:t.side||'a'});s.boardPieces.push({...t,type:'building',side:s.buildingSides?.[catalog.groups.private.indexOf(t.def)]||'a',owner:1,x:c.x,y:c.y,node:c.node,grass:c.grass});log(s,'莎拉'+(c.oldUid?'替换':'新建')+'私有建筑 '+catalog.tiles[t.def].name);break;}
 }}
function wellington(s,catalog,context){const ai=s.sarah,p=actor(s);ai.delivery=p.deliveries;const value=nextDelivery(ai),station=LOCAL_TRADE.find(t=>t.value===value);
 if(addDisk(s,'莎拉当地 '+value,station.x,36.6,station.points)){if(station.reward==='objective')objective(s,catalog);else if(station.reward)supply(s,catalog,station.reward);}p.deliveries++;
 // Sarah always uses the rightmost forecast piece, before doing the card's actions.
 for(const g of ['A','B']){const t=s.forecast[g].pop();if(t)context.putTile(s,catalog,t);}context.refillForecast(s);log(s,`莎拉先完成威灵顿：运往 ${value}，使用右侧预测板块，再执行卡面行动`);
}
export function advanceSarah(s,catalog,context){const ai=s.sarah,p=actor(s);check(ai.stage==='actions','莎拉尚未完成移动');
 // Resolve unconditional effects. Decisions, board placement and exact ties pause visibly.
 for(let guard=0;ai.queue.length&&guard<100;guard++){
 const a=ai.queue.shift();
 if(a.kind==='wellington'){wellington(s,catalog,context);continue;}
 if(a.kind==='pioneer'){p.pioneer=Math.min(16,p.pioneer+a.count);log(s,`莎拉开拓者前进 ${a.count} 格（不领取途中资源）`);continue;}
 if(a.kind==='objective'){objective(s,catalog);continue;}
 if(a.kind==='refillSheep'){for(let i=0;i<a.count&&s.sheepDeck.length;i++)s.sheepMarket.push(s.sheepDeck.pop());continue;}
 if(a.kind==='sailorReward'){reward(s,catalog,p.workers[2]);continue;}
 if(a.kind==='shearerReward'){if(p.workers[3]>=2)supply(s,catalog,'romney');if(p.workers[3]>=4)ai.queue.unshift({kind:'coloredSheep',color:a.color});continue;}
 if(a.kind==='workerWool'){if(addDisk(s,'莎拉羊毛 '+a.value,a.value===5?95.7:89.5,30.1,a.value===5?2:1)&&a.value===9)supply(s,catalog,'romney');continue;}
 if(a.kind==='workerPort'){if(s.rulesVersion&&!sarahPorts(s).length)continue;ai.awaiting=a;ai.choices=[];ai.stage='port';return;}
 let options=candidates(s,catalog,a);
 if(a.kind==='buySheep'&&!options.length){const remaining=(a.remaining||p.workers[0])-1;if(remaining>=1){for(let i=0;i<2&&s.sheepDeck.length;i++)s.sheepMarket.push(s.sheepDeck.pop());ai.queue.unshift({...a,remaining});}else if(s.sheepDeck.length){for(let i=0;i<2&&s.sheepDeck.length;i++)s.sheepMarket.push(s.sheepDeck.pop());}log(s,'莎拉分配一名牧羊人补充两张市场牌');continue;}
 if(!options.length){log(s,'莎拉无法执行 '+a.kind+'，按规则略过');continue;}
 // Card copies with the same printed face are equivalent. Keep meaningful choices only.
 const signatures=new Set();options=options.filter(o=>{const key=o.cards?o.cards.map(c=>c.color).sort().join(','):o.key;if(signatures.has(key))return false;signatures.add(key);return true;});
 if(options.length===1&&a.kind!=='build'){applyChoice(s,catalog,a,options[0]);continue;}
 ai.awaiting=a;ai.choices=options;ai.stage=a.kind==='build'?'build':'choice';return;
 }
 check(!ai.queue.length,'莎拉行动队列超出安全上限');ai.awaiting=null;ai.choices=[];ai.stage='done';
}
export function sarahAction(s,a,catalog,context){const ai=s.sarah,p=actor(s);check(s.mode==='sarah'&&s.active===1&&s.phase==='sarah','当前不是莎拉回合');
 if(a.type==='sarahAutoMove'){
 check(s.rulesVersion&&ai.stage==='move','当前不能自动移动');const r=sarahRoutes(s,catalog).find(r=>r.path.join('|')===a.path);check(r,'请选择合法的莎拉路线');const n=LAND_NODES[r.destination];p.landNode=n.id;p.hasMoved=true;a={type:'sarahMove',x:n.x,y:n.y,wellington:n.id==='W',route:r.route};
 }
 if(a.type==='sarahAutoPort'){
 const port=sarahPorts(s).find(t=>t.id===a.port);check(ai.stage==='port'&&port,'请选择优先级允许的中型港口');const m=s.harbourmasters.find(t=>t.port===port.id);
 if(addDisk(s,port.id,port.x,port.y,0)){s.boardPieces.at(-1).port=port.id;p.scores[3]+=port.points;p.seaNode=port.nodes[0];p.ship={x:SEA_NODES[Number(p.seaNode)].x,y:SEA_NODES[Number(p.seaNode)].y};if(m)s.removed.push(remove(s.harbourmasters,m.uid));if(port.group)supply(s,catalog,port.group);if(port.bonus!==undefined)supply(s,catalog,'bonus'+s.bonusGroups[port.bonus]);}
 ai.stage='actions';advanceSarah(s,catalog,context);return;
 }
 if(a.type==='sarahMove'){
 check(ai.stage==='move','已结算移动');coord(a);let paid;if(a.route!==undefined){paid=settleTolls(s,catalog,a.route,{actor:1}).reduce((n,t)=>n+t.paid,0);}else{check(Number.isInteger(a.toll)&&a.toll>=0&&a.toll<=50,'过路费必须是 0～50 的整数');paid=a.toll;s.players[0].money+=paid;}p.position={x:a.x,y:a.y};ai.atWellington=!!a.wellington;if(ai.atWellington)ai.queue.unshift({kind:'wellington'});ai.stage='actions';log(s,`莎拉移动${ai.atWellington?'到威灵顿':''}，从供应区支付给你 ${paid} 元`);advanceSarah(s,catalog,context);return;
 }
 if(a.type==='sarahChoice'){
 check(['choice','build'].includes(ai.stage),'当前没有选择');const option=ai.choices.find(c=>c.key===a.key);check(option,'请选择规则允许的选项');const result={...option};if(ai.stage==='build'&&!result.oldUid&&!s.rulesVersion){coord(a);result.x=a.x;result.y=a.y;check(!s.boardPieces.some(t=>t.type==='building'&&Math.hypot(t.x-a.x,t.y-a.y)<2),'此处已有建筑');}
 const awaiting=ai.awaiting;ai.awaiting=null;ai.stage='actions';ai.choices=[];applyChoice(s,catalog,awaiting,result);advanceSarah(s,catalog,context);return;
 }
 if(a.type==='sarahPort'){
 check(ai.stage==='port','当前没有港口奖励');coord(a);check(Number.isInteger(a.points)&&a.points>=0&&a.points<=20,'港口分数无效');if(addDisk(s,'莎拉中型港口',a.x,a.y,0)){p.scores[3]+=a.points;p.ship={x:a.x,y:a.y};const master=s.harbourmasters.find(t=>t.uid===a.master);if(master)s.removed.push(remove(s.harbourmasters,master.uid));if(a.group) supply(s,catalog,a.group);}ai.stage='actions';advanceSarah(s,catalog,context);return;
 }
 if(a.type==='sarahSkipBuild'){
 check(ai.stage==='build','只能略过无法落位的建筑行动');ai.stage='actions';ai.awaiting=null;ai.choices=[];log(s,'经玩家确认，没有合法建造位置，略过建筑行动');advanceSarah(s,catalog,context);return;
 }
 if(a.type==='sarahEnd'){
 check(ai.stage==='done','莎拉仍有未完成的行动');ai.discard.push(ai.card);ai.card=null;ai.stage='idle';if(ai.atWellington){p.position=s.rulesVersion?{x:6,y:90}:{x:57,y:93};p.landNode='start';}
 if(s.final&&--s.final.remaining<=0){s.phase='ended';log(s,'最后一回合结束，进入最终计分');return;}s.active=0;s.turn++;if(s.rulesVersion){s.players[0].gainedThisTurn=[];s.players[0].ruleUsed=[];}s.phase=s.players[0].started?'A':'start';return;
 }
 throw new Error('未知莎拉操作');
}
export function sarahTotal(s,p,catalog,values){const scores=[...values];scores[0]=0;scores[8]=0;scores[9]=0;scores[1]+=p.built.filter(t=>t.type==='building').reduce((v,t)=>v+buildingData(catalog,t.def,t.side).vp,0);scores[7]+=p.objectives.reduce((v,c)=>v+objectivePoints(catalog,c.def),0);scores[10]+=p.workers.filter(n=>n>=5).length*4;return {values:scores,total:scores.reduce((a,b)=>a+b,0)};}

// Resolve only forced choices; a genuine tie remains a player decision.
export function settleSarah(s,catalog,context){
 if(!s.rulesVersion)return s;
 for(let guard=0;guard<100;guard++){
  if(s.phase!=='sarah'||s.active!==1)return s;
  const ai=s.sarah;let action;
  if(ai.stage==='move'){const routes=sarahRoutes(s,catalog);if(routes.length===1)action={type:'sarahAutoMove',path:routes[0].path.join('|')};}
  else if(['choice','build'].includes(ai.stage)&&ai.choices.length===1)action={type:'sarahChoice',key:ai.choices[0].key};
  else if(ai.stage==='port'){const ports=sarahPorts(s);if(ports.length===1)action={type:'sarahAutoPort',port:ports[0].id};}
  if(!action)return s;
  sarahAction(s,action,catalog,context);
 }
 throw new Error('莎拉自动结算超过安全上限');
}
