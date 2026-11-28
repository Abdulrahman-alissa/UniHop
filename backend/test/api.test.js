// Integration tests against a real PostgreSQL database.
//   DATABASE_URL=postgresql://user@localhost:5432/unihop_test npm test
// WARNING: tables are wiped at the start of the run; never point this at real data.
import "./setup.js"; // must come first: sets NODE_ENV before config is read
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { migrate, pool, query } from "../src/db/pool.js";

let server, base;
const call = async (method, path, { token, body } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, headers: res.headers, data: text ? JSON.parse(text) : null };
};
const register = async (name, gender, email = `${name.toLowerCase()}@lau.edu`) => {
  const r = await call("POST", "/api/auth/register", { body: { name, email, password: "carpool123", campus: "LAU Beirut", gender } });
  assert.equal(r.status, 201);
  return { token: r.data.token, id: r.data.user.id };
};
const future = (h = 5) => new Date(Date.now() + h * 3600_000).toISOString();
const rideBody = (o = {}) => ({ direction: "toCampus", girlsOnly: false, originArea: "Jounieh", originLabel: "Maameltein exit", campus: "LAU Beirut", meetingPoint: "Lower gate", departAt: future(), returnAt: null, seatsTotal: 2, pricePerSeat: 4, notes: "", tags: [], ...o });

before(async () => {
  await migrate();
  await query("TRUNCATE saved_rides, bookings, rides, users CASCADE");
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { server.close(); await pool.end(); });

test("auth: register, duplicate, validation, login, me, hashing", async () => {
  const sara = await register("Sara", "female");
  assert.equal((await call("POST", "/api/auth/register", { body: { name: "Sara", email: "sara@lau.edu", password: "carpool123", campus: "LAU Beirut", gender: "female" } })).status, 409);
  assert.equal((await call("POST", "/api/auth/register", { body: { name: "X", email: "bad@gmail.com", password: "short", campus: "MIT", gender: "x" } })).status, 400);
  const bad = await call("POST", "/api/auth/login", { body: { email: "sara@lau.edu", password: "wrongpass1" } });
  assert.equal(bad.status, 401);
  assert.equal((await call("POST", "/api/auth/login", { body: { email: "nobody@lau.edu", password: "wrongpass1" } })).data.error.message, bad.data.error.message);
  const ok = await call("POST", "/api/auth/login", { body: { email: "SARA@lau.edu", password: "carpool123" } });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.user.password_hash, undefined);
  assert.equal((await call("GET", "/api/auth/me", { token: sara.token })).data.email, "sara@lau.edu");
  const { rows } = await query("SELECT password_hash FROM users WHERE email='sara@lau.edu'");
  assert.match(rows[0].password_hash, /^\$2[aby]\$/); // bcrypt
  assert.equal((await call("GET", "/api/auth/me", { token: "garbage" })).status, 401);
});

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

