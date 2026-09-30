const $ = (selector) => document.querySelector(selector);
const BASE = new URL('../../', import.meta.url);
const url = (path) => new URL(path, BASE).href;
const twitch = (creator) => `https://www.twitch.tv/${encodeURIComponent(creator.twitch)}`;
const profile = (creator) => url(creator.spotlight ? `profile.html?id=${encodeURIComponent(creator.id)}` : (creator.legacyProfile || `profile.html?id=${encodeURIComponent(creator.id)}`));
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const safeImage = (value) => { try { const u = new URL(value); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } };

let creators = [];
let streams = new Map();
let filter = 'live';
let fresh = false;

async function json(path) {
  const response = await fetch(url(path), { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function card(creator) {
  const stream = fresh ? streams.get(creator.twitch.toLowerCase()) : null;
  const image = safeImage(stream?.thumbnail);
  const avatar = safeImage(creator.avatar);
  const state = fresh ? (stream ? 'LIVE' : 'HORS LIGNE') : 'STATUT INCONNU';
  return `<article class="stream-card"><div class="stream-image">${image ? `<img src="${escapeHtml(image)}" alt="Aperçu du direct de ${escapeHtml(creator.name)}" loading="lazy">` : `<span class="fallback" aria-hidden="true">${escapeHtml(creator.name[0])}</span>`}<span class="status-badge ${stream ? '' : 'unknown'}">${state}</span>${stream ? `<span class="viewers">◉ ${Number(stream.viewers).toLocaleString('fr-FR')} spectateurs</span>` : ''}</div><div class="stream-body"><div class="stream-person">${avatar ? `<img class="avatar" src="${escapeHtml(avatar)}" alt="" loading="lazy">` : `<span class="avatar spot-initial" aria-hidden="true">${escapeHtml(creator.name[0])}</span>`}<h3>${escapeHtml(creator.name)}</h3></div><p class="category">${escapeHtml(stream?.category || (fresh ? 'Hors ligne' : 'Données indisponibles'))}</p><p class="stream-title">${escapeHtml(stream?.title || (fresh ? 'Retrouvez cette chaîne sur Twitch.' : 'Le titre du stream sera affiché après synchronisation.'))}</p><div class="card-actions"><a href="${twitch(creator)}" target="_blank" rel="noopener noreferrer">Voir sur Twitch ↗</a><a href="${profile(creator)}">Voir le profil</a></div></div></article>`;
}

function render() {
  const query = $('#search').value.trim().toLocaleLowerCase('fr');
  const matches = creators.filter((creator) => creator.name.toLocaleLowerCase('fr').includes(query) && (filter === 'all' || !fresh || (filter === 'live' ? streams.has(creator.twitch.toLowerCase()) : !streams.has(creator.twitch.toLowerCase()))));
  $('#creator-grid').innerHTML = matches.length ? matches.map(card).join('') : `<p class="empty-card">${fresh && filter === 'live' ? 'Aucun des VTubers répertoriés n’est en direct pour le moment.' : 'Aucun résultat pour cette recherche.'}</p>`;
  $('#live-count').textContent = fresh ? String(streams.size) : '—';
}

function renderSpotlight() {
  const featured = creators.filter((c) => c.spotlight);
  $('#spotlight-grid').innerHTML = featured.map((c) => `<article class="spot-card"><span class="spot-initial" aria-hidden="true">${escapeHtml(c.name[0])}</span><h3>${escapeHtml(c.name)}</h3><p>${escapeHtml(c.intro || 'Présentation à venir')}</p><a href="${profile(c)}">Découvrir le profil ↗</a></article>`).join('');
  $('#contact-creator').innerHTML = featured.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join('');
}

function renderEvents(events) {
  const upcoming = events.filter((e) => e.date && !Number.isNaN(Date.parse(e.date)) && Date.parse(e.date) >= Date.now() - 86400000).sort((a,b) => a.date.localeCompare(b.date)).slice(0,6);
  $('#event-list').innerHTML = upcoming.length ? upcoming.map((e) => `<article class="event-card"><time datetime="${escapeHtml(e.date)}">${new Date(e.date).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}</time><div><h3>${escapeHtml(e.title)}</h3><p>${escapeHtml(e.type || 'Événement')} · ${escapeHtml(e.creator || 'Scène VTuber')}</p></div>${/^https:\/\//.test(e.url || '') ? `<a href="${escapeHtml(e.url)}" target="_blank" rel="noopener noreferrer">Détails ↗</a>` : ''}</article>`).join('') : '<div class="empty-card">Aucun événement confirmé pour le moment. L’agenda sera rempli au fil des annonces vérifiées.</div>';
}

function setupContact() {
  $('#contact-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const creator = creators.find((c) => c.id === data.get('creator'));
    if (!creator) return;
    const subject = `Proposition ${data.get('type')} pour ${creator.name}`;
    const body = `Bonjour,\n\n${data.get('message')}\n\n${data.get('sender')}\nRéponse : ${data.get('email')}`;
    const result = $('#contact-result');
    if (creator.contactEmail) {
      location.href = `mailto:${encodeURIComponent(creator.contactEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      result.textContent = `Votre logiciel de messagerie va s’ouvrir. Vérifiez le destinataire et envoyez le message vous-même.`;
    } else {
      try {
        await navigator.clipboard.writeText(`${subject}\n\n${body}`);
        result.innerHTML = `Proposition copiée. Aucun contact professionnel n’est encore renseigné pour ${escapeHtml(creator.name)}. <a href="${twitch(creator)}" target="_blank" rel="noopener noreferrer">Consulter sa chaîne Twitch ↗</a> pour trouver son canal de contact officiel. Aucun message n’a été envoyé.`;
      } catch {
        result.textContent = `Copie automatique indisponible. Sélectionnez votre texte et contactez ${creator.name} depuis sa chaîne Twitch. Aucun message n’a été envoyé.`;
      }
    }
  });
}

function setupControls() {
  document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((b) => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
    render();
  }));
  $('#search').addEventListener('input', render);
  $('#raid').addEventListener('click', () => {
    const live = creators.filter((c) => fresh && streams.has(c.twitch.toLowerCase()));
    const result = $('#raid-result');
    result.hidden = false;
    if (!live.length) { result.textContent = 'Aucun live confirmé actuellement : impossible de proposer un raid fiable.'; return; }
    const previous = sessionStorage.getItem('lastRaid');
    const pool = live.length > 1 ? live.filter((c) => c.id !== previous) : live;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    sessionStorage.setItem('lastRaid', chosen.id);
    result.innerHTML = `Suggestion : <strong>${escapeHtml(chosen.name)}</strong> — ${escapeHtml(streams.get(chosen.twitch.toLowerCase()).category || 'En direct')} · <a href="${twitch(chosen)}" target="_blank" rel="noopener noreferrer">ouvrir Twitch ↗</a>`;
  });
  const menu = $('.menu-toggle');
  menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); $('#nav').classList.toggle('open', open); });
  $('#nav').addEventListener('click', (e) => { if (e.target.closest('a')) { menu.setAttribute('aria-expanded','false'); $('#nav').classList.remove('open'); } });
}

async function init() {
  $('#year').textContent = new Date().getFullYear();
  setupControls();
  try {
    creators = await json('data/creators.json');
    renderSpotlight(); setupContact();
    const [liveResult, eventResult] = await Promise.allSettled([json('data/live.json'),json('data/events.json')]);
    if (eventResult.status === 'fulfilled') renderEvents(eventResult.value);
    else renderEvents([]);
    if (liveResult.status === 'fulfilled') {
      const data = liveResult.value;
      const age = Date.now() - Date.parse(data.updatedAt);
      fresh = data.status === 'ok' && age >= 0 && age < 45 * 60 * 1000;
      if (fresh) {
        streams = new Map(data.streams.map((s) => [s.login.toLowerCase(),s]));
        $('#live-timestamp').textContent = `Mis à jour à ${new Date(data.updatedAt).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}`;
      }
    }
    if (!fresh) {
      $('#data-status').textContent = 'Statuts Twitch indisponibles ou trop anciens. Les chaînes restent consultables ; aucun live n’est annoncé sans confirmation.';
      filter = 'all';
      document.querySelectorAll('[data-filter]').forEach((b) => { b.classList.toggle('active', b.dataset.filter === 'all'); b.setAttribute('aria-pressed', String(b.dataset.filter === 'all')); });
    }
    render();
  } catch (error) {
    $('#data-status').textContent = 'Impossible de charger la sélection pour le moment. Réessayez plus tard.';
    renderEvents([]);
    console.error(error);
  }
}
init();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register(url('sw.js')).catch(console.error));
