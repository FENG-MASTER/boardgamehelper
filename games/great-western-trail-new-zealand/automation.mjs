import {LAND_NODES} from './map-data.mjs';
import {objectiveScore} from './objectives.mjs';
import {NEUTRAL,WORKERS,cardInfo} from './data.mjs';
import {buildingData,hazardData,isWildcard,bonusPoints,BONUS_ROW_COSTS,LOCAL_TRADE} from './component-data.mjs';
import {NEUTRAL_ACTIONS,PRIVATE_ACTIONS,PRIVATE_B_ACTIONS,BONUS_EFFECTS,DISKS,OBJECTIVES,OBJECTIVE_EFFECTS,SHEEP_OFFERS} from './rule-data.mjs';
const check=(ok,message)=>{if(!ok)throw new Error(message);};
const player=s=>s.players[s.active];
const pay=(p,n)=>{check(Number.isInteger(n)&&n>=0,'费用无效');check(p.money>=n,`需要 ${n} 元，当前钱币不足`);p.money-=n;};
const take=(zone,uid)=>{const i=zone.findIndex(t=>t.uid===uid);check(i>=0,'请选择仍在区域内的配件');return zone.splice(i,1)[0];};
const log=(s,text)=>s.log.push({turn:s.turn,player:s.active,text});
export function initAutomation(s){s.rulesVersion=2;s.ruleTasks=[];for(const p of s.players){p.unlocked=[];p.aux={money:1,cycle:1,certificate:0,ship:0,pioneer:0};p.ruleUsed=[];p.gainedThisTurn=[];p.ports=[];}}
export function gain(s,catalog,c,top=false){if(!c)return;const p=player(s);(top?p.deck:p.discard).push(c);(p.gainedThisTurn??=[]).push(c.uid);log(s,'获得 '+cardInfo(catalog.cards[c.def]).name);}
const supply=(s,catalog,group)=>gain(s,catalog,s.supply[group]?.pop());
function queue(s,task){(s.ruleTasks??=[]).push(task);}
export function certificate(p,n){const old=p.certificate;p.certificate=Math.min(p.certificateMax,p.certificate+n);if(old<2&&p.certificate>=2)p.gold=Math.min(5,p.gold+1);}
export function pioneer(s,n){const p=player(s),old=p.pioneer;p.pioneer=Math.min(16,old+n);p.money+=Math.max(0,old+n-16);for(const k of [3,8])if(old<k&&p.pioneer>=k)p.gold=Math.min(5,p.gold+1);const step=s.count===4?4:6;if(old<step&&p.pioneer>=step)p.steps++;if(old<11&&p.pioneer>=11)queue(s,{kind:'pioneerChoice',mandatory:true,label:'开拓者 11 格：选择永久奖励'});}
export function availableDisks(s){const p=player(s),options=DISKS.filter(d=>!p.unlocked.includes(d.id));if(options.every(d=>(d.cost||0)>p.money)||p.disks===0){return [...options,...s.boardPieces.filter(t=>t.owner===s.active&&t.type==='disk'&&t.port).map(t=>({id:'port:'+t.uid,label:'收回 '+t.port+' 的圆片',color:'white',recycled:true}))];}return options;}
export function removeDisk(s,id,black=true){const p=player(s),options=availableDisks(s),d=options.find(d=>d.id===id);check(d,'请选择可用圆片');if(d.recycled){const t=take(s.boardPieces,id.slice(5));p.ports=p.ports.filter(id=>id!==t.port);return d;}
 check(black||d.color==='white'||!options.some(d=>d.color==='white'),'此处只能放白边圆片');check(p.disks>0,'没有剩余圆片');pay(p,d.cost||0);p.disks--;p.unlocked.push(id);for(const k of ['money','wool','steps','handLimit','permanentCertificate'])if(d[k])p[k]+=d[k];if(d.certificateMax)p.certificateMax=d.certificateMax;if(d.aux)p.aux[d.aux]++;return d;}

