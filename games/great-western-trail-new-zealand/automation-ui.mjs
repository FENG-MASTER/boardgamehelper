import {availableActions,buildingCost,availableDisks} from './automation.mjs';
import {DISKS,SHEEP_OFFERS,BONUS_EFFECTS} from './rule-data.mjs';
import {movementOptions,buildSites,deliveryOptions} from './map-rules.mjs';
import {SEA_NODES,seaDistances,PORTS} from './map-data.mjs';
import {cardInfo,WORKER_NAMES} from './data.mjs';
import {BONUS_ROW_COSTS,isWildcard} from './component-data.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const select=(name,label,options)=>`<label>${label}<select name="${name}">${options.map(([v,label])=>`<option value="${esc(v)}">${esc(label)}</option>`).join('')}</select></label>`;
const checks=(name,items)=>`<div class="shelf">${items.map(([uid,label,image])=>`<label class="rule-choice"><input type="checkbox" name="${name}" value="${esc(uid)}">${image?`<img src="${image}" alt="">`:''}<span>${esc(label)}</span></label>`).join('')}</div>`;
const options=items=>items.map(t=>[t.id,t.label]);
const diskOptions=(p,s)=>availableDisks(s).map(d=>[d.id,(d.color==='white'?'白边 · ':'黑边 · ')+d.label]);
export function automaticPanel(s,catalog){const p=s.players[s.active];if(s.ruleTasks?.length){const task=s.ruleTasks[0];return `<h2>${esc(task.label)}</h2><p>完成当前行动后，才能进行其他地点行动。</p><button data-auto="task" class="primary full">选择并结算</button>${task.mandatory?'':'<button data-auto="skip">放弃剩余效果</button>'}`;}
 if(s.phase==='start')return `<h2>首次准备</h2><p>保留 4 张手牌，再选择移除的白边圆片。系统结算解锁能力。</p><button data-auto="start" ${p.hand.length!==4?'disabled':''}>选择起始圆片</button>`;
 if(s.phase==='A')return `<h2>选择移动路线</h2><p>系统计算有效地点、步数及沿路费用。分岔路线由你选择。</p><button data-auto="move" class="primary full">查看可到达地点</button>`;
 if(s.phase==='B')return `<h2>${esc(p.location)}</h2><div class="tasks">${availableActions(s,catalog).map(a=>`<button class="full" data-rule-id="${a.id}" ${a.used?'disabled':''}>${a.used?'✓ ':''}${esc(a.label)}</button>`).join('')}</div><button data-action="finishB" class="primary full" ${s.pending?'disabled':''}>地点行动结束 →</button>`;
 if(s.phase==='delivery')return `<h2>威灵顿 · 运送</h2><p>本次育种价值 ${s.deliveryValue}。选择贸易站和圆片，系统结算运费、解锁能力及奖励。</p><button data-auto="delivery" class="primary full">选择贸易站与圆片</button>`;
 return null;
}
export function autoDialog(s,catalog,key,helpers){const {formDialog,dispatch,selected}=helpers,p=s.players[s.active];
 const cards=p.hand.map(c=>[c.uid,cardInfo(catalog.cards[c.def]).name,catalog.cards[c.def].image]);
 const sheep=s.sheepMarket.map(c=>[c.uid,cardInfo(catalog.cards[c.def]).name,catalog.cards[c.def].image]);
 if(key==='start'){formDialog('起始圆片','<p>移除白边圆片，自动解锁能力。</p>',select('disk','圆片',diskOptions(p,s).filter(([id])=>DISKS.find(d=>d.id===id).color==='white')),d=>dispatch({type:'ruleStart',disk:d.get('disk')}));return;}
 if(key==='move'){const routes=movementOptions(s,catalog);formDialog('选择路线','<p>只计算已放置板块的地点。费用按照实际经过顺序自动支付。</p>',select('path','路线',routes.map(r=>[r.path.join('|'),`${r.label} · ${r.steps} 步 · ${r.fee} 元`])),d=>dispatch({type:'autoMove',path:d.get('path')}));return;}
 if(key==='delivery'){formDialog('运送','',select('station','贸易站',deliveryOptions(s).filter(t=>t.value<=s.deliveryValue).map(t=>[t.id,`${t.label} · 运费 ${t.fee} · ${t.points} 分`]))+select('disk','移除圆片',diskOptions(p,s)),d=>dispatch({type:'autoDelivery',station:d.get('station'),disk:d.get('disk')}));return;}
 if(key==='skip'){dispatch({type:'ruleTask',skip:true});return;}
 if(key.startsWith('card:')){const uid=key.slice(5),c=p.hand.find(c=>c.uid===uid),d=cardInfo(catalog.cards[c.def]);formDialog('打出 '+d.name,`<img class="detail-image" src="${d.image}" alt="${esc(d.name)}"><p>自动执行卡牌效果及补抽。目标卡不补抽。</p>`,select('effect','效果',[['normal','执行普通效果'],...(['bonus4','bonus5','bonus6'].includes(d.group)?[['special','执行卡面特殊分支']]:[]),['skip','放弃效果']]),f=>dispatch({type:'ruleCard',uid,skip:f.get('effect')==='skip',special:f.get('effect')==='special'}));return;}
 if(key!=='task'){
 const a=availableActions(s,catalog).find(a=>a.id===key);if(!a)return;
 let fields='';if(a.kind==='choice')fields=select('choice','分支',a.options.map((o,i)=>[i,o.label]));if(['discard','risk','discardGold'].includes(a.kind))fields=checks('uids',cards);if(a.kind==='cycle')fields=select('count','抽换数量',Array.from({length:a.count},(_,i)=>[i+1,i+1]));
 if(!fields){dispatch({type:'ruleAction',id:key});return;}
 formDialog(a.label,'',fields,d=>dispatch({type:'ruleAction',id:key,choice:Number(d.get('choice')),count:Number(d.get('count')),uids:d.getAll('uids')}));return;
 }
 const a=s.ruleTasks[0];if(!a)return;let fields='',note='';
 switch(a.kind){
 case 'pioneerChoice':fields=select('choice','永久奖励',[['toll','以后免除过路费'],['steps','移动上限再增加 1']]);break;
 case 'hire':fields=select('uid','工人',s.workers.filter(t=>p.workers[['shepherd','craftsman','sailor','shearer'].indexOf(catalog.tiles[t.def].name)]<5).map(t=>[t.uid,`${WORKER_NAMES[['shepherd','craftsman','sailor','shearer'].indexOf(catalog.tiles[t.def].name)]} · ${Math.max(0,8-t.row+a.price)} 元`]));break;
 case 'build':case 'cardReplace':{
 const combos=[];for(const t of p.private)for(const old of [null,...s.boardPieces.filter(b=>b.owner===s.active&&b.type==='building')]){try{const b=buildingCost(s,catalog,t.uid,old?.uid,a.kind==='cardReplace'?0:a.rate);if(a.kind==='cardReplace'&&(!old||b.n!==1))continue;combos.push([`${t.uid}|${old?.uid||''}`,`${catalog.tiles[t.def].name}${old?' 替换 '+catalog.tiles[old.def].name:' 新建'} · ${b.cost} 元`]);}catch{}}
 fields=select('building','建筑方案',combos)+select('node','新建位置（替换沿用原位置）',options(buildSites(s,catalog)));break;}
 case 'hazard':fields=select('uid','天灾',s.hazards.map(t=>[t.uid,`${catalog.tiles[t.def].name==='flood'?'洪水':'落石'} ${t.slot+1} · ${a.price} 元`]));break;
 case 'bonus':fields=select('uid','奖励板块',s.bonuses.filter(t=>t.row<Math.floor(s.bonusProgress/s.count)).map(t=>[t.uid,`${catalog.tiles[t.def].name} · ${BONUS_ROW_COSTS[t.row]+a.price} 元${isWildcard(catalog,t.def)?'，另付 1 金块':''}`]))+select('worker','万能工人放入哪列',WORKER_NAMES.map((n,i)=>[i,n]))+select('card','需移除的起始羊（对应板块才使用）',[['','不适用'],...cards.map(([u,n])=>[u,n])])+select('hazard','移除天灾（对应板块另付 3 元）',[['','不适用'],...s.hazards.map(t=>[t.uid,catalog.tiles[t.def].name+' '+(t.slot+1)])]);note='按板块印刷要求自动支付金块、移除卡牌、领取全部奖励。';break;
 case 'objective':fields=select('uid','目标',[...(s.objectiveDeck.length?[['deck','从目标牌库顶抽取']]:[]),...s.objectiveMarket.map(c=>[c.uid,cardInfo(catalog.cards[c.def]).name])]);break;
 case 'aux':fields=select('kind','附属行动',Object.entries(p.aux).filter(([,n])=>n>0).map(([k,n])=>[k,`${{money:'钱币',cycle:'抽换',certificate:'认证（每次 2 元）',ship:'帆船（每次 1 元）',pioneer:'开拓者（每次 1 元）'}[k]} · 已解锁 ${n} 次`]))+select('count','次数',Array.from({length:a.limit},(_,i)=>[i+1,i+1]));break;
 case 'discardCertificate':fields=select('uid','弃掉一张绵羊',cards.map(([u,n])=>[u,n]));break;
 case 'workerSheep':fields=checks('uids',sheep);break;
 case 'market':fields=select('offer','购买方案',SHEEP_OFFERS.filter(o=>o.workers<=(a.remaining??p.workers[0])).map(o=>[o.id,`${o.colors.join('/')} ×${o.count} · ${o.workers} 人 · ${o.cost} 元`]))+checks('uids',sheep)+select('operation','执行',[['buy','购买所选'],['refill','分配 1 人补充两张'],['finish','结束采购']]);note=`剩余牧羊人 ${a.remaining??p.workers[0]}；每人本次只能分配一次。`;break;
 case 'shear':fields=checks('uids',cards)+select('operation','执行',[['shear','给所选不同品种绵羊剃毛'],...(a.workers?[['cycle','分配 1 名剃毛工抽换一张']]:[])]);note=`剩余可分配 ${a.remaining??a.count}。`;break;
 case 'cycleRemaining':fields=select('count','抽换数量',Array.from({length:a.count},(_,i)=>[i+1,i+1]));break;
 case 'woolDelivery':fields=select('station','羊毛贸易站',deliveryOptions(s,true).filter(t=>t.value<=a.value).map(t=>[t.id,`${t.label} · 运费 ${t.fee} · ${t.points} 分`]))+select('disk','移除圆片',diskOptions(p,s));break;
 case 'rancher':note='进入额外移动阶段，不补手牌；抵达后继续地点行动。';break;
 case 'ship':case 'remoteWarehouse':{const distances=seaDistances(p.seaNode||'0'),limit=a.count||a.remaining||p.workers[2];const ports=PORTS.filter(t=>!p.ports.includes(t.id)&&Math.min(...t.nodes.map(n=>distances[n]??Infinity))+1<=limit&&(a.kind!=='remoteWarehouse'||t.kind!=='medium'));
 fields=select('destination','目的地',[...(a.kind==='ship'?SEA_NODES.filter(n=>distances[n.id]<=limit).map(n=>['sea:'+n.id,`${n.label} · ${distances[n.id]} 步`]):[]),...ports.map(t=>['port:'+t.id,`${t.label} · 升级 ${t.cost||0} 元`])])+select('disk','中型港口移除圆片',diskOptions(p,s))+select('warehouse','小／大型港口使用仓库',Array.from({length:10},(_,i)=>i).filter(i=>!p.warehouseSlots?.includes(i)).map(i=>[i,'仓库 '+(i+1)]))+select('worker','取得港务长时派出工人',[['','不派出'],...WORKER_NAMES.map((n,i)=>[i,n]).filter(([i])=>p.workers[i]>1)]);note='升级港口消耗一步，并结束本次帆船行动。';break;}
 }
 formDialog(a.label,note?`<p>${esc(note)}</p>`:'',fields,d=>{const action={type:'ruleTask'};for(const [k,v] of d.entries())action[k]=v;for(const k of ['worker','warehouse','count'])if(d.has(k)&&d.get(k)!=='')action[k]=Number(d.get(k));action.uids=d.getAll('uids');if(d.has('building')){[action.uid,action.oldUid]=d.get('building').split('|');}if(d.has('destination')){const [kind,id]=d.get('destination').split(':');action[kind==='sea'?'node':'port']=id;}action.refill=d.get('operation')==='refill';action.finish=d.get('operation')==='finish';action.cycle=d.get('operation')==='cycle';return dispatch(action);});
}
