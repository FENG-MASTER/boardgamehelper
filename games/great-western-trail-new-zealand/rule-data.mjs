// Printed Chinese appendix, pages 1–4. Each array entry is one once-per-visit action.
const a=(kind,label,options={})=>({kind,label,...options});
export const NEUTRAL_ACTIONS={
 A:[a('discard','弃两张相同绵羊，获得 2 元',{same:2,money:2}),a('hire','雇用工人',{price:0}),a('hire','再次雇用工人（+3 元）',{price:3})],
 B:[a('choice','开拓者前进 2 格／获得目标',{options:[a('pioneer','开拓者 +2',{count:2}),a('objective','获得目标')]}),a('ship','按水手人数移动帆船',{workers:true})],
 B2:[a('choice','附属行动一次／获得目标',{options:[a('aux','附属行动',{limit:1}),a('objective','获得目标')]}),a('pioneer','开拓者 +2',{count:2})],
 C:[a('gold','获得 1 金块',{count:1}),a('aux','附属行动 1～2 次',{limit:2}),a('bonus','投资奖励板块',{price:0})],
 C2:[a('aux','附属行动 1～2 次',{limit:2}),a('bonus','投资奖励板块',{price:0}),a('bonus','再次投资（+3 元）',{price:3})],
 D:[a('discard','弃一张绿色起始羊，获得 2 元',{color:'green',money:2}),a('build','建造／替换建筑',{rate:2})],
 E:[a('shear','剃毛及抽换牌',{workers:true}),a('aux','附属行动一次',{limit:1})],
 F:[a('discard','弃一张黑色起始羊，获得 3 元',{color:'black',money:3}),a('market','采购绵羊',{workers:true})],
 G:[a('ship','按水手人数移动帆船',{workers:true}),a('ship','移动帆船一步',{count:1}),a('aux','附属行动一次',{limit:1})],
 G2:[a('ship','按水手人数移动帆船',{workers:true}),a('ship','再次按水手人数移动帆船',{workers:true})],
 H:[a('shear','给一只羊剃毛',{count:1}),a('bonus','投资奖励板块',{price:0}),a('hazard','支付 5 元移除天灾',{price:5})],
 H2:[a('choice','附属行动一次／获得目标',{options:[a('aux','附属行动',{limit:1}),a('objective','获得目标')]}),a('hazard','支付 5 元移除天灾',{price:5})]
};
export const PRIVATE_ACTIONS=[
 [a('grassMoney','每座茂草区建筑获得 2 元'),a('aux','附属行动一次',{limit:1})],
 [a('aux','附属行动 1～2 次',{limit:2}),a('rancher','牧场主前进 1 步',{count:1})],
 [a('shear','给最多两只羊剃毛',{count:2}),a('bonus','投资奖励板块',{price:0})],
 [a('hire','雇用工人（−2 元）',{price:-2}),a('cycle','抽换最多两张',{count:2})],
 [a('ship','按水手人数移动帆船',{workers:true}),a('rancher','牧场主前进最多两步',{count:2})],
 [a('hazardIncome','每两片天灾获得 7 元、开拓者前进 2 格')],
 [a('shear','给最多三只羊剃毛',{count:3}),a('ship','移动帆船最多三步',{count:3})],
 [a('money','获得 7 元',{count:7}),a('rancher','牧场主前进最多三步',{count:3})],
 [a('hire','雇用工人（−3 元）',{price:-3}),a('bonus','投资奖励板块',{price:0}),a('hazard','免费移除天灾',{price:0})],
 [a('money','获得 7 元',{count:7}),a('woolDelivery','运往 13 羊毛站',{value:13})]
];
export const BONUS_EFFECTS={
 0:{group:'ferry',gold:2},1:{permanentCertificate:1},2:{group:'ferry',gold:2},3:{wool:1,exchange:1},4:{goldCost:4},
 5:{removeStarter:true,group:'romney',gold:1},6:{goldCost:4},7:{exchange:1},8:{pioneer:2,group:'bird',gold:1},9:{removeStarter:true,group:'romney',gold:1},10:{removeStarter:true,group:'romney',gold:1},11:{pioneer:2,group:'bird',gold:1},12:{exchange:3,gold:1},13:{pioneer:2,group:'bird',gold:1},14:{hazardCost:3},
 24:{pioneer:2,group:'bird',gold:1},25:{hazardCost:3},26:{group:'dog',gold:2},28:{pioneer:2,group:'bird',gold:1},29:{hazardCost:3},31:{pioneer:2,group:'bird',gold:1},32:{hazardCost:3},33:{group:'dog',gold:2}
};
export const DISKS=[
 ...['money','cycle'].map(kind=>({id:'aux-'+kind+'-2',label:`${kind==='money'?'钱币':'抽换'}附属行动第二次`,color:'white',aux:kind})),
 ...['certificate','ship','pioneer'].flatMap(kind=>[1,2].map(n=>({id:`aux-${kind}-${n}`,label:`${{certificate:'认证',ship:'帆船',pioneer:'开拓者'}[kind]}附属行动 ${n}`,color:'white',aux:kind}))),
 {id:'wool1',label:'永久羊毛 +1',color:'white',wool:1},{id:'wool2',label:'永久羊毛 +2（4 元）',color:'black',wool:2,cost:4},
 {id:'hand1',label:'手牌上限 +1（3 元）',color:'black',handLimit:1,cost:3},{id:'hand2',label:'手牌上限 +1（8 元，终局 3 分）',color:'black',handLimit:1,cost:8,vp:3},
 {id:'steps',label:'移动上限 +1，获得 3 元',color:'white',steps:1,money:3},
 {id:'certificateMax',label:'临时认证上限变为 5',color:'black',certificateMax:5},
 {id:'permanent1',label:'永久认证 +1（4 元）',color:'white',permanentCertificate:1,cost:4},{id:'permanent2',label:'永久认证 +1',color:'black',permanentCertificate:1}
];
// Objective requirements are read from actual card faces, not the example icons in the rulebook.
export const OBJECTIVES=[
 {small:1,big:1,hazard:1},{building:2,hazard:1},{pioneer:5,warehouse:2},{hazard:1,warehouse:3},{small:1,warehouse:3},{big:1,delivery:1},{small:1,building:2},
 {shearer:2,hazard:1},{big:1,pioneer:6},{small:1,big:1,purple:1},{pioneer:8,building:1},{building4:1,hazard:1},{hazard:1,delivery:1},{pioneer:4,delivery:1},{building:1,delivery:1},{shearer:2,pioneer:6},
 {shearer:2,warehouse:2},{building2:1,warehouse:2},{hazard:1,warehouse:3},{small:2,delivery:1},{shearer:2,building:1},{small:1,building4:1},{hazard:1,delivery:1},{small:1,purple:1,building:1}
];
export const OBJECTIVE_EFFECTS=Array.from({length:24},(_,i)=>i<=6?'money':i<=15?'ship':i===16||i>=22?'pioneer':i<=19?'exchange':'certificate');
export const SHEEP_OFFERS=[
 {id:'orange1',workers:1,cost:3,colors:['orange'],count:1},{id:'orange2',workers:2,cost:1,colors:['orange'],count:1},
 {id:'small1',workers:1,cost:5,colors:['red','yellow'],count:1},{id:'small2',workers:2,cost:2,colors:['red','yellow'],count:1},
 {id:'big1',workers:1,cost:9,colors:['blue','brown'],count:1},{id:'big3',workers:3,cost:5,colors:['blue','brown'],count:1},{id:'pair',workers:3,cost:3,colors:['red','yellow'],count:2},
 {id:'purple2',workers:2,cost:10,colors:['purple'],count:1,exchange:1},{id:'purple4',workers:4,cost:4,colors:['purple'],count:1,exchange:1}
];
export const PRIVATE_B_ACTIONS=[
 [a('grassCertificate','每座茂草区建筑使认证前进 1 格'),a('aux','附属行动一次',{limit:1})],
 [a('aux','附属行动一次',{limit:1}),a('rancher','牧场主前进最多两步',{count:2})],
 [a('discard','弃两张相同绵羊，获得 3 元',{same:2,money:3}),a('bonus','投资奖励板块',{price:0})],
 [a('shepherdMoney','每名牧羊人获得 2 元'),a('cycle','抽换最多三张',{count:3})],
 [a('warehouseMoney','每个仓库获得 1 元'),a('rancher','牧场主前进最多两步',{count:2})],
 [a('discardGold','弃一只羊，获得 5 元及 1 金块'),a('pioneer','开拓者前进三格',{count:3})],
 [a('money','获得 6 元',{count:6}),a('supply','获得罗姆尼羊',{group:'romney'})],
 [a('exchange','获得 1 交换指示物',{count:1}),a('money','获得 5 元',{count:5}),a('rancher','牧场主前进最多三步',{count:3})],
 [a('aux','附属行动 1～2 次',{limit:2}),a('certificate','认证前进两格',{count:2}),a('pioneer','开拓者前进四格',{count:4})],
 [a('ship','移动帆船最多三步',{count:3}),a('remoteWarehouse','在七步范围内放置仓库',{count:7})]
];
