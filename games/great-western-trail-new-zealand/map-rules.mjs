import {LAND_NODES,LAND_EDGES,landRoutes,occupant,nearestLand,SEA_NODES,seaDistances,PORTS,WOOL_STATIONS} from './map-data.mjs';
import {quoteTolls,settleTolls,tollSites} from './tolls.mjs';
import {LOCAL_TRADE} from './component-data.mjs';
import {gain,removeDisk,pioneer} from './automation.mjs';
const check=(ok,msg)=>{if(!ok)throw new Error(msg);};
const pay=(p,n)=>{check(p.money>=n,'钱币不足');p.money-=n;};
export function movementOptions(s,catalog,actor=s.active){const p=s.players[actor],from=p.landNode||'start',limit=p.extraMove||p.steps;const paths=!p.hasMoved?Object.keys(LAND_NODES).filter(id=>LAND_NODES[id].neutral).map(id=>({destination:id,path:[id],steps:1})):landRoutes(s,catalog,from,limit);return paths.map(r=>{const route=r.path.map(id=>occupant(s,catalog,id)?.uid).filter(uid=>tollSites(s,catalog).some(t=>t.uid===uid));const fees=quoteTolls(s,catalog,route,{actor});return {...r,route,fee:fees.reduce((n,t)=>n+t.paid,0),label:r.path.filter(id=>occupant(s,catalog,id)).map(id=>LAND_NODES[id].label).join(' → ')};});}
export function automatedMove(s,a,catalog){const p=s.players[s.active];check(s.phase==='A'&&!s.ruleTasks?.length&&!s.pending,'当前不能移动');const r=movementOptions(s,catalog).find(r=>r.path.join('|')===a.path);check(r,'路线已变化或不在移动范围内');settleTolls(s,catalog,r.route);const n=LAND_NODES[r.destination],t=occupant(s,catalog,n.id);p.landNode=n.id;p.locationId=t?.uid;p.location=n.label;p.position={x:n.x,y:n.y};p.hasMoved=true;p.extraMove=null;p.used=[];p.ruleUsed=[];s.phase=n.id==='W'?'income':'B';s.log.push({turn:s.turn,player:s.active,text:`移动：${r.label}；${r.steps} 步；支付 ${r.fee} 元`});}
export function buildSites(s,catalog){const p=s.players[s.active];return Object.values(LAND_NODES).filter(n=>n.slot&&n.pioneer<=p.pioneer&&!occupant(s,catalog,n.id));}
export function prepareBuild(s,a,catalog){if(a.oldUid){const old=s.boardPieces.find(t=>t.uid===a.oldUid);check(old,'旧建筑不存在');return {...a,x:old.x,y:old.y,node:old.node,grass:old.grass};}const n=buildSites(s,catalog).find(n=>n.id===a.node);check(n,'不是当前可建造的空格');return {...a,x:n.x,y:n.y,grass:n.grass};}
function receive(s,catalog,group){gain(s,catalog,s.supply[group]?.pop());}
function disk(s,id,black,label,x,y,points,station){const p=s.players[s.active];removeDisk(s,id,black);s.boardPieces.push({uid:`i${s.nextId++}`,type:'disk',owner:s.active,label,x,y,points,station,...(!station?{port:label}:{})});}
export function deliveryOptions(s,wool=false){const p=s.players[s.active];const local=wool?WOOL_STATIONS:LOCAL_TRADE.map((t,i)=>({...t,id:'local'+t.value,label:'本地 '+t.value,fee:[0,0,0,0,3,4,5,6,7][i],black:![0,1,3,6].includes(t.value),group:t.reward,repeat:[0,21].includes(t.value),y:36.6}));return [...local,...PORTS.filter(t=>t.kind==='large'&&!!t.wool===wool&&p.ports?.includes(t.id))].filter(t=>!p.built.some(b=>b.station===t.id)||t.repeat).map(t=>({...t,label:t.label||t.id}));}
export function deliver(s,a,catalog,value,wool=false){const p=s.players[s.active],t=deliveryOptions(s,wool).find(t=>t.id===a.station);check(t&&t.value<=value,'育种／羊毛值不足，或已运送过');const unlocked=p.unlocked.length;disk(s,a.disk,t.black,t.label,t.x,t.y,t.points,t.id);pay(p,t.fee);p.built.push({type:'delivery',station:t.id,value:t.value,wool,points:t.points});if(t.id==='local0')p.money+=6;if(t.id==='local1')p.money+=2;
 if(t.group==='objective'&&(s.objectiveMarket.length||s.objectiveDeck.length)){s.ruleTasks.push({kind:'objective',label:'贸易站奖励：必须获得目标',mandatory:true});}else if(t.group)receive(s,catalog,t.group);
 if(!wool){p.deliveries++;s.phase='forecastA';}
 check(p.unlocked.length===unlocked+1||a.disk.startsWith('port:'),'圆片记录无效');
}
function warehouse(s,a,t,catalog){const p=s.players[s.active];check(Number.isInteger(a.warehouse)&&a.warehouse>=0&&a.warehouse<10&&!p.warehouseSlots?.includes(a.warehouse),'请选择尚未使用的仓库');check(p.warehouses>0,'仓库耗尽');(p.warehouseSlots??=[]).push(a.warehouse);p.warehouses--;s.boardPieces.push({uid:`i${s.nextId++}`,type:'warehouse',owner:s.active,label:t.id,x:t.x,y:t.y,port:t.id,points:t.kind==='small'?t.points:0});
 const slots=p.warehouseSlots;for(const [left,right,kind] of [[0,1,'wool'],[1,2,'points2'],[3,4,'points4'],[5,6,'exchange'],[6,7,'money'],[7,8,'gold'],[8,9,'certificate']])if((a.warehouse===left||a.warehouse===right)&&slots.includes(left)&&slots.includes(right)){if(kind==='wool')p.wool++;if(kind==='exchange')p.exchange++;if(kind==='money')p.money+=3;if(kind==='gold')p.gold=Math.min(5,p.gold+1);if(kind==='certificate')p.permanentCertificate++;}
}
function master(s,input,port,catalog){if(input.worker===undefined||input.worker==='')return;const p=s.players[s.active],wi=Number(input.worker);check(p.workers[wi]>1,'只能派出已雇用的工人');const m=s.harbourmasters.find(t=>t.port===port.id);check(m,'此港口已没有港务长');s.harbourmasters=s.harbourmasters.filter(t=>t!==m);p.workers[wi]--;const index=p.collected.findIndex(t=>t.worker===wi);check(index>=0,'该列没有可派出的工人板块');const worker=p.collected.splice(index,1)[0];(s.stationedWorkers??=[]).push({...worker,owner:s.active,port:port.id});p.collected.push(m);const i=catalog.groups.harbourmaster.indexOf(m.def);if([0,3,5,6].includes(i))p.money+={0:6,3:5,5:8,6:9}[i];if([1,7].includes(i))p.permanentCertificate++;if(i===2)pioneer(s,4);if(i===4){p.money+=3;receive(s,catalog,'ferry');}}
export function mapTask(s,input,a,catalog){const p=s.players[s.active];switch(a.kind){
 case 'rancher':p.extraMove=a.count;s.phase='A';break;
 case 'woolDelivery':deliver(s,input,catalog,a.value,true);break;
 case 'ship':case 'remoteWarehouse':{
 const distances=seaDistances(p.seaNode||'0'),limit=a.count||a.remaining||p.workers[2];
 if(input.port){const t=PORTS.find(t=>t.id===input.port);check(t&&!p.ports.includes(t.id),'该港口已升级或不存在');const distance=Math.min(...t.nodes.map(n=>distances[n]??Infinity));check(distance+1<=limit,'移动加升级所需步数超过上限');if(a.kind==='remoteWarehouse')check(t.kind!=='medium','此效果只能放仓库');pay(p,t.cost||0);
 if(t.kind==='medium'){disk(s,input.disk,t.black,t.id,t.x,t.y,t.points);master(s,input,t,catalog);}else warehouse(s,input,t,catalog);
 p.ports.push(t.id);if(t.group)receive(s,catalog,t.group);if(t.bonus!==undefined)receive(s,catalog,'bonus'+s.bonusGroups[t.bonus]);
 if(a.kind==='ship'){p.seaNode=t.reset?'0':t.nodes.find(n=>distances[n]===distance);const node=SEA_NODES[Number(p.seaNode)];p.ship={x:node.x,y:node.y};}
 }else{check(a.kind==='ship','请选择港口');const n=SEA_NODES.find(n=>n.id===input.node);check(n&&distances[n.id]<=limit,'海路目的地超过移动范围');p.seaNode=n.id;p.ship={x:n.x,y:n.y};}break;}
 default:throw new Error('未知地图行动 '+a.kind);
}}
