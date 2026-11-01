import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const local = existsSync('forge.local.json') ? JSON.parse(await readFile('forge.local.json', 'utf8')) : {};
const forge = resolve(process.env.FORGE_ROOT ?? local.forgeRoot ?? '../../Forge');
const require = createRequire(resolve(forge, 'package.json'));
const { build } = require('esbuild');
const bundle = await build({ bundle: true, write: false, platform: 'node', format: 'esm', tsconfig: resolve(forge, 'tsconfig.json'), stdin: {
  resolveDir: process.cwd(), loader: 'ts', contents: `
    export * from './src/game/m0/contractBoard';
    export * from './src/game/m0/transportPersistence';
    export { createGameModule } from './src/game/gameModule';
    export { createSaveGameModule } from ${JSON.stringify(resolve(forge, 'src/scene/capabilities/saveGameModule.ts'))};
    export { createRuntimeServiceHost } from ${JSON.stringify(resolve(forge, 'src/scene/capabilities/RuntimeServices.ts'))};
    export * from ${JSON.stringify(resolve(forge, 'src/scene/capabilities/runtimeServiceKeys.ts'))};
    export { DEMO_ROUTES } from './src/game/m0/m0Content';
    export { transportHud } from './src/game/m0/transportHud';
    export { splineToPolyline } from ${JSON.stringify(resolve(forge, 'engine/scene/landscape.ts'))};
    export { mergeWorldCells, normalizeWorldCellDocument, worldCellPath } from ${JSON.stringify(resolve(forge, 'engine/world/worldPartition.ts'))};
    export { readRoomLayout } from ${JSON.stringify(resolve(forge, 'engine/scene/layoutValidation.ts'))};
    export { BehaviorSubsystem } from ${JSON.stringify(resolve(forge, 'engine/behavior/behaviorSubsystem.ts'))};
    export { ActionMap } from ${JSON.stringify(resolve(forge, 'engine/input/actionMap.ts'))};
    export { collectSaveState, applySaveState } from ${JSON.stringify(resolve(forge, 'engine/persistence/saveGameState.ts'))};
    export { SaveGameStore, MemoryStorageAdapter } from ${JSON.stringify(resolve(forge, 'engine/persistence/saveGameStore.ts'))};
  `,
}, nodePaths: [resolve(forge, 'node_modules')] });
await mkdir('.forge/m0-contract', { recursive: true });
const artifact = resolve('.forge/m0-contract/board-test.bundle.mjs');
await writeFile(artifact, bundle.outputFiles[0].text);
const { createContractBoard, BOARD_SCRIPT, TRANSPORT_KEY, readBoardState, BehaviorSubsystem, ActionMap, collectSaveState, applySaveState, SaveGameStore, MemoryStorageAdapter, DEMO_ROUTES, splineToPolyline, transportHud, mergeWorldCells, normalizeWorldCellDocument, worldCellPath, readRoomLayout } = await import(pathToFileURL(artifact));
const { createTransportPersistence, transportRestoreError, createGameModule, createSaveGameModule, createRuntimeServiceHost, gameplaySaveStateService, projectIdentityService, levelTravelService, uiViewModelService, saveGameCommandsService, behaviorRegistryFactoryService } = await import(pathToFileURL(artifact));

function setup() {
  const fields = {}; let saves = 0; const saved=[];
  const board = createContractBoard({ publish: value => Object.assign(fields, value), save: () => { saves++; saved.push(behavior.getPersistentStateSnapshot()); }, points: () => ({pickup:[0,0,0],delivery:[100,0,0]}) });
  const behavior = new BehaviorSubsystem({ get: id => id === BOARD_SCRIPT ? board.tick : undefined }, new ActionMap({}), () => {});
  behavior.setEntities([{ id: 'board', components: {
    Transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    Behavior: { scriptId: BOARD_SCRIPT },
  } }]);
  const tick = () => behavior.update({ deltaSeconds: .016, elapsedSeconds: .016, frame: 1 });
  tick();
  const entries = () => behavior.getPersistentStateSnapshot();
  const state = () => entries().find(e => e.key === TRANSPORT_KEY).value;
  return { board, behavior, fields, tick, entries, state, saved, saves: () => saves };
}

