import {newGame,act} from './engine.mjs';

// The walkthrough uses its own game. Nothing here writes to browser storage.
export function tutorialSteps(){
 let s=newGame('roswell',42,0);
 s.dice.forEach((d,i)=>d.value=[3,4,3,4,2][i]);
 const steps=[];
 const add=(target,title,body,next='下一步')=>steps.push({target,title,body,next,state:structuredClone(s)});
 add('.status','守住城市，完成研究','这是一局独立的教学演示。能源用来做事，损伤满格就输；把研究路线走完就赢。退出教程后，会回到你原来的页面。');
 add('.dice','每轮用五颗骰子安排工作','三颗灰骰、两颗白骰。平时先点一颗骰子，再点基地里的位置。每列只能放一颗工人骰。我们先看一颗 3 点灰骰。');
 add('[data-cell="0-0"]','把 3 点骰放进防空塔','基地最上排是防空塔。放在第 1 列，会让这一列敌舰下降 3 − 1 = 2 格。下面点“演示放骰”，看看变化。','演示放骰');
 s=act(s,{type:'place',id:0,cell:'0-0'});
 add('.sky-row:nth-child(3)','敌舰已经下降了两格','第 1 列的紫色 ◆ 从母舰向下走了两格。放骰会立刻移动敌舰；基地里的发电、研究等工作，要等五颗骰子全放完。');
 add('.die.white','白骰会改变剩下的点数','每放一颗白骰，所有还没放的骰子都会重掷。已经放好的不会变。想保住一个好点数，可以先把它放好。接下来演示安排其余骰子。','继续安排');
 s=act(s,{type:'place',id:1,cell:'1-3'});
 s=act(s,{type:'place',id:2,cell:'1-4'});
 s=act(s,{type:'place',id:3,cell:'1-1'});
 // After the white reroll, use a fixed teaching value for the last die.
 s.dice[4].value=2;
 add('[data-cell="2-2"]','还可以安排挖掘','这格还在阴影中，沿蛇形路线离钻探机 2 格。最后一颗 2 点白骰够得着。放下只是安排任务，稍后还要花 1 能源完成挖掘。','演示挖掘安排');
 s=act(s,{type:'place',id:4,cell:'2-2'});
 add('[data-room="1-3"]','五颗放完，先发电','这间充能室跨两格，放了 4 点和 3 点骰，设施修正是 −3，因此得到 4 点能源。这个按钮会直接执行行动，你可以自行决定设施使用顺序。','演示发电');
 s=act(s,{type:'resolve',id:'1-3'});
 add('.status > div:nth-child(2)','能源从 2 增加到 6','现在有钱做其他工作了。研究中心放的是 4 点骰，房间没有加减修正，所以得到 4 点研究。启动还要另外花 2 能源，这个费用不从研究点中扣。下一步看看能走几格。','演示研究');
 s=act(s,{type:'resolve',id:'1-1'});
 add('.research-track','4 点研究，刚好走两格','前两格的费用是 3 和 1，因此这次前进两格。下次从第三格继续。每次研究剩余的点数不会保留，也不能与另一个研究中心先相加。');
 add('[data-action="dig"]','别忘了完成挖掘','现在点击这个按钮，就能花 1 能源挖到刚才选的位置。挖掘骰只负责挖掘，不能再启动它所在的房间。','演示完成挖掘');
 s=act(s,{type:'dig'});
 add('[data-cell="2-2"]','阴影退去，下轮选择更多','钻探机已经前进到这里，沿途房间也挖开了。每轮最多安排一次挖掘。以后放骰时，就可以使用这些新位置。');
 s=act(s,{type:'endBase'});
 add('[data-action="mother"]','最后轮到母舰行动','做完基地工作，点击“结束基地阶段”，再点这里。母舰会下降、执行右侧事件，然后让等待的敌舰重新出发。如果出现多个列按钮，选一个就能继续。');
 add('.mothership','你已经学会一轮的流程','放骰时看敌舰，基地阶段先后安排发电、研究和挖掘，最后处理母舰。正式游戏时随时可以重看教程，或打开“玩法说明”查战机、机器人等细节。','完成教程');
 return steps;
}

export function installTutorial({show,restore}){
 const dialog=document.createElement('dialog');
 dialog.className='tutorial';
 dialog.setAttribute('aria-labelledby','tutorial-title');
 dialog.innerHTML='<div class="tutorial-focus" aria-hidden="true"></div><section class="tutorial-card"><div class="tutorial-top"><span id="tutorial-progress"></span><button type="button" data-tour="exit" aria-label="退出教程">跳过 / 退出</button></div><div aria-live="polite" aria-atomic="true"><h2 id="tutorial-title"></h2><p id="tutorial-body"></p></div><div class="tutorial-actions"><button type="button" data-tour="back">上一步</button><button type="button" class="primary" data-tour="next">下一步</button></div></section>';
 document.body.append(dialog);
 let steps=[],index=0,active=false,returnFocus,scrollPosition=0,frame;
 const card=dialog.querySelector('.tutorial-card'),focus=dialog.querySelector('.tutorial-focus');
 function position(scroll=false){
  if(!active)return;
  const target=document.querySelector(steps[index].target);
  if(!target){focus.hidden=true;return;}
  focus.hidden=false;
  const area=Math.max(80,window.innerHeight-card.offsetHeight-45);
  if(scroll){const r=target.getBoundingClientRect();window.scrollTo({top:Math.max(0,window.scrollY+r.top-(area-Math.min(r.height,area))/2),behavior:'instant'});}
  const r=target.getBoundingClientRect();
  focus.style.left=`${Math.max(4,r.left-5)}px`;
  focus.style.top=`${Math.max(4,r.top-5)}px`;
  focus.style.width=`${Math.min(window.innerWidth-8,r.width+10)}px`;
  focus.style.height=`${Math.max(20,Math.min(r.height+10,area))}px`;
 }
 function paint(){
  const step=steps[index];show(structuredClone(step.state));
  dialog.querySelector('#tutorial-progress').textContent=`教学演示 · ${index+1} / ${steps.length}`;
  dialog.querySelector('#tutorial-title').textContent=step.title;
  dialog.querySelector('#tutorial-body').textContent=step.body;
  dialog.querySelector('[data-tour="next"]').textContent=step.next;
  dialog.querySelector('[data-tour="back"]').disabled=index===0;
  cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>position(true));
 }
 function close(){if(!active)return;active=false;cancelAnimationFrame(frame);dialog.close();document.body.classList.remove('tutorial-active');restore();window.scrollTo({top:scrollPosition,behavior:'instant'});if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});else document.querySelector('#tutorial-start').focus({preventScroll:true});}
 dialog.addEventListener('click',e=>{const action=e.target.closest('[data-tour]')?.dataset.tour;if(action==='exit')close();if(action==='back'&&index>0){index--;paint();}if(action==='next'){if(index===steps.length-1)close();else{index++;paint();}}});
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 const reposition=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>position());};
 window.addEventListener('scroll',reposition,{passive:true});window.addEventListener('resize',()=>{if(active)position(true);});
 return ()=>{if(active)return;returnFocus=document.activeElement;scrollPosition=window.scrollY;steps=tutorialSteps();index=0;active=true;document.body.classList.add('tutorial-active');dialog.showModal();paint();dialog.querySelector('[data-tour="next"]').focus({preventScroll:true});};
}
