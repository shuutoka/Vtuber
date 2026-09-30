import { filtered, filters, results } from "./views/discover.mjs";
import { escape, avatar, external, number } from "./core/dom.mjs";
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export function bindDiscover(store) {
  const resultsNode = document.querySelector("#discover-results");
  if (!resultsNode) return;
  const update = () => {
    filters.limit = 24;
    resultsNode.innerHTML = results(store);
  };
  for (const [id, key, event] of [
    ["search", "query", "input"],
    ["category", "category", "change"],
    ["viewers", "viewers", "change"],
    ["sort", "sort", "change"],
  ])
    document.getElementById(id).addEventListener(event, (e) => {
      filters[key] = e.target.value;
      update();
    });
  resultsNode.addEventListener("click", (e) => {
    if (e.target.closest("#load-more")) {
      filters.limit += 24;
      resultsNode.innerHTML = results(store);
    }
  });
  document
    .querySelectorAll(".raid-trigger")
    .forEach((button) =>
      button.addEventListener("click", () => openRaid(store)),
    );
}
let raidTimer;
export function openRaid(store) {
  const dialog = document.getElementById("raid-dialog"),
    stage = document.getElementById("raid-stage");
  const candidates = filtered(store);
  clearTimeout(raidTimer);
  dialog.showModal();
  if (!candidates.length) {
    stage.innerHTML =
      '<p class="muted">Aucun direct confirmé ne correspond à vos filtres. Élargissez votre recherche ou attendez le prochain relevé.</p>';
    return;
  }
  const draw = new Uint32Array(1);
  crypto.getRandomValues(draw);
  const chosen = candidates[draw[0] % candidates.length];
  const reveal = () => {
    if (!dialog.open) return;
    const p = store.person(chosen.login);
    stage.innerHTML = `<div class="raid-result">${avatar(p, "raid-portrait")}<span class="overline">CONNEXION TROUVÉE / LIVE</span><h3>${escape(p.name)}</h3><p>${escape(chosen.category)} · ${number(chosen.viewers)} spectateurs</p><p class="muted">${escape(chosen.title)}</p>${external(`https://www.twitch.tv/${encodeURIComponent(chosen.login)}`, "Ouvrir sa chaîne", "button primary")}<p class="footnote">Une suggestion de chaîne. Aucun raid n’est déclenché automatiquement.</p></div>`;
  };
  if (reduced()) {
    reveal();
    return;
  }
  let step = 0;
  const roll = () => {
    if (!dialog.open) return;
    stage.innerHTML = `<div class="raid-roll" aria-hidden="true"><span>↗</span><strong>${escape(candidates[step % candidates.length].name)}</strong></div><p class="muted">On cherche la prochaine connexion…</p>`;
    step++;
    if (step < 6) raidTimer = setTimeout(roll, 100 + step * 25);
    else raidTimer = setTimeout(reveal, 180);
  };
  roll();
}
export function bindPro(store) {
  const form = document.getElementById("pro-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const values = new FormData(form),
      p = store.person(values.get("creator"));
    const subject = `Proposition ${values.get("type")} pour ${p.name}`;
    const body = `Bonjour,\n\n${values.get("message")}\n\n${values.get("sender")}\nRéponse : ${values.get("email")}`;
    const result = document.getElementById("pro-result");
    result.innerHTML = `<p>Votre proposition est prête. Aucun message n’a été envoyé.</p><label class="field">Texte à transmettre<textarea readonly rows="7" id="proposal-text">${escape(subject + "\n\n" + body)}</textarea></label><div class="button-row"><button type="button" class="button" id="copy-proposal">Copier le texte</button>${p.contactEmail ? `<a class="button primary" href="mailto:${encodeURIComponent(p.contactEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}">Ouvrir ma messagerie ↗</a>` : external(`https://www.twitch.tv/${encodeURIComponent(p.login)}`, "Trouver son contact officiel")}</div>${p.contactEmail ? "" : '<p class="footnote">Aucune adresse professionnelle validée n’est renseignée. Consultez sa chaîne pour choisir son canal officiel.</p>'}<p id="copy-status" role="status"></p>`;
    document
      .getElementById("copy-proposal")
      .addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(subject + "\n\n" + body);
          document.getElementById("copy-status").textContent =
            "Proposition copiée.";
        } catch {
          document.getElementById("proposal-text").select();
          document.getElementById("copy-status").textContent =
            "Le texte est sélectionné : utilisez Copier.";
        }
      });
  });
}
export function initInteractions() {
  const dialog = document.getElementById("raid-dialog");
  dialog
    .querySelector(".dialog-close")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => clearTimeout(raidTimer));
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      const b = dialog.getBoundingClientRect();
      if (
        e.clientX < b.left ||
        e.clientX > b.right ||
        e.clientY < b.top ||
        e.clientY > b.bottom
      )
        dialog.close();
    }
  });
  document.addEventListener(
    "error",
    (e) => {
      if (e.target.tagName === "IMG") e.target.hidden = true;
    },
    true,
  );
  if (!reduced() && matchMedia("(pointer:fine)").matches) {
    document.getElementById("content").addEventListener("pointermove", (e) => {
      const card = e.target.closest(".spotlight-access");
      if (!card) return;
      const box = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - box.left}px`);
      card.style.setProperty("--my", `${e.clientY - box.top}px`);
    });
  }
}
