import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, tokenStore } from "./lib/api";

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

let counter = 0;
const ok = (extra = {}) => ({ ok: true, ...extra });
const fail = (err) => ({ ok: false, error: err?.message || "Something went wrong. Try again.", code: err?.code });
const live = (b) => b.status === "pending" || b.status === "confirmed";
const EMPTY_BOOKINGS = { asPassenger: [], asDriver: [] };

// All shared data now lives in the database. This store keeps a cached copy for the UI,
// calls the REST API for every change and then re-fetches so the screen always matches the server.
export function StoreProvider({ children }) {
  const [rides, setRides] = useState([]);
  const [myBookings, setMyBookings] = useState(EMPTY_BOOKINGS);
  const [savedRideIds, setSaved] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  // "loading" (first fetch) | "ready" | "error" (API unreachable)
  const [boot, setBoot] = useState({ state: "loading", error: "" });
  const [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState(() => (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  const userRef = useRef(null);
  userRef.current = currentUser;

  useEffect(() => { document.documentElement.classList.toggle("dark", theme === "dark"); }, [theme]);

  const toast = useCallback((type, title, description) => {
    const id = `t${counter++}`;
    setToasts((t) => [...t, { id, type, title, description }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  /** Re-download rides (and, when signed in, my bookings and saved rides). */
  const refresh = useCallback(async (signedIn = Boolean(userRef.current)) => {
    const [r, b, s] = await Promise.all([
      api.get("/rides?limit=500"),
      signedIn ? api.get("/bookings/mine") : EMPTY_BOOKINGS,
      signedIn ? api.get("/saved") : [],
    ]);
    setRides(r); setMyBookings(b); setSaved(s);
  }, []);

  const loadAll = useCallback(async () => {
    setBoot({ state: "loading", error: "" });
    try {
      let user = null;
      if (tokenStore.get()) {
        try { user = await api.get("/auth/me"); }
        catch (e) { if (e.status === 401) tokenStore.set(null); else throw e; } // expired token: continue signed out
      }
      userRef.current = user;
      setCurrentUser(user);
      await refresh(Boolean(user));
      setBoot({ state: "ready", error: "" });
    } catch (e) {
      setBoot({ state: "error", error: e.message });
    }
  }, [refresh]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Wrap a mutation: run it, refresh the cached data, and turn errors into { ok:false, error }.
  const mutate = async (fn) => {
    try {
      const data = await fn();
      await refresh();
      return ok(data ? { data } : {});
    } catch (e) {
      if (e.status === 401 && userRef.current) { signOut(); return fail({ message: "Your session expired. Please sign in again." }); }
      return fail(e);
    }
  };

  const ridesWithDrivers = rides;
  const getRideView = (id) => rides.find((r) => r.id === id);
  const upcoming = useMemo(
    () => rides
      .filter((r) => r.status === "open" && new Date(r.departAt).getTime() > Date.now() - 3600000)
      .sort((a, b) => new Date(a.departAt) - new Date(b.departAt)),
    [rides]
  );
  // The API already hides girls-only rides from non-girl accounts; this keeps the UI rule explicit.
  const canSee = (r) => !r.girlsOnly || currentUser?.gender === "female";
  const ridesByDriver = (id) => rides.filter((r) => r.driverId === id);
  const withFreshRide = (b) => ({ ...b, ride: getRideView(b.rideId) || b.ride });
  const bookingsByPassenger = () => myBookings.asPassenger.map((b) => ({ ...withFreshRide(b), passenger: currentUser }));
  const bookingsForDriver = () => myBookings.asDriver.map(withFreshRide);
  const canManageRide = (id) => rides.find((r) => r.id === id)?.driverId === currentUser?.id;
  const bookings = myBookings.asPassenger; // my own bookings (used to detect "already booked")

  // Auth ------------------------------------------------------------------
  const startSession = async ({ token, user }) => {
    tokenStore.set(token);
    userRef.current = user;
    setCurrentUser(user);
    try { await refresh(true); } catch { /* the UI will retry on the next action */ }
  };
  const signOut = () => {
    tokenStore.set(null);
    userRef.current = null;
    setCurrentUser(null);
    setMyBookings(EMPTY_BOOKINGS);
    setSaved([]);
    refresh(false).catch(() => {}); // girls-only rides disappear again
  };
  const login = async (email, password) => {
    try { await startSession(await api.post("/auth/login", { email, password })); return ok(); }
    catch (e) { return fail(e); }
  };
  const register = async (data) => {
    try { await startSession(await api.post("/auth/register", data)); return ok(); }
    catch (e) { return fail(e); }
  };

  // Rides: only the driver can edit or cancel (enforced by the API too) --------
  const createRide = async (draft) => {
    const r = await mutate(() => api.post("/rides", draft));
    return r.ok ? ok({ rideId: r.data.id }) : r;
  };
  const updateRide = (id, draft) => mutate(() => api.put(`/rides/${id}`, draft));
  const setRideStatus = (id, status) => mutate(() => api.patch(`/rides/${id}/status`, { status }));

  // Bookings --------------------------------------------------------------
  const bookRide = (rideId, seats, note) => mutate(() => api.post(`/rides/${rideId}/bookings`, { seats, note: note.trim() }));
  const cancelBooking = (id) => mutate(() => api.patch(`/bookings/${id}/status`, { status: "cancelled" }));
  const respondToBooking = (id, status) => mutate(() => api.patch(`/bookings/${id}/status`, { status }));

  // Saved rides: optimistic update, rolled back if the server says no
  const toggleSaved = async (id) => {
    if (!currentUser) { toast("info", "Sign in to save rides", "Saved rides are kept on your account."); return; }
    const was = savedRideIds.includes(id);
    setSaved((s) => (was ? s.filter((x) => x !== id) : [...s, id]));
    try {
      await (was ? api.delete(`/saved/${id}`) : api.put(`/saved/${id}`));
      toast("info", was ? "Removed from saved rides" : "Saved for later");
    } catch (e) {
      setSaved((s) => (was ? [...s, id] : s.filter((x) => x !== id)));
      toast("error", "Couldn't update saved rides", e.message);
    }
  };
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <Ctx.Provider value={{ boot, reload: loadAll, bookings, currentUser, theme, toggleTheme, toasts, toast, ridesWithDrivers, upcoming, getRideView, ridesByDriver, bookingsByPassenger, bookingsForDriver, canManageRide, canSee, savedRideIds, toggleSaved, login, register, logout: signOut, createRide, updateRide, setRideStatus, bookRide, cancelBooking, respondToBooking }}>
      {children}
    </Ctx.Provider>
  );
}
