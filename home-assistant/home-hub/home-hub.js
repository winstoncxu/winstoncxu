/*
 * Home Hub — a wall-panel style custom panel for Home Assistant.
 *
 * Three views: Controls (rooms, lights, cameras, security), Calendar and
 * Ambient (big clock, house status, front-of-house cameras, energy today).
 *
 * Installed as a `panel_custom`, so it runs inside Home Assistant with your
 * normal login. No access tokens are stored anywhere. See README.md.
 */

const VERSION = "1.0.0";

const DEFAULTS = {
  theme: "light", // light | dark | auto (follows Home Assistant)
  clock_24h: false,
  idle_minutes: 5, // switch to Ambient after this much inactivity (0 = never)
  default_view: "controls",
  camera_refresh: 5, // seconds between camera snapshot refreshes
  name_strip_area: true, // "Kitchen Pendants" → "Pendants" inside the Kitchen room
  weather: null, // defaults to the first weather.* entity
  power: null, // sensor reporting current power use (W or kW)
  energy_today: null, // sensor reporting energy used today (kWh, resets daily)
  rooms: null, // ordered list of area ids or names; default: every area with lights
  hidden_rooms: [],
  room_domains: ["light"],
  cameras: null, // [{ entity, name, detection, featured }]; default: every camera
  security: null, // [entity | { entity, name }]; default: locks + garage/gate covers
  status: null, // Ambient status rows; see README
  activity: null, // entities for the "recent activity" strip; default: security
  actions: [], // [{ name, icon, entity }] buttons under the room list
  calendars: [], // calendars shown on the Calendar view
  next_up_calendars: null, // calendars used for "Next up"; default: calendars
  highlight_calendars: [], // e.g. a sports schedule, shown as chips on Ambient
};

/* ------------------------------------------------------------------ icons */

const ICONS = {
  bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  lock: '<rect width="16" height="11" x="4" y="11" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  unlock: '<rect width="16" height="11" x="4" y="11" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.9-1"/>',
  garage: '<path d="M3 21V9l9-5 9 5v12"/><path d="M7 21v-9h10v9"/><path d="M7 15h10"/><path d="M7 18h10"/>',
  gate: '<path d="M4 4v17"/><path d="M20 4v17"/><path d="M4 8h16"/><path d="M4 17h16"/><path d="M9 8v9"/><path d="M14.5 8v9"/>',
  door: '<path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.56v16.16a1 1 0 0 1-1.24.97L5 20V5.56a2 2 0 0 1 1.52-1.94l4-1A2 2 0 0 1 13 4.56Z"/>',
  thermo: '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  drop: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  power: '<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  rain: '<path d="M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/>',
  snow: '<path d="M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24"/><path d="M8 15h.01M8 19h.01M12 17h.01M12 21h.01M16 15h.01M16 19h.01"/>',
  storm: '<path d="M6 16.33A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.97"/><path d="m13 12-3 5h4l-3 5"/>',
  fog: '<path d="M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24"/><path d="M16 17H7M17 21H9"/>',
  partly: '<path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41M15.95 12.65a4 4 0 0 0-5.93-4.61"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/>',
  wind: '<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>',
  car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18.4 10.5 16 6.5c-.3-.5-.9-.5-1.4-.5H8.4c-.5 0-1 .3-1.3.7L4.5 10.5 3.4 11c-.8.3-1.4 1.1-1.4 2v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/>',
  fan: '<path d="M10.83 16.38a2 2 0 1 0 2.83-2.83"/><path d="M12 12c-1.5-3-1.5-6 0-9 3 1 4 4 3 6.5"/><path d="M12 12c3.5.5 6 2.5 7 5.5-2.5 2-5.5 1.5-7-1"/><path d="M12 12c-2 2.5-5 3.5-8 2.5.5-3 3-5 6-4.5"/>',
  plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
  scene: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  motion: '<circle cx="13" cy="4" r="2"/><path d="m7 21 3-5 3 2v-5l-3-3 3-2 2 3h3"/><path d="m6 12 2-3h4"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  dot: '<circle cx="12" cy="12" r="1"/>',
};

const icon = (name, cls = "") =>
  `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.dot}</svg>`;

const WEATHER = {
  "clear-night": ["moon", "Clear"],
  cloudy: ["cloud", "Cloudy"],
  exceptional: ["cloud", "Unusual"],
  fog: ["fog", "Fog"],
  hail: ["snow", "Hail"],
  lightning: ["storm", "Storms"],
  "lightning-rainy": ["storm", "Storms"],
  partlycloudy: ["partly", "Partly cloudy"],
  pouring: ["rain", "Pouring"],
  rainy: ["rain", "Rain"],
  snowy: ["snow", "Snow"],
  "snowy-rainy": ["snow", "Sleet"],
  sunny: ["sun", "Sunny"],
  windy: ["wind", "Windy"],
  "windy-variant": ["wind", "Windy"],
};

/* ---------------------------------------------------------------- helpers */

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const domainOf = (id) => id.split(".")[0];
const asArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const entryId = (e) => (typeof e === "string" ? e : e.entity);
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const DAY = 86400000;
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

function clockParts(d, h24) {
  const m = String(d.getMinutes()).padStart(2, "0");
  if (h24) return { t: `${String(d.getHours()).padStart(2, "0")}:${m}`, ap: "" };
  return { t: `${d.getHours() % 12 || 12}:${m}`, ap: d.getHours() < 12 ? "AM" : "PM" };
}
const fmtTime = (d, h24) => {
  const c = clockParts(d, h24);
  return c.ap ? `${c.t} ${c.ap}` : c.t;
};
function fmtDayTime(d, h24, now = new Date()) {
  const diff = Math.round((startOfDay(d) - startOfDay(now)) / DAY);
  const day =
    diff === 0 ? "" : diff === -1 ? "Yesterday " : diff === 1 ? "Tomorrow " : d.toLocaleDateString(undefined, { weekday: "short" }) + " ";
  return day + fmtTime(d, h24);
}
function fmtAgo(ms) {
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < DAY / 1000) return `${Math.floor(s / 3600)} hr ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
const parseTs = (v) => (typeof v === "number" ? (v < 1e12 ? v * 1000 : v) : Date.parse(v));
const eventStart = (e) => (e.start.dateTime ? new Date(e.start.dateTime) : dateOnly(e.start.date));
const eventEnd = (e) => (e.end.dateTime ? new Date(e.end.dateTime) : dateOnly(e.end.date));
const isAllDay = (e) => !e.start.dateTime;
function dateOnly(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const CAL_COLORS = ["#4C7DF0", "#D9734E", "#3E9B78", "#9A6BD8", "#C9A227", "#D2577F"];

/* ------------------------------------------------------------------ styles */

const STYLE = `
:host {
  display: block; height: 100%;
  --bg: #F2EFE9; --surface: #FBFAF7; --surface-2: #E8E4DC; --line: #E2DDD3;
  --text: #1D1C1A; --muted: #8A857C; --soft: #BDB8AE;
  --accent: #C2852E; --accent-bg: #F6EAD5; --accent-line: #E7C58C; --on: #FFFFFF;
  --ink: #1D1C1A; --ink-text: #F7F5F0; --live: #E5483B; --thumb: #FFFFFF;
  --font: 'Outfit', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  --mono: 'DM Mono', ui-monospace, 'SF Mono', Menlo, monospace;
}
:host([theme="dark"]) {
  --bg: #141412; --surface: #1E1D1A; --surface-2: #2A2925; --line: #2D2B27;
  --text: #EDEAE3; --muted: #8F8A80; --soft: #57534C;
  --accent: #E2A54F; --accent-bg: #3A2C18; --accent-line: #6E5024; --on: #26241F;
  --ink: #EDEAE3; --ink-text: #141412; --thumb: #EDEAE3;
}
* { box-sizing: border-box; }
button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; text-align: inherit; -webkit-tap-highlight-color: transparent; }
.ic { width: 20px; height: 20px; flex: none; }
.hub {
  font-family: var(--font); background: var(--bg); color: var(--text);
  height: 100vh; height: 100dvh; display: flex; flex-direction: column;
  padding: 28px 32px 24px; overflow: hidden; -webkit-font-smoothing: antialiased;
  user-select: none; -webkit-user-select: none;
}
.view { display: none; flex: 1; min-height: 0; }
.hub[data-view="controls"] .v-controls, .hub[data-view="calendar"] .v-calendar { display: flex; }
.hub[data-view="ambient"] .v-ambient { display: flex; }
.hub[data-view="ambient"] .top { display: none; }

