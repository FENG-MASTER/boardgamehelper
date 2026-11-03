const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('语言大爆炸离线服务只接管游戏目录，升级不删除其他站点缓存', async () => {
  const handlers = {}, deleted = [];
  const scope = 'https://feng-master.github.io/boardgamehelper/games/gibberers/';
  const cachedPage = {body:'语言大爆炸'};
  const context = vm.createContext({
    self: {registration:{scope}, clients:{claim:async()=>{}}, addEventListener:(name, fn)=>handlers[name]=fn},
    caches: {
      keys:async()=>['gibberers-shell-v3','other-game-v1','boardgamehelper-gibberers-v0','boardgamehelper-gibberers-v1'],
      delete:async key=>deleted.push(key),
      open:async()=>({match:async request=>request === './index.html' ? cachedPage : undefined}),
    },
    fetch:async()=>{throw Error('offline');},
  });
  vm.runInContext(fs.readFileSync('games/gibberers/sw.js','utf8'),context);
  let activation;
  handlers.activate({waitUntil:promise=>activation=promise});
  await activation;
  assert.deepEqual(deleted,['boardgamehelper-gibberers-v0']);
  for (const url of ['https://feng-master.github.io/boardgamehelper/', 'https://feng-master.github.io/gibberers/', 'https://example.com/']) {
    handlers.fetch({request:{method:'GET',url,mode:'navigate'}, respondWith:()=>assert.fail('不能拦截合集或其他游戏')});
  }
  let response;
  handlers.fetch({request:{method:'GET',url:scope,mode:'navigate'},respondWith:promise=>response=promise});
  assert.equal(await response,cachedPage);
});
