export const FLOWERS=['郁金香','绣球花','鸢尾花','风信子','番红花','黄水仙'];
export const TOOLS=[['玻璃罐',1,1,'此后每收获黑莓，获得 1 货物'],['馅饼柜',2,3,'此后每收获苹果或桃子，获得 1 货物'],['铲子',2,1,'可随时花 3 堆肥换 1 奖励行动'],['果盘',3,0,'收获 1/2/3/4 种水果，得 1/4/7/10 分'],['蓄雨桶',2,2,'每轮降雨后，额外浇灌一个区域'],['炖锅',2,0,'每 2 株已收获豆子得 1 分'],['华丽标签',3,2,'每次市集额外推进一次花卉'],['蜂巢套装',3,2,'推进番红花时，额外推进一次蜂巢'],['干草叉',1,1,'推进绣球花时，获得 1 堆肥'],['割草机',3,6,'完成后得 6 分'],['独轮车',2,3,'此后每次工具棚行动获得 1 货物'],['护根土',1,1,'可将行动轨行动替换成花卉行动'],['新拖拉机',6,18,'完成后得 18 分'],['南瓜刻刀',3,0,'最长连续收获南瓜链，每株得 1 分'],['播种机',4,2,'种植时最多种植 3 株作物']];
export const ACTIONS=['蜂巢或水果','种植或浇灌','工具棚','1 堆肥 + 4 货物','蜂巢或水果','工具棚','农夫市集'];
export const EVENTS=['工具棚','降雨','农夫市集','降雨','农夫市集','工具棚','农夫市集','降雨'];
// Clockwise around the printed garden, starting at the top-left pumpkin.
export const PUMPKINS=[{z:1,n:1,g:1,f:2},{z:2,n:4,g:3,f:0},{z:3,n:2,g:1,f:3},{z:3,n:3,g:2,f:2},{z:4,n:4,g:3,f:5},{z:4,n:3,g:3,f:4},{z:4,n:1,g:1,f:1},{z:5,n:2,g:1,f:0},{z:6,n:4,g:3,f:3},{z:6,n:3,g:2,f:5},{z:1,n:4,g:3,f:4},{z:1,n:3,g:2,f:1}];
export const FRUITS=[['苹果',8,[2,4,5,6,7,8]],['桃子',8,[2,4,6,8]],['黑莓',7,[1,2,3,4,5,6,7]],['树莓',9,[1,2,3,4,5,6,7,8,9]]];
export const FLOWER_STEPS=[['水果','此后桃子 +2 货物','—','改为桃子 +3 货物','—','每份水果 1 分，最多 15 分'],['苹果','—','黑莓','树莓','桃子','7 分'],['+1 堆肥','免费调整区域 ±1','—','改为免费调整区域 ±2','—','12 分'],['+2 货物','+2 货物','—','+2 货物','—','10 分'],['+2 堆肥','+1 堆肥','+1 堆肥','+2 堆肥','—','6 分'],['工具棚','—','工具棚','工具棚','工具棚','4 分']];
export function farm(name){return {name,corn:[3,5,3,3,5,3].map(n=>Array(n).fill(0)),beans:[3,5,3,3,5,3].map(n=>Array(n).fill(0)),pumpkins:Array(12).fill(0),flowers:Array(6).fill(0),fruit:Array(4).fill(0),hive:Array(4).fill(0),tools:Array(15).fill(0),goods:0,compost:0,earnedCompost:0};}
export function createGame(n=2,options={}){if(!Number.isInteger(n)||n<1||n>4)throw Error('人数应为 1～4');const s={version:1,mode:n===1?(options.mode==='practice'?'practice':'solo'):'multi',soloTurn:0,players:Array.from({length:n},(_,i)=>farm(n===1?'我的农场':`玩家 ${i+1}`)),round:1,first:0,active:0,edith:0,phase:'draft',dice:[],queue:[],log:[],picked:0,eventPlayer:0};roll(s);return s;}
function note(s,t){s.log.push(t);s.log=s.log.slice(-100);}
function task(s,type,extra={}){s.queue.push({type,...extra});}
function compost(p,n){const gain=Math.min(n,40-p.earnedCompost);p.earnedCompost+=gain;p.compost+=gain;}
function goods(s,p,n){
  const crossed=p.blocked?.goods??[];
  for(let gain=0;gain<n&&p.goods<120;gain++){
    // Crossed star spaces cannot be filled: move to the next usable goods box.
    while(p.goods<120&&crossed.includes(p.goods+1))p.goods++;
    if(p.goods===120)break;
    p.goods++;
    if(p.goods%5===0)task(s,'bonus');
  }
}
export function unlocked(p,i){return !toolBlocked(p,i)&&p.tools[i]===TOOLS[i][1];}
export function roll(s,random=Math.random){let last=-1,pos=s.edith;const values=Array.from({length:isSolo(s)?4:Math.max(2,s.players.length+2)},()=>1+Math.floor(random()*6)).sort((a,b)=>a-b);s.dice=values.map((v,id)=>{if(last!==-1&&v!==last)pos=(pos+1)%7;last=v;return{id,v,pos,used:false};});s.edith=(pos+1)%7;if(isSolo(s)){s.soloTurn=0;s.phase=s.round%2?'draft':'edith';s.edithReport=[];}note(s,`第 ${s.round} 轮：${EVENTS[s.round-1]}`);}
function market(s,p){const g=p.goods;let f=g>=35?2:g>=4?1:0;if(unlocked(p,6))f++;while(f--)task(s,'flower');if(g>=70)task(s,'bonus');else if(g>=50||g>=20&&g<35)task(s,'fruit');else compost(p,1);}
function track(s,p,pos,z){if(pos===1)task(s,'garden',{z});else if(pos===2||pos===5)task(s,'tool');else if(pos===3){compost(p,1);goods(s,p,4);}else if(pos===6)market(s,p);else task(s,'hiveOrFruit');}
export function chooseDie(s,id,z){if(s.phase!=='draft'||s.queue.length)throw Error('请先完成当前行动');const d=s.dice.find(d=>d.id===id&&!d.used);if(!d)throw Error('骰子不可用');if((isSolo(s)?s.soloTurn===2:s.picked===s.players.length)&&d.v!==Math.min(...s.dice.filter(d=>!d.used).map(d=>d.v)))throw Error(isSolo(s)?'本轮先拿第二颗骰子的一方必须选择剩余最小点数':'公共骰必须选择剩余最小点数');if(!Number.isInteger(z)||z<1||z>6)throw Error('区域应为 1～6');const p=s.players[s.active],diff=Math.min(Math.abs(z-d.v),6-Math.abs(z-d.v)),free=p.flowers[2]>=4?2:p.flowers[2]>=2?1:0,cost=Math.max(0,diff-free);if(p.compost<cost)throw Error('堆肥不足');p.compost-=cost;d.used=true;d.usedBy='player';s.zone=z;s.currentPos=d.pos;s.phase=!isSolo(s)&&s.picked===s.players.length?'common':'acting';s.commonDie=s.phase==='common'?{pos:d.pos,z,v:d.v}:null;task(s,'garden',{z});task(s,'track',{pos:d.pos,z});note(s,`${p.name}：骰子 ${d.v} → 区域 ${z}，${ACTIONS[d.pos]}`);}
function harvest(s,p){for(let i=0;i<12;i++){if(p.pumpkins[i]===PUMPKINS[i].n&&!p['harvest'+i]){p['harvest'+i]=true;goods(s,p,PUMPKINS[i].g);for(const edge of [(i+11)%12,i]){const next=(edge+1)%12;if(p.pumpkins[edge]===PUMPKINS[edge].n&&p.pumpkins[next]===PUMPKINS[next].n&&!p['edge'+edge]){p['edge'+edge]=true;task(s,'flower',{only:PUMPKINS[edge].f});}}}}}
function water(s,p,z){const j=z-1;p.corn[j]=p.corn[j].map(v=>v>0&&v<4?v+1:v);p.beans[j]=p.beans[j].map(v=>v>0&&v<2?v+1:v);PUMPKINS.forEach((a,i)=>{if(a.z===z&&p.pumpkins[i]>0&&p.pumpkins[i]<a.n)p.pumpkins[i]++;});harvest(s,p);}
function plant(s,p,z,choices){if(!Array.isArray(choices)||choices.length<1||choices.length>(unlocked(p,14)?3:2)||new Set(choices).size!==choices.length)throw Error('请选择可种植的作物');for(const c of choices){const [type,raw]=c.split(':'),i=Number(raw);if(!Number.isInteger(i)||!['corn','beans','pumpkins'].includes(type))throw Error('无效作物');if(type==='pumpkins'){if(!PUMPKINS[i]||PUMPKINS[i].z!==z||p.pumpkins[i])throw Error('南瓜不可种植');}else if(p[type][z-1][i]!==0||type==='beans'&&p.corn[z-1][i]<2)throw Error('豆子需要相邻玉米至少两格，且作物只能种一次');}for(const c of choices){const [type,i]=c.split(':');if(type==='pumpkins')p.pumpkins[Number(i)]=1;else p[type][z-1][Number(i)]=1;}harvest(s,p);}
function fruit(s,p,i){if(!FRUITS[i]||p.fruit[i]>=trackLimit(p,'fruit',i))throw Error('水果已填满');const v=++p.fruit[i];if(!FRUITS[i][2].includes(v))return;if(i===0||i===1){if(unlocked(p,1))goods(s,p,1);}if(i===1){task(s,'water');goods(s,p,p.flowers[0]>=4?3:p.flowers[0]>=2?2:0);}if(i===2&&unlocked(p,0))goods(s,p,1);if(i===3)goods(s,p,3);}
function flower(s,p,i){if(!FLOWERS[i]||p.flowers[i]>=trackLimit(p,'flowers',i))throw Error('花卉已填满');const v=++p.flowers[i];if(i===0&&v===1)task(s,'fruit');if(i===1){const f={1:0,3:2,4:3,5:1}[v];if(f!==undefined)task(s,'fruit',{only:f});if(unlocked(p,8))compost(p,1);}if(i===2&&v===1)compost(p,1);if(i===3&&[1,2,4].includes(v))goods(s,p,2);if(i===4){compost(p,[2,1,1,2,0,0][v-1]);if(unlocked(p,7))task(s,'hive');}if(i===5&&[1,3,4,5].includes(v))task(s,'tool');}
function hive(s,p,i){const max=[5,4,4,4];if(!Number.isInteger(i)||i<0||i>3||p.hive[i]>=trackLimit(p,'hive',i)||i>0&&p.hive[0]<5)throw Error('请先填满主蜂巢，或选择未完成分支');const v=++p.hive[i];if(i===0){if(v===2)task(s,'fruit');if(v===4){task(s,'fruit');task(s,'fruit');}}if(i===1&&v!==3)goods(s,p,v===1?2:4);if(i===3){if(v===2)task(s,'plant');if(v===3)for(let k=0;k<3;k++)task(s,'fruit');if(v===4){task(s,'garden');task(s,'garden');}}}
export function resolve(s,choice){if(!s.queue.length)throw Error('没有待处理行动');const p=s.players[s.active],t=s.queue[0],i=choice.i;const allowed={bonus:['flower','fruit','hive','tool'],hiveOrFruit:['hive','fruit'],garden:['plant','water'],plant:['plant'],water:['water'],flower:['flower'],fruit:['fruit'],hive:['hive'],tool:['tool'],track:['track','mulch']}[t.type];if(!allowed?.includes(choice.kind))throw Error('行动类型不符');if(t.only!==undefined&&t.only!==i)throw Error('需要使用指定奖励');if(choice.kind==='mulch'&&!unlocked(p,11))throw Error('护根土尚未完成');const z=t.z??choice.z;if(['plant','water'].includes(choice.kind)&&(!Number.isInteger(z)||z<1||z>6))throw Error('请选择区域');
// Resolve transactionally: invalid choices must never consume an action or partially change the farm.
const backup=JSON.stringify(s);try{s.queue.shift();const pending=s.queue.length;if(choice.kind==='plant')plant(s,p,z,choice.crops);if(choice.kind==='water')water(s,p,z);if(choice.kind==='fruit')fruit(s,p,i);if(choice.kind==='flower')flower(s,p,i);if(choice.kind==='hive')hive(s,p,i);if(choice.kind==='tool'){if(!TOOLS[i]||unlocked(p,i)||toolBlocked(p,i))throw Error('工具已完成或被农夫划除');p.tools[i]++;if(unlocked(p,10))goods(s,p,1);}if(choice.kind==='track')track(s,p,t.pos,t.z);if(choice.kind==='mulch')task(s,'flower');const generated=s.queue.splice(pending);if(generated.length){const batch=(s.batch??0)+1;s.batch=batch;generated.forEach(t=>t.batch=batch);s.queue.unshift(...generated);}note(s,`${p.name}：${{plant:'种植',water:'浇灌',fruit:'果园',flower:'花卉',hive:'蜂巢',tool:'工具棚',track:'行动轨',mulch:'护根土'}[choice.kind]}${i===undefined?'':` · ${choice.kind==='fruit'?FRUITS[i][0]:choice.kind==='flower'?FLOWERS[i]:choice.kind==='tool'?TOOLS[i][0]:['主蜂巢','蜂蜡','蜂蜜','培育子巢'][i]}`}`);}catch(e){Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,JSON.parse(backup));throw e;}}
export function shovel(s){if(!['acting','common','event'].includes(s.phase))throw Error('请在行动阶段使用铲子');const p=s.players[s.active];if(!unlocked(p,2)||p.compost<3)throw Error('需要已完成的铲子及 3 堆肥');p.compost-=3;task(s,'bonus');}
export function skip(s){if(s.phase==='edithActing')throw Error('必须按规则完成农夫干扰，不能放弃');if(!s.queue.length)throw Error('没有行动');s.queue.shift();note(s,`${s.players[s.active].name} 放弃一次行动`);}
function event(s){s.phase='event';const p=s.players[s.active],e=EVENTS[s.round-1];if(e==='降雨'){for(let z=1;z<=6;z++)task(s,'water',{z});if(unlocked(p,4))task(s,'water');}else if(e==='工具棚')task(s,'tool');else market(s,p);}
export function advance(s){if(s.queue.length)throw Error('请先处理完奖励');const n=s.players.length;if(isSolo(s)&&['acting','edithActing'].includes(s.phase)){s.soloTurn++;if(s.soloTurn===4){s.eventPlayer=0;event(s);}else s.phase=soloActor(s)==='player'?'draft':'edith';return;}if(s.phase==='acting'){s.picked++;s.active=(s.first+s.picked)%n;s.phase='draft';}else if(s.phase==='common'){s.eventPlayer++;if(s.eventPlayer<n){s.active=(s.first+s.eventPlayer)%n;s.phase='commonAdjust';}else{s.eventPlayer=0;s.active=s.first;event(s);}}else if(s.phase==='event'){s.eventPlayer++;if(s.eventPlayer<n){s.active=(s.first+s.eventPlayer)%n;event(s);}else if(s.round===8){s.phase='over';note(s,'八轮结束，收获结算！');}else{s.round++;s.first=(s.first+1)%n;s.active=s.first;s.picked=0;s.eventPlayer=0;s.phase='draft';roll(s);}}else throw Error('请先选择骰子');}
export function common(s,z){if(s.phase!=='commonAdjust')throw Error('当前不需调整公共骰');const p=s.players[s.active],d=s.commonDie;if(!Number.isInteger(z)||z<1||z>6)throw Error('区域应为 1～6');const diff=Math.min(Math.abs(z-d.v),6-Math.abs(z-d.v)),free=p.flowers[2]>=4?2:p.flowers[2]>=2?1:0,cost=Math.max(0,diff-free);if(p.compost<cost)throw Error('堆肥不足');p.compost-=cost;s.phase='common';task(s,'garden',{z});task(s,'track',{pos:d.pos,z});}
export function score(p){const corn=p.corn.flat().filter(v=>v===4).length,beans=p.beans.flat().filter(v=>v===2).length,harvests=p.fruit.map((v,i)=>FRUITS[i][2].filter(x=>x<=v).length);let chain=0,run=0;for(let i=0;i<24;i++){run=p.pumpkins[i%12]===PUMPKINS[i%12].n?run+1:0;chain=Math.max(chain,Math.min(12,run));}const flowers=p.flowers.reduce((a,v,i)=>a+(v===6?[Math.min(15,harvests.reduce((a,b)=>a+b,0)),7,12,10,6,4][i]:0),0),hive=(p.hive[1]>=1?2:0)+(p.hive[1]>=2?2:0)+(p.hive[1]>=4?5:0)+(p.hive[2]>=1?5:0)+(p.hive[2]>=2?5:0)+(p.hive[2]>=4?8:0)+(p.hive[3]>=1?3:0),fruit=harvests[0]*3+harvests[2]*2+(p.fruit[3]>=3?1:0)+(p.fruit[3]>=6?2:0)+(p.fruit[3]>=9?3:0),shed=TOOLS.reduce((a,t,i)=>a+(unlocked(p,i)?t[2]:0),0)+(unlocked(p,3)?[0,1,4,7,10][harvests.filter(n=>n>0).length]:0)+(unlocked(p,5)?Math.floor(beans/2):0)+(unlocked(p,13)?chain:0);const parts=[corn*3+beans,flowers,hive,fruit,shed];return{parts,total:parts.reduce((a,b)=>a+b,0)};}

