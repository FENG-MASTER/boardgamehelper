const {test}=require('node:test');
const assert=require('node:assert/strict');
const catalog=require('../games/great-western-trail-new-zealand/catalog.json');
const modules=Promise.all(['engine','interaction-options','sarah-runtime','sarah-map'].map(n=>import('../games/great-western-trail-new-zealand/'+n+'.mjs')));
test('买羊自动匹配保留工人与费用取舍，并排除超预算和失效卡牌',async()=>{
 const [e,o]=await modules,s=e.createGame(catalog,{automation:true},()=>.37),p=s.players[0];
 const {cardInfo}=await import('../games/great-western-trail-new-zealand/data.mjs');
 const def=catalog.groups.sheep.find(id=>cardInfo(catalog.cards[id]).color==='orange');
 s.sheepMarket=[{uid:'orange',def}];s.ruleTasks=[{kind:'market',remaining:2}];p.money=10;
 assert.deepEqual(o.matchingSheepOffers(s,catalog,['orange']).map(x=>x.id),['orange1','orange2']);
 p.money=1;assert.deepEqual(o.matchingSheepOffers(s,catalog,['orange']).map(x=>x.id),['orange2']);
 s.ruleTasks[0].remaining=1;assert.equal(o.matchingSheepOffers(s,catalog,['orange']).length,0);
 assert.equal(o.matchingSheepOffers(s,catalog,['gone']).length,0);
 assert.equal(o.matchingSheepOffers(s,catalog,['orange','orange']).length,0);
});
test('地图建造确认之前不改变状态，落位后引擎仍校验费用与空位',async()=>{
 const [e,o]=await modules,s=e.createGame(catalog,{automation:true},()=>.37),p=s.players[0];s.phase='B';s.ruleTasks=[{kind:'build',rate:2}];p.money=20;
 const before=structuredClone(s),targets=o.buildingTargets(s,catalog,p.private[0].uid);assert.ok(targets.length);assert.deepEqual(s,before);
 const next=e.reduce(s,targets[0].action,catalog);assert.equal(next.players[0].money,20-targets[0].cost);assert.equal(next.boardPieces[0].node,targets[0].action.node);
 s.boardPieces=next.boardPieces;assert.ok(!o.buildingTargets(s,catalog,p.private[1].uid).some(t=>t.id===targets[0].id));
});
test('航海和港口地图选项遵守步数、升级消耗与远程仓库限制',async()=>{
 const [e,o]=await modules,s=e.createGame(catalog,{automation:true},()=>.37);s.ruleTasks=[{kind:'ship',count:1}];s.players[0].money=30;
 const targets=o.sailingTargets(s);assert.ok(targets.some(t=>t.id==='sea:1'));assert.ok(!targets.some(t=>t.id==='port:foreign5'));
 s.ruleTasks=[{kind:'ship',count:2}];assert.ok(o.sailingTargets(s).some(t=>t.id==='port:foreign5'));
 s.ruleTasks=[{kind:'remoteWarehouse',count:10}];assert.ok(o.sailingTargets(s).every(t=>t.port&&t.port.kind!=='medium'));
});
test('莎拉唯一移动和港口自动执行，真正并列时保留决策',async()=>{
 const [e,,r,m]=await modules,s=e.createGame(catalog,{automation:true,mode:'sarah'},()=>.37);s.phase='sarah';s.active=1;
 Object.assign(s.sarah,{stage:'move',move:{normal:1,extra:0},queue:[]});assert.equal(m.sarahRoutes(s,catalog).length,1);
 r.settleSarah(s,catalog,{});assert.equal(s.players[1].landNode,'A');assert.equal(s.sarah.stage,'done');
 s.sarah.stage='port';s.sarah.queue=[];const port=m.sarahPorts(s)[0];r.settleSarah(s,catalog,{});assert.equal(s.sarah.stage,'done');assert.ok(s.boardPieces.some(t=>t.port===port.id));
 s.sarah.stage='choice';s.sarah.choices=[{key:'one'},{key:'two'}];const before=structuredClone(s);r.settleSarah(s,catalog,{});assert.deepEqual(s,before);
});
