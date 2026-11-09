import {icon,svgIcon,WORKER_ICONS} from './icons.mjs';
// Independently drawn SVGs. Only rule data and logical board coordinates are used.
import {NEUTRAL,WORKERS,WORKER_NAMES,cardInfo} from './data.mjs';
import {LAND_NODES,LAND_EDGES,SEA_NODES,SEA_EDGES,PORTS,WOOL_STATIONS} from './map-data.mjs';
import {NEUTRAL_ACTIONS,PRIVATE_ACTIONS,PRIVATE_B_ACTIONS,BONUS_EFFECTS,OBJECTIVES,OBJECTIVE_EFFECTS,DISKS} from './rule-data.mjs';
import {buildingData,hazardData,isWildcard,bonusPoints,LOCAL_TRADE,BONUS_ROW_COSTS} from './component-data.mjs';
import {resolveCard,ACTION_NAMES} from './sarah-cards.mjs';
const xml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const ink='#193f48',muted='#62787e',green='#24796e',gold='#a56922';
const colors={gray:'#7b8b91',green:'#368b69',white:'#7586a8',black:'#354657',orange:'#cc8431',red:'#bd625d',yellow:'#ac952b',blue:'#4489b4',brown:'#946950',purple:'#8965aa','bonus-yellow':'#a88e32','bonus-blue':'#4881a6',romney:'#597760'};
const text=(x,y,label,size=22,color=ink,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${xml(label)}</text>`;
const rect=(x,y,w,h,fill='#fff',stroke='none',r=12)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
const wrap=(value,width=16)=>{const chars=Array.from(String(value)),lines=[];for(let i=0;i<chars.length;i+=width)lines.push(chars.slice(i,i+width).join(''));return lines;};
const lines=(labels,x,y,size=18,width=16)=>labels.flatMap(v=>wrap(v,width)).map((v,i)=>text(x,y+i*(size+9),v,size)).join('');
const svg=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><g font-family="system-ui, sans-serif">${body}</g></svg>`;
const uri=s=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s).replace(/'/g,'%27');
const groupNames={dog:'牧羊犬',ferry:'渡轮',bird:'翠鸟',romney:'罗姆尼羊'};
const needNames={small:'红／黄羊',big:'蓝／棕羊',purple:'紫羊',hazard:'天灾',building:'建筑',building2:'至少 2 工匠建筑',building4:'至少 4 工匠建筑',warehouse:'仓库',pioneer:'开拓者格',shearer:'剃毛工',delivery:'至少价值 13 的运送',ferry:'渡轮'};
const effectNames={money:'获得 4 元',ship:'帆船移动最多 2 步',pioneer:'开拓者前进 2 格',exchange:'获得 2 交换',certificate:'认证前进 2 格'};
const utility={dog:['认证前进 1 格'],ferry:['获得 2 元'],bird:['开拓者前进 1 格'],bonus1:['每张已打出目标获得 1 元'],bonus2:['获得 1 元','开拓者前进 1 格'],bonus4:['获得 1 元；或将本回合获得','且仍在弃牌堆的牌移到牌库顶'],bonus5:['获得 1 元；或执行特殊仓库行动','按 3 步范围选择港口'],bonus6:['获得 2 元；或免费替换建筑','新建筑恰好高 1 工匠']};
function face(title,tag,body,footer='',color=green,square=false){const h=square?320:440;return uri(svg(320,h,rect(1,1,318,h-2,'#fffdf7','#d6e1dc',20)+rect(1,1,318,64,color,'none',20)+rect(1,32,318,32,color,'none',0)+text(20,40,tag,18,'#fff')+text(20,103,title,25,ink,'font-weight="700"')+body+text(20,h-20,footer,16,muted)));}
function sheepGlyph(color){return `<g fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"><path d="M115 173c-23-22-45 7-25 23-17 22 6 42 26 29 10 23 40 21 44 0 25 9 42-15 23-32 9-26-19-42-36-26-9-15-28-11-32 6Z"/><path d="M108 227v17m46-17v17M178 178l27 4 7 30-23 8-13-20"/><circle cx="201" cy="193" r="2" fill="${color}"/></g>`;}
function cardArt(catalog,def){const d=cardInfo(def);if(d.kind==='sheep')return face(d.name,`绵羊 / ${d.vp} 分`,sheepGlyph(colors[d.color])+rect(18,270,137,105,'#edf3ed')+rect(165,270,137,105,'#eaf1f5')+text(35,300,'育种价值',18)+text(35,352,d.value,40)+text(182,300,'羊毛价值',18)+text(182,352,d.wool,40),`${d.color==='purple'?'购入额外获得 1 交换 · ':''}同品种每次只计一张`,colors[d.color]);
 if(d.kind==='objective'){const i=catalog.groups.objective.indexOf(def.id),needs=i>=0?OBJECTIVES[i]:({bonus8:{small:1,warehouse:1},bonus9:{pioneer:3,warehouse:1},bonus10:{ferry:1,warehouse:1}}[d.group]);return face(d.name,'目标 / '+(i>=0?3:4)+' 分',lines(Object.entries(needs||{}).map(([k,n])=>`${needNames[k]||k} × ${n}`),20,150,20,13)+text(20,315,'打出时',17,muted)+lines([i>=0?effectNames[OBJECTIVE_EFFECTS[i]]:'获得 4 元'],20,347,19,14),'未完成的已打出目标扣分',gold);}
 return face(d.name,'行动卡'+(d.vp?` / ${d.vp} 分`:''),lines(utility[d.group]||['按回合提示执行行动'],20,160,21,13),'执行或放弃效果后补抽 1 张',green);
}
function tileArt(catalog,id,side){const d=catalog.tiles[id],n=NEUTRAL.find(n=>n.id===id),b=buildingData(catalog,id,side);
 if(n||b){const acts=n?NEUTRAL_ACTIONS[n.letter+(side==='b'&&['B','C','G','H'].includes(n.letter)?'2':'')]:((side==='b'?PRIVATE_B_ACTIONS:PRIVATE_ACTIONS)[catalog.groups.private.indexOf(id)]||[]);return face(n?'中立建筑 '+n.letter:'牧场建筑 '+(catalog.groups.private.indexOf(id)+1),`${n?'公共地点':'私有建筑'} / ${side==='b'?'II / b':'I / a'} 面`,lines(acts.map((a,i)=>`${i+1}. ${a.label}`),18,140,16,17),b?`${b.craftsmen} 工匠 · ${b.vp} 分 · 过路费 ${b.toll}`:'停留后按任意顺序执行',n?green:'#4e718e',true);}
 if(WORKERS.includes(d.name))return face(WORKER_NAMES[WORKERS.indexOf(d.name)],'工人',svgIcon(WORKER_ICONS[WORKERS.indexOf(d.name)],28,130,88,green)+text(170,197,'+1',52,green)+text(22,253,'解锁该列即时奖励',21),'费用按市场所在行计算',green,true);
 if(['flood','rockfall'].includes(d.name)){const h=hazardData(catalog,id);return face(d.name==='flood'?'洪水':'落石','天灾 / '+h.vp+' 分',lines([h.hand==='green'?'绿手过路费':'黑手过路费','移除后获得'+(d.name==='flood'?'渡轮':'牧羊犬')],20,165,23,12),'沿路费用由系统计算', '#947b5d',true);}
 if(d.group==='harbourmaster'){const i=catalog.groups.harbourmaster.indexOf(id),gain=['获得 6 元','永久认证 +1','开拓者前进 4 格','获得 5 元','获得 3 元和渡轮','获得 8 元','获得 9 元','永久认证 +1'][i],vp=['每张目标 1 分','每个永久认证 1 分','每片天灾 1 分','每 5 格开拓者 2 分','每张渡轮／奖励组1卡 1 分','每座建筑 1 分','每座仓库 1 分','每 2 名工人 1 分'][i];return face('港务长 '+(i+1),'派出一名已雇用工人',lines([gain,'终局：'+vp],20,148,20,14),'取得时自动结算奖励','#587c91',true);}
 if(isWildcard(catalog,id))return face('万能工人','奖励板块',lines(['选择一个工人列 +1','另付 1 金块'],20,160,23,12),'触发该列即时奖励',gold,true);
 const e=BONUS_EFFECTS[catalog.groups.bagB.indexOf(id)]||{},effects=[];
 for(const [k,n] of Object.entries(e)){if(k==='group')effects.push('获得'+(groupNames[n]||n));else if(k==='removeStarter')effects.push('移除价值 2 的起始羊');else if(k==='hazardCost')effects.push(`另付 ${n} 元移除天灾`);else effects.push(({gold:'金块 +',goldCost:'支付金块 ',wool:'永久羊毛 +',permanentCertificate:'永久认证 +',exchange:'交换 +',pioneer:'开拓者前进 '})[k]+n);}
 return face('牧场投资','奖励 / '+bonusPoints(catalog,id)+' 分',lines(effects,20,145,20,14),'费用按奖励市场所在行计算',gold,true);
}
export function boardArtwork(){
 let b=rect(0,0,2000,3000,'#eef3ec','none',0)+rect(0,0,2000,1000,'#e4f0f3','none',0)+rect(0,1005,2000,210,'#fffdf6','none',0);
 b+=`<path d="M75 1410Q130 1235 510 1325T1320 1310Q1535 1530 1395 1940T1450 2660Q1310 2910 850 2870T65 2810Q145 2470 60 2110T75 1410Z" fill="#e1eadb" stroke="#d2e0ce" stroke-width="10"/>`;
 b+='<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10" fill="#759082"/></marker></defs>';
 const edge=(a,z,color,dashed=false)=>`<polyline points="${a.x*20},${a.y*30} ${(a.x+z.x)*10},${(a.y+z.y)*15} ${z.x*20},${z.y*30}" fill="none" stroke="${color}" stroke-width="5" ${dashed?'stroke-dasharray="9 10"':'marker-mid="url(#arrow)"'}/>`;
 for(const [id,to] of Object.entries(SEA_EDGES))for(const n of to)if(Number(id)<Number(n))b+=edge(SEA_NODES[Number(id)],SEA_NODES[Number(n)],'#a8c5cd',true);
 for(const [id,to] of Object.entries(LAND_EDGES))for(const n of to)b+=edge(LAND_NODES[id],LAND_NODES[n],'#8eaa96');
 for(const n of SEA_NODES)b+=`<circle cx="${n.x*20}" cy="${n.y*30}" r="18" fill="#fff" stroke="#6f9dac" stroke-width="4"/>`+text(n.x*20,n.y*30+7,n.id,20,muted,'text-anchor="middle"');
 for(const n of Object.values(LAND_NODES)){const x=n.x*20,y=n.y*30;b+=rect(x-42,y-28,84,56,n.grass?'#d6e9ca':'#fdfef9','#aac2ad',14)+text(x,y+8,n.id,23,ink,'text-anchor="middle" font-weight="700"');if(n.slot)b+=text(x,y+53,`${n.pioneer?'开拓 '+n.pioneer:'空位'}${n.gold?' · 金块 +'+n.gold:''}`,18,muted,'text-anchor="middle"');}
 for(const p of PORTS){const x=p.x*20,y=p.y*30;b+=rect(x-57,y-49,114,106,p.kind==='medium'?'#dce9ef':'#fff7e5','#91aeb3',13)+svgIcon(p.kind==='medium'?'ship':p.wool?'wool':'barn',x-16,y-41,32,p.kind==='medium'?'#3f8195':gold)+text(x,y+12,p.kind==='large'?(p.wool?'毛':'外贸')+' ≥'+p.value:p.kind==='medium'?'港 '+p.points+' 分':'仓 '+p.points+' 分',18,ink,'text-anchor="middle"')+text(x,y+40,(p.kind==='large'?'运费 '+p.fee:'升级 '+p.cost)+' 元',16,muted,'text-anchor="middle"');}
 for(const t of LOCAL_TRADE){const x=t.x*20,y=1098;b+=rect(x-48,y-45,96,105,'#f5f1df','#d0c6a1')+text(x,y-11,'≥ '+t.value,26,ink,'text-anchor="middle" font-weight="700"')+text(x,y+21,'终局 '+t.points+' 分',16,gold,'text-anchor="middle"')+text(x,y+46,'运费 '+[0,0,0,0,3,4,5,6,7][LOCAL_TRADE.indexOf(t)],15,muted,'text-anchor="middle"');}
 for(const t of WOOL_STATIONS){const x=t.x*20,y=t.y*30;b+=rect(x-45,y-35,90,90,'#f5f1df','#d0c6a1')+text(x,y,'羊毛 ≥'+t.value,17,ink,'text-anchor="middle"')+text(x,y+22,'运费 '+t.fee+' 元',16,gold,'text-anchor="middle"')+text(x,y+44,'终局 '+t.points+' 分',15,muted,'text-anchor="middle"');}
 b+=text(70,101,'SEA / 海路',28,muted)+text(75,1047,'本地贸易站 · ≥ 育种门槛 / 运费 / 终局分',23,gold)+text(70,1270,'SOUTH ISLAND / 南岛',32,green)+text(70,1310,'沿箭头前进 · 空格不计步 · 高亮地点可点击',22,muted);
 b+=rect(1535,1560,440,1200,'#e1e9df','#c5d4c2',24)+text(1570,1625,'公共市场',32,green);
 for(let col=0;col<4;col++){b+=text((81.6+col*4.6)*20,1670,['羊','匠','航','毛'][col],25,ink,'text-anchor="middle"');for(let row=0;row<5;row++)b+=rect((81.6+col*4.6)*20-42,(57.2+row*3.35)*30-42,84,84,'#f6f9f0','#bdcfb9',10);}
 for(let row=0;row<5;row++)b+=text(1563,(57.2+row*3.35)*30+8,8-row+'元',19,muted,'text-anchor="middle"');
 b+=text(1570,2200,'奖励板块',28,gold);for(let row=0;row<7;row++)b+=text(1563,(76.2+row*3.3)*30+8,BONUS_ROW_COSTS[row]+'元',19,gold,'text-anchor="middle"');for(let col=0;col<4;col++)for(let row=0;row<7;row++)b+=rect((81.6+col*4.6)*20-42,(76.2+row*3.3)*30-42,84,84,'#fff9eb','#d6ccae',10);
 b+=text(75,2925,'沿途经营，远洋贸易。',36,green)+text(75,2970,'路线示意图 · 放大可查看节点与港口',22,muted);
 return uri(svg(2000,3000,b));
}
function mapTile(catalog,id,side){
 const d=catalog.tiles[id],n=NEUTRAL.find(n=>n.id===id),b=buildingData(catalog,id,side),wi=WORKERS.indexOf(d.name);
 let title=n?n.letter:b?String(catalog.groups.private.indexOf(id)+1):wi>=0?['羊','匠','航','毛'][wi]:d.name==='flood'?'洪':d.name==='rockfall'?'岩':isWildcard(catalog,id)?'全':'奖';
 let subtitle=n?({A:'雇工',B:'开拓 · 航海',C:'金块 · 投资',D:'建造',E:'剃毛',F:'购羊',G:'航海',H:'剃毛 · 投资'})[n.letter]:b?`${b.craftsmen} 工匠 / ${b.vp} 分`:wi>=0?'工人 +1':['flood','rockfall'].includes(d.name)?hazardData(catalog,id).vp+' 分':bonusPoints(catalog,id)+' 分';
 const color=n?green:b?'#4e718e':wi>=0?green:gold;
 return uri(svg(240,240,rect(1,1,238,238,'#fffdf7',color,22)+rect(1,1,238,40,color,'none',16)+text(120,28,n?'中立建筑':b?'私有建筑 '+side:wi>=0?'求职市场':'市场板块',20,'#fff','text-anchor="middle"')+(wi>=0?svgIcon(WORKER_ICONS[wi],70,62,100,color):!n&&!b?svgIcon(d.name==='flood'?'flood':d.name==='rockfall'?'rock':'star',70,62,100,color):text(120,n?116:150,title,n?70:96,color,'text-anchor="middle" font-weight="700"')+(n?({A:['sheep','market'],B:['pioneer','ship'],C:['gold','market'],D:['sheep','hammer'],E:['scissors','action'],F:['sheep','market'],G:['ship','action'],H:['scissors','market','rock']}[n.letter]).map((glyph,i,all)=>svgIcon(glyph,120-all.length*21+i*42,140,32,color)).join(''):''))+text(120,205,subtitle,24,ink,'text-anchor="middle"')));
}
export function originalCatalog(source){const c=structuredClone(source);for(const [id,d] of Object.entries(c.cards)){d.image=cardArt(c,d);d.back=face('羊群牌库','牧场经营',lines(['抽取下一张旅途中的机会'],20,180,24,10),'新西兰');}for(const [id,d] of Object.entries(c.tiles)){d.image=tileArt(c,id,'a');d.back=tileArt(c,id,'b');d.mapImage=mapTile(c,id,'a');d.mapBack=mapTile(c,id,'b');}c.board=boardArtwork();c.playerBoard=face('牧场经营','玩家能力',lines(['工人 · 圆片 · 仓库','在牧场面板查看当前能力'],20,160,22,13),'能力由规则自动结算');c.reference=c.playerBoard;return c;}
export function sarahArtwork(card,specialty){const movement=card.move.kind==='fixed'?card.move.value+' 步':card.move.kind==='worker'?WORKER_NAMES[WORKERS.indexOf(card.move.worker)]+'人数':'专精工人人数';return face('莎拉 · '+String(card.number).padStart(2,'0'),'单人对手 / 行动顺序',text(20,147,'移动：'+movement,23)+lines(resolveCard(card,specialty).map((a,i)=>`${i+1}. ${ACTION_NAMES[a.kind]||a.kind}${a.count?' '+a.count:''}${a.limit?'（最多 '+a.limit+' 工匠）':''}${a.color?'（'+(a.color==='red'?'红羊':'棕羊')+'）':''}`),20,200,20,14),'唯一合法结果自动结算','#4f667d');}
export {playerBoard as playerDashboard} from './player-board.mjs';