test('delivery rejects empty cargo, wrong point/carrier and corrupt cargo without paying or changing progress',()=>{
 const s=setup();assert.equal(s.board.deliver('delivery','truck'),false);s.board.action('accept');assert.equal(s.board.deliver('delivery','truck'),false);
 s.board.load('pickup','truck',2000);const loaded=s.state(),saves=s.saves();
 assert.equal(s.board.deliver('pickup','truck'),false);assert.equal(s.board.deliver('delivery','other'),false);
 assert.deepEqual(s.state(),loaded);assert.equal(s.saves(),saves);assert.equal(s.state().balance,0);
 const corrupt={...loaded,cargo:{...loaded.cargo,id:'wrong-cargo'}};
 s.behavior.applyPersistentStateSnapshot([{entityId:'board',key:TRANSPORT_KEY,value:corrupt}]);s.tick();
 assert.equal(s.board.deliver('delivery','truck'),false);assert.deepEqual(s.state(),corrupt);assert.equal(s.saves(),saves);
});

test('explicit delivery creates a durable receipt then pays once; repeated result actions do not save or start another job',()=>{
 const s=setup();s.board.action('accept');s.board.load('pickup','truck',2000);
 assert.equal(s.board.deliver('delivery','truck'),true);
 assert.equal(s.state().phase,'completed');assert.equal(s.state().cargo,null);assert.equal(s.state().balance,100);assert.equal(s.state().rewardPaid,true);
 assert.deepEqual(s.saved.slice(-2).map(entries=>entries.find(e=>e.key===TRANSPORT_KEY).value.phase),['delivered','completed']);
 const complete=s.state(),saves=s.saves();
 for(let i=0;i<5;i++)assert.equal(s.board.deliver('delivery','truck'),false);
 s.board.action('open');s.board.action('accept');s.board.action('profile-heavy');s.board.action('cancel');
 assert.deepEqual(s.state(),complete);assert.equal(s.saves(),saves);assert.match(s.fields['delivery.balance'],/100/);
});

test('real Forge delivered and completed save/load restores cannot generate a second reward',()=>{
 const s=setup();s.board.action('accept');s.board.load('pickup','truck',2000);s.board.deliver('delivery','truck');
 const store=new SaveGameStore({gameId:'F test',schema:1,storage:new MemoryStorageAdapter()});
 for(const entries of s.saved.slice(-2)){
   store.writeSlot('quick',collectSaveState({activeLevelPath:'test.level.json',persistentState:entries}));
   const restored=setup();restored.behavior.applyPersistentStateSnapshot(applySaveState(store.readSlot('quick').payload).persistentState);restored.tick();
   const phase=restored.state().phase;assert.equal(restored.saves(),0,'restore is a read, never a payout');
   assert.equal(restored.board.deliver('delivery','truck'),phase==='delivered');
   assert.equal(restored.state().phase,'completed');assert.equal(restored.state().balance,100);assert.equal(restored.state().rewardPaid,true);
   const saves=restored.saves();restored.board.deliver('delivery','truck');assert.equal(restored.state().balance,100);assert.equal(restored.saves(),saves);
 }
});

test('optional independent details, explicit accept, duplicate rejection and penalty-free cancel use one persisted record', () => {
  const s = setup();
  s.board.action('open'); s.board.action('accept');
  assert.equal(s.state().phase, 'accepted'); assert.equal(s.state().cargo, null); assert.equal(s.state().balance, 0);
  assert.equal(s.saves(), 1); assert.equal(s.entries().length, 1);
  s.board.action('accept'); assert.match(s.fields['contract.notice'], /İkinci aktif/); assert.equal(s.saves(), 1);
  s.board.action('reason'); s.board.action('terms');
  assert.ok(s.fields['contract.reason']); assert.ok(s.fields['contract.terms']);
  s.board.action('reason'); assert.equal(s.fields['contract.reason'], ''); assert.ok(s.fields['contract.terms']);
  s.board.action('cancel'); assert.equal(s.state().phase, 'offered'); assert.equal(s.state().balance, 0); assert.equal(s.saves(), 2);
  s.board.action('cancel'); assert.equal(s.saves(), 2);
});