/* header */
.top { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
.top-info { display: flex; align-items: baseline; gap: 28px; min-width: 0; white-space: nowrap; overflow: hidden; }
.top-clock { font-size: 38px; letter-spacing: -0.02em; font-weight: 400; }
.top-clock small, .amb-clock small { font-size: 0.45em; color: var(--muted); margin-left: 6px; letter-spacing: 0; }
.top-meta { font-size: 18px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; }
.seg { display: flex; background: var(--surface); border-radius: 999px; padding: 5px; box-shadow: 0 0 0 1px var(--line); flex: none; }
.seg button { font-size: 17px; padding: 11px 26px; border-radius: 999px; transition: background .2s, color .2s; }
.seg button.on { background: var(--ink); color: var(--ink-text); }

/* controls */
.controls { display: grid; grid-template-columns: 300px minmax(0, 1fr) minmax(400px, 0.95fr); gap: 36px; flex: 1; min-height: 0; }
.col { min-height: 0; overflow-y: auto; scrollbar-width: none; }
.col::-webkit-scrollbar { display: none; }
.rooms { display: flex; flex-direction: column; min-height: 0; }
.roomlist { flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: none; }
.room-btn { display: block; width: 100%; padding: 10px 20px; border-radius: 14px; border: 1px solid transparent; margin-bottom: 4px; }
.room-btn.on { background: var(--surface-2); border-color: var(--line); }
.room-btn b { display: block; font-weight: 400; font-size: 20px; }
.room-btn span { display: block; font-size: 13.5px; color: var(--muted); margin-top: 1px; }
.room-btn span.lit { color: var(--accent); }
.actions { padding-top: 12px; }
.action { display: flex; align-items: center; gap: 14px; width: 100%; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 16px 20px; font-size: 17.5px; margin-top: 10px; transition: transform .1s; }
.action:active, .tile:active, .sec:active, .pill:active { transform: scale(.98); }

.room-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 28px; }
.room-head h1 { font-size: 48px; font-weight: 400; letter-spacing: -0.02em; margin: 0; line-height: 1.1; }
.room-head p { margin: 6px 0 0; color: var(--muted); font-size: 18px; }
.pills { display: flex; gap: 10px; }
.pill { border: 1px solid var(--line); background: var(--surface); border-radius: 999px; padding: 13px 26px; font-size: 17px; white-space: nowrap; }
.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(185px, 1fr)); gap: 18px; }
.tile { position: relative; background: var(--surface); border: 1px solid var(--line); border-radius: 18px; padding: 22px 22px 18px; min-height: 172px; display: flex; flex-direction: column; cursor: pointer; transition: background .2s, box-shadow .2s, transform .1s; }
.tile-ic { width: 50px; height: 50px; border-radius: 50%; background: var(--surface-2); color: var(--muted); display: grid; place-items: center; transition: background .2s, color .2s; }
.tile-name { margin-top: auto; padding-top: 18px; font-size: 21px; line-height: 1.2; }
.tile-state { font-size: 15px; color: var(--muted); margin-top: 3px; }
.tile.on { background: var(--on); box-shadow: 0 10px 24px -16px rgba(140, 90, 20, .45); }
.tile.on .tile-ic { background: var(--accent-bg); color: var(--accent); }
.tile.unavailable { opacity: .45; }
.tile input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; height: 24px; margin: 10px 0 -6px; background: transparent; cursor: pointer; }
.tile input[type=range]::-webkit-slider-runnable-track { height: 4px; border-radius: 4px; background: linear-gradient(to right, var(--accent) var(--p), var(--surface-2) var(--p)); }
.tile input[type=range]::-moz-range-track { height: 4px; border-radius: 4px; background: linear-gradient(to right, var(--accent) var(--p), var(--surface-2) var(--p)); }
.tile input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; margin-top: -7px; border-radius: 50%; background: var(--thumb); box-shadow: 0 0 0 1px var(--line), 0 2px 6px rgba(0,0,0,.15); }
.tile input[type=range]::-moz-range-thumb { width: 18px; height: 18px; border: 0; border-radius: 50%; background: var(--thumb); box-shadow: 0 0 0 1px var(--line), 0 2px 6px rgba(0,0,0,.15); }
.empty { color: var(--muted); font-size: 17px; padding: 40px 0; }

