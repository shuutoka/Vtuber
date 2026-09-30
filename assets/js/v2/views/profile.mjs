import {
  escape,
  avatar,
  external,
  color,
  number,
  profileLink,
} from "../core/dom.mjs";
import { badge } from "./spotlight.mjs";
export function profileView(store, login) {
  const p = store.person(login);
  if (!p.spotlight && !store.snapshot.users?.[login])
    return '<div class="page-heading"><div><h1>Cette connexion n’est pas disponible.</h1><p>Retrouvez les chaînes présentes dans le relevé actuel.</p></div></div><a class="button" href="#/discover">Retour à Discover</a>';
  const events = store.events.filter(
    (e) => e.login === login && Date.parse(e.date) >= Date.now() - 86400000,
  );
  return `<section class="profile-view" style="--person:${color(p.color)}"><a class="back-link" href="${p.spotlight ? "#/spotlight" : "#/discover"}">← ${p.spotlight ? "Les quatre univers" : "Discover"}</a><div class="profile-banner"><div class="profile-network" aria-hidden="true"></div>${avatar(p, "profile-portrait")}<div><span class="overline">${p.spotlight ? "SPOTLIGHT / CRÉATRICE INDÉPENDANTE" : "CONNEXION DÉCOUVERTE SUR TWITCH"}</span><h1>${escape(p.name)}</h1>${badge(p)}${p.stream ? `<span class="profile-viewers">${number(p.stream.viewers)} spectateurs</span>` : ""}</div></div><div class="profile-layout"><div><div class="profile-links">${external(`https://www.twitch.tv/${encodeURIComponent(login)}`, "Twitch — ouvrir sa chaîne", "button primary")}${(p.socials || []).map((s) => external(s.url, s.label)).join("")}${p.mediaKit ? external(p.mediaKit, "Media kit") : ""}${p.spotlight ? `<a class="button" href="#/pro/${encodeURIComponent(login)}">Proposer un projet ↗</a>` : ""}</div>${p.stream ? `<section class="profile-block"><span class="overline">EN DIRECT / ${escape(p.stream.category)}</span><h2>${escape(p.stream.title)}</h2></section>` : ""}${p.description ? `<section class="profile-block"><span class="overline">SA PRÉSENTATION TWITCH / SYNCHRONISÉE</span><p class="public-bio">${escape(p.description)}</p></section>` : ""}${p.intro ? `<section class="profile-block"><h2>Présentation</h2><p>${escape(p.intro)}</p></section>` : ""}${p.spotlight ? `<div class="profile-editorial"><section class="profile-block"><span class="overline">UNIVERS</span><p>${escape(p.universe || "Présentation de son univers à compléter avec la créatrice.")}</p></section><section class="profile-block"><span class="overline">CONTENUS</span><p>${escape(p.content || "Ses contenus seront présentés ici après validation.")}</p></section></div>` : ""}${(p.media || []).length ? `<section class="profile-block"><h2>Médias</h2><div class="button-row">${p.media.map((m) => external(m.url, m.label)).join("")}</div></section>` : ""}</div><aside class="profile-sidebar"><section><span class="overline">${p.spotlight ? "COLLABORATIONS" : "À PROPOS DE CE PROFIL"}</span><p>${escape(p.spotlight ? p.collaboration || "Disponibilité à confirmer directement avec la créatrice." : "Les informations de cette chaîne proviennent de ses données publiques Twitch.")}</p>${p.spotlight ? '<p class="footnote">Vtuber Link n’est pas une agence et ne représente pas commercialement cette créatrice.</p>' : ""}</section><section><span class="overline">PROCHAINS RENDEZ-VOUS</span>${events.length ? events.map((e) => `<p>${escape(e.title)}<br><span class="muted">${new Date(e.date).toLocaleDateString("fr-FR")}</span></p>`).join("") : '<p class="muted">Aucun événement confirmé.</p>'}</section>${p.spotlight && !p.mediaKit ? '<section><span class="overline">MEDIA KIT</span><p class="muted">Un espace est prêt pour son futur dossier professionnel.</p></section>' : ""}</aside></div></section>`;
}
