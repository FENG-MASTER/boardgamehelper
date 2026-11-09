// Printed a-side values, indexed by the original source manifest.
export const BUILDING_DATA=[
 [1,1,1],[1,1,0],[2,3,0],[2,3,1],[3,4,0],[4,5,2],[5,6,0],[7,9,1],[9,13,0],[10,15,0]
].map(([craftsmen,vp,toll])=>({craftsmen,vp,toll}));
const hazards={0:[2,'green'],1:[2,'green'],5:[3,'black'],8:[2,'black'],9:[4,'green'],12:[3,'black'],13:[4,'black'],14:[3,'green'],21:[3,'black'],22:[2,'green'],23:[4,'green'],24:[2,'black'],36:[3,'black'],37:[4,'black'],38:[3,'green'],39:[3,'green']};
const wildcardIndices=[15,16,17,18,19,20,21,22,23,27,30];
export const BONUS_ROW_COSTS=[7,6,8,5,8,7,6];
export const BUILDING_B_DATA=[[1,1,1],[1,1,0],[2,3,1],[2,3,0],[3,4,1],[4,5,0],[5,6,0],[6,8,2],[8,12,1],[10,15,0]].map(([craftsmen,vp,toll])=>({craftsmen,vp,toll}));
export function buildingData(catalog,def,side='a'){return (side==='b'?BUILDING_B_DATA:BUILDING_DATA)[catalog.groups.private.indexOf(def)];}
export function hazardData(catalog,def){const [vp,hand]=hazards[catalog.groups.bagA.indexOf(def)]||[0,'none'];return {vp,hand,type:catalog.tiles[def].name};}
export function isWildcard(catalog,def){return wildcardIndices.includes(catalog.groups.bagB.indexOf(def));}
export function bonusPoints(catalog,def){const i=catalog.groups.bagB.indexOf(def);if(i<0)return 0;if(wildcardIndices.includes(i))return 0;if([4,6].includes(i))return 8;if(i===7)return 4;return 2;}
export function objectivePoints(catalog,def){return catalog.cards[def].group==='objective'?3:4;}
export const LOCAL_TRADE=[
 {value:0,x:59.3,points:-8,reward:null},{value:1,x:52.8,points:1,reward:null},
 {value:3,x:46.3,points:0,reward:'ferry'},{value:6,x:39.6,points:0,reward:'objective'},
 {value:9,x:33,points:0,reward:'objective'},{value:12,x:26.7,points:4,reward:null},
 {value:15,x:20.2,points:7,reward:null},{value:18,x:13.8,points:10,reward:null},
 {value:21,x:7.2,points:13,reward:null}
];
