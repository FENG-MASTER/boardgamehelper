const {test}=require('node:test');const assert=require('node:assert/strict');
const source=require('../games/great-western-trail-new-zealand/catalog.json');
test('独立界面替换所有图片入口，同时保留规则数据和存档结构',async()=>{
 const {originalCatalog,sarahArtwork,playerDashboard}=await import('../games/great-western-trail-new-zealand/original-ui.mjs');
 const {SARAH_CARDS}=await import('../games/great-western-trail-new-zealand/sarah-cards.mjs');
 const e=await import('../games/great-western-trail-new-zealand/engine.mjs');const c=originalCatalog(source);
 const images=[c.board,c.playerBoard,c.reference,...Object.values(c.cards).flatMap(d=>[d.image,d.back]),...Object.values(c.tiles).flatMap(d=>[d.image,d.back,d.mapImage,d.mapBack]),...SARAH_CARDS.map(d=>sarahArtwork(d,'shepherd'))];
 for(const image of images){assert.ok(image.startsWith('data:image/svg+xml;'));const svg=decodeURIComponent(image.slice(image.indexOf(',')+1));assert.ok(!/assets\/|<image\b|https?:\/\/(?!www.w3.org)/.test(svg));assert.ok(!svg.includes('undefined'));}
 assert.deepEqual(c.groups,source.groups);assert.ok(source.board.startsWith('assets/'));
 for(const zone of ['cards','tiles'])for(const id of Object.keys(source[zone])){const {image,back,...before}=source[zone][id];const {image:afterImage,back:afterBack,mapImage,mapBack,...after}=c[zone][id];assert.deepEqual(after,before);}
 const a=e.createGame(source,{automation:true,mode:'sarah'},()=>.37),b=e.createGame(c,{automation:true,mode:'sarah'},()=>.37);assert.deepEqual(a,b);
 assert.match(playerDashboard(b.players[0]),/圆片与解锁能力/);
});
