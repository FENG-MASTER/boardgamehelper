import {buildingTargets,sailingTargets,matchingSheepOffers} from './interaction-options.mjs';
import {availableDisks} from './automation.mjs';
import {deliveryOptions} from './map-rules.mjs';
import {cardInfo,WORKER_NAMES} from './data.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const select=(name,label,items)=>`<label>${label}<select name="${name}" required>${items.map(([id,label])=>`<option value="${esc(id)}">${esc(label)}</option>`).join('')}</select></label>`;
function diskField(s,black){const ds=availableDisks(s),white=ds.some(d=>d.color==='white');return select('disk','选择解锁能力',ds.filter(d=>black||d.color==='white'||!white).map(d=>[d.id,`${d.label} · ${d.cost||0} 元`]));}
export function interactionDialog(s,catalog,key,h){
 const task=s.ruleTasks?.[0],p=s.players[s.active],{showDialog,formDialog,modal,dispatch,pickMap}=h;
 if(!s.rulesVersion||p.isSarah)return false;
 if(key==='delivery'||key==='task'&&task?.kind==='woolDelivery'){
  const wool=key==='task',targets=deliveryOptions(s,wool).filter(t=>t.value<=(wool?task.value:s.deliveryValue)).map(t=>({...t,label:t.label||`羊毛贸易站 ${t.value}`}));
  pickMap('点击地图上的贸易站',targets,t=>formDialog(t.label,`<p>运费 ${t.fee} 元 · ${t.points} 分。确认后运送并解锁圆片能力。</p>`,diskField(s,t.black),d=>dispatch({type:wool?'ruleTask':'autoDelivery',station:t.id,disk:d.get('disk')})));return true;
 }
 if(key!=='task')return false;
 if(['build','cardReplace'].includes(task?.kind)){
  const choices=p.private.map(t=>({t,targets:buildingTargets(s,catalog,t.uid)})).filter(c=>c.targets.length);
  showDialog(`<h2>选择要建造的建筑</h2><p>选好建筑，再点击地图上的空位或可替换建筑。</p><div class="shelf">${choices.map(({t})=>`<button class="card" data-build-pick="${t.uid}"><img src="${t.side==='b'?catalog.tiles[t.def].back:catalog.tiles[t.def].image}" alt="${esc(catalog.tiles[t.def].name)}"><span class="caption">${esc(catalog.tiles[t.def].name)}</span></button>`).join('')}</div>${choices.length?'':'<p>目前没有满足工人、费用和落位要求的建筑，可以关闭后放弃此效果。</p>'}`,()=>{
   modal.querySelectorAll('[data-build-pick]').forEach(el=>el.onclick=()=>{const c=choices.find(c=>c.t.uid===el.dataset.buildPick);pickMap('点击高亮位置建造或替换',c.targets,t=>formDialog(t.label,`<img class="detail-image" src="${c.t.side==='b'?catalog.tiles[c.t.def].back:catalog.tiles[c.t.def].image}" alt="建筑"><p>${t.workers} 名工匠 · 支付 ${t.cost} 元${t.action.oldUid?' · 原建筑移出游戏':''}</p>`,'',()=>dispatch(t.action),'确认建造'));});
  });return true;
 }
 if(['ship','remoteWarehouse'].includes(task?.kind)){
  pickMap(task.kind==='ship'?'点击海路停靠点或港口':'点击要建仓库的港口',sailingTargets(s),t=>{
   let fields='';const port=t.port;
   if(port?.kind==='medium'){
    fields=diskField(s,port.black);
    if(s.harbourmasters.some(m=>m.port===port.id))fields+=select('worker','派工取得港务长',[['','不派出'],...WORKER_NAMES.map((n,i)=>[i,n]).filter(([i])=>p.workers[i]>1)]);
   }else if(port)fields=select('warehouse','选择玩家板上的仓库',Array.from({length:10},(_,i)=>i).filter(i=>!p.warehouseSlots?.includes(i)).map(i=>[i,'仓库 '+(i+1)]));
   formDialog(t.label,`<p>${t.steps} 步${port?`（含升级） · 港口费用 ${port.cost||0} 元，另付所选圆片解锁费用。升级后结束本次行动。`:' · 确认后帆船停在这里。'}</p>`,fields,d=>{const a={...t.action};for(const [k,v] of d.entries())a[k]=['worker','warehouse'].includes(k)&&v!==''?Number(v):v;return dispatch(a);});
  });return true;
 }
 if(task?.kind==='market'){
  let chosen=new Set(),offerId=null;
  function render(){
   const offers=matchingSheepOffers(s,catalog,[...chosen]);if(!offers.some(o=>o.id===offerId))offerId=offers.length===1?offers[0].id:null;
   const remaining=task.remaining??p.workers[0];
   showDialog(`<h2>点击要购买的绵羊</h2><p>剩余 ${remaining} 名牧羊人 · ${p.money} 元。系统按所选绵羊匹配购买方案。</p><div class="shelf">${s.sheepMarket.map(c=>{const d=cardInfo(catalog.cards[c.def]);return `<button class="card ${chosen.has(c.uid)?'selected':''}" data-buy-sheep="${c.uid}" aria-pressed="${chosen.has(c.uid)}"><img src="${d.image}" alt="${esc(d.name)}"><span class="caption">${esc(d.name)}</span></button>`;}).join('')}</div><div class="move-routes" style="margin-top:16px">${offers.map(o=>`<button data-buy-offer="${o.id}" aria-pressed="${offerId===o.id}">${o.workers} 名牧羊人 · ${o.cost} 元${o.exchange?` · 方案奖励 ${o.exchange} 交换`:''}</button>`).join('')}</div><p role="status">${!chosen.size?'请先选择绵羊。':!offers.length?'当前组合没有可负担的购买方案，请调整选牌。':offers.length===1?'已自动匹配唯一方案。':'这些方案的工人数和费用不同，请选择。'}</p><div class="dialog-actions"><button data-buy-confirm class="primary" ${offerId?'':'disabled'}>确认购买</button><button data-buy-refill ${remaining>0&&s.sheepDeck.length?'':'disabled'}>分配 1 人补充两张</button><button data-buy-finish>结束采购</button></div>`,()=>{
    modal.querySelectorAll('[data-buy-sheep]').forEach(el=>el.onclick=()=>{const uid=el.dataset.buySheep;chosen.has(uid)?chosen.delete(uid):chosen.add(uid);offerId=null;render();});
    modal.querySelectorAll('[data-buy-offer]').forEach(el=>el.onclick=()=>{offerId=el.dataset.buyOffer;render();});
    modal.querySelector('[data-buy-confirm]').onclick=()=>{if(dispatch({type:'ruleTask',uids:[...chosen],offer:offerId}))modal.close();};
    modal.querySelector('[data-buy-refill]').onclick=()=>{if(dispatch({type:'ruleTask',refill:true}))modal.close();};
    modal.querySelector('[data-buy-finish]').onclick=()=>{if(dispatch({type:'ruleTask',finish:true}))modal.close();};
   });
  }render();return true;
 }
 return false;
}