test("bookings: seats, duplicates, roles, cancel cascade", async () => {
  const driver = await register("Dana", "female");
  const p1 = await register("Pia", "female");
  const p2 = await register("Paul", "male");
  const ride = (await call("POST", "/api/rides", { token: driver.token, body: rideBody({ seatsTotal: 2 }) })).data;
  const book = (t, seats) => call("POST", `/api/rides/${ride.id}/bookings`, { token: t, body: { seats } });

  assert.equal((await book(undefined, 1)).status, 401);
  assert.equal((await book(driver.token, 1)).data.error.code, "OWN_RIDE");
  assert.equal((await book(p1.token, 3)).data.error.code, "NOT_ENOUGH_SEATS");
  const b1 = await book(p1.token, 1);
  assert.equal(b1.status, 201);
  assert.equal(b1.data.status, "pending");
  assert.equal((await book(p1.token, 1)).data.error.code, "ALREADY_BOOKED");
  assert.equal((await call("GET", `/api/rides/${ride.id}`)).data.seatsLeft, 1);

  // only the driver sees the requests; only the driver confirms; only the passenger cancels
  assert.equal((await call("GET", `/api/rides/${ride.id}/bookings`, { token: p1.token })).status, 403);
  const reqs = await call("GET", `/api/rides/${ride.id}/bookings`, { token: driver.token });
  assert.equal(reqs.data.length, 1);
  const patch = (t, s) => call("PATCH", `/api/bookings/${b1.data.id}/status`, { token: t, body: { status: s } });
  assert.equal((await patch(p1.token, "confirmed")).status, 403);
  assert.equal((await patch(p2.token, "confirmed")).status, 404);
  assert.equal((await patch(driver.token, "confirmed")).data.status, "confirmed");
  assert.equal((await patch(driver.token, "declined")).data.status, "declined");
  assert.equal((await call("GET", `/api/rides/${ride.id}`)).data.seatsLeft, 2); // declined frees the seat

  const mine = await call("GET", "/api/bookings/mine", { token: p1.token });
  assert.equal(mine.data.asPassenger[0].ride.driver.id, driver.id);
  const inc = await call("GET", "/api/bookings/mine", { token: driver.token });
  assert.equal(inc.data.asDriver[0].passenger.name, "Pia");

  // restore + cancel ride cascades
  assert.equal((await patch(driver.token, "confirmed")).status, 200);
  await book(p2.token, 1);
  const cancelled = await call("PATCH", `/api/rides/${ride.id}/status`, { token: driver.token, body: { status: "cancelled" } });
  assert.equal(cancelled.data.status, "cancelled");
  assert.equal(cancelled.data.seatsBooked, 0);
  assert.equal((await patch(driver.token, "confirmed")).data.error.code, "BOOKING_CANCELLED");
  assert.equal((await book(p2.token, 1)).data.error.code, "RIDE_NOT_OPEN");
});

test("concurrency: the last seat can only be taken once", async () => {
  const driver = await register("Rami", "male");
  const ride = (await call("POST", "/api/rides", { token: driver.token, body: rideBody({ seatsTotal: 1 }) })).data;
  const people = await Promise.all(["A1", "A2", "A3", "A4", "A5"].map((n) => register(`Racer${n}`, "male")));
  const results = await Promise.all(people.map((p) => call("POST", `/api/rides/${ride.id}/bookings`, { token: p.token, body: { seats: 1 } })));
  assert.equal(results.filter((r) => r.status === 201).length, 1);
  assert.equal((await call("GET", `/api/rides/${ride.id}`)).data.isFull, true);
});

test("saved rides, user profile update/delete, filters, errors, docs", async () => {
  const u = await register("Zed", "male");
  const other = await register("Yara", "female");
  const ride = (await call("POST", "/api/rides", { token: u.token, body: rideBody({ originArea: "Zahle", pricePerSeat: 9 }) })).data;
  assert.equal((await call("PUT", `/api/saved/${ride.id}`, { token: other.token })).status, 204);
  assert.deepEqual((await call("GET", "/api/saved", { token: other.token })).data, [ride.id]);
  assert.equal((await call("DELETE", `/api/saved/${ride.id}`, { token: other.token })).status, 204);
  assert.equal((await call("GET", "/api/saved")).status, 401);

  const list = await call("GET", "/api/rides?origin=zahle&maxPrice=9&sort=cheapest");
  assert.equal(list.data.length, 1);
  assert.equal(list.headers.get("x-total-count"), "1");
  assert.equal((await call("GET", "/api/rides?maxPrice=abc")).status, 400);

  const prof = await call("PUT", `/api/users/${u.id}`, { token: u.token, body: { bio: "hi", phone: "+961 70 000 000" } });
  assert.equal(prof.data.bio, "hi");
  assert.equal((await call("PUT", `/api/users/${u.id}`, { token: other.token, body: { bio: "hack" } })).status, 403);
  assert.equal((await call("GET", `/api/users/${u.id}`)).data.phone, undefined); // phone is private
  assert.equal((await call("DELETE", `/api/users/${other.id}`, { token: u.token })).status, 403);
  assert.equal((await call("DELETE", `/api/users/${u.id}`, { token: u.token })).status, 204);
  assert.equal((await call("GET", `/api/rides/${ride.id}`)).status, 404); // cascade

  assert.equal((await call("GET", "/api/nothing")).data.error.code, "ROUTE_NOT_FOUND");
  const bad = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{oops" });
  assert.equal(bad.status, 400);
  const spec = await call("GET", "/api/docs.json");
  assert.equal(spec.status, 200);
  assert.ok(spec.data.paths["/api/rides"]);
  assert.equal((await fetch(base + "/api/docs/")).status, 200);
});
