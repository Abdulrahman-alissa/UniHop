// OpenAPI 3 description served by Swagger UI at /api/docs (raw JSON at /api/docs.json).
const ref = (n) => ({ $ref: `#/components/schemas/${n}` });
const json = (schema) => ({ "application/json": { schema } });
const body = (schema, example) => ({ required: true, content: { "application/json": { schema, ...(example ? { example } : {}) } } });
const err = (description) => ({ description, content: json(ref("Error")) });
const idParam = (name = "id", description = "Resource id") => ({ name, in: "path", required: true, schema: { type: "string" }, description });
const secured = [{ bearerAuth: [] }];
const E = { 400: err("Validation error"), 401: err("Missing or invalid token"), 403: err("Not allowed (not the owner)"), 404: err("Not found"), 409: err("Conflict with current state") };
const pick = (...codes) => Object.fromEntries(codes.map((c) => [c, E[c]]));

const rideExample = {
  direction: "toCampus", girlsOnly: false, originArea: "Jounieh", originLabel: "Maameltein exit, outside the petrol station",
  campus: "LAU Beirut", meetingPoint: "Lower gate, Koraytem", departAt: "2030-01-15T07:30:00.000Z", returnAt: "2030-01-15T15:30:00.000Z",
  seatsTotal: 3, pricePerSeat: 4, notes: "No stops.", tags: ["Quiet ride"],
};

