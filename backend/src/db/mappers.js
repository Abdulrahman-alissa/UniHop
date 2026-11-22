// Turn snake_case DB rows into the camelCase JSON the frontend already uses.

/** Fields anybody may see about a user. No e-mail, phone or password hash. */
export const publicUser = (u) => ({
  id: u.id, name: u.name, campus: u.campus, gender: u.gender, rating: u.rating,
  verified: u.verified, bio: u.bio, car: u.car, joinedAt: u.joined_at,
});

/** What a user sees about themselves. */
export const privateUser = (u) => ({ ...publicUser(u), email: u.email, phone: u.phone });

/** A passenger as seen by the driver they booked with: public data + phone so they can coordinate. */
export const passengerView = (u) => ({ ...publicUser(u), phone: u.phone });

export const rideFromRow = (r) => {
  const seatsLeft = Math.max(0, r.seats_total - r.seats_booked);
  return {
    id: r.id, driverId: r.driver_id, direction: r.direction, girlsOnly: r.girls_only,
    originArea: r.origin_area, originLabel: r.origin_label, campus: r.campus, meetingPoint: r.meeting_point,
    departAt: r.depart_at, returnAt: r.return_at, seatsTotal: r.seats_total, pricePerSeat: r.price_per_seat,
    notes: r.notes, tags: r.tags, status: r.status, postedAt: r.posted_at,
    seatsBooked: r.seats_booked, seatsLeft, isFull: seatsLeft === 0,
    driver: publicUser({ id: r.driver_id, name: r.d_name, campus: r.d_campus, gender: r.d_gender, rating: r.d_rating, verified: r.d_verified, bio: r.d_bio, car: r.d_car, joined_at: r.d_joined_at }),
  };
};

export const bookingFromRow = (b) => ({
  id: b.id, rideId: b.ride_id, passengerId: b.passenger_id, seats: b.seats, status: b.status, note: b.note, createdAt: b.created_at,
});
