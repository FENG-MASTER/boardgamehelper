import {initAutomation,ruleAction,automaticScore} from './automation.mjs';
import {automatedMove,deliver,mapTask,prepareBuild} from './map-rules.mjs';
import {PORTS,LAND_NODES,SEA_NODES} from './map-data.mjs';
import {DISKS} from './rule-data.mjs';
import {settleTolls} from './tolls.mjs';
import {setupSarah,beginSarah,sarahAction,sarahTotal,settleSarah} from './sarah-runtime.mjs';
import {cardInfo,NEUTRAL,WORKERS,SCORE_LABELS} from './data.mjs';
export const VERSION=1;
const clone=value=>structuredClone(value);
function assert(ok,message){if(!ok)throw new Error(message);}
export function shuffle(list,random=Math.random){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function instance(s,def){return {uid:`i${s.nextId++}`,def};}
export function current(s){return s.players[s.active];}
function log(s,text){s.log.push({turn:s.turn,player:s.active,text});if(s.log.length>300)s.log.shift();}
function pay(p,n){assert(Number.isInteger(n)&&n>=0,'费用必须是非负整数');assert(p.money>=n,'钱币不足');p.money-=n;}
function take(array,uid){const i=array.findIndex(c=>c.uid===uid);assert(i>=0,'配件不在此区域');return array.splice(i,1)[0];}
function position(a){assert(Number.isFinite(a.x)&&Number.isFinite(a.y)&&a.x>=0&&a.x<=100&&a.y>=0&&a.y<=100,'地图位置无效');}
function integer(value,min=0,max=999){assert(Number.isInteger(value)&&value>=min&&value<=max,`请输入 ${min}～${max} 的整数`);return value;}
export function draw(s,p,n,random=Math.random){const drawn=[];for(let i=0;i<n;i++){if(!p.deck.length){if(!p.discard.length)break;p.deck=shuffle(p.discard,random);p.discard=[];}const c=p.deck.pop();p.hand.push(c);drawn.push(c);}return drawn;}
export function score(s,p,catalog){const values=[...p.scores];values[0]=Math.floor(p.money/5);values[4]=p.pioneer>=16?15:p.pioneer>=14?13:p.pioneer>=12?10:p.pioneer>=9?7:p.pioneer>=5?3:0;values[6]+= [...p.hand,...p.deck,...p.discard].reduce((sum,c)=>sum+cardInfo(catalog.cards[c.def]).vp,0);if(p.isSarah)return sarahTotal(s,p,catalog,values);const result=s.rulesVersion?automaticScore(s,p,catalog,values):values;return {values:result,total:result.reduce((a,b)=>a+b,0)};}
export function sheepValue(s,catalog,uids,type='value'){
 const p=current(s);assert(new Set(uids).size===uids.length,'不能重复选择同一张牌');const cards=uids.map(uid=>{const c=p.hand.find(x=>x.uid===uid);assert(c,'请选择手中的牌');return cardInfo(catalog.cards[c.def]);});assert(cards.every(c=>c.kind==='sheep'),'只能选择绵羊牌');assert(new Set(cards.map(c=>c.color)).size===cards.length,'相同品种的绵羊只能计算一次');return cards.reduce((v,c)=>v+c[type],0);
}
function putTile(s,catalog,tile){const d=catalog.tiles[tile.def];if(WORKERS.includes(d.name)){
 const used=s.workers.filter(t=>catalog.tiles[t.def].name===d.name).map(t=>t.row);const row=[0,1,2,3,4].find(r=>!used.includes(r));if(row===undefined)s.removed.push(tile);else s.workers.push({...tile,row});
 }else if(['rockfall','flood'].includes(d.name)){
 const used=s.hazards.filter(t=>catalog.tiles[t.def].name===d.name).map(t=>t.slot);const slot=(d.name==='rockfall'?[0,1,2,3,4]:[0,1,2,3]).find(r=>!used.includes(r));if(slot===undefined)s.removed.push(tile);else s.hazards.push({...tile,slot});
 }else{
 if(s.final&&s.bonusProgress>=s.count*7){s.removed.push(tile);return;}
 const row=Math.floor(s.bonusProgress/s.count),col=s.bonusProgress%s.count;s.bonuses.push({...tile,row,col});s.bonusProgress++;
 if(s.bonusProgress===s.count*2||s.bonusProgress===s.count*4){const target=[0,0,9,11,14][s.count];while(s.sheepMarket.length<target&&s.sheepDeck.length)s.sheepMarket.push(s.sheepDeck.pop());log(s,'市场标记经过黄色箭头，绵羊市场补至规定数量');}
 if(s.bonusProgress===s.count*3){s.neutralFlipped=true;log(s,'市场标记经过蓝色箭头，四片中立建筑翻到 II 面');}
 if(s.bonusProgress>=s.count*7&&!s.final){s.final={trigger:s.active,remaining:s.players.length};current(s).scores[11]=5;log(s,'奖励市场标记移出图板：触发最后一轮');}
 }}
function refillForecast(s){for(const key of ['A','B'])while(s.forecast[key].length<2&&s['bag'+key].length){const t=s['bag'+key].pop();if(s.rulesVersion)s.forecast[key].unshift(t);else s.forecast[key].push(t);}}
export function createGame(catalog,{players=1,bonusGroups=[1,2,3,4],names=[],mode='base',difficulty='easy',automation=false,buildingFaces='a'}={},random=Math.random){
 if(mode==='sarah')players=2;
 integer(players,1,4);assert(bonusGroups.length===4&&new Set(bonusGroups).size===4&&bonusGroups.every(n=>Number.isInteger(n)&&n>=1&&n<=10),'请选择四组不同奖励卡');
 const s={version:VERSION,nextId:1,neutralFlipped:false,active:0,turn:1,count:Math.max(2,players),phase:'start',players:[],log:[],pending:null,final:null,bonusProgress:0,removed:[],boardPieces:[],workers:[],hazards:[],bonuses:[],forecast:{A:[],B:[]},supply:{},bonusGroups:[...bonusGroups].sort((a,b)=>a-b)};
 for(let i=0;i<players;i++){
 const p={name:String(names[i]||`牧场主 ${i+1}`).slice(0,30),money:7+i,gold:1,exchange:1,handLimit:4,steps:Math.max(2,players)===4?3:4,certificate:0,certificateMax:3,permanentCertificate:0,wool:0,pioneer:0,disks:16,warehouses:10,deck:shuffle(catalog.groups.starter.map(d=>instance(s,d)),random),hand:[],discard:[],objectives:[],collected:[],workers:[1,1,1,1],built:[],private:catalog.groups.private.map(d=>instance(s,d)),scores:SCORE_LABELS.map(()=>0),started:false,deliveries:0,position:{x:57,y:93},ship:{x:97,y:25},used:[],location:null};s.players.push(p);draw(s,p,4+i,random);
 }
 s.sheepDeck=shuffle(catalog.groups.sheep.map(d=>instance(s,d)),random);s.sheepMarket=s.sheepDeck.splice(0,[0,0,9,11,14][s.count]);
 s.objectiveDeck=shuffle(catalog.groups.objective.map(d=>instance(s,d)),random);s.objectiveMarket=s.objectiveDeck.splice(0,4);
 s.bagA=shuffle(catalog.groups.bagA.map(d=>instance(s,d)),random);s.bagB=shuffle(catalog.groups.bagB.map(d=>instance(s,d)),random);
 for(const def of catalog.groups.initialWorkers)putTile(s,catalog,instance(s,def));
 for(let n=0;n<s.count+10;n++){
 let placed=false;for(let tries=0;tries<100&&!placed;tries++){
 const t=s.bagA.pop();if(!t)break;const d=catalog.tiles[t.def];const full=WORKERS.includes(d.name)?s.workers.filter(x=>catalog.tiles[x.def].name===d.name).length>=5:s.hazards.filter(x=>catalog.tiles[x.def].name===d.name).length>=(d.name==='rockfall'?5:4);
 if(full)s.bagA.unshift(t);else{putTile(s,catalog,t);placed=true;}
 }
 }
 for(let n=0;n<(mode==='sarah'&&automation?1:s.count*2-1);n++)putTile(s,catalog,s.bagB.pop());
 refillForecast(s);
 const masters=shuffle(catalog.groups.harbourmaster,random).slice(0,5);s.harbourmasters=masters.map(d=>instance(s,d));
 for(const group of ['romney','dog','bird','ferry',...s.bonusGroups.map(i=>'bonus'+i)])s.supply[group]=catalog.groups[group].slice(0,group.startsWith('bonus')?s.count===2?3:s.count===3?5:6:undefined).map(d=>instance(s,d));
 if(mode==='sarah')setupSarah(s,catalog,difficulty,random,shuffle);
 if(automation){s.buildingSides=catalog.groups.private.map(()=>buildingFaces==='mixed'?(random()<.5?'a':'b'):buildingFaces==='b'?'b':'a');for(const p of s.players)p.private.forEach((t,i)=>t.side=s.buildingSides[i]);initAutomation(s);for(const p of s.players){p.landNode='start';p.position={x:6,y:90};p.seaNode='0';p.ship={x:94,y:24};}const ports=PORTS.filter(t=>t.master!==undefined);s.harbourmasters.forEach((t,i)=>t.port=ports[i].id);}
 log(s,mode==='sarah'?'官方莎拉规则辅助单人对局已开始':players===1?'基础规则单人练习已开始（无莎拉对手）':`${players} 人同屏对局已开始`);return s;
}
export function reduce(state,action,catalog,random=Math.random){
 const s=reduceOnce(state,action,catalog,random);
 return settleSarah(s,catalog,{putTile,refillForecast});
}
function reduceOnce(state,action,catalog,random=Math.random){
 const s=clone(state),p=current(s),a=action;assert(s.phase!=='ended'||['score','reopen'].includes(a.type),'对局已结束');
 if(s.rulesVersion&&!p.isSarah){
  const context={draw:(state,p,n)=>draw(state,p,n,random),mapTask};
  if(s.pending)assert(a.type==='discard','请先完成抽换弃牌');
  if(a.type.startsWith('rule')){let input=a;if(a.type==='ruleTask'&&!a.skip&&['build','cardReplace'].includes(s.ruleTasks?.[0]?.kind))input=prepareBuild(s,a,catalog);ruleAction(s,input,catalog,context);return s;}
  if(a.type==='autoMove'){automatedMove(s,a,catalog);return s;}
  if(a.type==='autoDelivery'){assert(s.phase==='delivery'&&!s.ruleTasks?.length,'当前不是运送阶段');deliver(s,a,catalog,s.deliveryValue);return s;}
  if(s.ruleTasks?.length)assert(['discard','exchange','score'].includes(a.type),'请先完成待结算行动');
  if(a.type==='gainCard')assert(a.gold&&['A','B'].includes(s.phase)&&!s.ruleTasks?.length,'只能在行动之间使用金块购买奖励卡');
  if(a.type==='discard')assert(s.pending||s.phase==='start','请在具体行动中选择要弃掉的牌');
  if(a.type==='removeCard')assert(a.exchange,'请通过卡牌效果移除手牌');
  assert(!['adjust','adjustWorker','relocate','returnToken','flipNeutral','end'].includes(a.type),'自动规则对局不能手动改动规则状态');
  assert(!['start','move','hire','takeTile','build','replaceBuilding','playCard','shear','refillSheep','place','delivery','draw','adjustWorker','markAction'].includes(a.type),'请使用回合面板的规则行动');
 }
 if(a.type.startsWith('sarah')){sarahAction(s,a,catalog,{putTile,refillForecast});return s;}
 if(s.mode==='sarah'&&s.active===1&&s.phase==='sarah')assert(['score'].includes(a.type),'请先完成莎拉的行动卡');
 if(s.pending)assert(['discard'].includes(a.type),'请先完成抽换牌后的弃牌');
 switch(a.type){
 case 'start':assert(s.phase==='start','现在不是首次准备');assert(p.hand.length===4,'首次回合请先弃到 4 张手牌');assert(p.disks>0,'没有可用圆片');p.disks--;p.started=true;s.phase='A';log(s,'将一个白边圆片放到开拓者轨 0 格；请按原图记录解锁奖励');break;
 case 'discard':{
  assert(Array.isArray(a.uids)&&new Set(a.uids).size===a.uids.length,'弃牌选择无效');assert(a.uids.length>0,'先选择手牌');
  if(s.pending)assert(a.uids.length===s.pending.discard,`必须弃掉 ${s.pending.discard} 张牌`);
  if(s.phase==='start')assert(p.hand.length-a.uids.length>=4,'首次准备不能弃到少于 4 张');
  for(const uid of a.uids)p.discard.push(take(p.hand,uid));s.pending=null;log(s,`弃掉 ${a.uids.length} 张手牌`);break;}
 case 'exchange':{
  assert(['A','B'].includes(s.phase),'只能在移动或地点行动阶段使用交换');assert(p.exchange>0,'没有交换指示物');const n=integer(a.count,1,2);const available=p.deck.length+p.discard.length;assert(available>0,'没有可以抽取的牌');p.exchange--;const actual=draw(s,p,n,random).length;s.pending={discard:actual};log(s,`消耗一个交换指示物，抽 ${actual} 张后请选择等量手牌弃掉`);break;}
 case 'draw':{
  assert(['A','B'].includes(s.phase),'当前不能自由抽牌');const n=integer(a.count,1,10),actual=draw(s,p,n,random).length;if(a.cycle&&actual)s.pending={discard:actual};log(s,`按卡牌／地点效果抽 ${actual} 张牌${a.cycle?'，需弃掉等量牌':''}`);break;}
 case 'removeCard':assert(['A','B'].includes(s.phase),'当前不能移除手牌');{const c=p.hand.find(c=>c.uid===a.uid);assert(c,'请选择手牌');if(a.exchange){assert(p.exchange>=2,'需要两个交换指示物');assert(cardInfo(catalog.cards[c.def]).color==='gray','只能移除灰色起始绵羊');p.exchange-=2;p.gold=Math.min(5,p.gold+1);}s.removed.push(take(p.hand,a.uid));log(s,'永久移除一张手牌');}break;
 case 'move':{
  position(a);
  assert(s.phase==='A','请先进入移动阶段');assert(a.x>=0&&a.x<=100&&a.y>=0&&a.y<=100,'地图位置无效');p.position={x:a.x,y:a.y};p.location=a.location||'自选地点';p.used=[];
  if(a.tollExempt!==undefined){assert(typeof a.tollExempt==='boolean','免过路费选项无效');assert(p.pioneer>=11||p.tollExempt,'开拓者须先到达 11 格');p.tollExempt=a.tollExempt;}
  let details='';
  if(a.route!==undefined){const items=settleTolls(s,catalog,a.route);details=items.map(t=>`${t.label}：${t.paid} 元${t.paid<t.due?'（余额不足）':''}`).join('；');}
  else{const fee=integer(a.fee||0),paid=Math.min(p.money,fee);p.money-=paid;if(a.recipient!==undefined&&a.recipient!==-1){assert(s.players[a.recipient]&&a.recipient!==s.active,'过路费接收者无效');if(!s.players[a.recipient].isSarah)s.players[a.recipient].money+=paid;}details=`支付过路费 ${paid} 元`;}
  s.phase=a.wellington?'income':'B';log(s,`移动到 ${p.location}；${details||'无过路费'}；路径与步数由玩家核对`);break;}
 case 'markAction':assert(s.phase==='B','当前不是地点行动');assert(!p.used.includes(a.key),'该行动本回合已标记完成');p.used.push(a.key);log(s,`完成地点行动：${String(a.label).slice(0,150)}`);break;
 case 'next':{
  if(s.phase==='B'){s.phase='C';break;}
  assert(s.phase==='C','请完成当前阶段');
  if(!s.final)draw(s,p,Math.max(0,p.handLimit-p.hand.length),random);
  if(s.final&&--s.final.remaining<=0){s.phase='ended';log(s,'全部玩家完成最后一回合，进入最终计分');break;}
  s.active=(s.active+1)%s.players.length;s.turn++;if(s.rulesVersion){current(s).gainedThisTurn=[];current(s).ruleUsed=[];}s.phase=current(s).started?'A':'start';if(current(s).isSarah){s.phase='sarah';beginSarah(s,random,shuffle);}log(s,'开始下一回合');break;}
 case 'income':{
  assert(s.phase==='income','当前不是威灵顿收入阶段');const value=sheepValue(s,catalog,a.uids),cert=integer(a.certificate||0,0,p.certificate);p.certificate-=cert;s.deliveryValue=value+cert+p.permanentCertificate;p.money+=s.deliveryValue;
  for(const uid of a.uids)p.discard.push(take(p.hand,uid));s.phase='delivery';log(s,`运羊价值 ${s.deliveryValue}，获得 ${s.deliveryValue} 元（含认证）`);break;}
 case 'delivery':{
  position(a);
  assert(s.phase==='delivery','当前不是运送阶段');integer(a.value,0,s.deliveryValue);assert(p.disks>0,'没有可用圆片，请先依规则收回中型港口圆片');assert([0,21].includes(a.value)||!p.built.some(t=>t.type==='delivery'&&t.station===a.station),'不能重复运往这个贸易站');pay(p,integer(a.cost||0));p.disks--;p.deliveries++;p.built.push({type:'delivery',station:a.station,value:a.value});s.boardPieces.push({uid:`i${s.nextId++}`,owner:s.active,type:'disk',label:a.station,x:a.x,y:a.y});
  if(a.value===0)p.money+=6;if(a.value===1)p.money+=2;
  s.phase='forecastA';log(s,`运往 ${a.station}，支付 ${a.cost||0} 元；请结算该站卡牌及解锁奖励`);break;}
 case 'forecast':{
  const group=s.phase==='forecastA'?'A':s.phase==='forecastB'?'B':null;assert(group,'当前不是预测阶段');const t=take(s.forecast[group],a.uid);putTile(s,catalog,t);
  if(group==='A')s.phase='forecastB';else{refillForecast(s);p.position={x:57,y:93};if(s.rulesVersion){p.landNode='start';p.position={x:6,y:90};}s.phase='C';log(s,'预测区已补齐，牧场主返回起点');}
  log(s,`放置预测 ${group} 板块`);break;}
 case 'emptyForecast':assert((s.phase==='forecastA'||s.phase==='forecastB')&&!s.forecast[s.phase==='forecastA'?'A':'B'].length,'预测区不为空');if(s.phase==='forecastA')s.phase='forecastB';else{refillForecast(s);p.position={x:57,y:93};if(s.rulesVersion){p.landNode='start';p.position={x:6,y:90};}s.phase='C';}break;
 case 'shear':{
  assert(s.phase==='B','当前不是地点行动阶段');const wool=sheepValue(s,catalog,a.uids,'wool')+p.wool;assert(a.uids.length>0,'请选择至少一张绵羊');integer(a.limit,1,5);assert(a.uids.length<=a.limit,'选中的羊超过本次分配的工人数');p.money+=wool;for(const uid of a.uids)p.discard.push(take(p.hand,uid));log(s,`剃毛获得 ${wool} 元；贸易站与未用工人抽换另行结算`);break;}
 case 'gainCard':{
  assert(['A','B','delivery','forecastA','forecastB'].includes(s.phase),'当前不能获得卡牌');const zone=a.group==='sheep'?s.sheepMarket:a.group==='objective'?s.objectiveMarket:s.supply[a.group];assert(zone,'未知供应区');if(a.gold){assert(a.group.startsWith('bonus'),'只能用金块购买奖励卡');const index=s.bonusGroups.indexOf(Number(a.group.slice(5)));assert(index>=0,'该组奖励未参与本局');const cost=[3,3,4,5][index];assert(p.gold>=cost,'金块不足');p.gold-=cost;}else pay(p,integer(a.cost||0));const c=take(zone,a.uid);p.discard.push(c);if(s.rulesVersion)p.gainedThisTurn.push(c.uid);if(a.group==='objective'&&s.objectiveDeck.length)s.objectiveMarket.push(s.objectiveDeck.pop());log(s,`获得 ${cardInfo(catalog.cards[c.def]).name}，支付 ${a.cost||0} 元`);break;}
 case 'refillSheep':assert(s.phase==='B','当前不是地点行动');{const count=integer(a.count,1,14);let n=0;while(n<count&&s.sheepDeck.length){s.sheepMarket.push(s.sheepDeck.pop());n++;}log(s,`绵羊市场补充 ${n} 张；请分配相应牧羊人`);}break;
 case 'hire':{
  assert(s.phase==='B','当前不是地点行动');const t=s.workers.find(t=>t.uid===a.uid);assert(t,'工人已不在市场');const wi=WORKERS.indexOf(catalog.tiles[t.def].name);assert(p.workers[wi]<5,'该工人列已满');pay(p,integer(a.cost));p.workers[wi]++;p.collected.push(take(s.workers,a.uid));log(s,`雇用 ${catalog.tiles[t.def].name}，支付 ${a.cost} 元；请结算新覆盖的即时奖励`);break;}
 case 'takeTile':{
  assert(s.phase==='B','当前不是地点行动');const zone={bonus:s.bonuses,hazard:s.hazards,master:s.harbourmasters}[a.group];assert(zone,'未知板块区');pay(p,integer(a.cost||0));const t=take(zone,a.uid);p.collected.push(t);
  if(a.group==='hazard'){const group=catalog.tiles[t.def].name==='flood'?'ferry':'dog';if(s.supply[group].length)p.discard.push(s.supply[group].pop());}
  log(s,`取得${a.group==='hazard'?'天灾':a.group==='master'?'港务长':'奖励'}板块，支付 ${a.cost||0} 元；按原图结算其余效果`);break;}
 case 'build':{
  position(a);
  assert(s.phase==='B','当前不是地点行动');pay(p,integer(a.cost));const tile=take(p.private,a.uid);p.built.push({...tile,type:'building',side:a.side||'a'});s.boardPieces.push({...tile,owner:s.active,type:'building',side:a.side||'a',x:a.x,y:a.y});p.gold=Math.min(5,p.gold+1);log(s,`建造私有建筑，支付 ${a.cost} 元并获得 1 金块；工匠需求与建造位置按原图核对`);break;}
 case 'place':{
  position(a);
  assert(['A','B','delivery','forecastA','forecastB'].includes(s.phase),'当前不能放置标记');assert(['disk','warehouse','ship'].includes(a.kind),'标记类型无效');pay(p,integer(a.cost||0));if(a.kind==='ship'){p.ship={x:a.x,y:a.y};}else{const field=a.kind==='disk'?'disks':'warehouses';assert(p[field]>0,'没有剩余标记');p[field]--;s.boardPieces.push({uid:`i${s.nextId++}`,owner:s.active,type:a.kind,label:String(a.label||'').slice(0,60),x:a.x,y:a.y});}log(s,`放置${a.kind==='disk'?'圆片':a.kind==='warehouse'?'仓库':'帆船'}，支付 ${a.cost||0} 元；请结算原图奖励`);break;}
 case 'playCard':{
  assert(['A','B'].includes(s.phase),'只能在 A 前或 B 的行动之间打牌');const c=take(p.hand,a.uid),d=cardInfo(catalog.cards[c.def]);assert(d.kind!=='sheep','绵羊请用于收入、剃毛或弃牌');if(d.kind==='objective')p.objectives.push(c);else{p.discard.push(c);if(d.group==='bird')p.pioneer=Math.min(16,p.pioneer+1);draw(s,p,1,random);}log(s,`打出 ${d.name}${d.group==='bird'?'，开拓者前进 1 格并抽 1 张牌':'；按卡面结算尚未自动执行的效果'}`);break;}
 case 'adjust':{
  assert(['money','gold','exchange','handLimit','steps','certificate','certificateMax','permanentCertificate','wool','pioneer','disks','warehouses'].includes(a.field),'未知资源');const max={gold:5,handLimit:6,steps:7,certificate:p.certificateMax,certificateMax:5,pioneer:16,disks:16,warehouses:10}[a.field]||999;integer(a.value,['handLimit','steps'].includes(a.field)?1:0,max);const old=p[a.field];p[a.field]=a.value;log(s,`${a.label||a.field}：${old} → ${a.value}${a.note?`（${String(a.note).slice(0,150)}）`:''}`);break;}
 case 'relocate':{position(a);const t=s.boardPieces.find(t=>t.uid===a.uid);assert(t,'标记不在地图上');t.x=a.x;t.y=a.y;log(s,'按规则重新定位地图配件');break;}
 case 'returnToken':{const t=take(s.boardPieces,a.uid);assert(['disk','warehouse'].includes(t.type),'只能收回圆片或仓库');const owner=s.players[t.owner];owner[t.type==='disk'?'disks':'warehouses']++;log(s,'按规则收回地图标记，相关贸易记录需另行核对');break;}
 case 'replaceBuilding':{assert(s.phase==='B','当前不是地点行动');const old=s.boardPieces.find(t=>t.uid===a.oldUid&&t.type==='building'&&t.owner===s.active);assert(old,'请选择自己的旧建筑');const fresh=take(p.private,a.uid);pay(p,integer(a.cost));s.removed.push(take(s.boardPieces,a.oldUid));const index=p.built.findIndex(t=>t.uid===a.oldUid);assert(index>=0,'旧建筑记录不存在');p.built.splice(index,1,{...fresh,type:'building',side:old.side});s.boardPieces.push({...fresh,type:'building',side:old.side,owner:s.active,x:old.x,y:old.y});log(s,'替换私有建筑；旧建筑移出游戏，本次不获得金块');break;}
 case 'adjustWorker':{integer(a.worker,0,3);integer(a.value,1,5);p.workers[a.worker]=a.value;log(s,'按派驻港务长／万能工人效果调整工人数量');break;}
 case 'flipNeutral':s.neutralFlipped=!s.neutralFlipped;log(s,s.neutralFlipped?'四片中立建筑翻到 II 面':'中立建筑恢复 I 面');break;
 case 'score':integer(a.player,0,s.players.length-1);integer(a.index,0,11);integer(a.value,-200,500);s.players[a.player].scores[a.index]=a.value;break;
 case 'end':assert(!s.final,'已在最后一轮');s.final={trigger:s.active,remaining:s.players.length};log(s,'手动触发最后一轮；本轮不再补牌');break;
 case 'reopen':assert(s.phase==='ended','对局尚未结束');s.final=null;s.phase='A';break;
 default:throw new Error('未知操作');
 }
 return s;
}
export function validateSave(s,catalog){
 assert(s&&s.version===VERSION,'存档版本不兼容');assert(Array.isArray(s.players)&&s.players.length>=1&&s.players.length<=4,'玩家数据无效');integer(s.active,0,s.players.length-1);assert(['start','A','B','income','delivery','forecastA','forecastB','C','sarah','ended'].includes(s.phase),'阶段数据无效');
 assert(Array.isArray(s.log)&&Array.isArray(s.boardPieces),'存档缺少桌面数据');
 for(const p of s.players){assert(typeof p.name==='string'&&Array.isArray(p.scores)&&p.scores.length===12,'玩家数据无效');for(const field of ['money','gold','exchange','handLimit','steps','certificate','pioneer','disks','warehouses'])integer(p[field],0,999);for(const zone of ['deck','hand','discard','objectives']){assert(Array.isArray(p[zone]),'牌区数据无效');for(const c of p[zone])assert(c&&typeof c.uid==='string'&&catalog.cards[c.def],'未知卡牌');}}
 for(const t of s.boardPieces){position(t);integer(t.owner,0,s.players.length-1);assert(typeof t.uid==='string'&&['disk','warehouse','building'].includes(t.type),'地图配件无效');if(t.type==='building')assert(catalog.tiles[t.def],'未知建筑');}
 for(const p of s.players){position(p.position);position(p.ship);assert(Array.isArray(p.private)&&Array.isArray(p.built)&&Array.isArray(p.collected)&&Array.isArray(p.workers)&&p.workers.length===4,'牧场数据无效');p.workers.forEach(n=>integer(n,1,5));p.scores.forEach(n=>integer(n,-200,500));}
 for(const zone of ['sheepDeck','sheepMarket','objectiveDeck','objectiveMarket','bagA','bagB','workers','hazards','bonuses','harbourmasters','removed'])assert(Array.isArray(s[zone]),'公共区域数据无效');
 if(s.mode==='sarah'){assert(s.players.length===2&&s.players[1].isSarah&&s.sarah,'莎拉存档缺少对手数据');assert(['easy','medium','hard'].includes(s.sarah.difficulty)&&['idle','move','actions','choice','build','port','done'].includes(s.sarah.stage),'莎拉阶段无效');assert(Array.isArray(s.sarah.deck)&&Array.isArray(s.sarah.discard)&&Array.isArray(s.sarah.queue)&&Array.isArray(s.sarah.choices),'莎拉卡组无效');const numbers=[...s.sarah.deck,...s.sarah.discard,...(s.sarah.card?[s.sarah.card]:[])];assert(new Set(numbers).size===numbers.length&&numbers.every(n=>Number.isInteger(n)&&n>=1&&n<=17),'莎拉卡牌重复或编号无效');assert(s.phase!=='sarah'||s.active===1,'莎拉回合玩家无效');}
 if(s.rulesVersion!==undefined){
 assert(s.rulesVersion===2&&Array.isArray(s.ruleTasks),'自动规则存档版本或行动队列无效');
 const kinds=['pioneerChoice','hire','build','cardReplace','hazard','bonus','objective','aux','discardCertificate','workerSheep','market','shear','cycleRemaining','rancher','woolDelivery','ship','remoteWarehouse'];
 assert(s.ruleTasks.length<=30&&s.ruleTasks.every(t=>t&&kinds.includes(t.kind)),'待结算行动无效');
 for(const p of s.players){assert(Array.isArray(p.unlocked)&&new Set(p.unlocked).size===p.unlocked.length&&p.unlocked.every(id=>DISKS.some(d=>d.id===id)),'圆片解锁记录无效');assert(p.aux&&['money','cycle','certificate','ship','pioneer'].every(k=>Number.isInteger(p.aux[k])&&p.aux[k]>=0&&p.aux[k]<=2),'附属行动记录无效');assert(Array.isArray(p.ports)&&new Set(p.ports).size===p.ports.length&&p.ports.every(id=>PORTS.some(t=>t.id===id)),'港口记录无效');assert(LAND_NODES[p.landNode]&&SEA_NODES.some(n=>n.id===p.seaNode),'道路位置无效');assert(Array.isArray(p.ruleUsed)&&Array.isArray(p.gainedThisTurn),'回合记录无效');if(p.warehouseSlots)assert(new Set(p.warehouseSlots).size===p.warehouseSlots.length&&p.warehouseSlots.every(n=>Number.isInteger(n)&&n>=0&&n<10),'仓库记录无效');}
 }
 assert(s.forecast&&Array.isArray(s.forecast.A)&&Array.isArray(s.forecast.B)&&s.supply,'供应区数据无效');return clone(s);
}
