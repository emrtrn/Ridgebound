import assert from "node:assert/strict";
import test from "node:test";
import { createTransportState, transitionTransport } from "../../src/game/m0/transport.ts";

// All numbers are test fixtures, not authored Gaz52 capacity or economy data.
const contract = {
  id: "job", cargoId: "cargo", profile: { id: "light", kind: "light", massKg: 500 },
  pickupPointId: "pickup", deliveryPointId: "delivery", fee: 100,
};
const fresh = () => createTransportState(contract, "instance-1", 20);
const advance = (state, command) => {
  const result = transitionTransport(state, command);
  assert.equal(result.ok, true);
  return result.state;
};
const accepted = () => advance(fresh(), { type: "accept", contractId: "job" });
const load = { type: "load", pointId: "pickup", vehicleId: "gaz52", capacityKg: 500 };
const deliver = { type: "deliver", pointId: "delivery", vehicleId: "gaz52", cargoId: "cargo" };
const loaded = () => advance(accepted(), load);
const reject = (state, command, reason) => {
  const result = transitionTransport(state, command);
  assert.equal(result.ok, false);
  assert.equal(result.reason, reason);
  assert.equal(result.state, state);
};

test("accept does not load; second acceptance is rejected; pre-load cancellation is free", () => {
  const state = accepted();
  assert.equal(state.cargo, null);
  reject(state, { type: "accept", contractId: "job" }, "wrong-phase");
  reject(state, { type: "accept", contractId: "another-job" }, "wrong-contract");
  const cancelled = advance(state, { type: "cancel" });
  assert.equal(cancelled.phase, "offered");
  assert.equal(cancelled.balance, 20);
});

test("load requires the correct point and a finite sufficient nominal capacity", () => {
  reject(fresh(), load, "wrong-phase");
  reject(accepted(), { ...load, pointId: "elsewhere" }, "wrong-point");
  for (const capacityKg of [499, -1, NaN, Infinity]) {
    reject(accepted(), { ...load, capacityKg }, "over-capacity");
  }
  reject(accepted(), { ...load, vehicleId: " " }, "invalid-vehicle");
  assert.deepEqual(loaded().cargo, { id: "cargo", profileId: "light", vehicleId: "gaz52" });
  reject(loaded(), { type: "cancel" }, "wrong-phase");
});

test("a heavy profile uses its own mass while capacity equality is allowed", () => {
  const heavy = { ...contract, profile: { id: "heavy", kind: "heavy", massKg: 1500 } };
  const state = advance(createTransportState(heavy, "heavy-test"), { type: "accept", contractId: "job" });
  reject(state, load, "over-capacity");
  assert.equal(advance(state, { ...load, capacityKg: 1500 }).cargo.profileId, "heavy");
});

test("empty, wrong-location, wrong-cargo and wrong-vehicle delivery never pays", () => {
  reject(accepted(), deliver, "wrong-phase");
  reject(loaded(), { ...deliver, pointId: "pickup" }, "wrong-point");
  reject(loaded(), { ...deliver, cargoId: "wrong" }, "wrong-cargo");
  reject(loaded(), { ...deliver, vehicleId: "other" }, "invalid-vehicle");
  reject(loaded(), { type: "complete" }, "wrong-phase");
});

test("delivery followed by completion pays once, including repeated commands on a JSON copy", () => {
  const state = advance(loaded(), deliver);
  assert.equal(state.balance, 20);
  assert.equal(state.cargo, null);
  reject(state, deliver, "wrong-phase");
  const completed = advance(state, { type: "complete" });
  assert.equal(completed.balance, 120);
  assert.equal(completed.rewardPaid, true);
  assert.equal(completed.phase, "completed");
  const copy = JSON.parse(JSON.stringify(completed));
  reject(copy, { type: "complete" }, "wrong-phase");
  reject(copy, deliver, "wrong-phase");
  reject(copy, { type: "accept", contractId: "job" }, "wrong-phase");
});

test("definition rejects invalid identities, mass and money; caller changes do not alter contract snapshot", () => {
  for (const massKg of [0, -1, NaN, Infinity]) {
    assert.throws(() => createTransportState({ ...contract, profile: { ...contract.profile, massKg } }, "run"));
  }
  assert.throws(() => createTransportState(contract, " "));
  assert.throws(() => createTransportState({ ...contract, fee: -1 }, "run"));
  assert.throws(() => createTransportState(contract, "run", 0.5));
  const definition = structuredClone(contract);
  const state = createTransportState(definition, "run");
  definition.profile.massKg = 900;
  assert.equal(state.contract.profile.massKg, 500);
});
