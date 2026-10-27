import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { seedUsers, seedRides, seedBookings } from "./data";

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

let counter = 100;
const uid = (p) => `${p}${counter++}`;
const ok = (extra = {}) => ({ ok: true, ...extra });
const fail = (error) => ({ ok: false, error });
const live = (b) => b.status === "pending" || b.status === "confirmed";

// Everything lives in React state, so data is lost on refresh
export function StoreProvider({ children }) {
  const [users, setUsers] = useState(seedUsers);
  const [rides, setRides] = useState(seedRides);
  const [bookings, setBookings] = useState(seedBookings);
  const [savedRideIds, setSaved] = useState(["r5"]);
  const [userId, setUserId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState(() => (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

  useEffect(() => { document.documentElement.classList.toggle("dark", theme === "dark"); }, [theme]);

  const toast = useCallback((type, title, description) => {
    const id = uid("t");
    setToasts((t) => [...t, { id, type, title, description }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const currentUser = users.find((u) => u.id === userId) || null;

  // girls-only rides can only be seen by girls (and the driver)
  const canSee = (r) => !r.girlsOnly || currentUser?.gender === "female";

  // rides with driver info and seat counts added
  const ridesWithDrivers = useMemo(
    () =>
      rides.map((r) => {
        const seatsBooked = bookings.filter((b) => b.rideId === r.id && live(b)).reduce((s, b) => s + b.seats, 0);
        const seatsLeft = Math.max(0, r.seatsTotal - seatsBooked);
        return { ...r, driver: users.find((u) => u.id === r.driverId), seatsBooked, seatsLeft, isFull: seatsLeft === 0 };
      }),
    [rides, users, bookings]
  );
  const getRideView = (id) => ridesWithDrivers.find((r) => r.id === id);
  const upcoming = useMemo(
    () => ridesWithDrivers
      .filter((r) => r.status === "open" && new Date(r.departAt).getTime() > Date.now() - 3600000)
      .filter((r) => !r.girlsOnly || currentUser?.gender === "female")
      .sort((a, b) => new Date(a.departAt) - new Date(b.departAt)),
    [ridesWithDrivers, currentUser]
  );
  const decorate = (b) => ({ ...b, ride: getRideView(b.rideId), passenger: users.find((u) => u.id === b.passengerId) });
  const ridesByDriver = (id) => ridesWithDrivers.filter((r) => r.driverId === id);
  const bookingsByPassenger = (id) => bookings.filter((b) => b.passengerId === id).map(decorate);
  const bookingsForDriver = (id) => bookings.filter((b) => rides.find((r) => r.id === b.rideId)?.driverId === id).map(decorate);
  const canManageRide = (id) => rides.find((r) => r.id === id)?.driverId === userId;

  // Auth
  const login = (email, password) => {
    const u = users.find((x) => x.email === email.trim().toLowerCase() && x.password === password);
    if (!u) return fail("Email or password is incorrect.");
    setUserId(u.id);
    return ok();
  };
  const register = (data) => {
    const email = data.email.trim().toLowerCase();
    if (users.some((u) => u.email === email)) return fail("An account with this email already exists.");
    const u = { id: uid("u"), ...data, name: data.name.trim(), email, rating: 0, verified: true, phone: "", joinedAt: new Date().toISOString(), bio: "", car: null };
    setUsers((us) => [...us, u]);
    setUserId(u.id);
    return ok();
  };
  const logout = () => setUserId(null);

  // Rides: only the driver can edit or cancel
  const createRide = (draft) => {
    if (!currentUser) return fail("Sign in to post a ride.");
    const id = uid("r");
    // only girl drivers can make a girls-only ride
    const girlsOnly = currentUser.gender === "female" && Boolean(draft.girlsOnly);
    setRides((rs) => [...rs, { ...draft, girlsOnly, id, driverId: currentUser.id, status: "open", postedAt: new Date().toISOString() }]);
    return ok({ rideId: id });
  };
  const updateRide = (id, draft) => {
    if (!canManageRide(id)) return fail("Only the driver can edit this ride.");
    setRides((rs) => rs.map((r) => (r.id === id ? { ...r, ...draft } : r)));
    return ok();
  };
  const setRideStatus = (id, status) => {
    if (!canManageRide(id)) return fail("Only the driver can change this ride.");
    setRides((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    if (status === "cancelled") setBookings((bs) => bs.map((b) => (b.rideId === id && live(b) ? { ...b, status: "cancelled" } : b)));
    return ok();
  };

  // Bookings
  const bookRide = (rideId, seats, note) => {
    const r = getRideView(rideId);
    if (!currentUser) return fail("Sign in to book a seat.");
    if (!r || r.status !== "open") return fail("This ride is no longer open.");
    if (r.girlsOnly && currentUser.gender !== "female") return fail("This ride is for girls only.");
    if (r.driverId === currentUser.id) return fail("You can't book your own ride.");
    if (seats > r.seatsLeft) return fail(`Only ${r.seatsLeft} seat(s) left.`);
    if (bookings.some((b) => b.rideId === rideId && b.passengerId === currentUser.id && live(b))) return fail("You already booked this ride.");
    setBookings((bs) => [...bs, { id: uid("b"), rideId, passengerId: currentUser.id, seats, status: "pending", note: note.trim() }]);
    return ok();
  };
  const cancelBooking = (id) => {
    if (bookings.find((b) => b.id === id)?.passengerId !== currentUser?.id) return fail("That isn't your booking.");
    setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
    return ok();
  };
  const respondToBooking = (id, status) => {
    const b = bookings.find((x) => x.id === id);
    if (!b || !canManageRide(b.rideId)) return fail("Only the driver can answer requests.");
    setBookings((bs) => bs.map((x) => (x.id === id ? { ...x, status } : x)));
    return ok();
  };
  const toggleSaved = (id) => setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <Ctx.Provider value={{ users, bookings, currentUser, theme, toggleTheme, toasts, toast, ridesWithDrivers, upcoming, getRideView, ridesByDriver, bookingsByPassenger, bookingsForDriver, canManageRide, canSee, savedRideIds, toggleSaved, login, register, logout, createRide, updateRide, setRideStatus, bookRide, cancelBooking, respondToBooking }}>
      {children}
    </Ctx.Provider>
  );
}
