const d = (iso) => new Date(iso);
const same = (a, b) => a.toDateString() === b.toDateString();
export const formatTime = (iso) => d(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
export const formatDay = (iso) => {
  const x = d(iso), n = new Date(), t = new Date(n);
  t.setDate(n.getDate() + 1);
  if (same(x, n)) return "Today";
  if (same(x, t)) return "Tomorrow";
  return x.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
};
export const formatDayTime = (iso) => `${formatDay(iso)} · ${formatTime(iso)}`;
export const formatFullDate = (iso) => d(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
export const formatPrice = (n) => `$${n}`;
export const formatCountdown = (iso) => {
  const m = Math.round((d(iso) - Date.now()) / 60000);
  if (m <= 0) return "departing now";
  if (m < 60) return `in ${m} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `in ${h} h` : `in ${Math.floor(h / 24)} d`;
};

// A ride is either home -> campus or campus -> home
export const routeOf = (ride) =>
  ride.direction === "fromCampus" ? { from: ride.campus, to: ride.originArea } : { from: ride.originArea, to: ride.campus };
export const genderWord = (g) => (g === "female" ? "Girl" : "Boy");
