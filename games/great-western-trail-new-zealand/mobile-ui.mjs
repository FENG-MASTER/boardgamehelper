import {icon,RESOURCE_ICONS} from './icons.mjs';
import {PHASES,COLORS} from './data.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function suggestedScreen(s){const p=s.players[s.active];if(p.isSarah)return 'turn';if(s.pending||s.phase==='income'||s.phase==='start'&&p.hand.length>4)return 'hand';if(s.phase==='A'&&!s.ruleTasks?.length)return 'map';return 'turn';}
export function mobileShell(s,screen,content,dock,canUndo){const p=s.players[s.active];
 const nav=[['turn','行动','action'],['map','地图','map'],['hand',`手牌 ${p.hand.length}`,'hand'],['market','市场','market'],['estate','牧场','barn']];
 return `<div class="mobile-game"><header class="mobile-header"><div><small>新西兰 · 第 ${s.turn} 回合</small><strong><i style="background:${COLORS[s.active]}"></i>${esc(p.name)}<span>${esc(PHASES[s.phase])}</span></strong></div><button data-action="undo" aria-label="撤销上一步" ${canUndo?'':'disabled'}>↶</button><button data-mobile-menu aria-label="更多选项">•••</button></header><div class="mobile-resources" aria-label="当前资源">${[['money','钱币'],['gold','金块'],['exchange','交换'],['pioneer','开拓'],['certificate','认证'],['wool','羊毛']].map(([k,n])=>`<span class="mobile-resource"><span class="mobile-resource-value">${icon(RESOURCE_ICONS[k])}<b>${p[k]}</b></span><small>${n}</small></span>`).join('')}</div><main class="mobile-page ${screen==='map'?'mobile-map-view':''}" id="mobile-page" aria-label="${esc(nav.find(n=>n[0]===screen)?.[1]||'规则')}">${content}</main>${dock?`<section class="mobile-dock" aria-label="当前操作">${dock}</section>`:''}<nav class="mobile-nav" aria-label="游戏导航">${nav.map(([id,name,glyph])=>`<button data-mobile-screen="${id}" aria-current="${screen===id?'page':'false'}">${icon(glyph)}${esc(name)}</button>`).join('')}</nav></div>`;
}
export function frameMap(view,points){
 const board=view?.querySelector('#board');if(!view||!board||!points.length)return;
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y),x0=Math.min(...xs)-7,x1=Math.max(...xs)+7,y0=Math.min(...ys)-5,y1=Math.max(...ys)+5;
 const width=Math.max(500,Math.min(900,(view.clientWidth-12)/((x1-x0)/100),(view.clientHeight-12)/((y1-y0)*1.5/100)));
 board.style.width=width+'px';view.scrollLeft=(x0+x1)/200*board.clientWidth-view.clientWidth/2;view.scrollTop=(y0+y1)/200*board.clientHeight-view.clientHeight/2;
}
