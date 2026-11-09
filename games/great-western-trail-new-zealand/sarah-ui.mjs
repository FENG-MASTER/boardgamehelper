import {sarahArtwork} from './original-ui.mjs';
import {sarahRoutes,sarahPorts} from './sarah-map.mjs';
import {SARAH_CARDS,ACTION_NAMES} from './sarah-cards.mjs';
import {SARAH_DIFFICULTIES,SARAH_WORKERS} from './sarah.mjs';
import {WORKER_NAMES} from './data.mjs';
export function sarahPanel(s,catalog,{escape,button}){
 const ai=s.sarah,p=s.players[1],c=SARAH_CARDS[(ai.card||1)-1];
 let body='';
 if(ai.stage==='move')body=`<h3>先移动莎拉</h3><p>正常移动 <b>${ai.move.normal}</b> 步${ai.move.extra?`，再额外移动 <b>${ai.move.extra}</b> 步`:''}，到威灵顿必须停止。选择通往威灵顿步数最少的路线，再依次比较总过路费、付给你的过路费。</p><div class="actions-row">${button('sarahMove','在地图上定位',false,'primary')}${button('sarahWellington','到达威灵顿')}</div><p class="bottom-note">系统未自动判定路线；请按箭头与实际板块数确定落点。点击确认后自动执行卡面行动。</p>`;
 if(['choice','build'].includes(ai.stage))body=`<h3>${ACTION_NAMES[ai.awaiting.kind]}</h3><p>${ai.stage==='build'?(s.rulesVersion?'已筛选建筑优先级及你牧场主前方的合法空位，选择方案即可落位。':'先按规则选建筑，再在合法空格落位。'):'以下选项已按官方优先级筛选；完全并列时由你决定。'}</p><div class="sarah-choices">${ai.choices.map(o=>`<button data-sarah-choice="${escape(o.key)}" class="sarah-choice">${o.cards?o.cards.map(c=>`<img src="${catalog.cards[c.def].image}" alt="绵羊选项">`).join(''):`<img src="${catalog.tiles[o.def].image}" alt="板块选项">`}<span>${o.cards?`获得 ${o.cards.length} 张绵羊`:ai.stage==='build'?`${o.oldUid?'替换':'新建 '+(o.node||'')} · ${o.craftsmen} 工匠 · ${o.vp} 分`:o.worker?`雇用${WORKER_NAMES[SARAH_WORKERS.indexOf(o.worker)]}`:'选择此板块'}</span></button>`).join('')}</div>${ai.stage==='build'&&!s.rulesVersion?button('sarahSkipBuild','确认没有合法建造位置，略过'):''}`;
 if(ai.stage==='port')body=`<h3>工人格奖励 · 中型港口</h3><p>选择分数最低且尚无任何圆片的中型港口。若全部港口已有圆片，则选分数最低且没有莎拉圆片的港口。移除该处港务长，领取印刷的奖励卡。</p>${button('sarahPort','在地图上选择中型港口',false,'primary full')}`;
 if(s.rulesVersion&&ai.stage==='move')body=`<h3>莎拉移动</h3><p>已依最少步数、最低总费用、最低玩家收入筛选路线。</p>${sarahRoutes(s,catalog).map(r=>`<button class="full" data-sarah-route="${escape(r.path.join('|'))}">${escape(r.label)}</button>`).join('')}`;
 if(s.rulesVersion&&ai.stage==='port')body=`<h3>中型港口奖励</h3>${sarahPorts(s).map(p=>`<button data-sarah-port="${p.id}">${p.label}</button>`).join('')}`;
 if(ai.stage==='done')body=`<h3>莎拉的行动已结算</h3><p>${ai.atWellington?'已先完成威灵顿，再执行卡面行动；结束后返回起点。':'莎拉停留地点不影响卡面行动。'}${s.final?'当前处于最后一轮，不再补牌。':''}</p>${button('sarahEnd','结束莎拉回合 →',false,'primary full')}`;
 return `<div class="sarah-heading"><span class="eyebrow">WOMAN OF GREAT CHARACTER</span><h2>莎拉 · ${SARAH_DIFFICULTIES[ai.difficulty].name}</h2><span class="chip">专精：${WORKER_NAMES[SARAH_WORKERS.indexOf(ai.specialization)]}</span><span class="chip">开拓者 ${p.pioneer}</span></div><img class="sarah-card" src="${sarahArtwork(c,ai.specialization)}" alt="莎拉行动卡 ${ai.card}"><p class="muted">行动卡 #${ai.card} · 牌库 ${ai.deck.length} · 弃牌 ${ai.discard.length}</p>${body}<div class="notice">独立文字卡面，按官方单人规则结算。${s.rulesVersion?'市场、路径费用、合法建造落位和港口优先级自动计算，并列选项由你选择。':'市场与卡牌结算自动处理，路径、建造落位和港口仍需人工确认。'}</div>`;
}