export const openapi = {
  openapi: "3.0.3",
  info: {
    title: "UniHop API",
    version: "1.0.0",
    description: "REST API for UniHop, the LAU Beirut / LAU Byblos student carpool app (CSC443 Phase 2).\n\n**How to try it:** call `POST /api/auth/login` (demo: `test.female@lau.edu` / `carpool123`), copy the `token`, press **Authorize** and paste it. Protected routes show a lock.",
  },
  servers: [{ url: "/", description: "This server" }],
  tags: [{ name: "Auth" }, { name: "Users" }, { name: "Rides" }, { name: "Bookings" }, { name: "Saved rides" }, { name: "System" }],
  paths: {
    "/api/health": { get: { tags: ["System"], summary: "Health check", responses: { 200: { description: "API and database are up" } } } },
    "/api/auth/register": { post: { tags: ["Auth"], summary: "Create an account (password stored as a bcrypt hash)",
      requestBody: body(ref("RegisterInput"), { name: "Sara Khoury", email: "sara@lau.edu", password: "carpool123", campus: "LAU Beirut", gender: "female" }),
      responses: { 201: { description: "Account created", content: json(ref("AuthResponse")) }, 400: E[400], 409: err("E-mail already registered") } } },
    "/api/auth/login": { post: { tags: ["Auth"], summary: "Log in and receive a JWT",
      requestBody: body(ref("LoginInput"), { email: "test.female@lau.edu", password: "carpool123" }),
      responses: { 200: { description: "Signed in", content: json(ref("AuthResponse")) }, 400: E[400], 401: err("Wrong e-mail or password") } } },
    "/api/auth/me": { get: { tags: ["Auth"], summary: "Current user", security: secured, responses: { 200: { description: "OK", content: json(ref("PrivateUser")) }, 401: E[401] } } },

    "/api/users": { get: { tags: ["Users"], summary: "List public profiles", parameters: [{ name: "campus", in: "query", schema: { type: "string", enum: ["LAU Beirut", "LAU Byblos"] } }], responses: { 200: { description: "OK", content: json({ type: "array", items: ref("PublicUser") }) } } } },
    "/api/users/{id}": {
      get: { tags: ["Users"], summary: "One public profile", parameters: [idParam()], responses: { 200: { description: "OK", content: json(ref("PublicUser")) }, 404: E[404] } },
      put: { tags: ["Users"], summary: "Update my profile (owner only)", security: secured, parameters: [idParam()], requestBody: body(ref("UpdateUserInput")), responses: { 200: { description: "Updated", content: json(ref("PrivateUser")) }, ...pick(400, 401, 403) } },
      delete: { tags: ["Users"], summary: "Delete my account (owner only; rides and bookings cascade)", security: secured, parameters: [idParam()], responses: { 204: { description: "Deleted" }, ...pick(401, 403) } },
    },

    "/api/rides": {
      get: { tags: ["Rides"], summary: "List rides (girls-only rides are hidden from non-girl viewers)", description: "Optional token. Total count is in the `X-Total-Count` response header.",
        parameters: [
          { name: "campus", in: "query", schema: { type: "string", enum: ["LAU Beirut", "LAU Byblos"] } },
          { name: "direction", in: "query", schema: { type: "string", enum: ["toCampus", "fromCampus"] } },
          { name: "origin", in: "query", schema: { type: "string" }, description: "Origin area contains…" },
          { name: "status", in: "query", schema: { type: "string", enum: ["open", "cancelled", "completed"] } },
          { name: "driverId", in: "query", schema: { type: "string" } },
          { name: "girlsOnly", in: "query", schema: { type: "boolean" } },
          { name: "hideFull", in: "query", schema: { type: "boolean" } },
          { name: "minSeats", in: "query", schema: { type: "integer", minimum: 0, maximum: 6 } },
          { name: "maxPrice", in: "query", schema: { type: "number" } },
          { name: "departAfter", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "departBefore", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["soonest", "cheapest", "seats"], default: "soonest" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 200, maximum: 500 } },
          { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
        ],
        responses: { 200: { description: "OK", content: json({ type: "array", items: ref("Ride") }) }, 400: E[400] } },
      post: { tags: ["Rides"], summary: "Post a ride (authenticated; caller becomes the driver)", security: secured, requestBody: body(ref("RideInput"), rideExample),
        responses: { 201: { description: "Created", content: json(ref("Ride")) }, ...pick(400, 401, 403) } },
    },
    "/api/rides/{id}": {
      get: { tags: ["Rides"], summary: "One ride", parameters: [idParam()], responses: { 200: { description: "OK", content: json(ref("Ride")) }, 403: err("GIRLS_ONLY: girls-only ride"), 404: E[404] } },
      put: { tags: ["Rides"], summary: "Edit a ride (driver only)", security: secured, parameters: [idParam()], requestBody: body(ref("RideInput"), rideExample), responses: { 200: { description: "Updated", content: json(ref("Ride")) }, ...pick(400, 401, 403, 404, 409) } },
      delete: { tags: ["Rides"], summary: "Delete a ride and its bookings (driver only)", security: secured, parameters: [idParam()], responses: { 204: { description: "Deleted" }, ...pick(401, 403, 404) } },
    },
    "/api/rides/{id}/status": { patch: { tags: ["Rides"], summary: "Cancel or complete a ride (driver only). Cancelling cancels its live bookings.", security: secured, parameters: [idParam()],
      requestBody: body({ type: "object", required: ["status"], properties: { status: { type: "string", enum: ["cancelled", "completed"] } } }, { status: "cancelled" }),
      responses: { 200: { description: "Updated", content: json(ref("Ride")) }, ...pick(400, 401, 403, 404, 409) } } },
    "/api/rides/{id}/bookings": {
      get: { tags: ["Bookings"], summary: "Requests on my ride (driver only)", security: secured, parameters: [idParam()], responses: { 200: { description: "OK", content: json({ type: "array", items: ref("Booking") }) }, ...pick(401, 403, 404) } },
      post: { tags: ["Bookings"], summary: "Request seats on a ride", security: secured, parameters: [idParam()], requestBody: body(ref("BookingInput"), { seats: 1, note: "I finish class at 16:30." }),
        responses: { 201: { description: "Requested (status pending)", content: json(ref("Booking")) }, ...pick(400, 401, 403, 404, 409) } },
    },

    "/api/bookings/mine": { get: { tags: ["Bookings"], summary: "My bookings as passenger and requests on my rides as driver", security: secured,
      responses: { 200: { description: "OK", content: json({ type: "object", properties: { asPassenger: { type: "array", items: ref("Booking") }, asDriver: { type: "array", items: ref("Booking") } } }) }, 401: E[401] } } },
    "/api/bookings/{id}/status": { patch: { tags: ["Bookings"], summary: "Passenger cancels; driver confirms/declines", security: secured, parameters: [idParam()],
      requestBody: body({ type: "object", required: ["status"], properties: { status: { type: "string", enum: ["pending", "confirmed", "declined", "cancelled"] } } }, { status: "confirmed" }),
      responses: { 200: { description: "Updated", content: json(ref("Booking")) }, ...pick(400, 401, 403, 404, 409) } } },

    "/api/saved": { get: { tags: ["Saved rides"], summary: "Ids of my saved rides", security: secured, responses: { 200: { description: "OK", content: json({ type: "array", items: { type: "string" } }) }, 401: E[401] } } },
    "/api/saved/{rideId}": {
      put: { tags: ["Saved rides"], summary: "Save a ride", security: secured, parameters: [idParam("rideId")], responses: { 204: { description: "Saved" }, ...pick(401, 404) } },
      delete: { tags: ["Saved rides"], summary: "Unsave a ride", security: secured, parameters: [idParam("rideId")], responses: { 204: { description: "Removed" }, 401: E[401] } },
    },
  },
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    schemas: {
      Error: { type: "object", properties: { error: { type: "object", properties: { message: { type: "string" }, code: { type: "string" }, details: { type: "array", items: { type: "object" } } } } } },
      Car: { type: "object", nullable: true, properties: { make: { type: "string" }, model: { type: "string" }, color: { type: "string" }, plate: { type: "string" }, languages: { type: "array", items: { type: "string" } }, permitVerified: { type: "boolean" }, trips: { type: "integer" } } },
      PublicUser: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, campus: { type: "string" }, gender: { type: "string", enum: ["female", "male"] }, rating: { type: "number" }, verified: { type: "boolean" }, bio: { type: "string" }, car: ref("Car"), joinedAt: { type: "string", format: "date-time" } } },
      PrivateUser: { allOf: [ref("PublicUser"), { type: "object", properties: { email: { type: "string" }, phone: { type: "string" } } }] },
      RegisterInput: { type: "object", required: ["name", "email", "password", "campus", "gender"], properties: { name: { type: "string" }, email: { type: "string", description: "Must end with @lau.edu" }, password: { type: "string", minLength: 8, description: "Letters and numbers" }, campus: { type: "string", enum: ["LAU Beirut", "LAU Byblos"] }, gender: { type: "string", enum: ["female", "male"] } } },
      LoginInput: { type: "object", required: ["email", "password"], properties: { email: { type: "string" }, password: { type: "string" } } },
      AuthResponse: { type: "object", properties: { token: { type: "string" }, user: ref("PrivateUser") } },
      UpdateUserInput: { type: "object", properties: { name: { type: "string" }, campus: { type: "string" }, phone: { type: "string" }, bio: { type: "string" }, car: ref("Car") } },
      RideInput: { type: "object", required: ["direction", "originArea", "originLabel", "campus", "meetingPoint", "departAt", "seatsTotal", "pricePerSeat"], properties: {
        direction: { type: "string", enum: ["toCampus", "fromCampus"] }, girlsOnly: { type: "boolean", description: "Only girl drivers may set this" },
        originArea: { type: "string" }, originLabel: { type: "string" }, campus: { type: "string", enum: ["LAU Beirut", "LAU Byblos"] }, meetingPoint: { type: "string" },
        departAt: { type: "string", format: "date-time" }, returnAt: { type: "string", format: "date-time", nullable: true },
        seatsTotal: { type: "integer", minimum: 1, maximum: 6 }, pricePerSeat: { type: "number", minimum: 0, maximum: 50 }, notes: { type: "string", maxLength: 400 },
        tags: { type: "array", items: { type: "string", enum: ["Quiet ride", "Music OK", "Air-conditioned", "Luggage space", "Study-friendly", "Non-smoking"] } } } },
      Ride: { allOf: [ref("RideInput"), { type: "object", properties: { id: { type: "string" }, driverId: { type: "string" }, status: { type: "string", enum: ["open", "cancelled", "completed"] }, postedAt: { type: "string", format: "date-time" }, seatsBooked: { type: "integer" }, seatsLeft: { type: "integer" }, isFull: { type: "boolean" }, driver: ref("PublicUser") } }] },
      BookingInput: { type: "object", required: ["seats"], properties: { seats: { type: "integer", minimum: 1, maximum: 6 }, note: { type: "string", maxLength: 300 } } },
      Booking: { type: "object", properties: { id: { type: "string" }, rideId: { type: "string" }, passengerId: { type: "string" }, seats: { type: "integer" }, status: { type: "string", enum: ["pending", "confirmed", "declined", "cancelled"] }, note: { type: "string" }, createdAt: { type: "string", format: "date-time" }, ride: ref("Ride"), passenger: ref("PublicUser") } },
    },
  },
};
