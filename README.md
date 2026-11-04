# 桌边 · 桌游助手

可部署到 GitHub Pages 的纯静态线下桌游助手合集。无需后端或 API Key，适合多人共用同一台手机或平板。

| 游戏 | 用途 |
| --- | --- |
| 传情画意 | 抽词、画画与猜词，结束后揭晓传递过程 |
| [语言大爆炸](https://feng-master.github.io/boardgamehelper/games/gibberers/) | 3～10 人纸笔造词，辅助抽卡、启迪标记、15 轮文明发展与计分 |

语言大爆炸整合自本地 `gibberers` 项目，运行资源与回归测试位于 `games/gibberers/`。保留自动存档、导入导出、撤销、私密选题、自定义知识与离线功能；进入后可通过顶部链接返回合集。需要线下准备纸笔；规则与数据口径见[使用说明](games/gibberers/README.md)。

语言大爆炸首次联网打开并显示“已可离线使用”后，可离线重开该游戏；合集首页及传情画意目前需要联网。离线缓存仅管理语言大爆炸目录。游戏存档沿用独立站点的存储键，同一浏览器、同一域名可读取已有进度，请避免同时在两个站点操作同一局。

## 玩法

1. 选择一个或多个词库，填写轮数（1–20）。**画一次算 1 轮，猜一次也算 1 轮**。例如 3 轮为「画 → 猜 → 画」，4 轮为「画 → 猜 → 画 → 猜」。
2. 随机抽取一个词，收起后进入只显示「下一棒」的白色交接页。
3. 下一位点击后查看词语并画画，提交后再次进入交接页。
4. 再下一位只能看到上一张画，输入猜测。下一次画画只显示这个猜测。
5. 指定轮数结束后（奇数轮止于画画，偶数轮止于猜词），通过交接页揭晓所有词语与画作。

支持触屏 / 鼠标、彩虹七色（红、橙、黄、绿、蓝、靛、紫）和黑色、粗细调整、橡皮、撤销与清空。点击「全屏画画」可在手机上全屏绘画，保留工具栏；点击「退出全屏」返回，画作保持不变。不支持原生全屏的浏览器使用页面内全屏。多个词库合并去重后等概率抽词。游戏内容仅存于当前页面内存，刷新或关闭会丢失；进行中刷新会触发浏览器离开提示。

## 本地预览

在项目目录运行：

```sh
python -m http.server 8080
```

打开 http://localhost:8080 。请通过 HTTP 服务访问，直接双击 HTML 会导致浏览器阻止词库读取。

## 更新词库

```sh
python scripts/import_words.py '/home/fengmaster/project/note_simple/生活/游戏/桌游/猜词库/'
```

每个 `.md` 文件是一个词库，一行一个词；空行和以 `#` 开头的元信息被跳过，每库内自动去重。网页使用生成的 `data/words.json`，部署时不需要访问原始目录。显示的词数以实际导入结果为准，可能不同于原文件名中的数字。

## GitHub Pages

在线访问：<https://feng-master.github.io/boardgamehelper/>。推送到 `main` 后自动更新。

1. 将本目录文件提交到目标 GitHub 仓库的 `main` 分支。
2. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 推送后 `.github/workflows/pages.yml` 会自动发布；也可在 Actions 中手动运行。

页面使用相对资源路径，支持 `https://用户名.github.io/仓库名/`。发布产物只包含页面和词库，不包含原始笔记目录、脚本和测试。

## 验证

```sh
node --check app.js
node --test tests/flow.test.cjs
npm test --prefix games/gibberers
node --test tests/integration.test.cjs
```

流程测试使用最小 DOM/Canvas 替身，覆盖 1 / 2 / 3 / 4 / 20 轮结束、交接遮挡、空白提交、词库选择、轮数校验和文字转义；触屏手感及视觉布局仍需在真实浏览器中确认。


## 农场三姐妹

入口：`games/three-sisters/`。基础游戏支持 2～4 人同屏轮流操作，以及不含农夫干扰的单人练习。骰子分组、个人与公共骰、堆肥调整、八轮事件、种植和浇水、南瓜连锁、花卉、蜂巢、果园、15 项工具、奖励及最终计分均由浏览器处理。提供自动存档、最近 80 步撤销、行动日志和原图对照。

单人练习不是说明书中的正式单人模式；目前未包含农夫划掉格子的机制或天气扩充。多人使用同一设备，不提供跨设备联机。

原作：Ben Pinchback / Matt Riddle，Motor City Gameworks，2021。本实现是非官方网页版。原图仅在规则中的对照链接打开，首页和游戏过程无需加载规则 PDF。

- 规则数据及状态机：`games/three-sisters/engine.mjs`
- 界面及浏览器存档：`games/three-sisters/app.mjs`
- 规则测试：`node tests/three-sisters.test.cjs`（也随项目 `node --test tests/*.test.cjs` 执行）
- 逐项识图记录：`games/three-sisters/MAPPING.md`

## 坠空之下

入口：`games/under-falling-skies/`。单人基础游戏支持罗斯维尔、纽约、华盛顿三个正常面城市和威胁 0～4。包含掷骰与白骰重掷、敌舰移动、基地设施自由结算、能源与研究、蛇形挖掘、机器人、母舰事件、敌舰重生选择和胜负结算。支持自动存档、最近 80 步撤销、JSON 导入导出、手机布局及原图对照。

基础模式可重复游玩。原版有威胁 0～4；四块高难度天空背面已接入，每级随机翻转一块天空板；城市被毁面尚未开放。战役第 1 章原图可在 `games/under-falling-skies/campaign.html` 预览，尚未实现战役自动结算。规则与图片映射见 `games/under-falling-skies/MAPPING.md`。非官方实现，原作 Tomáš Uhlíř / Czech Games Edition。

本地预览：<http://127.0.0.1:8765/games/under-falling-skies/>。规则测试：`node --test tests/under-falling-skies.test.cjs`。
