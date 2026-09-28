const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link = (href,label) => { try { const u = new URL(href); return u.protocol === 'https:' ? `<a class="button outline" href="${escapeHtml(u.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)} ↗</a>` : ''; } catch { return ''; } };
async function init() {
  const id = new URLSearchParams(location.search).get('id');
  const container = document.querySelector('#profile');
  try {
    const response = await fetch('data/creators.json');
    if (!response.ok) throw new Error('Chargement impossible');
    const creator = (await response.json()).find(c => c.id === id);
    if (!creator) { container.innerHTML = '<h1>Profil introuvable</h1><p><a href="index.html#decouvrir">Voir les créateurs</a></p>'; return; }
    document.title = `${creator.name} — Vtuber Link`;
    container.innerHTML = `<span class="kicker">SPOTLIGHT / PROFIL</span><h1>${escapeHtml(creator.name)}</h1><p>${escapeHtml(creator.intro || 'Présentation à venir')}</p><div class="hero-actions">${link(`https://www.twitch.tv/${creator.twitch}`,'Voir sur Twitch')}${creator.legacyProfile ? `<a class="button ghost" href="${escapeHtml(creator.legacyProfile)}">Voir l’ancien profil</a>` : ''}</div><div class="profile-sections"><article class="empty-card"><h2>Son univers</h2><p>${escapeHtml(creator.universe || 'À renseigner avec la créatrice')}</p></article><article class="empty-card"><h2>Ses contenus</h2><p>${escapeHtml(creator.content || 'À renseigner avec la créatrice')}</p></article><article class="empty-card"><h2>Collaborations</h2><p>${escapeHtml(creator.collaboration || 'À confirmer')}</p><a href="index.html#professionnels">Préparer une proposition ↗</a></article><article class="empty-card"><h2>Liens & médias</h2><div class="hero-actions">${(creator.socials || []).map(s => link(s.url,s.label)).join('')}${(creator.media || []).map(m => link(m.url,m.label)).join('')}${creator.mediaKit ? link(creator.mediaKit,'Media kit') : ''}</div><p>${(creator.socials || []).length || (creator.media || []).length || creator.mediaKit ? '' : 'Liens complémentaires et media kit à venir.'}</p></article><article class="empty-card"><h2>Événements</h2>${(creator.events || []).length ? `<ul>${creator.events.map(e => `<li>${escapeHtml(e)}</li>`).join('')}</ul>` : '<p>Aucun événement confirmé pour le moment.</p>'}</article></div><p class="section-foot">Cette créatrice est indépendante. Vtuber Link n’est pas son agence.</p>`;
  } catch { container.innerHTML = '<h1>Profil indisponible</h1><p><a href="index.html">Retour à l’accueil</a></p>'; }
}
init();
