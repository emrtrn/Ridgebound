import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const local=existsSync('forge.local.json')?JSON.parse(await readFile('forge.local.json','utf8')):{};
const forge=resolve(process.env.FORGE_ROOT??local.forgeRoot??'../../Forge');
const req=createRequire(resolve(forge,'package.json'));
const {build}=req('esbuild');
const bundle=await build({bundle:true,write:false,platform:'node',format:'esm',tsconfig:resolve(forge,'tsconfig.json'),stdin:{
 resolveDir:process.cwd(),loader:'ts',contents:`export {createDepotGameMode} from './src/game/m0/depotGameMode'; export {PerspectiveCamera,Object3D} from 'three'; export {ActionMap} from ${JSON.stringify(resolve(forge,'engine/input/actionMap.ts'))}; export {DEFAULT_INPUT_BINDINGS} from ${JSON.stringify(resolve(forge,'engine/input/defaultInputBindings.ts'))};`,
},nodePaths:[resolve(forge,'node_modules')]});
await mkdir('.forge/m0-depot',{recursive:true});
const artifact=resolve('.forge/m0-depot/session-test.bundle.mjs');
await writeFile(artifact,bundle.outputFiles[0].text);
const {createDepotGameMode,PerspectiveCamera,Object3D,ActionMap,DEFAULT_INPUT_BINDINGS}=await import(pathToFileURL(artifact));

function setup(){
 let speed=0,depth=0,handler,unsubscribed=false,canOpen=true,config={entry:[0,0,0],focus:[2,0,2]};
 const objects=new Map([['car-a',new Object3D()],['car-b',new Object3D()]]),fields={},inputs=[],resets=[];
 const actions=new ActionMap(DEFAULT_INPUT_BINDINGS);
 const context={camera:new PerspectiveCamera(),actions,characters:[],inputMode:'game',
  vehicles:{ids:()=>[...objects.keys()],object:id=>objects.get(id)??null,state:()=>({forwardSpeed:speed,wheels:[],drivetrain:null,engineLoad:0}),setInput:(id,input)=>inputs.push({id,...input}),reset:(...args)=>resets.push(args)},
  markCameraControlled(){},getInputMode(){return this.inputMode},setInputMode(mode){this.inputMode=mode},setMouseCursorVisible(){},setPointerLookMode(){},consumeLookDelta:()=>({dx:0,dy:0}),
  onScriptMessage(type,cb){handler=cb;return()=>{unsubscribed=true}},
 };
 const host={config:()=>config,presenter:()=>({screenDepth:()=>depth,pushWidget:()=>{if(!canOpen)return false;depth++;context.inputMode='ui';return true},clearScreens:()=>{depth=0;context.inputMode='game'}}),publish:value=>Object.assign(fields,value)};
 const session=createDepotGameMode(host).createSession(context);
 session.spawnDefaultPawn();session.possess();
 const tick=()=>{actions.advance();session.beforeEngineUpdate(1/60);session.update(1/60)};
 const tap=code=>{actions.handleDown(code);tick();actions.handleUp(code);tick()};
 const message=action=>{handler({payload:{message:'ridgebound:depot:'+action}});tick()};
 tick();
 return {session,context,actions,fields,objects,inputs,resets,tick,tap,message,enter:()=>tap('KeyE'),setSpeed:v=>speed=v,setCanOpen:v=>canOpen=v,setConfig:v=>config=v,back:()=>{depth=0;tick()},unsubscribed:()=>unsubscribed};
}

test('moving, distant and missing-point entries fail; E does not reset; R uses Forge reset',()=>{
 const s=setup();s.setSpeed(2);s.enter();assert.equal(s.fields['depot.active'],false);assert.equal(s.resets.length,0);
 s.setSpeed(0);s.objects.get('car-a').position.x=20;s.tick();s.enter();assert.equal(s.fields['depot.active'],false);
 s.objects.get('car-a').position.x=0;s.tick();s.setConfig(null);s.enter();assert.equal(s.fields['depot.active'],false);
 s.tap('KeyR');assert.equal(s.resets.length,1);s.session.dispose();
});
test('depot keeps the same car parked and ignores throttle/steering/reset until explicit return',()=>{
 const s=setup();s.enter();assert.equal(s.fields['depot.active'],true);assert.equal(s.context.inputMode,'ui');
 for(const code of ['KeyW','KeyD','KeyR'])s.actions.handleDown(code);
 s.tick();assert.equal(s.inputs.at(-1).throttle,0);assert.equal(s.inputs.at(-1).steer,0);assert.equal(s.inputs.at(-1).handbrake,true);assert.equal(s.resets.length,0);
 s.message('return');assert.equal(s.fields['depot.active'],false);assert.equal(s.session.playerState.pawnEntityId,'car-a');
 s.tick();assert.equal(s.inputs.at(-1).throttle,0,'held UI keys must not leak into driving');
 for(const code of ['KeyW','KeyD','KeyR'])s.actions.handleUp(code);
 s.tick();s.actions.handleDown('KeyW');s.tick();assert.equal(s.inputs.at(-1).throttle,1);
 s.session.dispose();
});
test('all camera controls clamp and center returns to the original depot reference',()=>{
 const s=setup();s.enter();
 for(let i=0;i<40;i++){s.message('right');s.message('far');s.message('north');s.message('west')}
 assert.equal(s.fields['depot.yaw'],80);assert.equal(s.fields['depot.distance'],50);
 assert.ok(Math.abs(s.fields['depot.panX'])<=8&&Math.abs(s.fields['depot.panZ'])<=8);
 for(let i=0;i<40;i++){s.message('left');s.message('near');s.message('south');s.message('east')}
 assert.equal(s.fields['depot.yaw'],10);assert.equal(s.fields['depot.distance'],24);
 s.message('center');assert.equal(s.fields['depot.yaw'],45);assert.equal(s.fields['depot.distance'],36);assert.equal(s.fields['depot.panX'],0);assert.equal(s.fields['depot.panZ'],0);
 const pose=s.context.camera.position.toArray();s.tap('Mouse0');assert.deepEqual(s.context.camera.position.toArray(),pose);
 s.back();assert.equal(s.fields['depot.active'],false);s.session.dispose();
});
test('unavailable screen does not enter; vanished parked car is not replaced by another',()=>{
 const s=setup();s.setCanOpen(false);s.enter();assert.equal(s.fields['depot.active'],false);
 s.setCanOpen(true);s.enter();s.objects.delete('car-a');s.message('return');
 assert.equal(s.session.playerState.pawnEntityId,'car-a');assert.equal(s.fields['depot.active'],true);assert.match(s.fields['depot.notice'],/Araç bulunamadı/);
 s.session.dispose();assert.equal(s.unsubscribed(),true);
 s.actions.handleDown('KeyE');s.actions.advance();assert.equal(s.actions.pressed('interact'),true,'bindings restored on teardown');
});
