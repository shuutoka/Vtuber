import {
  escape,
  avatar,
  https,
  profileLink,
  twitch,
  number,
  date,
} from "../core/dom.mjs";
export const filters = {
  query: "",
  category: "",
  viewers: "",
  sort: "desc",
  limit: 24,
};
export function filtered(store) {
  return store.streams
    .filter(
      (s) =>
        (!filters.query ||
          `${s.name} ${s.title}`
            .toLowerCase()
            .includes(filters.query.toLowerCase())) &&
        (!filters.category || s.category === filters.category) &&
        (!filters.viewers ||
          (s.viewers >= Number(filters.viewers.split("-")[0]) &&
            s.viewers <= Number(filters.viewers.split("-")[1]))),
    )
    .sort((a, b) =>
      filters.sort === "asc" ? a.viewers - b.viewers : b.viewers - a.viewers,
    );
}
function channel(store, s) {
  const p = store.person(s.login);
  return `<article class="channel" data-login="${escape(s.login)}"><a href="${twitch(s.login)}" class="channel-preview" target="_blank" rel="noopener noreferrer" aria-label="Regarder ${escape(p.name)} sur Twitch">${https(s.thumbnail) ? `<img src="${escape(https(s.thumbnail))}" alt="Aperçu du direct" loading="lazy" decoding="async">` : ""}<span class="preview-live">LIVE</span><span class="preview-viewers">${number(s.viewers)} spectateurs</span><span class="preview-arrow" aria-hidden="true">↗</span></a><div class="channel-heading">${avatar(p)}<div><a href="${profileLink(s.login)}" class="channel-name">${escape(p.name)}</a><p>${escape(s.category || "Sans catégorie")}</p></div></div><p class="channel-title">${escape(s.title)}</p><div class="channel-links"><a href="${twitch(s.login)}" target="_blank" rel="noopener noreferrer">Twitch ↗</a><a href="${profileLink(s.login)}">Profil ↗</a></div></article>`;
}
export function statusNote(store) {
  if (store.errors.includes("snapshot"))
    return '<p class="notice">Données Twitch inaccessibles. Réessayez avec le bouton Actualiser.</p>';
  if (!store.fresh)
    return '<p class="notice">Le dernier relevé Twitch est trop ancien ou indisponible. Les liens Spotlight restent accessibles ; aucun direct n’est annoncé sans données récentes.</p>';
  if (!store.ready)
    return '<p class="notice">Le premier relevé Discover est en préparation. Les accès Spotlight restent disponibles.</p>';
  const coverage = store.snapshot.coverage;
  return `<p class="discovery-source">Relevé du ${date(store.snapshot.updatedAt)} · ${number(coverage?.scanned)} directs en français examinés · tags VTuber déclarés${coverage?.complete ? "" : " · parcours partiel"}.</p>`;
}
export function results(store) {
  const matches = filtered(store);
  return `<div class="results-head"><span>${number(matches.length)} connexion${matches.length > 1 ? "s" : ""} disponible${matches.length > 1 ? "s" : ""}</span><span>DIRECTS FRANCOPHONES</span></div><div class="channel-grid">${
    matches.length
      ? matches
          .slice(0, filters.limit)
          .map((s) => channel(store, s))
          .join("")
      : `<div class="empty">${store.ready ? "Aucun direct ne correspond à ces filtres pour le moment." : "Les connexions apparaîtront ici dès qu’un relevé Discover sera disponible."}</div>`
  }</div>${matches.length > filters.limit ? '<button class="button load-more" id="load-more">Afficher la suite ↓</button>' : ""}`;
}
export function discoverView(store, compact = false) {
  const categories = [
    ...new Set(store.streams.map((s) => s.category).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "fr"));
  if (filters.category && !categories.includes(filters.category))
    filters.category = "";
  return `<section class="discover"><div class="page-heading"><div><span class="overline">${compact ? "LE FLUX / MAINTENANT" : "DISCOVER / LE RÉSEAU EN DIRECT"}</span><h${compact ? "2" : "1"}>${compact ? "Ouvrir une nouvelle connexion." : "Trouver votre prochain raid."}</h${compact ? "2" : "1"}><p>Des VTubers détectés parmi les directs en français. La liste se construit automatiquement à partir de leurs tags Twitch.</p></div><button class="button primary raid-trigger" type="button">Qui raider ? <span aria-hidden="true">⤨</span></button></div>${statusNote(store)}<div class="filter-bar"><label class="field"><span>Rechercher</span><input type="search" id="search" value="${escape(filters.query)}" placeholder="Une chaîne, un titre…"></label><label class="field"><span>Jeu / catégorie</span><select id="category"><option value="">Toutes les catégories</option>${categories.map((c) => `<option${c === filters.category ? " selected" : ""}>${escape(c)}</option>`).join("")}</select></label><label class="field"><span>Spectateurs</span><select id="viewers"><option value="">Toutes les tailles</option>${[
    ["0-20", "0 à 20"],
    ["21-100", "21 à 100"],
    ["101-500", "101 à 500"],
    ["501-100000000", "Plus de 500"],
  ]
    .map(
      ([v, l]) =>
        `<option value="${v}"${v === filters.viewers ? " selected" : ""}>${l}</option>`,
    )
    .join(
      "",
    )}</select></label><label class="field"><span>Ordre</span><select id="sort"><option value="desc"${filters.sort === "desc" ? " selected" : ""}>Plus de spectateurs</option><option value="asc"${filters.sort === "asc" ? " selected" : ""}>Petites chaînes d’abord</option></select></label></div><div id="discover-results">${results(store)}</div><details class="method"><summary>Comment ces chaînes sont-elles découvertes ?</summary><p>Le script parcourt les directs dont la langue Twitch est française et cherche des tags comme VTuber, FRVTuber ou PNGTuber. Une chaîne sans tag reconnu peut manquer. Les tags sont déclaratifs ; Vtuber Link ne certifie pas chaque profil. Le relevé est périodique et ne constitue pas un suivi à la seconde.</p></details></section>`;
}
