import {NEUTRAL} from './data.mjs';
// Coordinates refer to the supplied original board, in percent.
const slots=[
 ['a1',29.5,92.4,false],['a2',45.6,93.2,true,2,2],['a3',40.6,86.8,true,0,0,'gold'],
 ['b1',64.3,78.5,true,7,2],['b2',50.2,80.7,false,0,0,'money2'],
 ['c1',50,70.5,true],['c2',38,70.5,true],['c3',17.7,77.6,false,0,0,'gold'],['c4',7.8,73.8,false,0,0,'money1'],
 ['d1',10.7,66.9,true],['d2',26.6,63.5,false],
 ['e1',15.8,52.4,true],['e2',6.5,54.4,true,4,2,'money2'],
 ['f1',26.4,44.3,true,2,1],['f2',36.5,46.6,false],['f3',43.3,52.5,false],['f4',46.8,63.1,false,0,0,'money2'],['f5',60.7,62.9,true,0,0,'gold'],
 ['g1',53.3,46,false],['g2',63.4,50.2,true]
];
export const LAND_NODES=Object.fromEntries([
 ...NEUTRAL.map(n=>[n.letter,{id:n.letter,x:n.x,y:n.y,neutral:n.id,label:'中立建筑 '+n.letter}]),
 ...slots.map(([id,x,y,grass,pioneer=0,gold=0,risk=null])=>[id,{id,x,y,grass,pioneer,gold,risk,slot:true,label:`建筑格 ${id}${grass?' · 茂草区':''}${pioneer?' · 开拓者 '+pioneer:''}`}]),
 ...[[23.8,87.5],[31.2,87.2],[40,79],[33,79],[26.8,79]].map(([x,y],i)=>['r'+i,{id:'r'+i,x,y,hazard:'rockfall',slotIndex:i,label:'落石 '+(i+1)}]),
 ...[[6.5,46.5],[24,51.7],[30.5,57],[36.2,61.5]].map(([x,y],i)=>['flood'+i,{id:'flood'+i,x,y,hazard:'flood',slotIndex:i,label:'洪水 '+(i+1)}]),
 ['start',{id:'start',x:6,y:90,label:'起点'}],['W',{id:'W',x:86,y:46,label:'威灵顿'}]
]);
const paths=[['start','A'],['A','a1','a2','B'],['A','r0','r1','a3','B'],['B','b1','C'],['B','b2','r2','r3','r4','c3','c4','D'],['C','r2'],['C','c1','c2','D'],['D','d1','E'],['D','d2','E'],['E','e1','F'],['E','e2','flood0','F'],['F','f1','f2','f3','G'],['F','flood1','flood2','flood3','f4','f5','G'],['G','g1','H'],['G','g2','H'],['H','W']];
export const LAND_EDGES={};for(const path of paths)for(let i=1;i<path.length;i++)(LAND_EDGES[path[i-1]]??=[]).push(path[i]);
export function occupant(s,catalog,id){const n=LAND_NODES[id];if(n?.neutral)return {uid:n.neutral,neutral:true};if(id==='W')return {uid:'W'};if(n?.hazard)return s.hazards.find(t=>catalog.tiles[t.def].name===n.hazard&&t.slot===n.slotIndex);return s.boardPieces.find(t=>t.type==='building'&&(t.node===id||Math.hypot(t.x-n.x,t.y-n.y)<2.5));}
export function nearestLand(x,y){return Object.values(LAND_NODES).filter(n=>n.id!=='start').sort((a,b)=>Math.hypot(x-a.x,y-a.y)-Math.hypot(x-b.x,y-b.y))[0];}
export function landRoutes(s,catalog,from,limit){const routes=[];function visit(id,path,steps){for(const next of [...new Set(LAND_EDGES[id]||[])]){if(path.includes(next))continue;const n=occupant(s,catalog,next),count=steps+(n?1:0),route=[...path,next];if(count>limit)continue;if(n)routes.push({destination:next,path:route,steps:count});if(next!=='W')visit(next,route,count);}}visit(from,[],0);return routes;}
// Sea spaces are connected by dotted lines; travel is bidirectional.
export const SEA_NODES=[
 [94,24],[84,18.7],[75.5,16.7],[84,8.7],[84,2.4],[73,2],[64,1.7],[56,5.9],
 [56,15],[45,14],[35,17.2],[27,18.2],[20,19.4],[21,13.8],[28.5,11.3],[24.4,7],[13.7,7],[6.6,14.5],[5.8,19.6],[5.8,24],[8,28.7],[19.5,25.7],[25,22],[29.5,25.5],[39,25.5],[42,29.4],[49.5,25.5],[61.5,25.8],[71,25.8],[70.8,20.7],[35.3,7],[43,5.9],[55.5,1.8],[14.5,11],[73,11.3]
].map(([x,y],i)=>({id:String(i),x,y,label:'海路 '+i}));
export const SEA_EDGES={};const seaPaths=[[0,1,2,3,4,5,6,32,7,31,30,14,15],[14,13,12,11,10,9,8,34,3],[4,34],[16,33,17,18,19,20,21,22,11],[21,23,24,25,26,27,28,29,2],[1,29]];for(const path of seaPaths)for(let i=1;i<path.length;i++){(SEA_EDGES[path[i-1]]??=[]).push(String(path[i]));(SEA_EDGES[path[i]]??=[]).push(String(path[i-1]));}
export function seaDistances(from){const distances={[from]:0},q=[String(from)];while(q.length){const id=q.shift();for(const n of SEA_EDGES[id]||[])if(distances[n]===undefined){distances[n]=distances[id]+1;q.push(n);}}return distances;}
// Port costs, card rewards, printed points and station values.
export const PORTS=[
 {id:'local-small1',nodes:['29'],x:64,y:21,kind:'small',cost:2,points:2,group:'dog'},
 {id:'local-small2',nodes:['21'],x:19,y:30,kind:'small',cost:2,points:3,group:'bird'},
 {id:'local-small3',nodes:['14'],x:34,y:11,kind:'small',cost:3,points:4,group:'ferry'},
 {id:'bell',nodes:['32'],x:48,y:2,kind:'small',cost:3,points:4,bonus:2},
 {id:'compass1',nodes:['30'],x:35,y:2,kind:'small',cost:4,points:4,bonus:3},
 {id:'compass2',nodes:['15'],x:24,y:2,kind:'small',cost:3,points:4,bonus:3},
 {id:'compass3',nodes:['16'],x:14,y:2,kind:'small',cost:3,points:6,bonus:3,reset:true},
 {id:'medium1',nodes:['2'],x:69,y:16,kind:'medium',cost:2,points:1,bonus:0,master:0,black:true},
 {id:'medium2',nodes:['27'],x:62,y:30,kind:'medium',cost:3,points:2,bonus:1,master:1,black:true},
 {id:'medium3',nodes:['7','8'],x:55,y:11,kind:'medium',cost:4,points:3,bonus:1,master:2,black:true},
 {id:'medium4',nodes:['10','24'],x:38,y:21,kind:'medium',cost:4,points:4,bonus:2,master:3,black:true},
 {id:'medium5',nodes:['12','18'],x:12,y:20,kind:'medium',cost:4,points:5,group:'ferry',master:4,black:true},
 {id:'foreign5',nodes:['1'],x:83,y:16,kind:'large',value:5,points:1,fee:0,black:false},
 {id:'foreign7',nodes:['3'],x:89,y:9,kind:'large',value:7,points:2,fee:3,black:true},
 {id:'foreign11',nodes:['4'],x:90,y:3,kind:'large',wool:true,value:11,points:6,fee:3,black:true,group:'romney'},
 {id:'foreign16',nodes:['6'],x:67,y:6,kind:'large',wool:true,value:16,points:10,fee:10,black:true,group:'romney'},
 {id:'foreign13',nodes:['26'],x:53,y:30,kind:'large',value:13,points:8,fee:4,black:true},
 {id:'foreign23',nodes:['23'],x:34,y:30,kind:'large',value:23,points:17,fee:5,black:true}
];
export const WOOL_STATIONS=[{id:'wool5',value:5,fee:2,points:2,x:95.7,y:30.1,black:false},{id:'wool9',value:9,fee:5,points:1,x:89.5,y:30.1,black:true,group:'romney'},{id:'wool13',value:13,fee:7,points:3,x:83.5,y:30.1,black:true,group:'romney',repeat:true}];

for(const p of PORTS)p.label=p.kind==='large'?`${p.wool?'羊毛':'外贸'}港口 ${p.value}`:p.kind==='medium'?`中型港口 · ${p.points} 分`:`小型港口 · ${p.points} 分（${p.group?{dog:'牧羊犬',bird:'翠鸟',ferry:'渡轮'}[p.group]:['船舵','酒桶','钟','罗盘'][p.bonus]}）`;
