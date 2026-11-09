const {test}=require('node:test');const assert=require('node:assert/strict');
const catalog=require('../games/great-western-trail-new-zealand/catalog.json');
test('玩家板将奖励放在工人格，圆片和仓库连线反映当前状态且不修改对局',async()=>{
 const {playerBoard}=await import('../games/great-western-trail-new-zealand/player-board.mjs');const {createGame}=await import('../games/great-western-trail-new-zealand/engine.mjs');
 const s=createGame(catalog,{automation:true},()=>.37),p=s.players[0];p.workers=[2,3,1,4];p.unlocked=['wool1'];p.warehouseSlots=[0,1,5];p.certificate=2;const before=structuredClone(s),html=playerBoard(p,s);
 assert.equal((html.match(/data-worker-slot=/g)||[]).length,20);
 assert.match(html,/data-worker-slot="0-3"[^>]*可支付 4 元/);assert.match(html,/data-worker-slot="3-4"[^>]*罗姆尼/);
 assert.match(html,/pb-worker-slot occupied[^>]*data-worker-slot="1-3"/);assert.match(html,/pb-worker-slot[^>]*next[^>]*data-worker-slot="1-4"/);
 assert.equal((html.match(/pb-points/g)||[]).length,4);assert.match(html,/pb-disk-slot unlocked[^>]*data-disk-slot="wool1"/);
 assert.match(html,/pb-warehouse-link earned[^>]*data-warehouse-link="0"/);assert.ok(!/pb-warehouse-link earned[^>]*data-warehouse-link="5"/.test(html));
 assert.deepEqual(s,before);
});
