import { Store } from "./core/store.mjs";
import { escape, date } from "./core/dom.mjs";
import { dock, launchpad, spotlightView } from "./views/spotlight.mjs";
import { discoverView } from "./views/discover.mjs";
import { profileView } from "./views/profile.mjs";
import { eventsView, proView, archiveView, aboutView } from "./views/info.mjs";
import { bindDiscover, bindPro, initInteractions } from "./interactions.mjs";
const store = new Store();
const main = document.getElementById("content");
let loading = false;
function route() {
  const old = {
    decouvrir: "discover",
    spotlight: "spotlight",
    professionnels: "pro",
    evenements: "events",
    apropos: "about",
  };
  const hash = location.hash.slice(1);
  if (old[hash]) return [old[hash], ""];
  const parts = hash.replace(/^\//, "").split("/");
  try {
    return [
      parts[0] || "home",
      decodeURIComponent(parts[1] || "").toLowerCase(),
    ];
  } catch {
    return ["home", ""];
  }
}
function updateShell() {
  const [view, id] = route();
  document.querySelectorAll("[data-route]").forEach((a) => {
    const active =
      a.dataset.route === view ||
      (view === "profile" &&
        a.dataset.route === "spotlight" &&
        store.spotlight.some((p) => p.login === id));
    a.classList.toggle("active", active);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  document.getElementById("spotlight-dock").innerHTML = dock(store);
  document.querySelectorAll(".dock-link").forEach((a) => {
    if (view === "profile" && a.hash.endsWith("/" + id))
      a.setAttribute("aria-current", "page");
  });
  const accent = view === "profile" ? store.person(id).color : "#c8b4f2";
  document.documentElement.style.setProperty(
    "--accent",
    /^#[a-f0-9]{6}$/i.test(accent) ? accent : "#c8b4f2",
  );
  if (/^#[a-f0-9]{6}$/i.test(accent))
    document.documentElement.style.setProperty(
      "--glow",
      [1, 3, 5].map((i) => parseInt(accent.slice(i, i + 2), 16)).join(","),
    );
  document
    .querySelector(".status-light")
    .classList.toggle("unavailable", !store.fresh);
  document.getElementById("sync-label").textContent = store.fresh
    ? `TWITCH / RELEVÉ DU ${date(store.snapshot.updatedAt).toUpperCase()}`
    : "TWITCH / RELEVÉ À ACTUALISER";
}
function render(focus = false) {
  const [view, id] = route();
  const views = {
    home: () => launchpad(store) + discoverView(store, true),
    spotlight: () => spotlightView(store),
    discover: () => discoverView(store),
    profile: () => profileView(store, id),
    events: () => eventsView(store),
    pro: () => proView(store, id),
    archive: archiveView,
    about: aboutView,
  };
  const titles = {
    home: "Le hub",
    discover: "Discover",
    spotlight: "Spotlight",
    profile: store.person(id).name,
    events: "Événements",
    pro: "Professionnels",
    archive: "Archives",
    about: "À propos",
  };
  main.innerHTML = (views[view] || views.home)();
  updateShell();
  bindDiscover(store);
  bindPro(store);
  document.title = `${titles[view] || "Le hub"} — Vtuber Link`;
  main.classList.remove("view-arrival");
  void main.offsetWidth;
  main.classList.add("view-arrival");
  if (focus) {
    window.scrollTo({ top: 0, behavior: "instant" });
    main.focus({ preventScroll: true });
  }
}
async function refresh(initial = false, background = false) {
  if (loading) return;
  loading = true;
  const button = document.getElementById("refresh");
  button.disabled = true;
  try {
    await store.load();
    const [view] = route();
    const editing =
      background &&
      main.contains(document.activeElement) &&
      document.activeElement.matches("input,select,textarea");
    if (!initial && (view === "pro" || editing)) updateShell();
    else render();
  } catch {
    main.innerHTML =
      '<p class="notice">Le portail ne peut pas charger ses données. Réessayez avec Actualiser.</p>';
  } finally {
    button.disabled = false;
    loading = false;
  }
}
initInteractions();
render();
window.addEventListener("hashchange", () => render(true));
document.getElementById("refresh").addEventListener("click", () => refresh());
await refresh(true);
// Poll the public snapshot, never Twitch with a token. Pause while the tab is hidden.
setInterval(() => {
  if (!document.hidden) refresh(false, true);
}, 60000);
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("sw.js").catch(() => {});