.side h2 { font-size: 28px; font-weight: 400; margin: 0; letter-spacing: -0.01em; }
.side-head { display: flex; align-items: baseline; justify-content: space-between; margin: 6px 0 18px; }
.side-head span { font-size: 15px; color: var(--muted); }
.cams { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.cam { position: relative; aspect-ratio: 16 / 9; border-radius: 16px; overflow: hidden; background: #2a2926; display: block; width: 100%; }
.cam img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cam::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.5), transparent 45%); pointer-events: none; }
.cam-name { position: absolute; left: 16px; bottom: 12px; z-index: 1; color: #fff; font-size: 19px; text-shadow: 0 1px 6px rgba(0,0,0,.35); }
.live { position: absolute; left: 12px; top: 12px; z-index: 1; display: inline-flex; align-items: center; gap: 6px; font-family: var(--mono); font-size: 11.5px; letter-spacing: .1em; color: #fff; background: rgba(20,20,20,.55); padding: 4px 10px; border-radius: 999px; backdrop-filter: blur(6px); }
.live::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--live); }
.chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
.chip { border: 1px solid var(--line); background: var(--surface); border-radius: 999px; padding: 10px 17px; font-size: 15.5px; }
.secs { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.sec { display: flex; align-items: center; gap: 16px; background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 16px 18px; min-width: 0; transition: transform .1s; }
.sec .tile-ic { width: 42px; height: 42px; }
.sec b { display: block; font-weight: 400; font-size: 18.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sec span { display: block; font-size: 14.5px; color: var(--muted); }
.sec.alert { background: var(--accent-bg); border-color: var(--accent-line); }
.sec.alert .tile-ic { color: var(--accent); background: transparent; }
.sec.alert span { color: var(--accent); }
.sec-wrap { margin-top: 36px; padding-bottom: 8px; }

/* ambient */
.v-ambient { flex-direction: column; padding: 18px 26px 52px; cursor: pointer; overflow-y: auto; scrollbar-width: none; }
.amb-top { display: flex; justify-content: space-between; gap: 40px; }
.label { font-family: var(--mono); font-size: 15px; letter-spacing: .2em; text-transform: uppercase; color: var(--muted); }
.amb-clock { font-size: clamp(90px, min(13.5vw, 23vh), 270px); font-weight: 300; letter-spacing: -0.045em; line-height: 1; margin: 2.6vh 0 1.6vh -6px; }
.amb-clock small { font-size: 0.22em; letter-spacing: 0; margin-left: 14px; }
.amb-weather { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
.amb-weather .ic { width: 46px; height: 46px; stroke-width: 1.4; }
.amb-weather .t { font-size: 54px; letter-spacing: -0.02em; }
.amb-weather .c { font-size: 28px; }
.amb-weather .m { font-family: var(--mono); font-size: 22px; color: var(--muted); }
.amb-right { text-align: right; display: flex; flex-direction: column; align-items: flex-end; min-width: 0; }
.next-title { font-size: 32px; margin-top: 6px; }
.next-sub { font-size: 18px; color: var(--muted); margin-top: 2px; display: flex; align-items: center; gap: 8px; }
.next-sub i { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.status { margin-top: 3vh; display: flex; flex-direction: column; gap: 1.7vh; align-items: flex-end; }
.status div { display: flex; align-items: center; gap: 14px; font-size: clamp(17px, 2.5vh, 23px); }
.status em { font-style: normal; color: var(--muted); }
.status .ic { width: 24px; height: 24px; }
.status .alert .ic { color: var(--accent); }
.amb-rule { border: 0; border-top: 1px solid var(--line); margin: 4vh 0 4.4vh; }
.amb-bottom { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 90px; flex: 1; }
.label.dot::before { content: ""; display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--live); margin-right: 14px; vertical-align: 2px; }
.amb-cams { margin-top: 2.8vh; gap: 22px; }
.amb-cams .cam { border-radius: 18px; }
.activity { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; margin-top: 3vh; padding-bottom: 3vh; border-bottom: 1px solid var(--line); }
.activity time { display: block; font-family: var(--mono); font-size: 14.5px; color: var(--muted); }
.activity div > span { display: block; font-size: 20px; margin-top: 6px; }
.amb-chips { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 2.6vh; }
.amb-chips:empty { display: none; }
.evchip { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 12px 20px; display: flex; gap: 14px; align-items: center; }
.evchip b { display: block; font-weight: 400; font-size: 18px; }
.evchip span { display: block; font-size: 14.5px; color: var(--muted); }
.stats { display: flex; gap: 64px; margin-top: 3.4vh; flex-wrap: wrap; }
.stat b { font-weight: 400; font-size: clamp(38px, 6vh, 56px); letter-spacing: -0.02em; }
.stat b small { font-size: 20px; color: var(--muted); margin-left: 6px; letter-spacing: 0; }
.stat.accent b { color: var(--accent); }
.stat span { display: block; font-size: 18px; color: var(--muted); margin-top: 2px; }
.chart { position: relative; margin-top: 4.6vh; height: clamp(90px, 17vh, 230px); margin-right: 70px; }
.chart svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.chart .xl { position: absolute; bottom: -30px; transform: translateX(-50%); font-family: var(--mono); font-size: 14px; color: var(--muted); }
.chart .ymax { position: absolute; right: -66px; top: -8px; font-family: var(--mono); font-size: 13px; color: var(--muted); }
.chart .nowl { position: absolute; top: -22px; transform: translateX(6px); font-family: var(--mono); font-size: 13px; color: var(--muted); }
.energy-head { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; }
.legend { display: flex; gap: 26px; font-size: 15px; color: var(--muted); }
.legend span::before { content: ""; display: inline-block; width: 16px; height: 2px; background: var(--accent); vertical-align: middle; margin-right: 12px; }
.legend span + span::before { background: var(--muted); }
.hub { position: relative; }
.amb-foot { position: absolute; right: 32px; bottom: 22px; pointer-events: none; }

/* calendar */
.v-calendar { overflow-y: auto; scrollbar-width: none; }
.agenda { columns: 2 420px; column-gap: 48px; width: 100%; }
.day { break-inside: avoid; margin-bottom: 34px; }
.day .label { margin-bottom: 14px; }
.day.today .label { color: var(--accent); }
.ev { display: flex; gap: 18px; align-items: baseline; background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 16px 20px; margin-bottom: 10px; }
.ev i { width: 9px; height: 9px; border-radius: 50%; flex: none; transform: translateY(-2px); }
.ev time { font-family: var(--mono); font-size: 14.5px; color: var(--muted); width: 92px; flex: none; }
.ev b { font-weight: 400; font-size: 19px; display: block; }
.ev span { font-size: 14.5px; color: var(--muted); }

/* camera modal + confirm */
.modal { position: fixed; inset: 0; z-index: 10; background: var(--bg); padding: 32px; display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 32px; font-family: var(--font); color: var(--text); }
.stage { background: #000; border-radius: 26px; overflow: hidden; display: flex; flex-direction: column; min-height: 0; }
.stage-top { display: flex; align-items: center; gap: 18px; padding: 22px 28px; color: #fff; }
.stage-top .live { position: static; background: rgba(255,255,255,.1); }
.stage-top b { font-weight: 400; font-size: 30px; }
.stage-top span { font-size: 18px; color: rgba(255,255,255,.7); }
.stage-media { flex: 1; min-height: 0; position: relative; }
.stage-media video, .stage-media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.stage-bot { display: flex; align-items: center; justify-content: space-between; padding: 18px 26px; }
.stage-bot button { color: #fff; background: rgba(255,255,255,.12); border-radius: 999px; padding: 11px 22px; font-size: 16px; }
.stage-bot span { font-family: var(--mono); font-size: 13px; color: rgba(255,255,255,.45); }
.cam-list { display: flex; flex-direction: column; gap: 10px; overflow-y: auto; min-height: 0; }
.cam-list .close { background: var(--ink); color: var(--ink-text); border-radius: 16px; padding: 20px; text-align: center; font-size: 19px; margin-bottom: 14px; }
.cam-list button:not(.close) { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 18px 22px; font-size: 19px; }
.cam-list button.on { background: var(--surface-2); }
.confirm { position: fixed; inset: 0; z-index: 20; background: rgba(20,18,15,.35); display: grid; place-items: center; font-family: var(--font); color: var(--text); }
.confirm > div { background: var(--surface); border-radius: 22px; padding: 30px; width: min(420px, 90vw); box-shadow: 0 30px 60px -20px rgba(0,0,0,.35); }
.confirm p { font-size: 22px; margin: 0 0 24px; }
.confirm .pills { justify-content: flex-end; }
.confirm .pill.primary { background: var(--ink); color: var(--ink-text); border-color: var(--ink); }

/* responsive */
@media (max-height: 1000px) {
  .amb-foot { display: none; }
  .v-ambient { padding-bottom: 36px; }
}
@media (max-width: 1440px) {
  .controls { grid-template-columns: 240px minmax(0, 1fr) minmax(340px, 0.85fr); gap: 28px; }
  .tiles { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }
  .tile { min-height: 150px; padding: 18px; }
  .room-head h1 { font-size: 40px; }
  .room-head { flex-wrap: wrap; }
  .amb-bottom { gap: 56px; }
  .stats { gap: 36px; }
  .stat b { font-size: clamp(34px, 5vh, 48px); }
  .stat b small { font-size: 16px; }
  .stat span { font-size: 15px; }
  .activity time { font-size: 13px; }
  .activity div > span { font-size: 17px; }
  .sec { padding: 14px; gap: 12px; }
  .sec .tile-ic { width: 36px; height: 36px; }
  .sec b { font-size: 16.5px; white-space: normal; line-height: 1.2; }
  .sec span { font-size: 13.5px; }
}
@media (max-width: 1100px) {
  .v-controls { overflow-y: auto; align-items: flex-start; }
  .controls { grid-template-columns: 230px minmax(0, 1fr); flex: none; width: 100%; min-height: auto; }
  .controls .side { grid-column: 1 / -1; }
  .col, .roomlist { overflow: visible; }
}
@media (max-width: 860px) {
  .hub { padding: 18px 16px; height: auto; min-height: 100vh; overflow: visible; }
  .top { flex-direction: column; align-items: stretch; gap: 14px; }
  .top-info { flex-wrap: wrap; white-space: normal; gap: 4px 18px; }
  .seg button { flex: 1; text-align: center; padding: 10px 0; }
  .controls { grid-template-columns: minmax(0, 1fr); gap: 24px; }
  .rooms { flex-direction: column; min-width: 0; }
  .roomlist { display: flex; overflow-x: auto; gap: 6px; }
  .room-btn { width: auto; flex: none; padding: 8px 16px; }
  .room-btn b { font-size: 17px; white-space: nowrap; }
  .actions { display: flex; gap: 10px; overflow-x: auto; }
  .action { width: auto; flex: none; margin-top: 0; padding: 12px 16px; font-size: 16px; }
  .room-head { flex-direction: column; align-items: flex-start; }
  .room-head h1 { font-size: 36px; }
  .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .tile { min-height: 140px; padding: 16px; }
  .secs { grid-template-columns: 1fr; }
  .v-ambient { padding: 8px 0; }
  .amb-top, .amb-bottom { display: flex; flex-direction: column; gap: 36px; }
  .amb-right { align-items: flex-start; text-align: left; }
  .status { align-items: flex-start; }
  .status div { flex-direction: row-reverse; font-size: 19px; }
  .activity { grid-template-columns: 1fr; gap: 14px; }
  .stats { gap: 28px; }
  .stat b { font-size: 40px; }
  .amb-weather .m { font-size: 16px; }
  .amb-foot { display: none; }
  .chart { margin-right: 44px; height: 180px; }
  .chart .ymax { right: -44px; }
  .modal { grid-template-columns: 1fr; grid-template-rows: minmax(0, 1fr) auto; padding: 16px; gap: 16px; }
  .cam-list { flex-direction: row; overflow-x: auto; }
  .cam-list .close { order: 2; margin: 0; padding: 14px 20px; }
  .cam-list button { flex: none; }
}
`;

/* ------------------------------------------------------------------ panel */

class HomeHubPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._cfg = { ...DEFAULTS };
    this._view = null;
    this._room = null;
    this._parts = {};
    this._forecast = null;
    this._energy = null;
    this._events = {};
    this._activity = [];
    this._modalCam = null;
    this._confirm = null;
    this._lastInput = Date.now();
    this._timers = [];
  }

  set panel(panel) {
    this._cfg = { ...DEFAULTS, ...(panel?.config || {}) };
    if (this._hass) this._schedule();
  }

  set narrow(_) {}

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) this._init();
    this._applyTheme();
    this._schedule();
  }

  get hass() {
    return this._hass;
  }

  connectedCallback() {
    if (!this._hass) return;
    if (!this._timers.length) this._startTimers();
    if (!this._unsubForecast) this._subscribeForecast();
  }

  disconnectedCallback() {
    this._timers.forEach(clearInterval);
    this._timers = [];
    this._unsubForecast?.then((u) => u()).catch(() => {});
    this._unsubForecast = null;
    this._closeStream();
  }

  /* ---------------------------------------------------------------- setup */

  _init() {
    loadFonts();
    this._view = this._cfg.default_view;
    this.shadowRoot.innerHTML = `
      <style>${STYLE}</style>
      <div class="hub" data-view="${this._view}">
        <header class="top"><div class="top-info" data-p="top"></div><div data-p="seg"></div></header>
        <section class="view v-controls">
          <div class="controls">
            <aside class="rooms"><nav class="roomlist" data-p="roomlist"></nav><div class="actions" data-p="actions"></div></aside>
            <main class="col" data-p="room"></main>
            <div class="col side"><div data-p="cams"></div><div class="sec-wrap" data-p="security"></div></div>
          </div>
        </section>
        <section class="view v-calendar" data-p="calendar"></section>
        <section class="view v-ambient" data-action="view" data-arg="controls">
          <div class="amb-top"><div data-p="ambclock"></div><div class="amb-right" data-p="ambstatus"></div></div>
          <hr class="amb-rule">
          <div class="amb-bottom">
            <div>
              <div class="label dot">Front of house</div>
              <div data-p="ambcams"></div>
              <div data-p="activity"></div>
              <div class="amb-chips" data-p="ambchips"></div>
            </div>
            <div data-p="energy"></div>
          </div>
          <div class="amb-foot label">Tap for controls</div>
        </section>
        <div data-p="modal"></div>
        <div data-p="confirm"></div>
      </div>`;
    this.shadowRoot.querySelectorAll("[data-p]").forEach((el) => (this._parts[el.dataset.p] = { el, html: null }));
    this._hub = this.shadowRoot.querySelector(".hub");

    const root = this.shadowRoot;
    root.addEventListener("click", (e) => this._onClick(e));
    root.addEventListener("input", (e) => this._onInput(e));
    root.addEventListener("change", (e) => this._onChange(e));
    root.addEventListener("pointerdown", (e) => {
      this._lastInput = Date.now();
      if (e.target.matches?.("input[type=range]")) this._dragging = true;
    });
    window.addEventListener("pointerup", () => (this._dragging = false));

    this._startTimers();
    this._subscribeForecast();
    this._loadEnergy();
    this._loadCalendars();
    this._loadActivity();
  }

  _startTimers() {
    const every = (ms, fn) => this._timers.push(setInterval(fn, ms));
    every(10_000, () => {
      this._schedule();
      this._checkIdle();
    });
    every(Math.max(2, this._cfg.camera_refresh) * 1000, () => this._refreshCameras());
    every(5 * 60_000, () => this._loadEnergy());
    every(10 * 60_000, () => this._loadCalendars());
    every(2 * 60_000, () => this._loadActivity());
  }

  _applyTheme() {
    const t = this._cfg.theme === "auto" ? (this._hass.themes?.darkMode ? "dark" : "light") : this._cfg.theme;
    if (this.getAttribute("theme") !== t) this.setAttribute("theme", t);
  }

  /* -------------------------------------------------------------- render */

  _schedule() {
    if (this._raf || !this._hub) return;
    this._raf = requestAnimationFrame(() => {
      this._raf = null;
      this._render();
    });
  }

  _patch(part, html) {
    const p = this._parts[part];
    if (p && p.html !== html) {
      p.html = html;
      p.el.innerHTML = html;
    }
  }

  _render() {
    if (!this._hass) return;
    this._hub.dataset.view = this._view;
    const rooms = this._rooms();
    if (!rooms.find((r) => r.id === this._room)) this._room = rooms[0]?.id ?? null;

    this._patch("top", this._renderTop());
    this._patch("seg", this._renderSeg());
    this._patch("roomlist", this._renderRoomList(rooms));
    this._patch("actions", this._renderActions());
    if (!this._dragging) this._patch("room", this._renderRoom(rooms.find((r) => r.id === this._room)));
    this._patch("cams", this._renderCams());
    this._patch("security", this._renderSecurity());
    this._patch("calendar", this._renderCalendar());
    this._patch("ambclock", this._renderAmbClock());
    this._patch("ambstatus", this._renderAmbStatus());
    this._patch("ambcams", this._renderAmbCams());
    this._patch("activity", this._renderActivity());
    this._patch("ambchips", this._renderChips());
    this._patch("energy", this._renderEnergy());
    this._patch("modal", this._renderModal());
    this._patch("confirm", this._renderConfirm());
    this._mountStream();
  }

  /* ---------------------------------------------------------------- data */

  _st(id) {
    return id ? this._hass.states[id] : undefined;
  }

  _name(id, override, area) {
    if (override) return override;
    let n = this._st(id)?.attributes.friendly_name || id;
    if (area && this._cfg.name_strip_area && n.toLowerCase().startsWith(area.toLowerCase() + " ")) {
      n = n.slice(area.length + 1);
      n = n.charAt(0).toUpperCase() + n.slice(1);
    }
    return n;
  }

  _deg(v) {
    const n = num(v);
    return n == null ? "" : `${Math.round(n)}°`;
  }

  _rooms() {
    const h = this._hass;
    const reg = h.entities || {};
    const devices = h.devices || {};
    const areas = h.areas || {};
    const sig = `${Object.keys(reg).length}|${Object.keys(areas).length}|${Object.keys(h.states).length}`;
    if (this._roomCache?.sig === sig && this._roomCache.reg === reg) return this._roomCache.rooms;

    const domains = new Set(this._cfg.room_domains);
    const byArea = {};
    for (const [eid, e] of Object.entries(reg)) {
      if (e.hidden || e.entity_category) continue;
      const areaId = e.area_id || devices[e.device_id]?.area_id;
      if (!areaId || !areas[areaId]) continue;
      const st = h.states[eid];
      if (!st) continue;
      const room = (byArea[areaId] ||= { id: areaId, name: areas[areaId].name, lights: [], temps: [], area: areas[areaId] });
      const dom = domainOf(eid);
      if (domains.has(dom)) {
        // Skip light groups (they double count their members).
        if (dom === "light" && Array.isArray(st.attributes.entity_id)) continue;
        room.lights.push(eid);
      } else if (dom === "sensor" && st.attributes.device_class === "temperature") {
        room.temps.push(eid);
      } else if (dom === "climate") {
        room.temps.push(eid);
      }
    }
    const hidden = new Set(asArray(this._cfg.hidden_rooms).map((s) => String(s).toLowerCase()));
    let rooms = Object.values(byArea).filter(
      (r) => r.lights.length && !hidden.has(r.id.toLowerCase()) && !hidden.has(r.name.toLowerCase())
    );
    if (this._cfg.rooms) {
      const order = asArray(this._cfg.rooms).map((s) => String(s).toLowerCase());
      const rank = (r) => {
        const i = order.findIndex((o) => o === r.id.toLowerCase() || o === r.name.toLowerCase());
        return i === -1 ? Infinity : i;
      };
      rooms = rooms.filter((r) => rank(r) !== Infinity).sort((a, b) => rank(a) - rank(b));
    } else {
      rooms.sort((a, b) => a.name.localeCompare(b.name));
    }
    rooms.forEach((r) => r.lights.sort((a, b) => this._name(a).localeCompare(this._name(b))));
    this._roomCache = { sig, reg, rooms };
    return rooms;
  }

  _roomTemp(room) {
    const id = room.area.temperature_entity_id || room.temps[0];
    const st = this._st(id);
    if (!st) return "";
    return this._deg(domainOf(id) === "climate" ? st.attributes.current_temperature : st.state);
  }

  _lightsOn(ids) {
    return ids.filter((id) => this._st(id)?.state === "on").length;
  }

  _allLights() {
    return Object.keys(this._hass.states).filter(
      (id) => domainOf(id) === "light" && !Array.isArray(this._hass.states[id].attributes.entity_id)
    );
  }

  _cameras() {
    const list = this._cfg.cameras
      ? this._cfg.cameras.map((c) => (typeof c === "string" ? { entity: c } : c))
      : Object.keys(this._hass.states)
          .filter((id) => domainOf(id) === "camera")
          .sort()
          .map((entity) => ({ entity }));
    return list.filter((c) => this._st(c.entity)).map((c) => ({ ...c, name: this._name(c.entity, c.name) }));
  }

  _securityEntities() {
    if (this._cfg.security) return this._cfg.security.map((e) => (typeof e === "string" ? { entity: e } : e));
    return Object.keys(this._hass.states)
      .filter((id) => {
        const d = domainOf(id);
        const dc = this._hass.states[id].attributes.device_class;
        return d === "lock" || (d === "cover" && ["garage", "gate", "door"].includes(dc));
      })
      .sort()
      .map((entity) => ({ entity }));
  }

  _isAlert(id) {
    const st = this._st(id);
    if (!st) return false;
    const d = domainOf(id);
    if (d === "lock") return ["unlocked", "open", "jammed", "opening", "unlocking"].includes(st.state);
    if (d === "cover") return ["open", "opening", "closing"].includes(st.state);
    if (d === "binary_sensor") return st.state === "on" && ["door", "garage_door", "window", "opening"].includes(st.attributes.device_class);
    if (d === "valve") return st.state === "open";
    return false;
  }

  _iconFor(id, override) {
    if (override) return override;
    const st = this._st(id);
    const d = domainOf(id);
    const dc = st?.attributes.device_class;
    if (d === "lock") return st?.state === "locked" ? "lock" : "unlock";
    if (d === "cover") return dc === "gate" ? "gate" : dc === "garage" ? "garage" : "door";
    if (d === "binary_sensor") {
      if (dc === "garage_door") return "garage";
      if (["motion", "occupancy", "presence"].includes(dc)) return "motion";
      if (dc === "plug" || dc === "battery_charging") return "car";
      return "door";
    }
    if (d === "climate") return "thermo";
    if (d === "valve") return "drop";
    if (d === "fan") return "fan";
    if (d === "switch") return "plug";
    if (d === "scene") return "scene";
    if (d === "script") return "scene";
    return "bulb";
  }

  _stateText(id) {
    const st = this._st(id);
    if (!st) return "Unavailable";
    if (st.state === "unavailable" || st.state === "unknown") return "Unavailable";
    const d = domainOf(id);
    const dc = st.attributes.device_class;
    if (d === "binary_sensor") {
      if (["door", "garage_door", "window", "opening"].includes(dc)) return st.state === "on" ? "Open" : "Closed";
      if (["motion", "occupancy", "presence"].includes(dc)) return st.state === "on" ? "Detected" : "Clear";
      if (dc === "plug") return st.state === "on" ? "Plugged in" : "Unplugged";
    }
    if (d === "light" && st.state === "on" && st.attributes.brightness != null)
      return `On · ${Math.round(st.attributes.brightness / 2.55)}%`;
    const unit = st.attributes.unit_of_measurement;
    const s = st.state.replace(/_/g, " ");
    return unit ? `${s} ${unit}` : s.charAt(0).toUpperCase() + s.slice(1);
  }

  /* ----------------------------------------------------------- sections */

  _weatherBits() {
    const id = this._cfg.weather || Object.keys(this._hass.states).find((e) => domainOf(e) === "weather");
    const st = this._st(id);
    if (!st) return null;
    const [ic, label] = WEATHER[st.state] || ["cloud", st.state];
    const today = this._forecast?.[0];
    const sunset = this._st("sun.sun")?.attributes.next_setting;
    return { ic, label, temp: this._deg(st.attributes.temperature), hi: this._deg(today?.temperature), lo: this._deg(today?.templow), sunset: sunset ? new Date(sunset) : null };
  }

  _energyNow() {
    const out = {};
    const p = this._st(this._cfg.power);
    if (p && num(p.state) != null) {
      const unit = (p.attributes.unit_of_measurement || "W").toLowerCase();
      out.kw = num(p.state) / (unit === "kw" ? 1 : unit === "mw" ? 0.001 : 1000);
    }
    const e = this._st(this._cfg.energy_today);
    if (e && num(e.state) != null) {
      const unit = (e.attributes.unit_of_measurement || "kWh").toLowerCase();
      out.kwh = num(e.state) / (unit === "wh" ? 1000 : unit === "mwh" ? 0.001 : 1);
    }
    return out;
  }

  _renderTop() {
    const c = clockParts(new Date(), this._cfg.clock_24h);
    const w = this._weatherBits();
    const en = this._energyNow();
    const energy = [en.kw != null && `Using ${en.kw.toFixed(1)} kW`, en.kwh != null && `${en.kwh.toFixed(1)} kWh today`].filter(Boolean).join(" · ");
    return `
      <div class="top-clock">${c.t}${c.ap ? `<small>${c.ap}</small>` : ""}</div>
      ${w ? `<div class="top-meta">${w.temp} ${esc(w.label)}</div>` : ""}
      ${energy ? `<div class="top-meta">${energy}</div>` : ""}`;
  }

  _renderSeg() {
    const v = this._view;
    const b = (id, label) => `<button class="${v === id ? "on" : ""}" data-action="view" data-arg="${id}">${label}</button>`;
    return `<div class="seg">${b("controls", "Controls")}${b("calendar", "Calendar")}${b("ambient", "Ambient")}</div>`;
  }

  _renderRoomList(rooms) {
    if (!rooms.length) return `<p class="empty">No rooms yet. Assign your lights to Areas in Home Assistant.</p>`;
    return rooms
      .map((r) => {
        const on = this._lightsOn(r.lights);
        const t = this._roomTemp(r);
        const sub = [on ? `${on} on` : "All off", t].filter(Boolean).join(" · ");
        return `<button class="room-btn ${r.id === this._room ? "on" : ""}" data-action="room" data-arg="${esc(r.id)}">
          <b>${esc(r.name)}</b><span class="${on ? "lit" : ""}">${sub}</span></button>`;
      })
      .join("");
  }

  _renderActions() {
    const custom = asArray(this._cfg.actions)
      .map(
        (a, i) =>
          `<button class="action" data-action="run" data-arg="${i}">${icon(a.icon || this._iconFor(a.entity))}${esc(a.name || this._name(a.entity))}</button>`
      )
      .join("");
    const on = this._lightsOn(this._allLights());
    return `${custom}<button class="action" data-action="all-off">${icon("power")}All lights off${on ? ` · ${on} on` : ""}</button>`;
  }

  _renderRoom(room) {
    if (!room) return "";
    const on = this._lightsOn(room.lights);
    const tiles = room.lights.map((id) => this._renderTile(id, room.name)).join("");
    return `
      <div class="room-head">
        <div><h1>${esc(room.name)}</h1><p>${on} of ${room.lights.length} ${room.lights.length === 1 ? "light" : "lights"} on</p></div>
        <div class="pills">
          <button class="pill" data-action="room-power" data-arg="on">All on</button>
          <button class="pill" data-action="room-power" data-arg="off">All off</button>
        </div>
      </div>
      <div class="tiles">${tiles}</div>`;
  }

  _renderTile(id, area) {
    const st = this._st(id);
    const on = st?.state === "on";
    const unavailable = !st || st.state === "unavailable";
    const modes = st?.attributes.supported_color_modes || [];
    const dimmable = domainOf(id) === "light" && modes.some((m) => m !== "onoff");
    const pct = on && st.attributes.brightness != null ? Math.round(st.attributes.brightness / 2.55) : 0;
    const ic = domainOf(id) === "light" ? "bulb" : this._iconFor(id);
    return `
      <div class="tile ${on ? "on" : ""} ${unavailable ? "unavailable" : ""}" data-action="toggle" data-arg="${id}">
        <div class="tile-ic">${icon(ic)}</div>
        <div class="tile-name">${esc(this._name(id, null, area))}</div>
        <div class="tile-state">${on ? (dimmable ? `On · ${pct}%` : "On") : unavailable ? "Unavailable" : "Off"}</div>
        ${on && dimmable ? `<input type="range" min="1" max="100" value="${pct}" style="--p:${pct}%" data-bright="${id}" aria-label="Brightness">` : ""}
      </div>`;
  }

  _camImg(c) {
    const st = this._st(c.entity);
    const src = st?.attributes.entity_picture || "";
    return `<img data-cam-img="${c.entity}" src="${esc(src)}" alt="" loading="lazy">`;
  }

  _renderCamTile(c) {
    return `<button class="cam" data-action="cam" data-arg="${c.entity}">${this._camImg(c)}<span class="live">LIVE</span><span class="cam-name">${esc(c.name)}</span></button>`;
  }

  _renderCams() {
    const cams = this._cameras();
    if (!cams.length) return "";
    const grid = cams.slice(0, 4);
    const rest = cams.slice(4);
    return `
      <div class="side-head"><h2>Cameras</h2>${cams.length > 1 ? `<span>${cams.length} cameras · tap to expand</span>` : ""}</div>
      <div class="cams">${grid.map((c) => this._renderCamTile(c)).join("")}</div>
      ${rest.length ? `<div class="chips">${rest.map((c) => `<button class="chip" data-action="cam" data-arg="${c.entity}">${esc(c.name)}</button>`).join("")}</div>` : ""}`;
  }

  _renderSecurity() {
    const items = this._securityEntities().filter((e) => this._st(e.entity));
    if (!items.length) return "";
    return `
      <div class="side-head"><h2>Security</h2></div>
      <div class="secs">${items
        .map(
          (e) => `
        <button class="sec ${this._isAlert(e.entity) ? "alert" : ""}" data-action="secure" data-arg="${e.entity}">
          <div class="tile-ic">${icon(this._iconFor(e.entity, e.icon))}</div>
          <div style="min-width:0"><b>${esc(this._name(e.entity, e.name))}</b><span>${esc(this._stateText(e.entity))}</span></div>
        </button>`
        )
        .join("")}</div>`;
  }

  _renderAmbClock() {
    const now = new Date();
    const c = clockParts(now, this._cfg.clock_24h);
    const date = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).replace(",", " ·");
    const w = this._weatherBits();
    const h24 = this._cfg.clock_24h;
    return `
      <div class="label">${esc(date)}</div>
      <div class="amb-clock">${c.t}${c.ap ? `<small>${c.ap}</small>` : ""}</div>
      ${
        w
          ? `<div class="amb-weather">${icon(w.ic)}<span class="t">${w.temp}</span><span class="c">${esc(w.label)}</span>
             <span class="m">${w.hi ? `H ${w.hi}&nbsp;&nbsp;L ${w.lo}` : ""}${w.sunset ? `&nbsp;&nbsp;·&nbsp;&nbsp;Sunset ${fmtTime(w.sunset, h24).replace(/ [AP]M$/, "")}` : ""}</span></div>`
          : ""
      }`;
  }

  _statusRows() {
    if (this._cfg.status) return this._cfg.status;
    const rows = [];
    if (Object.keys(this._hass.states).some((id) => domainOf(id) === "lock")) rows.push({ type: "locks" });
    if (Object.entries(this._hass.states).some(([id, s]) => domainOf(id) === "cover" && s.attributes.device_class === "garage"))
      rows.push({ type: "garage" });
    const climate = Object.keys(this._hass.states).find((id) => domainOf(id) === "climate");
    if (climate) rows.push({ type: "climate", entity: climate });
    return rows;
  }

  _statusRow(row) {
    const s = this._hass.states;
    const pick = (fallback) => (row.entities ? asArray(row.entities) : Object.keys(s).filter(fallback));
    if (row.type === "locks") {
      const ids = pick((id) => domainOf(id) === "lock");
      const bad = ids.filter((id) => s[id] && s[id].state !== "locked");
      const text = !bad.length ? "All doors locked" : bad.length === 1 ? `${this._name(bad[0])} ${this._stateText(bad[0]).toLowerCase()}` : `${bad.length} doors unlocked`;
      return { text, ic: bad.length ? "unlock" : "lock", alert: bad.length > 0 };
    }
    if (row.type === "garage") {
      const ids = pick((id) => domainOf(id) === "cover" && s[id].attributes.device_class === "garage");
      const open = ids.filter((id) => s[id] && s[id].state !== "closed");
      const text = !open.length ? `Garage ${ids.length === 1 ? "door" : "doors"} closed` : open.length === 1 ? `${this._name(open[0])} ${s[open[0]].state}` : `${open.length} garage doors open`;
      return { text, ic: "garage", alert: open.length > 0 };
    }
    const st = s[row.entity];
    if (!st) return null;
    if (row.type === "climate") {
      const action = st.attributes.hvac_action || st.state;
      const detail = [action === "idle" ? "" : action, row.detail].filter(Boolean).join(" · ");
      return { text: `${this._name(row.entity, row.name)} ${this._deg(st.attributes.current_temperature)}`, detail, ic: "thermo" };
    }
    const text = row.text?.[st.state] ?? `${this._name(row.entity, row.name)} ${this._stateText(row.entity).toLowerCase()}`;
    const det = this._st(row.detail_entity);
    const detText = det && this._stateText(row.detail_entity).replace(/\.0+(\s|$)/, "$1");
    const detail = [row.detail_text?.[st.state], det && `${det.attributes.unit_of_measurement ? detText : detText.toLowerCase()}${row.detail_suffix || ""}`]
      .filter(Boolean)
      .join(" · ");
    return { text, detail, ic: this._iconFor(row.entity, row.icon), alert: row.alert === false ? false : this._isAlert(row.entity) };
  }

  _renderAmbStatus() {
    const next = this._nextUp();
    const h24 = this._cfg.clock_24h;
    let nextHtml = "";
    if (next) {
      const now = new Date();
      const s = eventStart(next.ev);
      const diff = Math.round((startOfDay(s) - startOfDay(now)) / DAY);
      const day = diff <= 0 ? "Today" : diff === 1 ? "Tomorrow" : s.toLocaleDateString(undefined, { weekday: "long" });
      const when = isAllDay(next.ev)
        ? `${day} · all day`
        : s < now
          ? `Now · until ${fmtTime(eventEnd(next.ev), h24)}`
          : `${day} · ${fmtTime(s, h24)}`;
      nextHtml = `<div class="label">Next up</div><div class="next-title">${esc(next.ev.summary)}</div>
        <div class="next-sub"><i style="background:${next.color}"></i>${esc(when)}</div>`;
    }
    const rows = this._statusRows()
      .map((r) => this._statusRow(r))
      .filter(Boolean)
      .map((r) => `<div class="${r.alert ? "alert" : ""}"><span>${esc(r.text)}${r.detail ? ` <em>· ${esc(r.detail)}</em>` : ""}</span>${icon(r.ic)}</div>`)
      .join("");
    return `${nextHtml}<div class="status">${rows}</div>`;
  }

  _renderAmbCams() {
    const cams = this._cameras();
    const featured = cams.filter((c) => c.featured);
    const list = (featured.length ? featured : cams).slice(0, 2);
    return list.length ? `<div class="cams amb-cams">${list.map((c) => this._renderCamTile(c)).join("")}</div>` : "";
  }

  _renderActivity() {
    if (!this._activity.length) return "";
    const h24 = this._cfg.clock_24h;
    return `<div class="activity">${this._activity
      .map((a) => `<div><time>${esc(fmtDayTime(new Date(a.when), h24))}</time><span>${esc(a.text)}</span></div>`)
      .join("")}</div>`;
  }

  _renderChips() {
    const now = Date.now();
    const h24 = this._cfg.clock_24h;
    const chips = asArray(this._cfg.highlight_calendars).flatMap((cal) =>
      (this._events[cal] || []).filter((e) => eventEnd(e) > now && eventStart(e) - now < 36 * 3600 * 1000).slice(0, 1)
    );
    return chips
      .map(
        (e) =>
          `<div class="evchip">${icon("calendar")}<div><b>${esc(e.summary)}</b><span>${esc(isAllDay(e) ? "All day" : fmtDayTime(eventStart(e), h24))}</span></div></div>`
      )
      .join("");
  }

  _renderEnergy() {
    const en = this._energyNow();
    const d = this._energy;
    if (en.kw == null && en.kwh == null && !d) return "";
    const stats = [];
    if (en.kwh != null) stats.push(`<div class="stat accent"><b>${en.kwh.toFixed(1)}<small>kWh</small></b><span>so far today</span></div>`);
    if (en.kwh != null && d?.yesterdayByNow) {
      const pct = ((en.kwh - d.yesterdayByNow) / d.yesterdayByNow) * 100;
      stats.push(`<div class="stat"><b>${pct >= 0 ? "+" : "−"}${Math.abs(Math.round(pct))}%</b><span>vs yesterday by now</span></div>`);
    }
    if (en.kw != null) stats.push(`<div class="stat"><b>${en.kw.toFixed(1)}<small>kW</small></b><span>using right now</span></div>`);
    const chart = d?.today?.length || d?.yesterday?.length;
    return `<div class="energy-head"><div class="label">Today</div>${chart ? `<div class="legend"><span>Today</span><span>Yesterday</span></div>` : ""}</div>
      <div class="stats">${stats.join("")}</div>${chart ? this._renderChart(d) : ""}`;
  }

  _renderChart(d) {
    const W = 1000;
    const H = 200;
    const all = [...d.today, ...d.yesterday].map((p) => p.v);
    const max = Math.max(1, Math.ceil(Math.max(...all) / 2) * 2);
    const x = (t) => (t / DAY) * W;
    const y = (v) => H - (v / max) * H;
    const line = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join("");
    const nowT = Date.now() - startOfDay(new Date()).getTime();
    const today = d.today;
    const last = today[today.length - 1];
    const area = today.length ? `${line(today)}L${x(last.t).toFixed(1)},${H}L${x(today[0].t).toFixed(1)},${H}Z` : "";
    const nowPct = (nowT / DAY) * 100;
    const ticks = ["12a", "6a", "12p", "6p", "12a"];
    return `
      <div class="chart">
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
          ${[0, 0.5, 1].map((f) => `<line x1="0" x2="${W}" y1="${H * f}" y2="${H * f}" stroke="var(--line)" vector-effect="non-scaling-stroke"/>`).join("")}
          ${area ? `<path d="${area}" fill="var(--accent)" fill-opacity=".16"/>` : ""}
          ${d.yesterday.length ? `<path d="${line(d.yesterday)}" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="5 5" vector-effect="non-scaling-stroke"/>` : ""}
          ${today.length ? `<path d="${line(today)}" fill="none" stroke="var(--accent)" stroke-width="2" vector-effect="non-scaling-stroke"/>` : ""}
          <line x1="${x(nowT)}" x2="${x(nowT)}" y1="-14" y2="${H}" stroke="var(--muted)" stroke-dasharray="2 4" vector-effect="non-scaling-stroke"/>
        </svg>
        ${last ? `<span style="position:absolute;left:${(last.t / DAY) * 100}%;top:${(y(last.v) / H) * 100}%;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:var(--accent)"></span>` : ""}
        <span class="nowl" style="left:${nowPct}%">now</span>
        <span class="ymax">${max} kW</span>
        ${ticks.map((t, i) => `<span class="xl" style="left:${i * 25}%">${t}</span>`).join("")}
      </div>`;
  }

  _calColor(cal) {
    const all = [...asArray(this._cfg.calendars), ...asArray(this._cfg.next_up_calendars), ...asArray(this._cfg.highlight_calendars)];
    const custom = this._cfg.calendar_colors?.[cal];
    return custom || CAL_COLORS[Math.max(0, [...new Set(all)].indexOf(cal)) % CAL_COLORS.length];
  }

  _nextUp() {
    const cals = asArray(this._cfg.next_up_calendars ?? this._cfg.calendars);
    const now = Date.now();
    const evs = cals.flatMap((cal) => (this._events[cal] || []).map((ev) => ({ ev, color: this._calColor(cal) })));
    return evs.filter((x) => eventEnd(x.ev) > now).sort((a, b) => eventStart(a.ev) - eventStart(b.ev))[0];
  }

  _renderCalendar() {
    const cals = asArray(this._cfg.calendars);
    if (!cals.length)
      return `<p class="empty">Add <code>calendars:</code> to the panel config to see your agenda here.</p>`;
    const h24 = this._cfg.clock_24h;
    const today = startOfDay(new Date());
    const days = [];
    for (let i = 0; i < 14; i++) {
      const d0 = new Date(today.getTime() + i * DAY);
      const d1 = new Date(d0.getTime() + DAY);
      const evs = cals
        .flatMap((cal) => (this._events[cal] || []).map((ev) => ({ ev, cal })))
        .filter(({ ev }) => eventStart(ev) < d1 && eventEnd(ev) > d0)
        .sort((a, b) => isAllDay(b.ev) - isAllDay(a.ev) || eventStart(a.ev) - eventStart(b.ev));
      if (!evs.length && i > 1) continue;
      const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d0.toLocaleDateString(undefined, { weekday: "long" });
      days.push(`
        <div class="day ${i === 0 ? "today" : ""}">
          <div class="label">${label} · ${d0.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
          ${
            evs.length
              ? evs
                  .map(
                    ({ ev, cal }) => `<div class="ev"><i style="background:${this._calColor(cal)}"></i>
                      <time>${isAllDay(ev) ? "All day" : fmtTime(eventStart(ev), h24)}</time>
                      <div><b>${esc(ev.summary)}</b>${ev.location ? `<span>${esc(ev.location)}</span>` : ""}</div></div>`
                  )
                  .join("")
              : `<div class="ev"><span>Nothing scheduled</span></div>`
          }
        </div>`);
    }
    return `<div class="agenda">${days.join("")}</div>`;
  }

  _renderModal() {
    if (!this._modalCam) return "";
    const cams = this._cameras();
    const cam = cams.find((c) => c.entity === this._modalCam) || { entity: this._modalCam, name: this._name(this._modalCam) };
    const det = this._st(cam.detection);
    const detText = det ? `${cam.detection_label || "Person"} · ${det.state === "on" ? "now" : fmtAgo(parseTs(det.last_changed))}` : "";
    return `
      <div class="modal">
        <div class="stage">
          <div class="stage-top"><span class="live">LIVE</span><b>${esc(cam.name)}</b><span>${esc(detText)}</span></div>
          <div class="stage-media" data-stage="${cam.entity}"></div>
          <div class="stage-bot"><button data-action="sound" ${this._streamKind === "hls" ? "" : "hidden"}>${this._muted === false ? "Sound on" : "Sound off"}</button><span>live · ${this._streamKind || "…"}</span></div>
        </div>
        <div class="cam-list">
          <button class="close" data-action="cam-close">Close</button>
          ${cams.map((c) => `<button class="${c.entity === cam.entity ? "on" : ""}" data-action="cam" data-arg="${c.entity}">${esc(c.name)}</button>`).join("")}
        </div>
      </div>`;
  }

  _renderConfirm() {
    if (!this._confirm) return "";
    return `<div class="confirm" data-action="confirm-no"><div>
      <p>${esc(this._confirm.text)}</p>
      <div class="pills"><button class="pill" data-action="confirm-no">Cancel</button><button class="pill primary" data-action="confirm-yes">${esc(this._confirm.ok)}</button></div>
    </div></div>`;
  }

  /* ------------------------------------------------------------ cameras */

  _refreshCameras() {
    if (document.hidden || this._modalCam) return;
    this.shadowRoot.querySelectorAll("img[data-cam-img]").forEach((img) => {
      if (!img.offsetParent) return;
      const base = this._st(img.dataset.camImg)?.attributes.entity_picture;
      if (!base || base.startsWith("data:")) return;
      const next = `${base}${base.includes("?") ? "&" : "?"}t=${Date.now()}`;
      const pre = new Image();
      pre.onload = () => (img.src = next);
      pre.src = next;
    });
  }

  _mountStream() {
    const host = this.shadowRoot.querySelector("[data-stage]");
    if (!host) return this._closeStream();
    const id = host.dataset.stage;
    if (this._streamFor === id && host.firstChild) return;
    if (this._streamFor === id && this._streamEl) {
      host.appendChild(this._streamEl);
      this._streamEl.play?.().catch(() => {});
      return;
    }
    this._closeStream();
    this._streamFor = id;
    this._startStream(id, host);
  }

  async _startStream(id, host) {
    const st = this._st(id);
    const mjpeg = () => {
      const img = document.createElement("img");
      const token = st?.attributes.access_token;
      img.src = token ? `/api/camera_proxy_stream/${id}?token=${token}` : st?.attributes.entity_picture || "";
      this._setStream(id, host, img, "mjpeg");
    };
    // supported_features bit 2 = STREAM
    if (!st || !(st.attributes.supported_features & 2)) return mjpeg();
    try {
      const { url } = await this._hass.callWS({ type: "camera/stream", entity_id: id });
      if (this._streamFor !== id) return;
      const video = document.createElement("video");
      video.autoplay = true;
      video.playsInline = true;
      video.muted = this._muted !== false;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
      } else {
        const Hls = await loadHls();
        if (!Hls?.isSupported()) throw new Error("no hls");
        this._hls = new Hls({ lowLatencyMode: true, backBufferLength: 30 });
        this._hls.loadSource(url);
        this._hls.attachMedia(video);
      }
      this._setStream(id, host, video, "hls");
    } catch (err) {
      if (this._streamFor === id) mjpeg();
    }
  }

  _setStream(id, host, el, kind) {
    if (this._streamFor !== id) return;
    this._streamEl = el;
    this._streamKind = kind;
    (this.shadowRoot.querySelector(`[data-stage="${id}"]`) || host).replaceChildren(el);
    el.play?.().catch(() => {});
    this._parts.modal.html = null;
    this._schedule();
  }

  _closeStream() {
    this._hls?.destroy();
    this._hls = null;
    if (this._streamEl) {
      if (this._streamEl.tagName === "IMG") this._streamEl.src = "";
      else this._streamEl.removeAttribute("src");
    }
    this._streamEl = null;
    this._streamFor = null;
    this._streamKind = null;
  }

  /* ---------------------------------------------------------- loaders */

  _subscribeForecast() {
    const id = this._cfg.weather || Object.keys(this._hass.states).find((e) => domainOf(e) === "weather");
    if (!id || !this._hass.connection?.subscribeMessage) return;
    this._unsubForecast = this._hass.connection
      .subscribeMessage(
        (msg) => {
          this._forecast = msg.forecast;
          this._schedule();
        },
        { type: "weather/subscribe_forecast", forecast_type: "daily", entity_id: id }
      )
      .catch(() => null);
  }

  async _loadEnergy() {
    const { power, energy_today: energy } = this._cfg;
    if (!power && !energy) return;
    const now = new Date();
    const today0 = startOfDay(now).getTime();
    const y0 = today0 - DAY;
    const out = { today: [], yesterday: [] };
    try {
      if (power) {
        const res = await this._hass.callWS({
          type: "recorder/statistics_during_period",
          start_time: new Date(y0).toISOString(),
          end_time: now.toISOString(),
          statistic_ids: [power],
          period: "5minute",
          types: ["mean"],
          units: { power: "kW" },
        });
        const buckets = { today: {}, yesterday: {} };
        for (const r of res[power] || []) {
          const t = parseTs(r.start);
          if (r.mean == null) continue;
          const key = t >= today0 ? "today" : "yesterday";
          const rel = t - (key === "today" ? today0 : y0);
          const b = Math.floor(rel / 900_000) * 900_000; // 15 min buckets
          (buckets[key][b] ||= []).push(r.mean);
        }
        for (const key of ["today", "yesterday"])
          out[key] = Object.entries(buckets[key])
            .map(([t, vs]) => ({ t: +t + 450_000, v: vs.reduce((a, b) => a + b, 0) / vs.length }))
            .sort((a, b) => a.t - b.t);
      }
      if (energy) {
        const at = new Date(now.getTime() - DAY);
        const res = await this._hass.callWS({
          type: "history/history_during_period",
          start_time: new Date(at.getTime() - 3600_000).toISOString(),
          end_time: at.toISOString(),
          entity_ids: [energy],
          minimal_response: true,
          no_attributes: true,
          include_start_time_state: true,
        });
        const states = (res[energy] || []).map((s) => num(s.s ?? s.state)).filter((v) => v != null);
        const unit = (this._st(energy)?.attributes.unit_of_measurement || "kWh").toLowerCase();
        const v = states.length ? states[states.length - 1] / (unit === "wh" ? 1000 : 1) : null;
        out.yesterdayByNow = v && v > 0 ? v : null;
      }
    } catch (err) {
      console.warn("home-hub: energy history unavailable", err);
    }
    this._energy = out;
    this._schedule();
  }

  async _loadCalendars() {
    const cals = [...new Set([...asArray(this._cfg.calendars), ...asArray(this._cfg.next_up_calendars), ...asArray(this._cfg.highlight_calendars)])];
    if (!cals.length) return;
    const start = startOfDay(new Date());
    const end = new Date(start.getTime() + 15 * DAY);
    await Promise.all(
      cals.map(async (cal) => {
        try {
          const evs = await this._hass.callApi("GET", `calendars/${cal}?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`);
          this._events[cal] = evs.sort((a, b) => eventStart(a) - eventStart(b));
        } catch (err) {
          console.warn(`home-hub: could not load ${cal}`, err);
        }
      })
    );
    this._schedule();
  }

  async _loadActivity() {
    const ids = this._cfg.activity ? asArray(this._cfg.activity) : this._securityEntities().map(entryId);
    if (!ids.length) return;
    const end = new Date();
    try {
      const res = await this._hass.callWS({
        type: "logbook/get_events",
        start_time: new Date(end.getTime() - 3 * DAY).toISOString(),
        end_time: end.toISOString(),
        entity_ids: ids,
      });
      this._activity = res
        .filter((e) => e.state && e.entity_id && !["unavailable", "unknown"].includes(e.state))
        .sort((a, b) => b.when - a.when)
        .slice(0, 3)
        .map((e) => ({ when: parseTs(e.when), text: `${this._name(e.entity_id, e.name)} ${this._verb(e.entity_id, e.state)}` }));
      this._schedule();
    } catch (err) {
      console.warn("home-hub: logbook unavailable", err);
    }
  }

  _verb(id, state) {
    const dc = this._st(id)?.attributes.device_class;
    const map = { open: "opened", opening: "opening", closed: "closed", closing: "closing", locked: "locked", unlocked: "unlocked", jammed: "jammed" };
    if (map[state]) return map[state];
    if (domainOf(id) === "binary_sensor") {
      if (["motion", "occupancy", "presence"].includes(dc)) return state === "on" ? "motion" : "clear";
      return state === "on" ? "opened" : "closed";
    }
    return state === "on" ? "turned on" : state === "off" ? "turned off" : state;
  }

  /* ------------------------------------------------------------ input */

  _checkIdle() {
    const mins = this._cfg.idle_minutes;
    if (!mins || this._view === "ambient" || this._modalCam || this._confirm) return;
    if (Date.now() - this._lastInput > mins * 60_000) {
      this._view = "ambient";
      this._schedule();
    }
  }

  _call(domain, service, data) {
    return this._hass.callService(domain, service, data).catch((err) => console.error("home-hub:", err));
  }

  _ask(text, ok, fn) {
    this._confirm = { text, ok, fn };
    this._schedule();
  }

  _onClick(e) {
    if (e.target.closest("input")) return;
    const el = e.target.closest("[data-action]");
    if (!el) return;
    e.stopPropagation();
    const { action, arg } = el.dataset;
    const rooms = () => this._rooms();
    switch (action) {
      case "view":
        this._view = arg;
        if (arg === "calendar") this._loadCalendars();
        break;
      case "room":
        this._room = arg;
        break;
      case "toggle": {
        const st = this._st(arg);
        if (st && st.state !== "unavailable") this._call("homeassistant", "toggle", { entity_id: arg });
        break;
      }
      case "room-power": {
        const room = rooms().find((r) => r.id === this._room);
        if (room) this._call("homeassistant", arg === "on" ? "turn_on" : "turn_off", { entity_id: room.lights });
        break;
      }
      case "all-off":
        this._call("light", "turn_off", { entity_id: "all" });
        break;
      case "run": {
        const a = asArray(this._cfg.actions)[+arg];
        if (!a) break;
        const d = domainOf(a.entity);
        const go = () =>
          d === "button" || d === "input_button"
            ? this._call(d, "press", { entity_id: a.entity })
            : this._call(d === "scene" || d === "script" ? d : "homeassistant", "turn_on", { entity_id: a.entity });
        a.confirm ? this._ask(a.confirm === true ? `Run ${a.name}?` : a.confirm, "Run", go) : go();
        break;
      }
      case "secure":
        this._secure(arg);
        break;
      case "cam":
        this._modalCam = arg;
        break;
      case "cam-close":
        this._modalCam = null;
        this._closeStream();
        break;
      case "sound":
        this._muted = this._muted === false;
        if (this._streamEl?.tagName === "VIDEO") this._streamEl.muted = this._muted;
        this._parts.modal.html = null;
        break;
      case "confirm-yes":
        this._confirm?.fn();
        this._confirm = null;
        break;
      case "confirm-no":
        if (e.target === el || el.tagName === "BUTTON") this._confirm = null;
        break;
    }
    this._schedule();
  }

  _secure(id) {
    const st = this._st(id);
    if (!st) return;
    const d = domainOf(id);
    const name = this._name(id);
    if (d === "lock") {
      if (st.state === "locked") this._ask(`Unlock ${name}?`, "Unlock", () => this._call("lock", "unlock", { entity_id: id }));
      else this._call("lock", "lock", { entity_id: id });
    } else if (d === "cover") {
      if (st.state === "closed") this._ask(`Open ${name}?`, "Open", () => this._call("cover", "open_cover", { entity_id: id }));
      else this._ask(`Close ${name}?`, "Close", () => this._call("cover", "close_cover", { entity_id: id }));
    } else if (d === "valve") {
      this._ask(`${st.state === "open" ? "Close" : "Open"} ${name}?`, "Yes", () => this._call("valve", "toggle", { entity_id: id }));
    } else {
      this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true }));
    }
  }

  _onInput(e) {
    const r = e.target;
    if (!r.dataset.bright) return;
    r.style.setProperty("--p", `${r.value}%`);
    const label = r.closest(".tile")?.querySelector(".tile-state");
    if (label) label.textContent = `On · ${r.value}%`;
  }

  _onChange(e) {
    const r = e.target;
    if (!r.dataset.bright) return;
    this._dragging = false;
    this._call("light", "turn_on", { entity_id: r.dataset.bright, brightness_pct: +r.value });
  }
}

/* --------------------------------------------------------------- loaders */

function loadFonts() {
  if (document.getElementById("home-hub-fonts")) return;
  const link = document.createElement("link");
  link.id = "home-hub-fonts";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400&family=Outfit:wght@300;400;500&display=swap";
  document.head.appendChild(link);
}

let hlsPromise;
function loadHls() {
  if (window.Hls) return Promise.resolve(window.Hls);
  hlsPromise ||= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js";
    s.onload = () => resolve(window.Hls);
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return hlsPromise;
}

if (!customElements.get("home-hub-panel")) customElements.define("home-hub-panel", HomeHubPanel);
console.info(`%c HOME HUB %c ${VERSION} `, "background:#1D1C1A;color:#F7F5F0", "background:#C2852E;color:#fff");