test('real Forge collector/store/restore rehydrates accepted and cancelled progress; UI follows the restored record', () => {
  const s = setup(); const store = new SaveGameStore({ gameId: 'Ridgebound test', schema: 1, storage: new MemoryStorageAdapter() });
  for (const phase of ['accepted', 'offered']) {
    s.board.action(phase === 'accepted' ? 'accept' : 'cancel');
    const payload = collectSaveState({ activeLevelPath: 'test.level.json', persistentState: s.entries() });
    assert.equal(store.writeSlot('quick', payload).ok, true);
    const restore = applySaveState(store.readSlot('quick').payload);
    const next = setup(); next.behavior.applyPersistentStateSnapshot(restore.persistentState); next.tick();
    assert.equal(next.state().phase, phase); assert.equal(next.state().cargo, null); assert.equal(next.saves(), 0);
    assert.match(next.fields['contract.status'], phase === 'accepted' ? /kabul edildi/ : /sunuluyor/);
    next.board.action('accept');
    assert.equal(next.state().phase, 'accepted');
  }
});

test('invalid/unknown progress is preserved and blocked, loaded cargo cannot be cancelled, teardown releases state', () => {
  const s = setup(); const initial = s.state();
  for (const broken of [null, { ...initial, schema: 99 }, { ...initial, phase: 'accepted', cargo: {} }, { ...initial, rewardPaid: true }, { ...initial, contract: { ...initial.contract, fee: 200 } }]) {
    assert.equal(readBoardState(broken), null);
    s.behavior.applyPersistentStateSnapshot([{ entityId: 'board', key: TRANSPORT_KEY, value: broken }]); s.tick(); s.board.action('accept');
    assert.deepEqual(s.state(), broken); assert.match(s.fields['contract.notice'], /bozuk veya uyumsuz/);
  }
  const loaded = { ...initial, phase: 'loaded', cargo: { id: initial.contract.cargoId, profileId: initial.contract.profile.id, vehicleId: 'car-a' } };
  s.behavior.applyPersistentStateSnapshot([{ entityId: 'board', key: TRANSPORT_KEY, value: loaded }]); s.tick(); s.board.action('cancel');
  assert.deepEqual(s.state(), loaded); assert.equal(s.saves(), 0);
  s.board.reset(); assert.equal(s.board.action('accept'), false);
});

test('light and heavy profiles load explicitly into the live carrier and survive real Forge save/restore without duplicating cargo', () => {
  for (const [profile, mass] of [['light',500],['heavy',1500]]) {
    const s=setup();s.board.action('profile-'+profile);
    assert.equal(s.state().phase,'offered'); assert.equal(s.state().contract.profile.massKg,mass);
    assert.equal(s.board.load('pickup','truck',2000),false,'acceptance is required');
    s.board.action('accept'); const accepted=s.state();
    s.board.action('profile-overload');assert.deepEqual(s.state(),accepted,'an active job cannot change its cargo');
    assert.equal(s.board.load('wrong-point','truck',2000),false);assert.equal(s.state().phase,'accepted');
    assert.equal(s.board.load('pickup','',2000),false);assert.equal(s.state().phase,'accepted');
    assert.equal(s.board.load('pickup','truck',2000),true);
    assert.deepEqual(s.state().cargo,{id:s.state().contract.cargoId,profileId:s.state().contract.profile.id,vehicleId:'truck'});
    const saves=s.saves();s.board.load('pickup','other-truck',2000);s.board.action('cancel');
    assert.equal(s.saves(),saves);assert.equal(s.state().cargo.vehicleId,'truck');assert.equal(s.state().balance,0);
    const store=new SaveGameStore({gameId:'E test',schema:1,storage:new MemoryStorageAdapter()});
    store.writeSlot('quick',collectSaveState({activeLevelPath:'test.level.json',persistentState:s.entries()}));
    const restored=setup();restored.behavior.applyPersistentStateSnapshot(applySaveState(store.readSlot('quick').payload).persistentState);restored.tick();
    restored.board.updateHud({vehicleId:'truck',position:[0,0,0],heading:{x:0,z:1},speedMps:10,depotActive:false});
    assert.deepEqual(restored.state(),s.state());assert.equal(restored.saves(),0);
    assert.match(restored.fields['hud.target'],/Teslim alanı.*100 m.*Sağda/);assert.equal(restored.fields['hud.speed'],'36.0 km/sa');
    assert.match(restored.fields['hud.cargo'],new RegExp(mass+' kg'));
  }
});

