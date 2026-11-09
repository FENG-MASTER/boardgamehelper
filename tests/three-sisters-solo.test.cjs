const {test}=require('node:test');
const assert=require('node:assert/strict');
const engine=import('../games/three-sisters/engine.mjs');
async function single(pos=0,v=1,protect=false){
 const E=await engine,s=E.createGame(1),p=s.players[0];
 s.soloTurn=1;s.phase='edith';s.dice=[{id:0,pos,v,used:false}];
 if(protect){p.pumpkins.fill(1);p.corn.forEach(r=>r.fill(1));p.beans.forEach(r=>r.fill(1));}
 return {E,s,p};
}
function drain(E,s){while(s.queue.length){const t=s.queue[0];if(t.type==='edithCrop')E.chooseEdithCrop(s,t.indices[0]);else E.skip(s);}}
test('正式单人：四骰、奇偶轮 ABAB、第三次拿最小、无公共骰，八轮各拿16颗',async()=>{
 const E=await engine,s=E.createGame(1),turns=[],events=[];let steps=0;
 while(s.phase!=='over'&&steps++<2000){
  if(s.phase==='draft'){
   assert.equal(s.dice.length,4);turns.push([s.round,s.soloTurn,'player']);
   const dice=s.dice.filter(d=>!d.used).sort((a,b)=>a.v-b.v);
   if(s.soloTurn===2&&dice.at(-1).v!==dice[0].v)assert.throws(()=>E.chooseDie(s,dice.at(-1).id,dice.at(-1).v));
   const d=s.soloTurn===2?dice[0]:dice.at(-1);E.chooseDie(s,d.id,d.v);
   assert.equal(s.phase,'acting');
  }else if(s.phase==='edith'){turns.push([s.round,s.soloTurn,'edith']);E.takeEdithDie(s);}
  else if(s.queue.length)drain(E,s);
  else{if(s.phase==='event')events.push(s.round);E.advance(s);}
 }
 assert.equal(s.phase,'over');assert.equal(turns.length,32);
 assert.deepEqual(events,[1,2,3,4,5,6,7,8]);
 for(let r=1;r<=8;r++)assert.deepEqual(turns.filter(t=>t[0]===r).map(t=>t[2]),r%2?['player','edith','player','edith']:['edith','player','edith','player']);
 assert.equal(turns.filter(t=>t[2]==='edith').length,16);
});
test('农夫首次从固定金钉起顺时针拿骰，第二颗按最小值，不跟随移动标记',async()=>{
 const {E,s}=await single();s.edith=4;
 s.dice=[{id:0,v:6,pos:0,used:false},{id:1,v:1,pos:4,used:false}];
 assert.equal(E.edithDie(s).id,0);s.dice[0].used=true;assert.equal(E.edithDie(s).id,1);
 s.dice=[{id:0,v:6,pos:6,used:false},{id:1,v:3,pos:1,used:false},{id:2,v:1,pos:5,used:false}];
 assert.equal(E.edithDie(s).id,1);s.soloTurn=2;assert.equal(E.edithDie(s).id,2);
});
test('园子优先划掉最高未种南瓜，种植轨追加一次；已种作物受保护',async()=>{
 const {E,s,p}=await single(1,1);p.pumpkins[10]=1;
 E.takeEdithDie(s);
 assert.equal(p.pumpkins[10],1);assert.equal(p.pumpkins[11],-1);assert.equal(p.pumpkins[0],-1);
 assert.equal(p.goods,0);assert.equal(s.queue.length,0);
});
test('没有未种南瓜时由玩家选择玉米，然后豆子；不能跳过或划已种作物',async()=>{
 const {E,s,p}=await single(1,2);p.pumpkins[1]=1;p.corn[1]=[1,0,1,0,1];
 E.takeEdithDie(s);assert.deepEqual(s.queue[0].indices,[1,3]);
 assert.throws(()=>E.skip(s));assert.throws(()=>E.chooseEdithCrop(s,0));
 E.chooseEdithCrop(s,3);assert.equal(p.corn[1][3],-1);assert.deepEqual(s.queue[0].indices,[1]);
 E.chooseEdithCrop(s,1);assert.equal(s.queue.length,0);assert.equal(p.corn[1][0],1);
 s.phase='edith';s.dice[0].used=false;E.takeEdithDie(s);
 assert.equal(s.queue[0].kind,'beans');E.chooseEdithCrop(s,2);assert.equal(p.beans[1][2],-1);
});
test('划除作物不能种植、浇灌、得分，也会断开南瓜链',async()=>{
 const {E,s,p}=await single(0,1);E.takeEdithDie(s);assert.equal(p.pumpkins[10],-1);
 s.phase='acting';s.queue=[{type:'plant',z:1}];assert.throws(()=>E.resolve(s,{kind:'plant',crops:['pumpkins:10']}));
 p.corn[0][0]=-1;p.beans[0][0]=-1;s.queue=[{type:'water',z:1}];E.resolve(s,{kind:'water'});
 assert.equal(p.corn[0][0],-1);assert.equal(p.beans[0][0],-1);assert.equal(E.score(p).parts[0],0);
 p.tools[13]=3;p.pumpkins[9]=3;p.pumpkins[11]=3;assert.equal(E.score(p).parts[4],1);
});
test('工具棚 A/B 的12个骰值映射正确，已完成工具受保护，部分进度仍可划除',async()=>{
 for(const pos of [2,5])for(let v=1;v<=6;v++){
  const {E,s,p}=await single(pos,v,true),index=(pos===2?0:6)+v-1;
  E.takeEdithDie(s);assert.deepEqual(p.blocked.tools,[index]);
  s.phase='acting';s.queue=[{type:'tool'}];assert.throws(()=>E.resolve(s,{kind:'tool',i:index}));
 }
 const {E,s,p}=await single(2,2,true);p.tools[1]=2;E.takeEdithDie(s);assert.deepEqual(p.blocked.tools,[]);assert.ok(E.unlocked(p,1));
 s.phase='edith';s.dice[0].used=false;p.tools[1]=1;E.takeEdithDie(s);assert.ok(E.toolBlocked(p,1));assert.equal(E.score(p).parts[4],0);
});
test('金钉决定蜂巢或水果；顶端/最右空格反复划除，不影响已经获得的分数',async()=>{
 for(let v=1;v<=6;v++){
  const {E,s,p}=await single(0,v,true);E.takeEdithDie(s);
  assert.equal(p.blocked.hive[v<=2?2:v<=4?1:3],1);
  const other=await single(4,v,true);other.E.takeEdithDie(other.s);
  assert.equal(other.p.blocked.fruit[v<=2?0:v===3?1:v<=5?2:3],1);
 }
 const {E,s,p}=await single(4,1,true);p.fruit[0]=7;const before=E.score(p).parts[3];E.takeEdithDie(s);
 assert.equal(E.trackLimit(p,'fruit',0),7);assert.equal(E.score(p).parts[3],before);
 s.phase='acting';s.queue=[{type:'fruit'}];assert.throws(()=>E.resolve(s,{kind:'fruit',i:0}));
 s.phase='edith';s.queue=[];s.dice[0].used=false;E.takeEdithDie(s);assert.equal(p.blocked.fruit[0],1);
});
test('蜂巢尚未解锁也能受干扰，顶端奖励失去但较低奖励仍可获得',async()=>{
 const {E,s,p}=await single(0,1,true);E.takeEdithDie(s);assert.equal(E.trackLimit(p,'hive',2),3);
 p.hive[0]=5;s.phase='acting';
 for(let n=0;n<3;n++){s.queue=[{type:'hive'}];E.resolve(s,{kind:'hive',i:2});}
 assert.equal(E.score(p).parts[2],10);s.queue=[{type:'hive'}];assert.throws(()=>E.resolve(s,{kind:'hive',i:2}));
});
test('市集按1～6划除指定花卉顶端，失去完成分，已完成不被删',async()=>{
 for(let v=1;v<=6;v++){
  const {E,s,p}=await single(6,v,true);p.flowers[v-1]=5;E.takeEdithDie(s);
  assert.equal(E.trackLimit(p,'flowers',v-1),5);assert.equal(E.score(p).parts[1],0);
  s.phase='acting';s.queue=[{type:'flower'}];assert.throws(()=>E.resolve(s,{kind:'flower',i:v-1}));
 }
 const {E,s,p}=await single(6,2,true);p.flowers[1]=6;E.takeEdithDie(s);assert.equal(p.blocked.flowers[1],0);assert.equal(E.score(p).parts[1],7);
});
test('货物划除下一颗未用奖励星，填涂跳过被划格；重复干扰找下一个',async()=>{
 const {E,s,p}=await single(3,1,true);p.goods=4;E.takeEdithDie(s);
 s.phase='edith';s.dice[0].used=false;E.takeEdithDie(s);assert.deepEqual(p.blocked.goods,[5,10]);
 s.phase='acting';s.queue=[{type:'fruit'}];E.resolve(s,{kind:'fruit',i:3});
 assert.equal(p.goods,8);assert.equal(s.queue.length,0);
 s.queue=[{type:'fruit'}];E.resolve(s,{kind:'fruit',i:3});assert.equal(p.goods,12);assert.equal(s.queue.length,0);
 s.queue=[{type:'fruit'}];E.resolve(s,{kind:'fruit',i:3});assert.equal(p.goods,15);assert.equal(s.queue[0].type,'bonus');
});
test('单人存档保存未决牺牲选择，旧版练习不被强制转换；结算六档边界',async()=>{
 const {E,s,p}=await single(0,2);p.pumpkins[1]=1;E.takeEdithDie(s);
 const saved=JSON.parse(JSON.stringify(s));assert.equal(E.isSolo(saved),true);assert.equal(saved.queue[0].type,'edithCrop');
 E.chooseEdithCrop(saved,0);assert.equal(saved.players[0].corn[1][0],-1);assert.equal(p.corn[1][0],0);
 const practice=E.createGame(1,{mode:'practice'});assert.equal(E.isSolo(practice),false);assert.equal(practice.dice.length,3);delete practice.mode;assert.equal(E.isSolo(practice),false);
 const ratings=[0,39,40,49,50,64,65,79,80,99,100].map(E.soloRating);
 assert.equal(ratings[0],ratings[1]);assert.equal(ratings[2],ratings[3]);assert.equal(new Set(ratings).size,6);
});
