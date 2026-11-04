# 坠空之下：基础单局资料与实现范围

来源：`doc/坠空之下` 下 23 页扫描 PDF 和 Steam 素材。页码按 PDF 顺序计数。

## 范围

实现三个基础城市正常面、威胁 0～4 的单人全流程。每级随机翻转一块天空板，改变空域、研究轨道、母舰事件和失败线。尚未实现战役自动结算与城市被毁面。

战役第 1 章的已提供原图收录在 `campaign.html`，包含故事、章节说明、记录表、墨西哥城、蒙特利尔、空中之战、增援及 Samantha Legrand / Jackson Moss 的两个等级。章节说明中还有哈瓦那、里约热内卢、另外两位角色和基地 D，当前缺少这些组件的独立完整图面。

原作 Tomáš Uhlíř / Czech Games Edition，非官方网页实现。

## 坐标与版图

天空从上到下 16 行、5 列，四块板颜色由深到浅；母舰起始为 -1。数组 SKY 中数字为爆炸点强度，M 为母舰下降，< / > 为横移。母舰抵达第 12 行（数组索引 11）的骷髅立即失败。研究从天空最下方向上，逐格消耗，不是累计总分。纽约、华盛顿城市上分别有额外的 2、6 点研究格。

基地 6 排 × 5 列，每排蛇形编号。第一排从右到左，此后交替。设施跨格只应用一次费用和修正。所有 30 格均由 room.cells 覆盖，可自动核验。

| 城市 | 上/下板 | 初始能源 / 上限 | 致命损伤 | 钻探机初始蛇形序号（0 起） |
| --- | --- | --- | --- | --- |
| 罗斯维尔 | A / B | 2 / 7 | 7 | 10 |
| 纽约 | C / A | 2 / 8 | 6 | 9 |
| 华盛顿 | B / C | 3 / 9 | 6 | 9 |

纽约最多一颗机器人骰，机器人所在设施数值 +1。华盛顿每轮首次投骰固定一颗白骰为 6，后续白骰触发的重掷正常进行。罗斯维尔此布局没有机器人工厂。

图片对应素材原名中 UGC 编号：

- 城市：1800854600490391616（罗斯维尔）、1800854600493345196（纽约）、1800854600493346159（华盛顿）。
- 上板 A/B/C：1800854600490396813、1800854600493395571、1800854600493396016。
- 下板 A/B/C：1800854600493399381、1800854600493399845、1800854600493400307。
- 天空从上到下：1800854600493372423、1800854600493369370、1800854600493366766、1800854600493363388。

## 关键规则

- PDF 4～5：每列一颗工人骰；白骰放置后重掷未放骰；防空塔令敌舰移动量 -1。敌舰只触发终点，同列先全体移动，然后从上到下处理效果。箭头目标有舰则无效；触发母舰下降不执行母舰阶段的事件。
- PDF 6～7：设施自由选择顺序；大型设施全部占用；研究剩余值不累积；挖掘付 1 能源，且目标距离不得大于骰子点数。挖掘骰不能作为该设施骰再次使用。
- PDF 8～9：母舰下降、执行事件、生成敌舰；紫舰优先生成，优先空列，否则选最近敌舰距离最远的列；并列由玩家选择，不随机代选。白舰被击落后移出，紫舰返回母舰等待。五个降落点全部占用后，剩余舰留待下一轮。
- PDF 10～11：三个城市布局、机器人制造/耗尽/衰减/移除、大型设施中耗尽机器人视为空位；机器人可以保留不用。

## 验证

`node --test tests/under-falling-skies.test.cjs`：关键规则、存档往返、三城 36 个种子的完整对局。浏览器另验开局、放骰、撤销后重放相同随机结果、刷新恢复、390px 手机视口、完整对局与资源加载。

本地预览：`http://127.0.0.1:8765/games/under-falling-skies/`。

## 新增天空背面

从上到下 UGC 编号：1800854600493372947、1800854600493369829、1800854600493367219、1800854600493364202。对应 `assets/sky-1-hard.jpg` 至 `sky-4-hard.jpg`。第三板背面失败线为第 11 行。

## 战役原图映射

- `assets/campaign-1/chapter-1-story.jpg`：第 1 章 · 故事漫画，来源 `httpssteamusercontentaakamaihdnetugc17175352644897324168197E5349E3C3C029AE21ACF1D420D51501A7D51.jpg`。
- `assets/campaign-1/chapter-1-guide.jpg`：第 1 章 · 入侵与补充规则，来源 `httpssteamusercontentaakamaihdnetugc171753526448973290999E96CD3602F0185D0CE48DA1BE3D105485B28B9.jpg`。
- `assets/campaign-1/campaign-record.jpg`：战役记录表，来源 `httpssteamusercontentaakamaihdnetugc1717535264490099956B272656D55213788E060BE086C627F72CF089FBC.jpg`。
- `assets/campaign-1/mexico-city.jpg`：墨西哥城，来源 `httpssteamusercontentaakamaihdnetugc1800854600493434669A5C6E19BBC62847F514FC1C431F9DDAEB22C78CE.jpg`。
- `assets/campaign-1/montreal.jpg`：蒙特利尔，来源 `httpssteamusercontentaakamaihdnetugc18008546004934356024A80892E10C5C8E2C44D89E876BF895BD395292D.jpg`。
- `assets/campaign-1/battle-story.jpg`：空中之战 · 故事，来源 `httpssteamusercontentaakamaihdnetugc1800854600493438897DA6E7E68C9E971D0D0558BE643735020FAA7D090.jpg`。
- `assets/campaign-1/battle-for-the-sky.jpg`：空中之战 · 场景规则，来源 `httpssteamusercontentaakamaihdnetugc1800854600493439369705EEB32AEF7F07AF3EA74D3D12A538DF15F60C9.jpg`。
- `assets/campaign-1/reinforcements-story.jpg`：增援 · 故事，来源 `httpssteamusercontentaakamaihdnetugc1800854600493439937C7B1A10B7379B2FF6FC09D9290F4E2AF18194F3B.jpg`。
- `assets/campaign-1/reinforcements.jpg`：增援 · 场景规则，来源 `httpssteamusercontentaakamaihdnetugc18008546004934401610BCE7AAD24CFD6BD4AB705000642C5F2814B3ECB.jpg`。
- `assets/campaign-1/samantha-reporter.jpg`：Samantha Legrand · 记者，来源 `httpssteamusercontentaakamaihdnetugc1800854600493442094B990E0DFE9247850BB99CC66C6849330D5F1C568.jpg`。
- `assets/campaign-1/samantha-journalist.jpg`：Samantha Legrand · 升级面，来源 `httpssteamusercontentaakamaihdnetugc1800854600493442424DAE0E47596654DE1F27E5FB71E80A52AD112751C.jpg`。
- `assets/campaign-1/jackson-colonel.jpg`：Jackson Moss · 上校，来源 `httpssteamusercontentaakamaihdnetugc1800854600493442950DB3FF831176C26E665FC26B22208F0537FAFFBA7.jpg`。
- `assets/campaign-1/jackson-general.jpg`：Jackson Moss · 将军，来源 `httpssteamusercontentaakamaihdnetugc1800854600493443167C2A2E40F8AD5C5A92932A4B52AC30C8B18A8CEC8.jpg`。
