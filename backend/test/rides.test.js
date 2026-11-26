// Rides: create, ownership (only the driver edits/cancels/deletes) and girls-only rules.
import test from "node:test";
import assert from "node:assert/strict";
import { call, register, rideBody, future, query, baseUrl, useTestServer } from "./helpers.js";

useTestServer();

test("rides: create needs auth, only owner edits/cancels/deletes", async () => {
  const driver = await register("Karim", "male");
  const other = await register("Omar", "male");
  assert.equal((await call("POST", "/api/rides", { body: rideBody() })).status, 401);
  assert.equal((await call("POST", "/api/rides", { token: driver.token, body: rideBody({ seatsTotal: 9 }) })).status, 400);
  assert.equal((await call("POST", "/api/rides", { token: driver.token, body: rideBody({ departAt: "2020-01-01T00:00:00Z" }) })).status, 400);
  const created = await call("POST", "/api/rides", { token: driver.token, body: rideBody() });
  assert.equal(created.status, 201);
  const id = created.data.id;
  assert.equal(created.data.driver.id, driver.id);
  assert.equal(created.data.seatsLeft, 2);

  assert.equal((await call("GET", `/api/rides/${id}`)).status, 200);
  assert.equal((await call("GET", "/api/rides/nope")).status, 404);
  assert.equal((await call("PUT", `/api/rides/${id}`, { token: other.token, body: rideBody() })).status, 403);
  assert.equal((await call("PATCH", `/api/rides/${id}/status`, { token: other.token, body: { status: "cancelled" } })).status, 403);
  assert.equal((await call("DELETE", `/api/rides/${id}`, { token: other.token })).status, 403);

  const upd = await call("PUT", `/api/rides/${id}`, { token: driver.token, body: rideBody({ pricePerSeat: 7 }) });
  assert.equal(upd.status, 200);
  assert.equal(upd.data.pricePerSeat, 7);
  assert.equal((await call("DELETE", `/api/rides/${id}`, { token: driver.token })).status, 204);
  assert.equal((await call("GET", `/api/rides/${id}`)).status, 404);
});

test("girls-only rides: only girls can post and see them", async () => {
  const girl = await register("Lina", "female");
  const boy = await register("Hadi", "male");
  assert.equal((await call("POST", "/api/rides", { token: boy.token, body: rideBody({ girlsOnly: true }) })).status, 403);
  const ride = (await call("POST", "/api/rides", { token: girl.token, body: rideBody({ girlsOnly: true, originArea: "GirlsOnlyTown" }) })).data;
  const seen = (t) => call("GET", "/api/rides?origin=GirlsOnlyTown", { token: t });
  assert.equal((await seen(girl.token)).data.length, 1);
  assert.equal((await seen(boy.token)).data.length, 0);
  assert.equal((await seen(undefined)).data.length, 0);
  assert.equal((await call("GET", `/api/rides/${ride.id}`, { token: boy.token })).data.error.code, "GIRLS_ONLY");
  assert.equal((await call("POST", `/api/rides/${ride.id}/bookings`, { token: boy.token, body: { seats: 1 } })).status, 403);
});

test("swagger: spec and UI are public", async () => {
  const spec = await call("GET", "/api/docs.json");
  assert.equal(spec.status, 200);
  assert.ok(spec.data.paths["/api/rides"]);
  assert.equal((await fetch(baseUrl() + "/api/docs/")).status, 200);
});
