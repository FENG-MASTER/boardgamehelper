const test=require('node:test');
const assert=require('node:assert/strict');
test('教学演示按规则推进，快照独立且可以重新开始',async()=>{
 const {tutorialSteps}=await import('../games/under-falling-skies/tutorial.mjs');
 const {validateSave}=await import('../games/under-falling-skies/engine.mjs');
 const steps=tutorialSteps();
 for(const step of steps){assert.ok(step.target);validateSave(step.state);assert.notEqual(step.state.phase,'over');}
 assert.equal(steps[3].state.ships[0].row,1);
 assert.equal(steps[6].state.phase,'resolve');
 assert.equal(steps[7].state.energy,6);
 assert.equal(steps[8].state.energy,4);
 assert.equal(steps[8].state.research,2);
 assert.equal(steps[10].state.energy,3);
 assert.equal(steps[10].state.excavated,12);
 assert.equal(steps.at(-1).state.phase,'mother');
 steps[0].state.energy=100;
 assert.equal(steps[1].state.energy,2);
 assert.equal(tutorialSteps()[0].state.energy,2);
});
