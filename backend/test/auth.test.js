// Auth, bookings (seats, roles, cancel cascade) and the last-seat race.
import test from "node:test";
import assert from "node:assert/strict";
import { call, register, rideBody, future, query, baseUrl, useTestServer } from "./helpers.js";

useTestServer();

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

test("users: update own profile, phone stays private, delete own account cascades", async () => {
  const u = await register("Zoe", "male");
  const other = await register("Yusuf", "female");
  const ride = (await call("POST", "/api/rides", { token: u.token, body: rideBody() })).data;
  const prof = await call("PUT", `/api/users/${u.id}`, { token: u.token, body: { bio: "hi", phone: "+961 70 000 000" } });
  assert.equal(prof.data.bio, "hi");
  assert.equal((await call("PUT", `/api/users/${u.id}`, { token: other.token, body: { bio: "hack" } })).status, 403);
  assert.equal((await call("GET", `/api/users/${u.id}`)).data.phone, undefined);
  assert.equal((await call("DELETE", `/api/users/${other.id}`, { token: u.token })).status, 403);
  assert.equal((await call("DELETE", `/api/users/${u.id}`, { token: u.token })).status, 204);
  assert.equal((await call("GET", `/api/rides/${ride.id}`)).status, 404);
});