export function availableActions(s,catalog){
 const p=player(s);if(s.phase!=='B'||p.isSarah)return [];
 let list=[];const neutral=NEUTRAL.find(n=>p.location===`中立建筑 ${n.letter}`||p.locationId===n.id);
 if(neutral)list=NEUTRAL_ACTIONS[neutral.letter+(s.neutralFlipped&&['B','C','G','H'].includes(neutral.letter)?'2':'')];
 else{const b=s.boardPieces.find(t=>t.type==='building'&&t.uid===p.locationId&&t.owner===s.active);if(b){list=[...((b.side==='b'?PRIVATE_B_ACTIONS:PRIVATE_ACTIONS)[catalog.groups.private.indexOf(b.def)]||[])];const risk=LAND_NODES[b.node]?.risk;if(risk)list.push({kind:'risk',label:risk==='gold'?'风险行动：弃一只羊，获得 1 金块':`风险行动：弃一只羊，获得 ${risk==='money1'?1:2} 元`,risk});}}
 const used=p.ruleUsed||[];return [...list.map((a,i)=>({...a,id:String(i),used:used.includes(String(i))})),{kind:'aux',label:'放弃地点行动，执行附属行动一次',limit:1,id:'fallback',used:used.length>0}].map(a=>({...a,used:a.used||used.includes('fallback')}));
}
export function buildingCost(s,catalog,uid,oldUid,rate=2){const p=player(s),t=p.private.find(t=>t.uid===uid);check(t,'建筑不在你的供应区');const old=oldUid?s.boardPieces.find(t=>t.uid===oldUid&&t.owner===s.active&&t.type==='building'):null;check(!oldUid||old,'请选择自己的旧建筑');const n=buildingData(catalog,t.def,t.side).craftsmen-(old?buildingData(catalog,old.def,old.side).craftsmen:0);check(n>0,'新建筑需求必须高于旧建筑');check(n<=p.workers[1],'工匠人数不足');return {cost:n*rate,t,old,n};}
function workerReward(s,catalog,wi){const p=player(s),n=p.workers[wi];
 if(wi===0){if(n===2||n===4)p.exchange++;if(n===3)queue(s,{kind:'workerSheep',label:'牧羊人奖励：支付 4 元，将蓝／棕羊放到牌库顶',colors:['blue','brown'],count:1,cost:4,top:true});if(n===5)queue(s,{kind:'market',label:'牧羊人奖励：采购绵羊',remaining:p.workers[0]});}
 if(wi===1&&[3,5].includes(n))queue(s,{kind:'build',label:'工匠即时建造奖励',rate:n===3?2:1});
 if(wi===2){if(n===2)p.gold=Math.min(5,p.gold+1);if(n===3)queue(s,{kind:'discardCertificate',label:'水手奖励：弃一只羊，认证前进 1 格'});if(n===5)queue(s,{kind:'ship',label:'水手奖励：移动帆船最多 5 格',count:5});}
 if(wi===3){if(n===3)pioneer(s,1);if(n===4)supply(s,catalog,'romney');if(n===5)queue(s,{kind:'workerSheep',label:'剃毛工奖励：两只红／黄羊，或一只蓝／棕羊',pairOrBig:true,cost:0});}
}
function hire(s,catalog,t,wi){const p=player(s);check(Number.isInteger(wi)&&wi>=0&&wi<4&&p.workers[wi]<5,'该工人列已满或无效');p.workers[wi]++;p.collected.push({...t,worker:wi});workerReward(s,catalog,wi);}
function hazard(s,catalog,uid){const t=take(s.hazards,uid);player(s).collected.push(t);supply(s,catalog,catalog.tiles[t.def].name==='flood'?'ferry':'dog');}
function selectedSheep(p,catalog,uids){check(Array.isArray(uids)&&new Set(uids).size===uids.length,'绵羊选择无效');return uids.map(uid=>{const c=p.hand.find(c=>c.uid===uid);check(c&&cardInfo(catalog.cards[c.def]).kind==='sheep','请选择手中的绵羊');return {...c,...cardInfo(catalog.cards[c.def])};});}
function discard(s,catalog,uids,action){const p=player(s),cards=selectedSheep(p,catalog,uids);check(cards.length===(action.same||1),'所选绵羊数量不符合要求');if(action.same)check(new Set(cards.map(c=>c.color)).size===1,'必须选择相同品种');if(action.color)check(cards.every(c=>c.color===action.color),'绵羊颜色不符合要求');for(const uid of uids)p.discard.push(take(p.hand,uid));p.money+=action.money||0;}
function cycle(s,p,n,context){check(Number.isInteger(n)&&n>=1,'抽换数量无效');const actual=context.draw(s,p,n).length;if(actual)s.pending={discard:actual};}
function begin(s,catalog,a,input,context){const p=player(s);
 switch(a.kind){
 case 'choice':{const choice=a.options[input.choice];check(choice,'请选择行动分支');begin(s,catalog,choice,input,context);break;}
 case 'supply':supply(s,catalog,a.group);break;case 'exchange':p.exchange+=a.count;break;case 'certificate':certificate(p,a.count);break;case 'grassCertificate':certificate(p,s.boardPieces.filter(t=>t.type==='building'&&t.owner===s.active&&t.grass).length);break;case 'shepherdMoney':p.money+=p.workers[0]*2;break;case 'warehouseMoney':p.money+=s.boardPieces.filter(t=>t.type==='warehouse'&&t.owner===s.active).length;break;case 'discardGold':discard(s,catalog,input.uids||[],{money:5});p.gold=Math.min(5,p.gold+1);break;
 case 'money':p.money+=a.count;break;case 'gold':p.gold=Math.min(5,p.gold+a.count);break;case 'pioneer':pioneer(s,a.count);break;
 case 'discard':discard(s,catalog,input.uids||[],a);break;case 'risk':discard(s,catalog,input.uids||[],{});if(a.risk==='gold')p.gold=Math.min(5,p.gold+1);else p.money+=a.risk==='money1'?1:2;break;
 case 'grassMoney':p.money+=s.boardPieces.filter(t=>t.type==='building'&&t.owner===s.active&&t.grass).length*2;break;
 case 'hazardIncome':{const n=Math.floor(p.collected.filter(t=>['flood','rockfall'].includes(catalog.tiles[t.def]?.name)).length/2);p.money+=n*7;pioneer(s,n*2);break;}
 case 'cycle':check(input.count<=a.count,'超过允许的抽换数量');cycle(s,p,input.count,context);break;
 default:queue(s,{...a,...(a.workers?{remaining:p.workers[a.kind==='market'?0:a.kind==='shear'?3:2],count:p.workers[a.kind==='market'?0:a.kind==='shear'?3:2]}:{})});
 }
}
export function ruleAction(s,input,catalog,context){const p=player(s);check(!p.isSarah,'请先完成莎拉回合');
 if(input.type==='ruleStart'){check(s.phase==='start'&&p.hand.length===4,'首次准备须保留四张手牌');removeDisk(s,input.disk,false);p.started=true;s.phase='A';return;}
 if(input.type==='ruleAction'){check(!s.ruleTasks?.length&&!s.pending,'请先完成当前行动');const a=availableActions(s,catalog).find(a=>a.id===input.id);check(a&&!a.used,'当前不能执行此行动或已执行过');begin(s,catalog,a,input,context);(p.ruleUsed??=[]).push(a.id);log(s,'执行：'+a.label);return;}
 if(input.type==='ruleCard'){check(['A','B'].includes(s.phase)&&!s.ruleTasks?.length&&!s.pending,'只能在行动之间打牌');const c=p.hand.find(c=>c.uid===input.uid);check(c,'手牌不存在');const d=cardInfo(catalog.cards[c.def]);check(d.kind!=='sheep','绵羊不是可打出的功能卡');
  const card=take(p.hand,c.uid);if(d.kind==='objective'){p.objectives.push(card);if(input.skip)return;const i=catalog.groups.objective.indexOf(c.def),kind=i<0?'money':OBJECTIVE_EFFECTS[i];if(kind==='money')p.money+=4;else if(kind==='exchange')p.exchange+=2;else if(kind==='certificate')certificate(p,2);else if(kind==='pioneer')pioneer(s,2);else if(kind==='ship')queue(s,{kind:'ship',count:2,label:'目标卡：移动帆船两步'});else throw new Error('这张奖励目标卡尚无行动数据');}
  else{p.discard.push(card);if(!input.skip){if(d.group==='dog')certificate(p,1);else if(d.group==='ferry')p.money+=2;else if(d.group==='bird')pioneer(s,1);else if(d.group==='bonus1')p.money+=p.objectives.length;else if(d.group==='bonus2'){p.money++;pioneer(s,1);}else if(d.group==='bonus4'){if(input.special){const ids=new Set(p.gainedThisTurn);const cards=p.discard.filter(c=>ids.has(c.uid));p.discard=p.discard.filter(c=>!ids.has(c.uid));p.deck.push(...cards);}else p.money++;}else if(d.group==='bonus5'||d.group==='bonus6'){if(input.special)queue(s,{kind:d.group==='bonus5'?'remoteWarehouse':'cardReplace',label:'奖励卡特殊行动',count:3,drawAfter:true});else p.money+=d.group==='bonus5'?1:2;}}
  if(!input.special||!['bonus5','bonus6'].includes(d.group))context.draw(s,p,1);}
  return;
 }
 check(input.type==='ruleTask','未知规则操作');const a=s.ruleTasks?.[0];check(a,'没有待结算行动');
 if(input.skip){check(!a.mandatory,'此奖励必须结算');s.ruleTasks.shift();if(a.drawAfter)context.draw(s,p,1);return;}
 // Remove the current task first, so immediate rewards queue behind it without being lost.
 s.ruleTasks.shift();
 switch(a.kind){
 case 'pioneerChoice':check(['steps','toll'].includes(input.choice),'请选择步数或免过路费');p.pioneerChoice=input.choice;if(input.choice==='steps')p.steps++;else p.tollExempt=true;break;
 case 'hire':{const t=s.workers.find(t=>t.uid===input.uid);check(t,'请选择工人');const wi=WORKERS.indexOf(catalog.tiles[t.def].name);check(p.workers[wi]<5,'工人列已满');pay(p,Math.max(0,8-t.row+a.price));hire(s,catalog,take(s.workers,t.uid),wi);break;}
 case 'build':case 'cardReplace':{const b=buildingCost(s,catalog,input.uid,input.oldUid,a.kind==='cardReplace'?0:a.rate);if(a.kind==='cardReplace')check(b.old&&b.n===1,'必须替换为恰好高一级的建筑');check(Number.isFinite(input.x)&&Number.isFinite(input.y),'请选择建造位置');if(!b.old)check(!s.boardPieces.some(t=>t.type==='building'&&Math.hypot(t.x-input.x,t.y-input.y)<2),'此处已有建筑');pay(p,b.cost);const fresh=take(p.private,input.uid);if(b.old){s.removed.push(take(s.boardPieces,b.old.uid));p.built=p.built.filter(t=>t.uid!==b.old.uid);}else p.gold=Math.min(5,p.gold+(LAND_NODES[input.node]?.gold||0));const tile={...fresh,type:'building',side:fresh.side||'a',owner:s.active,node:b.old?.node??input.node,x:b.old?.x??input.x,y:b.old?.y??input.y,grass:b.old?.grass??!!input.grass};s.boardPieces.push(tile);p.built.push({...tile});if(b.old)for(const other of s.players)if(other.locationId===b.old.uid){other.locationId=fresh.uid;if(other.ruleUsed?.length)other.ruleUsed=['fallback'];}break;}
 case 'hazard':pay(p,a.price);hazard(s,catalog,input.uid);break;
 case 'bonus':{const t=s.bonuses.find(t=>t.uid===input.uid);check(t,'请选择奖励板块');check(t.row<Math.floor(s.bonusProgress/s.count),'不能购买市场标记当前行的板块');pay(p,BONUS_ROW_COSTS[t.row]+a.price);if(isWildcard(catalog,t.def)){check(p.gold>=1,'万能工人还需要 1 金块');p.gold--;hire(s,catalog,take(s.bonuses,t.uid),input.worker);}
 else{const effect=BONUS_EFFECTS[catalog.groups.bagB.indexOf(t.def)];check(effect,'奖励板块缺少效果数据');if(effect.goldCost){check(p.gold>=effect.goldCost,'金块不足');p.gold-=effect.goldCost;}if(effect.removeStarter){const c=p.hand.find(c=>c.uid===input.card);check(c&&catalog.cards[c.def].group==='starter'&&cardInfo(catalog.cards[c.def]).value===2,'必须移除一张价值 2 的起始羊');s.removed.push(take(p.hand,c.uid));}if(effect.hazardCost){pay(p,effect.hazardCost);hazard(s,catalog,input.hazard);}p.collected.push(take(s.bonuses,t.uid));for(const k of ['wool','permanentCertificate','exchange'])p[k]+=effect[k]||0;if(effect.gold)p.gold=Math.min(5,p.gold+effect.gold);if(effect.pioneer)pioneer(s,effect.pioneer);if(effect.group)supply(s,catalog,effect.group);}break;}
 case 'objective':{const c=input.uid==='deck'?s.objectiveDeck.pop():take(s.objectiveMarket,input.uid);check(c,'目标牌库已空');gain(s,catalog,c);while(s.objectiveMarket.length<4&&s.objectiveDeck.length)s.objectiveMarket.push(s.objectiveDeck.pop());break;}
 case 'aux':{const k=input.kind,n=input.count;check(Number.isInteger(n)&&n>=1&&n<=a.limit&&n<=p.aux[k],'该附属行动未解锁或次数不足');if(k==='money')p.money+=n;else if(k==='cycle')cycle(s,p,n,context);else if(k==='certificate'){pay(p,n*2);certificate(p,n);}else if(k==='pioneer'){pay(p,n);pioneer(s,n);}else if(k==='ship'){pay(p,n);queue(s,{kind:'ship',count:n,label:'附属行动：帆船'});}else throw new Error('未知附属行动');break;}
 case 'discardCertificate':discard(s,catalog,[input.uid],{});certificate(p,1);break;
 case 'workerSheep':{const cards=(input.uids||[]).map(uid=>s.sheepMarket.find(c=>c.uid===uid));check(cards.every(Boolean)&&new Set(input.uids).size===cards.length,'请选择市场中的不同卡牌');const colors=cards.map(c=>cardInfo(catalog.cards[c.def]).color);check(a.pairOrBig?(cards.length===2&&colors.every(c=>['red','yellow'].includes(c))||cards.length===1&&['blue','brown'].includes(colors[0])):cards.length===a.count&&colors.every(c=>a.colors.includes(c)),'所选绵羊不符合奖励条件');pay(p,a.cost);for(const c of cards)gain(s,catalog,take(s.sheepMarket,c.uid),a.top);break;}
 case 'market':{if(input.finish)break;const remaining=a.remaining??p.workers[0];if(input.refill){check(remaining>=1,'没有未分配的牧羊人');for(let i=0;i<2&&s.sheepDeck.length;i++)s.sheepMarket.push(s.sheepDeck.pop());s.ruleTasks.unshift({...a,remaining:remaining-1});break;}const offer=SHEEP_OFFERS.find(o=>o.id===input.offer);check(offer&&offer.workers<=remaining,'牧羊人人数不足');check(input.uids?.length===offer.count&&new Set(input.uids).size===offer.count,'绵羊数量不符合购买方案');for(const uid of input.uids){const c=s.sheepMarket.find(c=>c.uid===uid);check(c&&offer.colors.includes(cardInfo(catalog.cards[c.def]).color),'绵羊品种不符合购买方案');}pay(p,offer.cost);for(const uid of input.uids)gain(s,catalog,take(s.sheepMarket,uid));p.exchange+=offer.exchange||0;s.ruleTasks.unshift({...a,remaining:remaining-offer.workers});break;}
 case 'shear':{const remaining=a.remaining??a.count;if(input.cycle){check(a.workers&&remaining>=1,'没有可用于抽换的剃毛工');cycle(s,p,1,context);s.ruleTasks.unshift({...a,remaining:remaining-1});break;}const cards=selectedSheep(p,catalog,input.uids||[]);check(cards.length>=1&&cards.length<=remaining&&new Set(cards.map(c=>c.color)).size===cards.length,'剃毛数量或品种不符合要求');const value=cards.reduce((n,c)=>n+c.wool,p.wool);p.money+=value;for(const c of cards)p.discard.push(take(p.hand,c.uid));queue(s,{kind:'woolDelivery',label:`羊毛价值 ${value}：选择羊毛贸易站`,value});if(a.workers&&remaining>cards.length)queue(s,{kind:'cycleRemaining',label:'剩余剃毛工可抽换牌',count:remaining-cards.length});break;}
 case 'cycleRemaining':check(input.count<=a.count,'超过剩余工人数');cycle(s,p,input.count,context);break;
 default:check(context.mapTask,'地图行动尚未接入');context.mapTask(s,input,a,catalog,context);
 }
 if(a.drawAfter)context.draw(s,p,1);log(s,'结算：'+a.label);
}
export function automaticScore(s,p,catalog,base){const v=[...base];if(p.isSarah)return v;
 v[1]+=s.boardPieces.filter(t=>t.type==='building'&&s.players[t.owner]===p).reduce((n,t)=>n+buildingData(catalog,t.def,t.side).vp,0);
 v[5]+=p.collected.reduce((n,t)=>n+(['flood','rockfall'].includes(catalog.tiles[t.def]?.name)?hazardData(catalog,t.def).vp:bonusPoints(catalog,t.def)),0);
 v[9]+=(p.unlocked||[]).includes('hand2')?3:0;v[10]+=p.workers.filter(n=>n===5).length*4;
 const pieces=s.boardPieces.filter(t=>s.players[t.owner]===p),cards=[...p.hand,...p.deck,...p.discard];
 v[2]+=p.built.filter(t=>t.type==='delivery').reduce((n,t)=>n+(t.points||0),0);
 if(p.built.some(t=>t.station==='local1')&&p.built.some(t=>t.station==='local3'))v[2]-=3;
 v[3]+=pieces.filter(t=>t.type==='warehouse'||t.type==='disk'&&!t.station).reduce((n,t)=>n+(t.points||0),0);
 if(p.ports?.includes('compass1')&&p.ports.includes('compass2'))v[3]+=4;if(p.ports?.includes('compass2')&&p.ports.includes('compass3'))v[3]+=4;
 const slots=p.warehouseSlots||[];if(slots.includes(1)&&slots.includes(2))v[10]+=2;if(slots.includes(3)&&slots.includes(4))v[10]+=4;
 v[7]+=objectiveScore(s,p,catalog).total;
 for(const t of p.collected){const i=catalog.groups.harbourmaster.indexOf(t.def);if(i<0)continue;v[8]+=[()=>cards.filter(c=>cardInfo(catalog.cards[c.def]).kind==='objective').length+p.objectives.length,()=>p.permanentCertificate,()=>p.collected.filter(t=>['flood','rockfall'].includes(catalog.tiles[t.def]?.name)).length,()=>Math.floor(p.pioneer/5)*2,()=>cards.filter(c=>['ferry','bonus1'].includes(catalog.cards[c.def].group)).length,()=>pieces.filter(t=>t.type==='building').length,()=>pieces.filter(t=>t.type==='warehouse').length,()=>Math.floor(p.workers.reduce((a,b)=>a+b,0)/2)][i]();}
 return v;
}