test('over-capacity profile remains accepted and empty; cancellation allows selecting a loadable offer',()=>{
  const s=setup();s.board.action('profile-overload');s.board.action('accept');const state=s.state();const saves=s.saves();
  assert.equal(s.board.load('pickup','truck',2000),false);assert.deepEqual(s.state(),state);assert.equal(s.saves(),saves);
  assert.match(s.fields['depot.notice'],/kapasitesini aşıyor/);assert.equal(s.state().cargo,null);
  s.board.action('cancel');s.board.action('profile-heavy');s.board.action('accept');assert.equal(s.board.load('pickup','truck',2000),true);
});

test('HUD follows task phase, target bearing, missing vehicle and completed state without retaining stale cargo',()=>{
  const s=setup();const points={pickup:[0,0,0],delivery:[100,0,0]};
  const live={vehicleId:'truck',position:[0,0,-30],heading:{x:0,z:1},speedMps:0,depotActive:false};
  let fields=transportHud(s.state(),live,points);assert.match(fields['hud.job'],/İş bekleniyor/);assert.match(fields['hud.target'],/30 m.*İleride/);
  s.board.action('accept');fields=transportHud(s.state(),{...live,position:[0,0,0]},points);assert.match(fields['hud.action'],/E — Depoyu aç/);assert.match(fields['hud.cargo'],/yükü yok/);
  s.board.load('pickup','truck',2000);fields=transportHud(s.state(),{...live,vehicleId:'another'},points);assert.match(fields['hud.cargo'],/başka araçta/);
  fields=transportHud(s.state(),{...live,position:null,heading:null,speedMps:null},points);assert.match(fields['hud.target'],/Konum bilgisi yok/);assert.match(fields['hud.speed'],/mevcut değil/);
  fields=transportHud({...s.state(),phase:'completed',cargo:null,rewardPaid:true},live,points);assert.match(fields['hud.target'],/Teslim tamamlandı/);assert.match(fields['hud.cargo'],/yükü yok/);
});

test('route comparison distances stay tied to the current authored road splines',async()=>{
  const def=JSON.parse(await readFile('public/assets/Maps/Landscape.landscapes/m0.terrain.json','utf8'));
  for(const route of DEMO_ROUTES){
    const spline=def.splines.find(s=>s.id===route.id);assert.ok(spline,'route must exist in the terrain');
    const measured=splineToPolyline(spline).reduce((sum,p)=>sum+Math.hypot(p.end.position[0]-p.start.position[0],p.end.position[2]-p.start.position[2]),0);
    assert.equal(route.mapLengthM,Math.round(measured),'refresh route content after changing authored roads');
  }
});

test('current authored level resolves M0 points, board behavior and Gaz52 through the existing Forge world-cell merge',async()=>{
 const path='assets/Maps/Landscape.level.json';
 const root=readRoomLayout(JSON.parse(await readFile('public/'+path,'utf8')),path);
 const cells=await Promise.all((root.worldCells??[]).map(async key=>normalizeWorldCellDocument(JSON.parse(await readFile('public/'+worldCellPath(path,'main',key),'utf8')))));
 const layout=cells.length?mergeWorldCells(root,cells):root;
 const placements=layout.instances.flatMap(group=>group.placements);
 assert.ok(placements.some(p=>p.role==='logistics.board'&&p.behavior?.script===BOARD_SCRIPT));
 assert.ok(placements.some(p=>p.id==='pickup'&&p.role==='logistics.pickup'));
 assert.ok(placements.some(p=>p.id==='delivery'&&p.role==='logistics.delivery'));
 assert.ok(layout.actors.some(a=>a.classRef==='assets/vehicles/gaz52/Script_Gaz52.actor.json'));
});

