const app = document.querySelector('#app');
let banks = [], selected = new Set(), rounds = 3, game = null, screen = 'home';
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const on = (id, event, callback) => document.getElementById(id)?.addEventListener(event, callback);
let cleanupDrawing = null;
function show(content, bare = false) {
  if (cleanupDrawing) { cleanupDrawing(); cleanupDrawing = null; }
  app.innerHTML = bare ? content : `<div class="shell"><header class="topbar"><div class="brand"><span class="brand-icon">⚄</span>桌边</div><span class="tag">好朋友，好游戏，好时光</span></header>${content}<footer class="footer">围坐一起，把快乐传下去。</footer></div>`;
  window.scrollTo(0, 0);
}
function home() {
  screen = 'home';
  show(`<section class="hero"><div class="eyebrow">THE TABLE IS OPEN</div><h1>把手机放中间，<br>快乐交给桌边。</h1><p>你的桌游小帮手。少一点准备，多一点一起玩的时间。</p></section><div class="section-label"><b>一起玩点什么</b><span class="hint">05 款游戏 · 持续添新</span></div><article class="game-card"><div class="game-art" aria-hidden="true"><div class="paper second">喵？</div><div class="paper first"><svg viewBox="0 0 140 140" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M32 56 28 23 54 39 Q70 32 88 39 L113 23 108 59 Q122 98 72 108 Q20 107 32 56Z"/><path d="M49 65v7m40-7v7M64 81l7 5 7-5m-7 5v8m-28-9-26-5m26 15-28 4m88-13 25-5m-25 14 27 4"/></svg></div></div><div class="card-body"><span class="pill">画画 × 猜词 × 意想不到</span><h2>传情画意</h2><p>一个词，经过几双手，会变成什么？<br>你来画，我来猜，把脑洞一棒一棒传下去。</p><div class="hint">多人同屏传递 · 无需下载 · 随时开局</div><button class="primary wide" id="enter">开始传递 <span aria-hidden="true">↗</span></button></div></article><article class="game-card"><div class="game-art language-art" aria-hidden="true"><div class="language-symbol">言<span>把一句话，变成一个文明</span></div><div class="language-bubble">你好？</div></div><div class="card-body"><span class="pill">纸笔造词 × 文明发展 × 面对面交流</span><h2>语言大爆炸</h2><p>从第一个词开始，创造你们自己的语言。<br>让桌边帮你抽卡、管理标记，记录文明的成长。</p><div class="hint">3～10 人 · 需准备纸笔 · 自动存档 · 支持离线</div><a class="primary wide game-link" href="./games/gibberers/">开启文明 <span aria-hidden="true">↗</span></a></div></article><article class="game-card"><div class="game-art language-art" aria-hidden="true"><div class="language-symbol">🌱<span>一季耕耘，满园收获</span></div></div><div class="card-body"><span class="pill">掷骰 × 种植 × 连锁丰收</span><h2>农场三姐妹</h2><p>种玉米、牵豆藤，让南瓜铺满田垄。<br>经营花卉、蜂巢与果园，把小奖励连成大丰收。</p><div class="hint">2～4 人同屏 · 单人练习 · 自动结算与存档</div><a class="primary wide game-link" href="./games/three-sisters/">开始耕耘 <span aria-hidden="true">↗</span></a></div></article><article class="game-card"><div class="game-art language-art" aria-hidden="true"><div class="language-symbol">✦<span>天空之下，守住最后的希望</span></div></div><div class="card-body"><span class="pill">单人防卫 × 骰子部署 × 地下基地</span><h2>坠空之下</h2><p>调度五颗骰子，挖掘与发展地下基地。<br>在母舰压境之前，完成反击研究。</p><div class="hint">单人完整对局 · 三个城市 · 威胁 0～4 · 自动存档</div><a class="primary wide game-link" href="./games/under-falling-skies/">开始防卫 <span aria-hidden="true">↗</span></a></div></article><article class="game-card"><div class="game-art language-art" aria-hidden="true"><div class="language-symbol">🐑<span>沿着南岛，走向更远的海岸</span></div></div><div class="card-body"><span class="pill">牧场经营 × 牌库管理 × 海路贸易</span><h2>大西部开拓者：新西兰</h2><p>在原版地图上经营牧场，管理羊群与工人。<br>跟随回合提示，完成从南岛到远洋的旅途。</p><div class="hint">官方莎拉单人 · 2～4 人同屏 · 行动、路线与计分自动结算</div><a class="primary wide game-link" href="./games/great-western-trail-new-zealand/">展开地图 <span aria-hidden="true">↗</span></a></div></article>`);
  on('enter', 'click', setup);
}
async function loadBanks() {
  if (banks.length) return;
  const response = await fetch('./data/words.json');
  if (!response.ok) throw new Error('词库加载失败');
  banks = await response.json();
  selected = new Set(banks.filter(bank => ['动物', '水果', '日常物品'].includes(bank.name)).map(bank => bank.id));
}
async function setup() {
  screen = 'setup';
  if (!banks.length) {
    show('<div class="loading" role="status">正在整理词库…</div>');
    try { await loadBanks(); } catch {
      show('<div class="page"><h1>词库暂时没有加载成功</h1><p class="sub">请检查网络连接后重试。</p><button id="retry" class="primary">重新加载</button></div>');
      on('retry', 'click', setup); return;
    }
  }
  show(`<main class="page"><button id="back" class="text-button">← 游戏合集</button><h1>准备好，传情画意</h1><p class="sub">抽一个词，让它在画笔和猜测之间旅行。</p><section class="panel round-row"><div><p class="field-title">这次玩几轮？</p><div class="hint">画一次算 1 轮，猜一次也算 1 轮。<br>每次完成后，将设备交给下一位。</div></div><input aria-label="轮数" id="rounds" class="number" type="number" min="1" max="20" step="1" value="${rounds}" required></section><section class="panel"><div class="bank-head"><div><p class="field-title">挑选词库</p><div class="hint">支持多选，混合后随机抽词</div></div><div class="bank-actions"><button id="all" class="text-button">全选</button><button id="none" class="text-button">清空</button></div></div><div class="bank-grid">${banks.map(bank => `<label class="bank"><input type="checkbox" value="${escape(bank.id)}" ${selected.has(bank.id) ? 'checked' : ''}><span>${escape(bank.name)}</span><small>${bank.words.length} 词</small></label>`).join('')}</div></section><div id="count" class="hint"></div><p id="error" class="error" role="alert"></p><button id="start" class="primary wide">抽取本局词语 →</button><p class="hint">玩法：看词 → 下一棒 → 画画 → 下一棒 → 猜词。画画只看上一位的词，猜词只看上一张画，结束后一起揭晓。</p></main>`);
  const update = () => { document.querySelector('#count').textContent = `已选 ${selected.size} 个词库 · ${wordPool().length.toLocaleString()} 个不重复词语`; };
  document.querySelectorAll('.bank input').forEach(input => input.addEventListener('change', () => { input.checked ? selected.add(input.value) : selected.delete(input.value); update(); }));
  on('all', 'click', () => { document.querySelectorAll('.bank input').forEach(input => { input.checked = true; selected.add(input.value); }); update(); });
  on('none', 'click', () => { selected.clear(); document.querySelectorAll('.bank input').forEach(input => input.checked = false); update(); });
  on('back', 'click', home);
  on('rounds', 'input', event => rounds = Number(event.target.value));
  on('start', 'click', () => {
    const error = document.querySelector('#error');
    if (!Number.isInteger(rounds) || rounds < 1 || rounds > 20) { error.textContent = '请填写 1 到 20 之间的整数轮数。'; return; }
    const pool = wordPool();
    if (!pool.length) { error.textContent = '请至少选择一个词库。'; return; }
    game = { rounds, round: 1, history: [{type:'word', text:pool[Math.floor(Math.random() * pool.length)]}] };
    reveal();
  });
  update();
}
function wordPool() { return [...new Set(banks.filter(bank => selected.has(bank.id)).flatMap(bank => bank.words))]; }
function progress(label) { return `<div class="progress"><span>第 ${game.round} / ${game.rounds} 轮 · ${label}</span><button id="quit" class="text-button">结束本局</button></div>`; }
function wireQuit() { on('quit', 'click', () => { if (window.confirm('结束本局并丢弃记录？')) { game = null; setup(); } }); }
function reveal() {
  screen = 'reveal';
  show(`<main class="page">${progress('抽词')}<div class="word-card"><div class="eyebrow">故事从这个词开始</div><div class="word">${escape(game.history[0].text)}</div><p class="hint">看好了？让下一位用画笔表达它。</p></div><button id="ready" class="primary wide">收起词语，交给下一棒 →</button></main>`);
  on('ready', 'click', () => handoff(draw)); wireQuit();
}
function handoff(next) {
  screen = 'handoff';
  show('<main class="handoff"><button id="next" class="primary">下一棒</button></main>', true);
  on('next', 'click', next);
}
function draw() {
  screen = 'draw';
  const prompt = game.history.at(-1).text;
  show(`<main class="page">${progress('画画')}<h1>轮到你的画笔了</h1><div class="prompt"><span class="hint">请画出：</span> <strong>${escape(prompt)}</strong></div><p class="hint">用图画表达，不要写出答案。画好后交给下一位猜。</p><section id="drawing-board" aria-label="绘画区域"><div class="toolbar" aria-label="画笔工具">${[['黑','#000000'],['红','#e53935'],['橙','#fb8c00'],['黄','#fdd835'],['绿','#2eaf45'],['蓝','#1e88e5'],['靛','#3f3d99'],['紫','#8e24aa']].map(([name, value], index) => `<button class="swatch" style="background:${value}" data-color="${value}" title="${name}色画笔" aria-label="${name}色画笔" aria-pressed="${index === 0}"></button>`).join('')}<button id="eraser" class="tool" aria-pressed="false">橡皮</button><label class="hint">粗细 <input id="width" type="range" min="2" max="24" value="5" aria-label="画笔粗细" style="width:65px;vertical-align:middle"></label><button id="undo" class="tool">撤销</button><button id="clear" class="tool">清空</button><button id="fullscreen" class="tool" aria-pressed="false">全屏画画</button></div><div class="canvas-stage"><div class="canvas-wrap"><canvas id="canvas" width="900" height="900" aria-label="画布，请使用鼠标或触屏绘画"></canvas></div></div></section><p id="draw-error" class="error" role="alert"></p><button id="done" class="primary wide">${game.round === game.rounds ? '画好了，准备揭晓 →' : '画好了，交给下一棒 →'}</button></main>`);
  wireQuit();
  const canvas = document.querySelector('#canvas'), ctx = canvas.getContext('2d');
  let strokes = [], active = null, pointer = null, color = '#000000';
  const board = document.querySelector('#drawing-board');
  const fullscreenButton = document.querySelector('#fullscreen');
  let expanded = false, nativeFullscreen = false;
  const previousOverflow = document.body.style.overflow;
  function setExpanded(value) {
    expanded = value;
    active = null; pointer = null;
    board.classList.toggle('drawing-fullscreen', value);
    document.body.style.overflow = value ? 'hidden' : previousOverflow;
    fullscreenButton.textContent = value ? '退出全屏' : '全屏画画';
    fullscreenButton.setAttribute('aria-pressed', String(value));
  }
  async function exitDrawingFullscreen() {
    setExpanded(false);
    if (document.fullscreenElement === board) {
      try { await document.exitFullscreen(); } catch { /* 页面内全屏已退出。 */ }
    }
    fullscreenButton.focus();
  }
  on('fullscreen', 'click', async () => {
    if (expanded) { await exitDrawingFullscreen(); return; }
    setExpanded(true);
    // iPhone 等不支持元素全屏的浏览器继续使用占满视口的画板。
    if (board.requestFullscreen) {
      try { await board.requestFullscreen(); } catch { /* 保留页面内全屏。 */ }
    }
  });
  const fullscreenChanged = () => {
    if (document.fullscreenElement === board) nativeFullscreen = true;
    else if (nativeFullscreen) { nativeFullscreen = false; setExpanded(false); }
  };
  const escapeFullscreen = event => {
    if (event.key === 'Escape' && expanded) { event.preventDefault(); void exitDrawingFullscreen(); }
  };
  document.addEventListener('fullscreenchange', fullscreenChanged);
  document.addEventListener('keydown', escapeFullscreen);
  cleanupDrawing = () => {
    document.removeEventListener('fullscreenchange', fullscreenChanged);
    document.removeEventListener('keydown', escapeFullscreen);
    document.body.style.overflow = previousOverflow;
    if (document.fullscreenElement === board) document.exitFullscreen().catch(() => {});
  };
  function paint(stroke) {
    ctx.strokeStyle = stroke.color; ctx.fillStyle = stroke.color; ctx.lineWidth = stroke.width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    const first = stroke.points[0];
    ctx.moveTo(first.x, first.y);
    for (const point of stroke.points.slice(1)) ctx.lineTo(point.x, point.y);
    ctx.stroke();
    if (stroke.points.length === 1) { ctx.beginPath(); ctx.arc(first.x, first.y, stroke.width / 2, 0, Math.PI * 2); ctx.fill(); }
  }
  function redraw() { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 900, 900); strokes.forEach(paint); }
  function point(event) { const rect = canvas.getBoundingClientRect(); return { x:(event.clientX - rect.left) * 900 / rect.width, y:(event.clientY - rect.top) * 900 / rect.height }; }
  redraw();
  canvas.addEventListener('pointerdown', event => {
    if (pointer !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault(); pointer = event.pointerId; canvas.setPointerCapture(pointer);
    active = {color, width:Number(document.querySelector('#width').value) * 900 / canvas.getBoundingClientRect().width, points:[point(event)]};
    strokes.push(active); paint(active); document.querySelector('#draw-error').textContent = '';
  });
  canvas.addEventListener('pointermove', event => { if (event.pointerId !== pointer || !active) return; const previous = active.points.at(-1), next = point(event); active.points.push(next); paint({...active, points:[previous, next]}); });
  const finish = event => { if (event.pointerId === pointer) { active = null; pointer = null; } };
  canvas.addEventListener('pointerup', finish); canvas.addEventListener('pointercancel', finish); canvas.addEventListener('lostpointercapture', finish);
  document.querySelectorAll('[data-color]').forEach(button => button.addEventListener('click', () => { color = button.dataset.color; document.querySelectorAll('[data-color]').forEach(b => b.setAttribute('aria-pressed', String(b === button))); document.querySelector('#eraser').setAttribute('aria-pressed', 'false'); }));
  on('eraser', 'click', event => { color = '#ffffff'; event.target.setAttribute('aria-pressed', 'true'); document.querySelectorAll('[data-color]').forEach(b => b.setAttribute('aria-pressed','false')); });
  on('undo', 'click', () => { strokes.pop(); redraw(); });
  on('clear', 'click', () => { if (strokes.length && window.confirm('清空这张画？')) { strokes = []; redraw(); } });
  on('done', 'click', () => {
    const pixels = ctx.getImageData(0, 0, 900, 900).data;
    let visible = false;
    for (let i = 0; i < pixels.length; i += 4) { if (pixels[i] < 250 || pixels[i + 1] < 250 || pixels[i + 2] < 250) { visible = true; break; } }
    if (!visible) { document.querySelector('#draw-error').textContent = '先画点什么，再交给下一位吧。'; return; }
    game.history.push({type:'drawing', image:canvas.toDataURL('image/png'), round:game.round});
    if (game.round === game.rounds) handoff(recap);
    else { game.round++; handoff(guess); }
  });
}
function guess() {
  screen = 'guess';
  show(`<main class="page">${progress('猜词')}<h1>这幅画，说的是什么？</h1><p class="sub">只看上一位的画，写下你的直觉。</p><img class="guess-image" src="${game.history.at(-1).image}" alt="上一位玩家的画作"><form id="guess-form"><input id="guess" class="guess-input" aria-label="你猜的词语" placeholder="我猜是……" maxlength="80" autocomplete="off" required><p id="guess-error" class="error" role="alert"></p><button class="primary wide" type="submit">${game.round === game.rounds ? '猜好了，准备揭晓 →' : '猜好了，交给下一棒 →'}</button></form></main>`);
  wireQuit();
  on('guess-form', 'submit', event => {
    event.preventDefault(); const text = document.querySelector('#guess').value.trim();
    if (!text) { document.querySelector('#guess-error').textContent = '请写下你猜的词语。'; return; }
    game.history.push({type:'guess', text, round:game.round});
    if (game.round === game.rounds) handoff(recap);
    else { game.round++; handoff(draw); }
  });
}
function recap() {
  screen = 'recap';
  show(`<main class="page"><div class="eyebrow">WHAT A JOURNEY</div><h1>传着传着，就有了故事。</h1><p class="sub">${game.rounds} 轮传递完成。一起来看看，脑洞拐了几个弯。</p><div class="recap">${game.history.map(item => `<section class="recap-item"><div class="hint">${item.type === 'word' ? '起点 · 最初的词语' : `第 ${item.round} 轮 · ${item.type === 'drawing' ? '画作' : '猜测'}`}</div>${item.type === 'drawing' ? `<img class="guess-image" src="${item.image}" alt="第 ${item.round} 轮画作">` : `<div class="prompt"><strong>${escape(item.text)}</strong></div>`}</section>`).join('')}</div><div class="actions"><button id="again" class="primary">再玩一局</button><button id="home" class="secondary">回到合集</button></div></main>`);
  on('again', 'click', () => { game = null; setup(); }); on('home', 'click', () => { game = null; home(); });
}
window.addEventListener('beforeunload', event => { if (game && screen !== 'recap') { event.preventDefault(); event.returnValue = ''; } });
home();
