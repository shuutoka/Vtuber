import {
  escape,
  avatar,
  color,
  profileLink,
  twitch,
  external,
} from "../core/dom.mjs";
export const badge = (p) =>
  `<span class="badge ${p.status}">${p.status === "live" ? "LIVE" : p.status === "offline" ? "HORS LIGNE" : "NON VÉRIFIÉ"}</span>`;
export function dock(store) {
  return `<span class="dock-caption">SPOTLIGHT / 04</span>${store.featured.map((p) => `<a class="dock-link" href="${profileLink(p.login)}" style="--person:${color(p.color)}" aria-label="Profil de ${escape(p.name)}${p.status === "live" ? ", en live" : ""}">${avatar(p)}${p.status === "live" ? '<span class="dock-live" aria-hidden="true"></span>' : ""}<span class="dock-name">${escape(p.name)}</span></a>`).join("")}`;
}
export function launchpad(store, full = false) {
  return `<section class="launchpad" aria-label="Les quatre créatrices Spotlight"><div class="launchpad-header"><div><span class="overline">SPOTLIGHT / QUATRE POINTS DE RENCONTRE</span><h1>${full ? "Leurs univers.<br>Vos prochaines connexions." : "Les univers se <em>relient.</em>"}</h1></div><span class="launchpad-note">ENTRER DANS UN UNIVERS <span aria-hidden="true">↘</span></span></div><div class="link-branches" aria-hidden="true"><svg viewBox="0 0 1000 45" preserveAspectRatio="none"><path class="branch-track" d="M500 0v17H125v28M500 17H875v28M375 17v28M625 17v28"/><path class="branch-signal" d="M500 0v17H125v28M500 17H875v28M375 17v28M625 17v28"/></svg></div><div class="spotlight-accesses">${store.featured.map((p, i) => `<article class="spotlight-access" style="--person:${color(p.color)};--index:${i}"><a class="spotlight-main" href="${profileLink(p.login)}"><span class="spotlight-top"><span class="access-number">0${i + 1} / LINK</span>${badge(p)}</span><div class="access-visual">${avatar(p, "large-portrait")}<span class="portrait-orbit" aria-hidden="true"></span><span class="access-spark" aria-hidden="true">✧</span></div><span class="access-name">${escape(p.name)}<span aria-hidden="true">↗</span></span><span class="access-subtitle">${escape(p.stream?.category || "Découvrir son profil")}</span></a><a class="access-twitch" href="${twitch(p.login)}" target="_blank" rel="noopener noreferrer">Twitch <span aria-hidden="true">↗</span></a></article>`).join("")}</div><p class="launchpad-foot">Quatre créatrices indépendantes mises en lumière. Vtuber Link facilite les rencontres, sans représentation commerciale.</p></section>`;
}
export function spotlightView(store) {
  return (
    launchpad(store, true) +
    `<section class="editorial-note"><span class="overline">CE QUI RELIE CES PROFILS</span><p>Une vitrine pour découvrir leurs chaînes, leurs liens et leurs futurs projets. Chaque univers est complété avec la créatrice concernée.</p>${external("#", "")}</section>`
  );
}