test('G all phases cross the real Forge store and guarded restore without writes or reward side effects',()=>{
 const source=setup();source.board.action('accept');source.board.load('pickup','truck',2000);source.board.deliver('delivery','truck');
 const store=new SaveGameStore({gameId:'G phases',schema:1,storage:new MemoryStorageAdapter()});
 const vehicle={entityId:'truck',position:[1,2,3],rotation:[0,20,0],linearVelocity:[0,0,0],angularVelocity:[0,0,0],handbrake:true,drivetrain:null};
 for(const entries of source.saved){
  const payload=collectSaveState({activeLevelPath:'test.level.json',persistentState:entries,vehicles:[vehicle]});
  assert.equal(store.writeSlot('quick',payload).ok,true);
  const s=setup();let captures=0;const errors=[];
  const p=createTransportPersistence({capture:()=>{captures++;return payload},restore:r=>s.behavior.applyPersistentStateSnapshot(r.persistentState)},m=>errors.push(m));
  p.bridge.restore(applySaveState(store.readSlot('quick').payload));
  assert.equal(p.bridge.capture(),null);assert.equal(captures,0);assert.equal(p.canMutate(),false);
  p.levelLoaded({levelPath:'test.level.json',boardId:'board',vehicleIds:['truck']});s.tick();
  assert.deepEqual(s.state(),entries.find(e=>e.key===TRANSPORT_KEY).value);assert.equal(s.saves(),0);assert.equal(errors.length,0);
  assert.deepEqual(p.bridge.capture(),payload);assert.equal(p.canMutate(),true);
 }
});

test('G old positional ids, unsupported versions, missing/duplicate records and missing carriers are blocked before native restore',()=>{
 const s=setup();s.board.action('accept');s.board.load('pickup','truck',2000);
 const payload=collectSaveState({activeLevelPath:'test.level.json',persistentState:s.entries(),vehicles:[{entityId:'truck',position:[0,0,0],rotation:[0,0,0],linearVelocity:[0,0,0],angularVelocity:[0,0,0],handbrake:true,drivetrain:null}]});
 const valid=applySaveState(payload),entry=valid.persistentState[0],bindings={levelPath:'test.level.json',boardId:'board',vehicleIds:['truck']};
 const cases=[{...valid,persistentState:[]},{...valid,persistentState:[entry,entry]},
  {...valid,persistentState:[{...entry,entityId:'old-board-index'}]},
  {...valid,persistentState:[{...entry,key:'ridgebound.transport.v2'}]},
  {...valid,persistentState:[{...entry,value:{...entry.value,schema:99}}]},
  {...valid,persistentState:[{...entry,value:{...entry.value,contract:{...entry.value.contract,fee:999}}}]},
  {...valid,vehicles:[]},{...valid,levelPath:'other.level.json'}];
 for(const request of cases){
  let nativeRestores=0;const target=setup();
  const p=createTransportPersistence({capture:()=>payload,restore:()=>nativeRestores++},m=>target.board.blockRestore(m));
  p.bridge.restore(request);p.levelLoaded(bindings);target.tick();
  assert.equal(nativeRestores,0);assert.equal(p.canMutate(),false);assert.equal(p.bridge.capture(),null);
  const before=target.state();assert.equal(target.board.action('accept'),false);assert.equal(target.board.load('pickup','truck',2000),false);assert.equal(target.board.deliver('delivery','truck'),false);
  assert.deepEqual(target.state(),before);assert.equal(target.saves(),0);assert.match(target.fields['hud.notice'],/korunuyor/);
 }
 assert.ok(transportRestoreError(valid,{...bindings,vehicleIds:['other']}));
});

