// 使用最小 DOM/Canvas 替身验证完整交替流程；不替代真实浏览器触屏测试。
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function boot() {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {value:'', textContent:'', handlers:{}, classList:{toggle(){}}, focus(){}, addEventListener(event, fn){this.handlers[event] = fn;}, setAttribute(){}});
    return elements.get(id);
  };
  let html = '';
  const app = {set innerHTML(value){html = value; elements.clear();}, get innerHTML(){return html;}};
  let ink = false;
  const ctx = {fillRect(){ink = false;},beginPath(){},moveTo(){},lineTo(){},stroke(){ink = true;},arc(){},fill(){ink = true;},getImageData(){return {data:ink ? [0,0,0,255] : [255,255,255,255]};}};
  const document = {body:{style:{overflow:''}},handlers:{},addEventListener(name,fn){this.handlers[name]=fn;},removeEventListener(name){delete this.handlers[name];},getElementById:element,querySelectorAll:()=>[],querySelector(selector){
    if(selector === '#app') return app;
    const el = element(selector.slice(1));
    if(selector === '#canvas') Object.assign(el, {getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:900,height:900}),setPointerCapture(){},toDataURL:()=> 'data:image/png;base64,dGVzdA=='});
    if(selector === '#width') el.value = 5;
    return el;
  }};
  const context = vm.createContext({document,window:{scrollTo(){},confirm:()=>true,addEventListener(){}},fetch:async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('data/words.json','utf8'))})});
  vm.runInContext(fs.readFileSync('app.js','utf8'),context);
  const run = code => vm.runInContext(code,context);
  const click = id => {assert.equal(typeof element(id).handlers.click,'function',`missing click: ${id}`);return element(id).handlers.click({target:element(id)});};
  return {run,click,element,app,document};
}
for(const rounds of [1,2,3,4,20]) test(`${rounds} 轮准确交替且在目标轮结束`, () => {
  const {run,click,element,app} = boot();
  run(`game = {rounds:${rounds},round:1,history:[{type:'word',text:'秘密原词'}]}; reveal();`);
  click('ready');
  for(let step=1;step<=rounds;step++) {
    assert.equal(run('screen'),'handoff');
    assert.equal(app.innerHTML,'<main class="handoff"><button id="next" class="primary">下一棒</button></main>');
    click('next');
    assert.equal(run('game.round'),step);
    if(step % 2) {
      assert.equal(run('screen'),'draw');
      if(step>1) {assert.ok(app.innerHTML.includes(`猜测${step-1}`));assert.ok(!app.innerHTML.includes('秘密原词'));}
      click('done');
      assert.equal(run('screen'),'draw','空画布不得提交');
      element('canvas').handlers.pointerdown({pointerId:1,pointerType:'touch',clientX:25,clientY:25,preventDefault(){}});
      element('canvas').handlers.pointerup({pointerId:1});
      click('done');
    } else {
      assert.equal(run('screen'),'guess');
      assert.ok(!app.innerHTML.includes('秘密原词'));
      element('guess').value = '   ';
      element('guess-form').handlers.submit({preventDefault(){}});
      assert.equal(run('screen'),'guess','空白猜测不得提交');
      element('guess').value = `猜测${step}`;
      element('guess-form').handlers.submit({preventDefault(){}});
    }
  }
  assert.equal(run('screen'),'handoff');click('next');
  assert.equal(run('screen'),'recap');
  assert.equal(run('game.history.length'),rounds+1);
  assert.ok(app.innerHTML.includes('秘密原词'));
});
test('词库多选、去重与开局校验',async()=>{
  const {run,click,element}=boot();await run('setup()');
  assert.equal(run('banks.length'),26);
  click('none');click('start');assert.equal(run('game'),null);assert.ok(element('error').textContent);
  run('selected = new Set(banks.map(b => b.id)); rounds = 0');click('start');assert.equal(run('game'),null);
  run('rounds = 1.5');click('start');assert.equal(run('game'),null);
  run('rounds = 21');click('start');assert.equal(run('game'),null);
  run('rounds = 3');click('start');assert.equal(run('screen'),'reveal');
  assert.equal(run('new Set(wordPool()).size'),run('wordPool().length'));
});
test('玩家输入作为纯文本呈现',()=>{
  const {run,app}=boot();
  run(`game={round:3,rounds:3,history:[{type:'guess',text:'<img src=x onerror=alert(1)>'}]};draw()`);
  assert.ok(app.innerHTML.includes('&lt;img src=x onerror=alert(1)&gt;'));
});

test('全屏回退与原生退出保留笔迹，并清理页面状态', async () => {
  const {run,click,element,document} = boot();
  run("game={round:1,rounds:1,history:[{type:'word',text:'彩虹'}]};draw()");
  element('canvas').handlers.pointerdown({pointerId:1,pointerType:'touch',clientX:25,clientY:25,preventDefault(){}});
  element('canvas').handlers.pointerup({pointerId:1});
  await click('fullscreen');
  assert.equal(document.body.style.overflow,'hidden');
  assert.equal(element('fullscreen').textContent,'退出全屏');
  await click('fullscreen');
  assert.equal(document.body.style.overflow,'');
  element('drawing-board').requestFullscreen = async () => { throw Error('unsupported'); };
  await click('fullscreen');
  assert.equal(document.body.style.overflow,'hidden');
  await click('fullscreen');
  element('drawing-board').requestFullscreen = async () => {
    document.fullscreenElement = element('drawing-board');
    document.handlers.fullscreenchange();
  };
  await click('fullscreen');
  document.fullscreenElement = null;
  document.handlers.fullscreenchange();
  assert.equal(document.body.style.overflow,'');
  assert.equal(element('fullscreen').textContent,'全屏画画');
  await click('fullscreen');
  document.exitFullscreen = async () => { document.fullscreenElement = null; };
  click('done');
  assert.equal(run('screen'),'handoff','切换全屏后画作仍可提交');
  assert.equal(document.body.style.overflow,'');
  assert.equal(document.handlers.fullscreenchange,undefined);
});