export function prioritize(s,index){if(!Number.isInteger(index)||index<1||!s.queue[index]||s.queue[0].batch===undefined||s.queue[index].batch!==s.queue[0].batch)throw Error('只能交换同一批奖励的顺序');s.queue.unshift(s.queue.splice(index,1)[0]);}

// Earlier saves could already have harvested D after two marks. Preserve those
// completed harvests and their rewards; unharvested crops use the corrected cost.
export function correctLegacyPumpkins(s){
  let changed=false;
  for(const p of s.players){
    if(p.pumpkins?.[3]===2&&p.harvest3===true){p.pumpkins[3]=3;changed=true;}
  }
  return changed;
}

export function isSolo(s){return s.mode==='solo';}
export function soloActor(s){return (s.soloTurn+s.round)%2===1?'player':'edith';}
export function toolBlocked(p,i){return p.blocked?.tools?.includes(i)??false;}
export function trackLimit(p,kind,i){
  const full=kind==='flowers'?6:kind==='fruit'?FRUITS[i][1]:[5,4,4,4][i];
  return full-(p.blocked?.[kind]?.[i]??0);
}
export function soloRating(points){
  return points>=100?'成立自己的电视频道！':points>=80?'成为知名网红！':points>=65?'加冕为洲际冠军！':points>=50?'赢得蓝丝带！':points>=40?'准备好参加县市农夫市集！':'下次你的运气会更好！';
}
function blocks(p){
  return p.blocked??=( {flowers:Array(6).fill(0),fruit:Array(4).fill(0),hive:Array(4).fill(0),tools:[],goods:[]} );
}
function edithNote(s,text){s.edithReport.push(text);note(s,`农夫伊迪丝：${text}`);}
export function edithDie(s){
  const available=s.dice.filter(d=>!d.used);
  if(!available.length)return null;
  if(s.soloTurn>=2)return available.slice().sort((a,b)=>a.v-b.v||a.id-b.id)[0];
  // The gold pin is fixed at position 0, not the moving round-planning pawn.
  return available.slice().sort((a,b)=>a.pos-b.pos||a.v-b.v||a.id-b.id)[0];
}
function blockTop(s,kind,i,name){
  const p=s.players[0],b=blocks(p),limit=trackLimit(p,kind,i);
  if(p[kind][i]>=limit){edithNote(s,`${name}没有空格，略过。`);return;}
  b[kind][i]++;edithNote(s,`划除${name}的第 ${limit} 格；不会得到这格的奖励或分数。`);
}
function edithGarden(s,z){
  const p=s.players[0];
  const pumpkin=PUMPKINS.map((a,i)=>({...a,i})).filter(a=>a.z===z&&p.pumpkins[a.i]===0).sort((a,b)=>b.n-a.n||a.i-b.i)[0];
  if(pumpkin){p.pumpkins[pumpkin.i]=-1;edithNote(s,`第 ${z} 区：划除最高的未种植南瓜 ${String.fromCharCode(65+pumpkin.i)}（${pumpkin.n} 格）。`);return;}
  for(const kind of ['corn','beans']){
    const indices=p[kind][z-1].flatMap((v,i)=>v===0?[i]:[]);
    if(indices.length){
      s.queue.unshift({type:'edithCrop',kind,z,indices});return;
    }
  }
  edithNote(s,`第 ${z} 区没有未种植作物，略过。`);
}
function edithTrack(s,pos,v){
  const p=s.players[0],b=blocks(p);
  if(pos===1){s.queue.unshift({type:'edithGarden',z:v});return;}
  if(pos===2||pos===5){
    const i=(pos===2?0:6)+v-1;
    if(unlocked(p,i)||toolBlocked(p,i)){edithNote(s,`${TOOLS[i][0]}已完成或已划除，略过。`);return;}
    b.tools.push(i);edithNote(s,`工具棚 ${pos===2?'A（剪刀）':'B（割草机）'}：划除${TOOLS[i][0]}，即使已有部分进度也不能继续使用。`);return;
  }
  if(pos===3){
    let next=5*(Math.floor(p.goods/5)+1);
    while(b.goods.includes(next))next+=5;
    if(next<=120){b.goods.push(next);edithNote(s,`划除货物轨第 ${next} 格的奖励星；填到这里时跳过此格。`);}
    else edithNote(s,'货物轨没有可划除的奖励星，略过。');
    return;
  }
  if(pos===0){const i=v<=2?2:v<=4?1:3;blockTop(s,'hive',i,['主蜂巢','蜂蜡','蜂蜜','培育子巢'][i]);return;}
  if(pos===4){const i=v<=2?0:v===3?1:v<=5?2:3;blockTop(s,'fruit',i,FRUITS[i][0]);return;}
  blockTop(s,'flowers',v-1,FLOWERS[v-1]);
}
function processEdith(s){
  while(s.queue.length&&s.queue[0].type!=='edithCrop'){
    const t=s.queue.shift();
    if(t.type==='edithGarden')edithGarden(s,t.z);
    else if(t.type==='edithTrack')edithTrack(s,t.pos,t.v);
    else throw Error('无效农夫行动');
  }
}
export function takeEdithDie(s){
  if(!isSolo(s)||s.phase!=='edith'||s.queue.length)throw Error('现在不是农夫的选骰阶段');
  const d=edithDie(s);if(!d)throw Error('没有可用骰子');
  d.used=true;d.usedBy='edith';s.edithReport=[];s.phase='edithActing';
  edithNote(s,`拿取 ${d.v} 点骰子，行动轨：${ACTIONS[d.pos]}。先处理园子，再处理行动轨。`);
  s.queue=[{type:'edithGarden',z:d.v},{type:'edithTrack',pos:d.pos,v:d.v}];
  processEdith(s);
}
export function chooseEdithCrop(s,index){
  const t=s.queue[0];
  if(!isSolo(s)||s.phase!=='edithActing'||t?.type!=='edithCrop'||!t.indices.includes(index))throw Error('请选择规则允许划除的作物');
  const p=s.players[0];if(p[t.kind][t.z-1][index]!==0)throw Error('不能划除已种植或已划除的作物');
  p[t.kind][t.z-1][index]=-1;s.queue.shift();
  edithNote(s,`第 ${t.z} 区：由你选择划除${t.kind==='corn'?'玉米':'豆子'} ${index+1}。`);
  processEdith(s);
}