test('G real save capability and game module compose in production lifecycle order; loading freezes commands and rejects old board ids',async()=>{
 const fields={};let live=null,travel=0,restores=0;
 const services=createRuntimeServiceHost({syncEntityTransform(){}});
 services.provide(gameplaySaveStateService,{capture:()=>live,restore:r=>{restores++;behavior.applyPersistentStateSnapshot(r.persistentState)}});
 services.provide(projectIdentityService,()=> 'G integration');services.provide(levelTravelService,()=>travel++);
 services.provide(uiViewModelService,{setFields:f=>Object.assign(fields,f),setField:(k,v)=>fields[k]=v,getField:k=>fields[k],flush(){}});
 const game=createGameModule();game.register({services}); // Layer 3 attaches before capabilities.
 const storage=new MemoryStorageAdapter();const capability=createSaveGameModule({storage});capability.onRuntimeStart(services);
 const registry=services.resolve(behaviorRegistryFactoryService)({});
 const behavior=new BehaviorSubsystem(registry,new ActionMap({}),()=>{});
 const entities=[{id:'board',components:{Behavior:{scriptId:BOARD_SCRIPT},Transform:{position:[0,0,0],rotation:[0,0,0],scale:[1,1,1]}}}];
 const context={services,levelPath:'test.level.json',entities,entity:id=>entities.find(e=>e.id===id),layout:{instances:[],actors:[]},resolve:k=>services.resolve(k)};
 const tick=()=>behavior.update({deltaSeconds:.016,elapsedSeconds:.016,frame:1});
 behavior.setEntities(entities);capability.onLevelLoaded(context);await game.onLevelLoaded(context);tick();
 live=collectSaveState({activeLevelPath:context.levelPath,persistentState:behavior.getPersistentStateSnapshot()});
 const commands=services.resolve(saveGameCommandsService);commands.handleUiMessage('save:write:quick');assert.match(fields['save.slots.quick.status'],/^Saved/);
 commands.handleUiMessage('save:load:slot-2');assert.equal(travel,0);assert.equal(fields['save.slots.slot-2.status'],'Empty');
 assert.equal(commands.requestSaveGameLoad({}),false);assert.equal(travel,0);
 const written=storage.getItem('forge.saveGame.G%20integration.slot.quick');
 const setItem=storage.setItem.bind(storage);storage.setItem=()=>{throw new Error('fixture quota')};
 commands.handleUiMessage('save:write:quick');assert.equal(fields['save.slots.quick.status'],'Save failed');assert.equal(storage.getItem('forge.saveGame.G%20integration.slot.quick'),written);
 storage.setItem=setItem;commands.handleUiMessage('save:write:quick');assert.match(fields['save.slots.quick.status'],/^Saved/);
 commands.handleUiMessage('save:load:quick');commands.handleUiMessage('save:load:quick');assert.equal(travel,1);
 commands.handleUiMessage('save:write:quick');assert.equal(fields['save.slots.quick.status'],'Save unavailable');
 game.onLevelUnloaded();behavior.setEntities(entities);capability.onLevelLoaded(context);assert.equal(restores,0,'native restore waits for game validation');
 await game.onLevelLoaded(context);tick();assert.equal(restores,1);
 const store=new SaveGameStore({gameId:'G integration',schema:1,storage});const old={...live,flags:live.flags.map(e=>({...e,entityId:'old-board'}))};store.writeSlot('quick',old);
 commands.handleUiMessage('save:load:quick');game.onLevelUnloaded();behavior.setEntities(entities);capability.onLevelLoaded(context);await game.onLevelLoaded(context);tick();
 assert.equal(restores,1);assert.match(fields['hud.notice'],/korunuyor/);commands.handleUiMessage('save:write:quick');assert.deepEqual(store.readSlot('quick').payload,old);
 // A rejected record must not prevent loading a known-good slot.
 store.writeSlot('slot-1',live);commands.handleUiMessage('save:load:slot-1');assert.equal(travel,3);
 game.onLevelUnloaded();behavior.setEntities(entities);capability.onLevelLoaded(context);await game.onLevelLoaded(context);tick();assert.equal(restores,2);
 game.dispose();capability.dispose();
});

test('G commands during pending restore cannot accept, load or complete an old live record',()=>{
 let ready=true;
 const fields={};let saves=0;const data=new Map();const state={get:(key,fallback)=>data.has(key)?data.get(key):fallback,persist:(key,value)=>data.set(key,value)};
 const board=createContractBoard({publish:f=>Object.assign(fields,f),save:()=>saves++,canMutate:()=>ready});
 board.tick({entityId:'board',state});ready=false;
 const before=data.get(TRANSPORT_KEY);
 assert.equal(board.action('accept'),false);assert.equal(board.load('pickup','truck',2000),false);assert.equal(board.deliver('delivery','truck'),false);
 assert.deepEqual(data.get(TRANSPORT_KEY),before);assert.equal(saves,0);
 ready=true;assert.equal(board.action('accept'),true);assert.equal(saves,1);
});
