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
    export { BehaviorSubsystem } from ${JSON.stringify(resolve(forge, 'engine/behavior/behaviorSubsystem.ts'))};
    export { ActionMap } from ${JSON.stringify(resolve(forge, 'engine/input/actionMap.ts'))};
    export { collectSaveState, applySaveState } from ${JSON.stringify(resolve(forge, 'engine/persistence/saveGameState.ts'))};
    export { SaveGameStore, MemoryStorageAdapter } from ${JSON.stringify(resolve(forge, 'engine/persistence/saveGameStore.ts'))};
  `,
}, nodePaths: [resolve(forge, 'node_modules')] });
await mkdir('.forge/m0-contract', { recursive: true });
const artifact = resolve('.forge/m0-contract/board-test.bundle.mjs');
await writeFile(artifact, bundle.outputFiles[0].text);
const { createContractBoard, BOARD_SCRIPT, TRANSPORT_KEY, readBoardState, BehaviorSubsystem, ActionMap, collectSaveState, applySaveState, SaveGameStore, MemoryStorageAdapter } = await import(pathToFileURL(artifact));

function setup() {
  const fields = {}; let saves = 0;
  const board = createContractBoard({ publish: value => Object.assign(fields, value), save: () => { saves++; return 'saved'; } });
  const behavior = new BehaviorSubsystem({ get: id => id === BOARD_SCRIPT ? board.tick : undefined }, new ActionMap({}), () => {});
  behavior.setEntities([{ id: 'board', components: {
    Transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    Behavior: { scriptId: BOARD_SCRIPT },
  } }]);
  const tick = () => behavior.update({ deltaSeconds: .016, elapsedSeconds: .016, frame: 1 });
  tick();
  const entries = () => behavior.getPersistentStateSnapshot();
  const state = () => entries().find(e => e.key === TRANSPORT_KEY).value;
  return { board, behavior, fields, tick, entries, state, saves: () => saves };
}

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
