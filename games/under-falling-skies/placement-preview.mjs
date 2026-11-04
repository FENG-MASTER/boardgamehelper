import {act,roomAt,NAMES,pathIndex,occupant,roomValue,researchTrack,CITIES,skyRows} from './engine.mjs';

const location=ship=>ship.row===null?'回到母舰等待重生':ship.row===-1?`母舰上、第 ${ship.col+1} 列`:`第 ${ship.row+1} 行、第 ${ship.col+1} 列`;
export function placementPreview(state,action){
 // act clones the state; preview never consumes the real game's random state.
 const after=act(state,action),room=roomAt(state,action.cell);
 const [row,col]=action.cell.split('-').map(Number);
 const immediate=[],later=[];
 if(action.type==='install')return {title:`安装 ${state.pending.value} 点机器人`,position:`第 ${row+1} 排 · 第 ${col+1} 列 · ${NAMES[room.type]}`,immediate:['机器人放入这格，不移动敌舰，也不触发白骰重掷。'],later:['本轮不能使用，从下一轮起可参与这个设施的工作。每次使用后点数减 1，降到 0 移除。'],fatal:false};
 const die=state.dice.find(d=>d.id===action.id),distance=Math.max(0,die.value-(row===0?1:0));
 const moving=state.ships.filter(s=>s.row!==null&&s.col===col);
 immediate.push(`第 ${col+1} 列有 ${moving.length} 艘敌舰${row===0?`；防空塔令移动量从 ${die.value} 减为 ${distance}`:''}。${moving.length?`这一列全体下降 ${distance} 格。`:'没有敌舰需要移动。'}`);
 for(const ship of moving){
  const next=after.ships.find(s=>s.id===ship.id);
  let text=`${ship.color==='purple'?'紫':'白'}舰：${location(ship)} → ${location(next)}。`;
  if(ship.row+distance>=16)text+='越过天空底部，撞击城市。';
  else if(distance&&next.row!==null){const effect=skyRows(state)[ship.row+distance]?.[ship.col];if((effect==='<'||effect==='>')&&next.col===ship.col)text+='箭头目标格已有敌舰，横移无效。';}
  immediate.push(text);
 }
 if(after.damage>state.damage)immediate.push(`城市损伤 +${after.damage-state.damage}，变为 ${after.damage} / ${CITIES[state.city].hull}。`);
 if(after.mother>state.mother)immediate.push(`落点触发母舰下降 ${after.mother-state.mother} 行，到第 ${after.mother+1} 行；这次不执行母舰阶段的事件。`);
 if(state.robots.some(r=>r.cell===action.cell))immediate.push('此格原有机器人会被移除，由工人骰占用。');
 const fatal=after.phase==='over';
 if(fatal){immediate.push('这次放骰会立即导致防卫失败。');return {title:`放置 ${die.value} 点${die.color==='white'?'白':'灰'}骰`,position:`第 ${row+1} 排 · 第 ${col+1} 列 · ${NAMES[room.type]}`,immediate,later:['本局立即结束，不再执行重掷或基地工作。'],fatal};}
 if(die.color==='white'){const count=after.dice.filter(d=>!d.cell).length;immediate.push(count?`白骰放下后，剩余 ${count} 颗未放骰子全部重掷；已放骰子保持不变。`:'这是最后一颗骰子，没有未放骰子需要重掷。');}
 else immediate.push('灰骰不会触发重掷。');
 const dig=pathIndex(row,col)>state.excavated;
 if(dig){later.push(`安排向前挖掘 ${pathIndex(row,col)-state.excavated} 格。五颗骰子放完后，还要点击“完成挖掘”，支付 1 能源，阴影才会退到这格。`,'这颗骰子只用于挖掘，不能再启动所在设施。直接结束基地阶段会放弃本次挖掘。');if(state.energy<1)later.push('当前能源不足 1，需先发电再完成挖掘。');}
 else if(room.type==='a')later.push('防空塔的减速已经在放骰时生效，基地阶段没有额外工作。');
 else if(room.type==='t')later.push('这是已挖开的隧道。它只占用这一列的放骰位置，不会发电、研究或推进阴影。');
 else {
  const missing=room.cells.filter(c=>!occupant(after,c.key));
  if(missing.length)later.push(`这是 ${room.span} 格设施，还缺 ${missing.length} 颗可用骰子，填满后才能启动。目前不能获得效果。`);
  else {
   const value=roomValue(after,room),values=room.cells.map(c=>occupant(after,c.key).value);
   const bonus=state.city==='new-york'&&room.cells.some(c=>after.robots.some(b=>b.cell===c.key&&!b.exhausted));
   later.push(`骰子 ${values.join(' + ')}${room.mod?` ${room.mod>0?'+':'−'} 房间修正 ${Math.abs(room.mod)}`:'（房间无修正）'}${bonus?' + 纽约机器人奖励 1':''} = ${value} 点效果${values.reduce((a,b)=>a+b,0)+room.mod<0?'（最低为 0）':''}。启动另付 ${room.cost} 能源。`);
   if(room.type==='r'){let remaining=value,position=after.research;const track=researchTrack(after);while(position<track.length&&remaining>=track[position])remaining-=track[position++];later.push(`本次可产生 ${value} 研究点。按当前路线可前进 ${position-after.research} 格${position===track.length?'，完成研究':`，剩余 ${remaining} 点不保留`}。`);}
   if(room.type==='e')later.push(`充能室可增加 ${value} 能源；按当前能源和费用计算，会从 ${after.energy} 变为 ${Math.min(CITIES[state.city].capacity,after.energy-room.cost+value)}，上限 ${CITIES[state.city].capacity}。`);
   if(room.type==='f'){const hits=after.ships.filter(s=>s.row!==null&&typeof skyRows(after)[s.row]?.[s.col]==='number'&&skyRows(after)[s.row][s.col]<=value);later.push(`提供 ${value} 点火力，可击落停在数字不大于 ${value} 的爆炸格上的所有敌舰。按当前落点可击落 ${hits.length} 艘；后续放骰可能改变敌舰位置。`);}
   if(room.type==='b')later.push(value?`可制造 ${Math.min(6,value)} 点机器人，随后选择已挖开的空格安装，本轮不能使用。`:'效果为 0，不能制造机器人。');
   if(after.energy<room.cost)later.push(`当前只有 ${after.energy} 能源，不足支付 ${room.cost}；需要先发电才能启动。`);
  }
  later.push('以上是按当前布局计算的预览。五颗骰子全放完后，仍需点击设施按钮启动，放骰本身不会立即获得基地效果。');
 }
 return {title:`放置 ${die.value} 点${die.color==='white'?'白':'灰'}骰`,position:`第 ${row+1} 排 · 第 ${col+1} 列 · ${dig?'挖掘位置':NAMES[room.type]}`,immediate,later,fatal};
}
