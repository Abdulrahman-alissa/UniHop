// Fake data. Lives in React state and resets on refresh.
export const CAMPUSES = ["LAU Beirut", "LAU Byblos"];
// Facts taken from LAU's Beirut and Byblos location pages
export const CAMPUS_INFO = {
  "LAU Beirut": {
    url: "https://www.lau.edu.lb/about/locations/beirut.php",
    blurb: "Koraytem, four blocks south of Hamra. Jounieh, Baabda, Aley and Saida rides end here.",
    tip: "LAU says traffic around Koraytem is usually heavy after 8 a.m., and street parking is hard to find. Sharing one car saves both.",
    gate: "Lower gate, Koraytem",
  },
  "LAU Byblos": {
    url: "https://www.lau.edu.lb/about/locations/byblos.php",
    blurb: "Blat hillside above Jbeil, 35 km north of Beirut. Batroun, Tripoli and Jounieh rides end here.",
    tip: "LAU lists an underground parking permit at $177 per semester. Splitting a ride beats paying it alone.",
    gate: "Lower gate, Blat",
  },
};
export const AREAS = ["Aley", "Baabda", "Batroun", "Beirut", "Byblos", "Hamra", "Jounieh", "Kaslik", "Saida", "Tripoli"];
export const RIDE_TAGS = ["Quiet ride", "Music OK", "Air-conditioned", "Luggage space", "Study-friendly", "Non-smoking"];
export const GENDERS = [["female", "Girl"], ["male", "Boy"]];
export const DEMO = { email: "sara.khoury@lau.edu", password: "carpool123" };

const iso = (date) => date.toISOString();
const soon = (min) => iso(new Date(Date.now() + min * 60000));
const at = (days, hhmm) => {
  const x = new Date();
  x.setDate(x.getDate() + days);
  const [h, m] = hhmm.split(":").map(Number);
  x.setHours(h, m, 0, 0);
  return iso(x);
};

export const seedUsers = [
  { id: "u1", name: "Sara Khoury", email: "sara.khoury@lau.edu", password: "carpool123", campus: "LAU Beirut", gender: "female", rating: 4.9, verified: true, phone: "+961 70 123 456", joinedAt: "2024-09-02", bio: "Daily commuter from Jounieh. I keep the car quiet in the morning and the playlist good in the afternoon.", car: { make: "Kia", model: "Picanto", color: "Silver", plate: "B 214553", languages: ["Arabic", "English", "French"], permitVerified: true, trips: 64 } },
  { id: "u2", name: "Karim Haddad", email: "karim.haddad@lau.edu", password: "carpool123", campus: "LAU Byblos", gender: "male", rating: 4.7, verified: true, phone: "+961 71 234 567", joinedAt: "2023-09-11", bio: "Final-year student. Always leave on time, always have water in the car.", car: { make: "Toyota", model: "Yaris", color: "White", plate: "M 489120", languages: ["Arabic", "English"], permitVerified: true, trips: 91 } },
  { id: "u3", name: "Lina Nasr", email: "lina.nasr@lau.edu", password: "carpool123", campus: "LAU Beirut", gender: "female", rating: 4.8, verified: true, phone: "+961 76 345 678", joinedAt: "2025-01-20", bio: "Studio hours are long, so I drive early and share the fuel.", car: { make: "Honda", model: "Civic", color: "Black", plate: "G 330871", languages: ["Arabic", "English", "French"], permitVerified: true, trips: 37 } },
  { id: "u4", name: "Omar Daher", email: "omar.daher@lau.edu", password: "carpool123", campus: "LAU Byblos", gender: "male", rating: 0, verified: true, phone: "+961 03 456 789", joinedAt: "2026-09-05", bio: "", car: null },
];

