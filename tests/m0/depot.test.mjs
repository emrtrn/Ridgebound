import test from 'node:test';
import assert from 'node:assert/strict';
import { depotEntryStatus, limitDepotView, INITIAL_DEPOT_VIEW, DEPOT_LIMITS } from '../../src/game/m0/depotRules.ts';
const depot = { entry: [0, 0, 0], focus: [2, 0, 2] };
test('depot entry requires a known vehicle at the physical point, same height and stopped', () => {
  assert.equal(depotEntryStatus(null, [0,0,0], 0), 'unavailable');
  assert.equal(depotEntryStatus(depot, null, 0), 'unavailable');
  assert.equal(depotEntryStatus(depot, [NaN,0,0], 0), 'unavailable');
  assert.equal(depotEntryStatus(depot, [0,0,0], NaN), 'unavailable');
  assert.equal(depotEntryStatus(depot, [0,0,10.01], 0), 'far');
  assert.equal(depotEntryStatus(depot, [0,3.01,0], 0), 'far');
  assert.equal(depotEntryStatus(depot, [0,0,0], .251), 'moving');
  assert.equal(depotEntryStatus(depot, [0,0,0], -.251), 'moving');
  assert.equal(depotEntryStatus(depot, [0,0,10], .25), 'ready');
});
test('depot camera stays inside orbit, distance and depot-relative pan limits', () => {
  assert.deepEqual(limitDepotView(INITIAL_DEPOT_VIEW), INITIAL_DEPOT_VIEW);
  assert.deepEqual(limitDepotView({yawDeg:-500,distance:0,panX:100,panZ:-100}), {
    yawDeg:DEPOT_LIMITS.yawMin,distance:DEPOT_LIMITS.distanceMin,panX:8,panZ:-8,
  });
  assert.deepEqual(limitDepotView({yawDeg:500,distance:500,panX:NaN,panZ:Infinity}), {
    yawDeg:DEPOT_LIMITS.yawMax,distance:DEPOT_LIMITS.distanceMax,panX:0,panZ:0,
  });
});
