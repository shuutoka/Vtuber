export const escape = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const https = (value) => {
  try {
    const u = new URL(value);
    return u.protocol === "https:" ? u.href : "";
  } catch {
    return "";
  }
};
export const twitch = (login) =>
  `https://www.twitch.tv/${encodeURIComponent(login)}`;
export const profileLink = (login) => `#/profile/${encodeURIComponent(login)}`;
export const external = (url, label, className = "button") =>
  https(url)
    ? `<a class="${className}" href="${escape(https(url))}" target="_blank" rel="noopener noreferrer">${escape(label)} <span aria-hidden="true">↗</span></a>`
    : "";
export const avatar = (person, extra = "") =>
  `<span class="portrait ${extra}"><span class="portrait-fallback" aria-hidden="true">${escape((person.name || person.login || "?")[0])}</span>${https(person.avatar) ? `<img src="${escape(https(person.avatar))}" alt="" loading="lazy" decoding="async">` : ""}</span>`;
export const number = (value) => Number(value || 0).toLocaleString("fr-FR");
export const date = (value) =>
  new Date(value).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
export function color(value) {
  return /^#[0-9a-f]{6}$/i.test(value || "") ? value : "#b9a7ef";
}