const base = { status: "open", postedAt: soon(-300), direction: "toCampus", girlsOnly: false };
export const seedRides = [
  { ...base, id: "r1", driverId: "u1", originArea: "Jounieh", originLabel: "Maameltein exit, outside the petrol station", campus: "LAU Beirut", meetingPoint: "Lower gate, Koraytem", departAt: soon(50), returnAt: at(0, "23:30"), seatsTotal: 3, pricePerSeat: 4, notes: "Straight run down the highway, no stops. I wait five minutes at the pickup point.", tags: ["Quiet ride", "Air-conditioned"] },
  { ...base, id: "r2", driverId: "u2", originArea: "Batroun", originLabel: "Batroun roundabout, next to the bakery", campus: "LAU Byblos", meetingPoint: "Lower gate, Blat", departAt: soon(130), returnAt: null, seatsTotal: 2, pricePerSeat: 3, notes: "Quiet ride, I study on the way.", tags: ["Study-friendly", "Non-smoking"] },
  { ...base, id: "r3", girlsOnly: true, driverId: "u3", originArea: "Baabda", originLabel: "Baabda roundabout, bus stop side", campus: "LAU Beirut", meetingPoint: "Lower gate, Koraytem", departAt: at(1, "08:15"), returnAt: at(1, "16:45"), seatsTotal: 4, pricePerSeat: 3, notes: "Back at 16:45 if anyone needs a ride home.", tags: ["Music OK", "Luggage space"] },
  { ...base, id: "r4", direction: "fromCampus", driverId: "u1", originArea: "Tripoli", originLabel: "Tripoli, Al Mina road, outside the pharmacy", campus: "LAU Byblos", meetingPoint: "Lower gate, Blat", departAt: at(1, "07:00"), returnAt: at(1, "17:00"), seatsTotal: 3, pricePerSeat: 5, notes: "Long drive, one coffee stop if everyone agrees.", tags: ["Air-conditioned", "Non-smoking"] },
  { ...base, id: "r5", driverId: "u2", originArea: "Aley", originLabel: "Aley main square, near the municipality", campus: "LAU Beirut", meetingPoint: "Lower gate, Koraytem", departAt: at(2, "06:45"), returnAt: null, seatsTotal: 3, pricePerSeat: 5, notes: "Highway route, early start for the 8:00 lectures.", tags: ["Quiet ride"] },
  { ...base, id: "r6", direction: "fromCampus", girlsOnly: true, driverId: "u3", originArea: "Jounieh", originLabel: "Jounieh seaside road, Kaslik side", campus: "LAU Byblos", meetingPoint: "Lower gate, Blat", departAt: at(2, "09:00"), returnAt: at(2, "15:30"), seatsTotal: 2, pricePerSeat: 3, notes: "Music is fine, I take requests.", tags: ["Music OK"] },
  { ...base, id: "r7", driverId: "u1", originArea: "Saida", originLabel: "Saida sea road, outside the Sea Castle car park", campus: "LAU Beirut", meetingPoint: "Lower gate, Koraytem", departAt: at(3, "06:30"), returnAt: null, seatsTotal: 4, pricePerSeat: 6, notes: "Long drive, I can stop for coffee.", tags: ["Luggage space", "Air-conditioned"] },
  { ...base, id: "r8", direction: "fromCampus", driverId: "u2", originArea: "Beirut", originLabel: "Hamra, outside the AUB main gate", campus: "LAU Byblos", meetingPoint: "Lower gate, Blat", departAt: at(4, "08:30"), returnAt: at(4, "17:30"), seatsTotal: 2, pricePerSeat: 4, notes: "Exam week: I can wait ten minutes.", tags: ["Study-friendly"] },
];

export const seedBookings = [
  { id: "b1", rideId: "r1", passengerId: "u4", seats: 1, status: "confirmed", note: "" },
  { id: "b2", rideId: "r3", passengerId: "u1", seats: 1, status: "pending", note: "I finish class at 16:30." },
  { id: "b3", rideId: "r2", passengerId: "u4", seats: 1, status: "pending", note: "" },
];
