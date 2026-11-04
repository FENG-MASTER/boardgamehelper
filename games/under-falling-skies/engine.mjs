// Coordinates: sky rows 0..15 north to south; mother starts at -1.
export const CITIES = {
 roswell:{name:'罗斯维尔',top:'a',bottom:'b',energy:2,capacity:7,hull:7,excavated:10,startCost:0,description:'入门推荐；无特殊能力，研究轨道最短，基地没有机器人工厂。'},
 'new-york':{name:'纽约',top:'c',bottom:'a',energy:2,capacity:8,hull:6,excavated:9,startCost:2,description:'最多一个机器人；有机器人参与的设施数值 +1。研究起点额外需要 2 点。'},
 washington:{name:'华盛顿',top:'b',bottom:'c',energy:3,capacity:9,hull:6,excavated:9,startCost:6,description:'每轮首次掷骰，一颗白骰固定为 6。研究起点额外需要 6 点。'}
};
// e=energy, f=fighters, r=research, b=robots, t=tunnel, a=anti-air.
const TOP={
 a:[['f',1,-1],['r',2,0],['t',0,0],['e',0,-3,2],null, ['e',0,0],['f',2,0,2],null,['r',1,-1],['t',0,0]],
 b:[['f',2,0],['e',0,-1],['f',0,-2],['f',1,-1],['t',0,0], ['r',1,0],['b',2,0],['t',0,0],['e',0,-1],['r',2,1]],
 c:[['b',1,-1],['f',3,0],['e',0,0,2],null,['t',0,0], ['t',0,0],['b',0,-1],['r',2,1],['r',1,0],['e',0,-1]]
};
const BOTTOM={
 a:[['f',0,-1],['t',0,0],['r',1,0],['f',1,0,2],null, ['e',0,0],['r',1,1],['f',2,1],['t',0,0],['b',2,0], ['r',4,3,2],null,['e',0,1],['t',0,0],['t',0,0]],
 b:[['r',0,-1],['t',0,0],['r',2,0,2],null,['f',2,0], ['f',2,1],['e',0,1],['f',1,0],['t',0,0],['r',1,0], ['t',0,0],['r',2,0,3],null,null,['t',0,0]],
 c:[['r',4,0,3],null,null,['t',0,0],['f',0,-1], ['e',0,1],['t',0,0],['b',0,0],['f',2,2],['b',1,0], ['t',0,0],['f',1,3],['r',0,0,2],null,['t',0,0]]
};
export const NAMES={a:'防空塔',t:'隧道',e:'充能室',f:'战斗机库',r:'研究中心',b:'机器人工厂'};
export const pathIndex=(row,col)=>row*5+(row%2===0?4-col:col);
export function rooms(city){
 const c=CITIES[city], result=[];
 for(let col=0;col<5;col++)result.push({id:`0-${col}`,row:0,col,span:1,type:'a',cost:0,mod:0});
 [TOP[c.top],BOTTOM[c.bottom]].forEach((list,part)=>list.forEach((v,i)=>{if(v)result.push({id:`${Math.floor(i/5)+(part?3:1)}-${i%5}`,row:Math.floor(i/5)+(part?3:1),col:i%5,type:v[0],cost:v[1],mod:v[2],span:v[3]||1});}));
 return result.map(r=>({...r,cells:Array.from({length:r.span},(_,i)=>({row:r.row,col:r.col+i,key:`${r.row}-${r.col+i}`,path:pathIndex(r.row,r.col+i)}))}));
}
// Each entry is a cell: numbers are explosion strength, < > shift, M lowers mothership.
export const SKY=[
 ['.','.','.','>','.'],['.','<','>','.','.'],['M','.',1,'.','.'],[2,'.','<','.',4],
 ['M','>','.',4,'.'],['.','M','.','.','.'],[4,3,'.','<',2],['>','.',6,'.','<'],
 ['.','.',4,'>','.'],[5,'.','<','.','.'],['.','M','>','.',6],['M',3,'.',4,'M'],
 [3,'>','.','M','.'],['.',6,'.','<',4],['>','.',3,'.','<'],['.',5,'M',4,'.']
];
export const MOTHER=['white1','excavate2','white1',null,'white1','excavate1','research1',null,'research1','white1',null,'lose',null,null,null,null];
export const BASE_RESEARCH=[3,1,3,1,4,1,3,2,1,6,1,3,5,1,3,11];
// Hard faces, north to south. Values transcribed from the newly supplied original images.
export const HARD_SKY=[
 ['.',1,'.','.','.'],['.','.','<','>','.'],['>','.','.','.',2],['.','<',3,'M','.'],
 ['>','.',2,'.','<'],['M','M','.','<',3],[4,'>','.',5,'.'],['.','<','>','.','M'],
 [6,'.','<','.','M'],['M',4,7,'>','.'],['.','>','.','M',7],['.','.','M',4,'.'],
 ['M',5,'M','.','<'],['.','.',4,'M',5],[4,'M','.',6,'M'],['M',7,'M','M','.']
];
export const HARD_MOTHER=['excavate1','white2','excavate2','damage1','excavate3','research2','white2','research1','damage1',null,'lose',null,null,null,null,null];
export const HARD_RESEARCH=[3,2,1,5,3,1,3,7,2,3,4,2,3,5,1,12];
export const skyRows=s=>SKY.map((row,i)=>(s.hardTiles||[]).includes(Math.floor(i/4))?HARD_SKY[i]:row);
export const motherEvents=s=>MOTHER.map((event,i)=>(s.hardTiles||[]).includes(Math.floor(i/4))?HARD_MOTHER[i]:event);
export const failureRow=s=>motherEvents(s).indexOf('lose');
export const researchTrack=s=>{
 const costs=BASE_RESEARCH.map((value,i)=>(s.hardTiles||[]).includes(Math.floor((15-i)/4))?HARD_RESEARCH[i]:value);
 return CITIES[s.city].startCost?[CITIES[s.city].startCost,...costs]:costs;
};
const copy=s=>structuredClone(s);
function log(s,m){s.log.push(m);s.log=s.log.slice(-100);}
function check(s){if(s.damage>=CITIES[s.city].hull||s.mother>=failureRow(s)){s.phase='over';s.outcome='lost';log(s,s.damage>=CITIES[s.city].hull?'城市被摧毁。':'母舰抵达骷髅线。');}else if(s.research>=researchTrack(s).length){s.phase='over';s.outcome='won';log(s,'研究完成，城市获救！');}}
function random(s){let t=s.seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);s.seed>>>=0;return ((t^t>>>14)>>>0)/4294967296;}
function roll(s){return 1+Math.floor(random(s)*6);}
function startRound(s){s.round++;s.phase='place';s.usedColumns=[];s.digUsed=false;s.dice=Array.from({length:5},(_,id)=>({id,color:id<3?'gray':'white',value:roll(s),cell:null,done:false}));if(s.city==='washington')s.dice[3].value=6;s.robots.forEach(r=>r.exhausted=false);log(s,`第 ${s.round} 轮：放置骰子。`);}
export function newGame(city='roswell',seed=Date.now(),difficulty=0){
 if(!CITIES[city])throw Error('未知城市');
 if(!Number.isInteger(difficulty)||difficulty<0||difficulty>4)throw Error('威胁等级必须为 0～4');
 const s={version:1,city,difficulty,hardTiles:[],seed:seed>>>0,round:0,phase:'place',energy:CITIES[city].energy,damage:0,research:0,excavated:CITIES[city].excavated,mother:-1,ships:Array.from({length:5},(_,i)=>({id:i,color:'purple',col:i,row:-1})),nextShip:5,robots:[],dice:[],usedColumns:[],log:[],pending:null};
 const pool=[0,1,2,3];
 for(let i=0;i<difficulty;i++){const index=Math.floor(random(s)*pool.length);s.hardTiles.push(pool.splice(index,1)[0]);}
 s.hardTiles.sort((a,b)=>a-b);
 if(difficulty)log(s,`威胁 ${difficulty}：第 ${s.hardTiles.map(i=>i+1).join('、')} 块天空板使用高难度面。`);
 startRound(s);return s;
}
export function roomAt(s,key){return rooms(s.city).find(r=>r.cells.some(c=>c.key===key));}
function validCell(key){return typeof key==='string'&&/^[0-5]-[0-4]$/.test(key);}
export function placementError(s,id,key){
 if(s.phase!=='place')return '现在不是放骰阶段';
 const die=s.dice.find(d=>d.id===id&&!d.cell);if(!die)return '请先选择未放置的骰子';
 if(!validCell(key))return '无效位置';
 const [row,col]=key.split('-').map(Number),p=pathIndex(row,col);
 if(s.usedColumns.includes(col))return '每列只能放一颗工人骰';
 if(s.dice.some(d=>d.cell===key))return '该位置已被占用';
 if(p>s.excavated){if(s.dice.some(d=>d.dig))return '每轮只能安排一次挖掘';if(p-s.excavated>die.value)return '骰子点数不足以挖到这里';}
 return '';
}
function lowerMother(s){s.mother++;s.ships.forEach(ship=>{if(ship.row!==null&&ship.row<=s.mother)ship.row=null;});check(s);}
function moveShips(s,col,distance){
 if(distance<=0)return;
 const moving=s.ships.filter(x=>x.row!==null&&x.col===col).sort((a,b)=>a.row-b.row);
 for(const ship of moving){ship.row+=distance;if(ship.row>=16){ship.row=null;s.damage++;log(s,'敌舰撞击城市：损伤 +1。');check(s);if(s.phase==='over')return;}}
 for(const ship of moving){if(ship.row===null)continue;const effect=skyRows(s)[ship.row]?.[ship.col];
  if(effect==='<'||effect==='>'){const next=ship.col+(effect==='>'?1:-1);if(!s.ships.some(x=>x.id!==ship.id&&x.row===ship.row&&x.col===next)){ship.col=next;log(s,`敌舰横移至第 ${next+1} 列。`);}}
  else if(effect==='M'){log(s,'敌舰触发母舰下降。');lowerMother(s);if(s.phase==='over')return;}
 }
}
export function availableRooms(s){return rooms(s.city).filter(r=>r.cells.every(c=>c.path<=s.excavated)&&r.cells.every(c=>occupant(s,c.key)));}
export function occupant(s,key){return s.dice.find(d=>d.cell===key&&!d.done&&!d.dig)||s.robots.find(r=>r.cell===key&&!r.exhausted);}
export function roomValue(s,r){return Math.max(0,r.cells.reduce((n,c)=>n+(occupant(s,c.key)?.value||0),0)+r.mod+(s.city==='new-york'&&r.cells.some(c=>s.robots.some(b=>b.cell===c.key&&!b.exhausted))?1:0));}
export function installCells(s){return rooms(s.city).flatMap(r=>r.cells).filter(c=>c.path<=s.excavated&&!s.dice.some(d=>d.cell===c.key&&!d.done)&&!s.robots.some(b=>b.cell===c.key)).map(c=>c.key);}
function consumeRoom(s,r){for(const c of r.cells){const d=s.dice.find(d=>d.cell===c.key&&!d.done);if(d)d.done=true;const b=s.robots.find(b=>b.cell===c.key&&!b.exhausted);if(b){b.value--;b.exhausted=true;}}s.robots=s.robots.filter(b=>b.value>0);}
function spawnOptions(s){
 const empty=Array.from({length:5},(_,i)=>i).filter(col=>!s.ships.some(x=>x.row!==null&&x.col===col));if(empty.length)return empty;
 const gaps=Array.from({length:5},(_,col)=>Math.min(...s.ships.filter(x=>x.row!==null&&x.col===col).map(x=>x.row))-s.mother);
 const max=Math.max(...gaps);return max>0?gaps.flatMap((v,i)=>v===max?[i]:[]):[];
}
function nextSpawn(s){
 while(s.pending?.queue.length){const options=spawnOptions(s);if(!options.length){s.pending=null;startRound(s);return;}
  if(options.length>1){s.pending.options=options;return;}
  const id=s.pending.queue.shift(),ship=s.ships.find(x=>x.id===id);ship.row=s.mother;ship.col=options[0];
 }
 s.pending=null;startRound(s);
}
export function act(state,action){
 const s=copy(state),a=action;
 if(s.phase==='over')throw Error('本局已经结束');
 if(a.type==='removeRobot'){
  if(!s.robots.some(b=>b.id===a.id))throw Error('机器人不存在');s.robots=s.robots.filter(b=>b.id!==a.id);log(s,'移除了一个机器人。');return s;
 }
 if(s.pending){
  if(s.pending.type==='robot'){
   if(a.type==='cancelRobot'){s.pending=null;return s;}
   if(a.type!=='install'||!installCells(s).includes(a.cell))throw Error('请选择已挖掘的空位置');
   if(s.robots.length>=(s.city==='new-york'?1:2))throw Error('机器人已达上限，请先移除一个');
   s.robots.push({id:s.nextShip++,cell:a.cell,value:s.pending.value,exhausted:true});log(s,`安装 ${s.pending.value} 点机器人，本轮耗尽。`);s.pending=null;return s;
  }
  if(a.type!=='spawn'||!s.pending.options.includes(a.col))throw Error('请选择一个合法降落列');
  const shipId=s.pending.queue.shift(),ship=s.ships.find(x=>x.id===shipId);ship.row=s.mother;ship.col=a.col;log(s,`敌舰生成于第 ${a.col+1} 列。`);nextSpawn(s);return s;
 }
 if(a.type==='place'){
  const error=placementError(s,a.id,a.cell);if(error)throw Error(error);
  const d=s.dice.find(d=>d.id===a.id),[row,col]=a.cell.split('-').map(Number);
  s.robots=s.robots.filter(b=>b.cell!==a.cell);d.cell=a.cell;d.dig=pathIndex(row,col)>s.excavated;s.usedColumns.push(col);
  log(s,`${d.color==='white'?'白':'灰'}骰 ${d.value} → 第 ${col+1} 列${d.dig?'（挖掘）':''}。`);
  moveShips(s,col,Math.max(0,d.value-(row===0?1:0)));if(s.phase==='over')return s;
  if(d.color==='white'){s.dice.filter(x=>!x.cell).forEach(x=>x.value=roll(s));log(s,'白骰已放置：所有未放骰子重掷。');}
  if(s.usedColumns.length===5){s.phase='resolve';log(s,'基地阶段：可以自行选择设施结算顺序。');}return s;
 }
 if(s.phase==='resolve'){
  if(a.type==='dig'){
   const d=s.dice.find(d=>d.dig&&!d.done);if(!d)throw Error('没有待挖掘的骰子');if(s.energy<1)throw Error('挖掘需要 1 点能源');
   const [r,c]=d.cell.split('-').map(Number);s.excavated=pathIndex(r,c);s.energy--;d.done=true;log(s,'消耗 1 能源，完成挖掘。');return s;
  }
  if(a.type==='resolve'){
   const r=availableRooms(s).find(r=>r.id===a.id);if(!r)throw Error('设施必须每格都有可用骰子');
   if(s.energy<r.cost)throw Error('能源不足');const value=roomValue(s,r);s.energy-=r.cost;consumeRoom(s,r);
   log(s,`${NAMES[r.type]}：数值 ${value}，消耗 ${r.cost} 能源。`);
   if(r.type==='e')s.energy=Math.min(CITIES[s.city].capacity,s.energy+value);
   if(r.type==='r'){let remaining=value;const track=researchTrack(s);while(s.research<track.length&&remaining>=track[s.research]){remaining-=track[s.research++];}log(s,`研究进度 ${s.research}/${track.length}；剩余研究点不保留。`);check(s);}
   if(r.type==='f'){let hits=0;s.ships=s.ships.filter(ship=>{const n=ship.row===null?null:skyRows(s)[ship.row]?.[ship.col];if(typeof n==='number'&&n<=value){hits++;if(ship.color==='white')return false;ship.row=null;}return true;});log(s,`击落 ${hits} 艘敌舰。`);}
   if(r.type==='b'&&value>0)s.pending={type:'robot',value:Math.min(6,value)};
   return s;
  }
  if(a.type==='endBase'){
   s.dice.forEach(d=>d.done=true);s.phase='mother';log(s,'基地阶段结束，未使用的行动已放弃。');return s;
  }
 }
 if(s.phase==='mother'&&a.type==='mother'){
  lowerMother(s);if(s.phase==='over')return s;const effect=motherEvents(s)[s.mother];log(s,`母舰下降至第 ${s.mother+1} 行。`);
  if(effect?.startsWith('excavate')){s.excavated=Math.max(CITIES[s.city].excavated,s.excavated-Number(effect.slice(8)));s.robots=s.robots.filter(b=>{const [r,c]=b.cell.split('-').map(Number);return pathIndex(r,c)<=s.excavated;});log(s,'钻探机后退，失去未挖掘区域的机器人。');}
  if(effect?.startsWith('research')){const n=Number(effect.slice(8));s.research=Math.max(0,s.research-n);log(s,`研究后退 ${n} 格。`);}
  if(effect==='damage1'){s.damage++;log(s,'母舰攻击：城市损伤 +1。');check(s);if(s.phase==='over')return s;}
  if(effect?.startsWith('white')){const count=Math.min(Number(effect.slice(5)),4-s.ships.filter(x=>x.color==='white').length);for(let i=0;i<count;i++)s.ships.push({id:s.nextShip++,color:'white',row:null,col:0});log(s,`增加 ${count} 艘白色敌舰。`);}
  const queue=s.ships.filter(x=>x.row===null).sort((a,b)=>(a.color==='purple'?0:1)-(b.color==='purple'?0:1)).map(x=>x.id);
  s.phase='spawn';s.pending={type:'spawn',queue,options:[]};nextSpawn(s);return s;
 }
 throw Error('当前阶段不能执行此行动');
}
export function validateSave(s){
 if(!s||s.version!==1||!CITIES[s.city]||!['place','resolve','mother','spawn','over'].includes(s.phase)||!Array.isArray(s.dice)||s.dice.length!==5||!Array.isArray(s.ships)||!Array.isArray(s.robots)||!Array.isArray(s.log)||!Array.isArray(s.usedColumns))throw Error('存档格式不正确');
 const difficulty=s.difficulty??0,hardTiles=s.hardTiles??[];
 if(!Number.isInteger(difficulty)||difficulty<0||difficulty>4||!Array.isArray(hardTiles)||hardTiles.length!==difficulty||hardTiles.some(i=>!Number.isInteger(i)||i<0||i>3)||new Set(hardTiles).size!==hardTiles.length)throw Error('存档难度配置无效');
 for(const k of ['seed','round','energy','damage','research','excavated','mother','nextShip'])if(!Number.isInteger(s[k]))throw Error('存档数据不完整');
 if(s.energy<0||s.energy>CITIES[s.city].capacity||s.research<0||s.research>researchTrack(s).length||s.excavated<0||s.excavated>29||s.mother< -1||s.mother>15)throw Error('存档数值越界');
 for(const d of s.dice)if(!Number.isInteger(d.value)||d.value<1||d.value>6||(d.cell&&!validCell(d.cell)))throw Error('存档骰子无效');
 for(const b of s.robots)if(!validCell(b.cell)||!Number.isInteger(b.value)||b.value<1||b.value>6)throw Error('存档机器人无效');
 for(const x of s.ships)if(!Number.isInteger(x.col)||x.col<0||x.col>4||(x.row!==null&&(!Number.isInteger(x.row)||x.row< -1||x.row>15)))throw Error('存档敌舰无效');
 if(s.round<1||s.seed<0||s.seed>4294967295||s.damage<0||s.damage>CITIES[s.city].hull||s.log.length>100||s.log.some(x=>typeof x!=='string'||x.length>1000))throw Error('存档记录无效');
 if(s.dice.some(d=>!Number.isInteger(d.id)||d.id<0||d.id>4||!['gray','white'].includes(d.color))||new Set(s.dice.map(d=>d.id)).size!==5)throw Error('存档骰子身份无效');
 if(s.ships.length>9||s.ships.some(x=>!Number.isInteger(x.id)||!['purple','white'].includes(x.color))||new Set(s.ships.map(x=>x.id)).size!==s.ships.length)throw Error('存档敌舰身份无效');
 if(s.robots.length>(s.city==='new-york'?1:2)||s.robots.some(b=>!Number.isInteger(b.id)||typeof b.exhausted!=='boolean'))throw Error('存档机器人身份无效');
 if(s.usedColumns.some(c=>!Number.isInteger(c)||c<0||c>4)||new Set(s.usedColumns).size!==s.usedColumns.length)throw Error('存档列状态无效');
 if(s.pending){
  if(s.pending.type==='robot'){if(!Number.isInteger(s.pending.value)||s.pending.value<1||s.pending.value>6||s.phase!=='resolve')throw Error('存档安装状态无效');}
  else if(s.pending.type==='spawn'){if(s.phase!=='spawn'||!Array.isArray(s.pending.queue)||!s.pending.queue.length||s.pending.queue.some(id=>!s.ships.some(x=>x.id===id&&x.row===null))||!Array.isArray(s.pending.options)||!s.pending.options.length||s.pending.options.some(c=>!Number.isInteger(c)||c<0||c>4))throw Error('存档生成状态无效');}
  else throw Error('存档待办无效');
 }
 if(s.phase==='spawn'&&!s.pending)throw Error('存档缺少生成选择');
 return copy(s);
}
