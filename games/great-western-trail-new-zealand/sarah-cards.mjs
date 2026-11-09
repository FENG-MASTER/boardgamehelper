// Card faces supplied by the user on 2026-11-09. Card artwork takes precedence
// over the solo booklet's inconsistent parenthetical card-number references.
const fixed=value=>({kind:'fixed',value});
const worker=worker=>({kind:'worker',worker});
const specialty={kind:'specialty'};
const branch=(specialty,yes,no)=>({kind:'branch',specialty,yes,no});
const action=(kind,extra={})=>({kind,...extra});
const buy=action('buySheep'),build=action('build'),hazard=action('hazard'),objective=action('objective');
const pioneer=n=>action('pioneer',{count:n});
const definitions=[
 [1,fixed(2),[action('hire',{preference:'cheapest'})]],
 [2,fixed(2),[action('hire',{preference:'specialty'})]],
 [3,fixed(2),[buy]],
 [4,fixed(2),[build]],
 [5,fixed(1),[action('removeBonus'),pioneer(2)]],
 [6,fixed(3),[objective,pioneer(2)]],
 [7,fixed(3),[pioneer(2)]],
 [8,fixed(3),[action('removeBonus'),hazard]],
 [9,fixed(3),[objective,hazard]],
 [10,worker('shepherd'),[branch('shepherd',[buy],[action('smallSheep')])]],
 [11,worker('craftsman'),[branch('craftsman',[build],[action('build',{limit:1})])]],
 [12,worker('sailor'),[branch('sailor',[action('sailorReward')],[pioneer(1)])]],
 [13,worker('shearer'),[branch('shearer',[action('shearerReward',{color:'red'})],[action('extraMove',{count:1})])]],
 [14,specialty,[branch('shepherd',[action('refillSheep',{count:2}),buy],[action('smallSheep'),action('orangeSheep')])]],
 [15,specialty,[branch('craftsman',[build],[action('build',{limit:2})])]],
 [16,specialty,[branch('sailor',[action('sailorReward')],[pioneer(2)])]],
 [17,specialty,[branch('shearer',[action('shearerReward',{color:'brown'})],[action('extraMove',{count:2})])]],
];
export const SARAH_CARDS=definitions.map(([number,move,actions])=>({number,move,actions,image:`assets/sarah-${String(number).padStart(2,'0')}.webp`,source:'doc/大西部开拓者：新西兰/mmexport1794194493458.jpg'}));
export function resolveCard(card,specialization){const expand=actions=>actions.flatMap(a=>a.kind==='branch'?expand(a.specialty===specialization?a.yes:a.no):[a]);return expand(card.actions);}
export const ACTION_NAMES={hire:'免费雇用工人',buySheep:'按牧羊人数购买绵羊',build:'建造／替换私有建筑',removeBonus:'移除奖励市场板块',pioneer:'前进开拓者轨',objective:'获得最远的目标卡',hazard:'移除最高分天灾',smallSheep:'获得较稀少的红色或黄色绵羊',orangeSheep:'获得橙色绵羊',refillSheep:'免费补充绵羊市场',sailorReward:'按水手人数获得奖励卡',shearerReward:'按剃毛工人数获得绵羊',extraMove:'额外移动',wellington:'结算威灵顿',workerPort:'工人格奖励：中型港口',workerWool:'工人格奖励：羊毛贸易站'};
