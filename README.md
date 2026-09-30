# Vtuber Link V2 — Link Hub

Portail statique reconstruit pour GitHub Pages, sans framework ni clé dans le navigateur. Les vues internes utilisent des routes `#/...`, compatibles avec le domaine personnalisé et l'installation PWA.

## Organisation

- `index.html` : navigation permanente, dock et zone des vues.
- `assets/css/v2/` : tokens, structure, vues, animations accessibles.
- `assets/js/v2/core/` : état des données et rendu sécurisé ; `views/` : Hub, Discover, Spotlight, profils, agenda, professionnels et archives.
- `data/spotlight.json` : **uniquement les quatre Spotlight** et leurs champs éditoriaux.
- `data/discovery-config.json` : langue, tags VTuber reconnus, nombre maximal de pages parcourues et validité d'un relevé.
- `data/live.json` : portraits, bios publiques, directs découverts, directs Spotlight et couverture du relevé. Généré automatiquement.
- `data/events.json` : événements confirmés, renseignés manuellement.
- `scripts/update-live.mjs` : entrée GitHub Actions ; `scripts/lib/twitch.mjs` : pagination, tags, profils et gestion des erreurs.
- `archive/v1/` : site d'origine au commit `36114a6` (anciennes cartes et profils).
- `archive/previous/` : version publiée au début de cette reconstruction, commit `79c6fa3`.

Les deux archives contiennent leurs fichiers d'origine. Leur `sw.js` est volontairement inactif afin de ne pas modifier les caches de V2. Les anciennes URL de profils pointent vers leurs archives, sauf Ryllaka qui ouvre son nouveau Spotlight. `profile.html?id=...` et `pages/selection.html` restent des entrées de compatibilité.

## Twitch — déjà configuré

Les secrets `TWITCH_CLIENT_ID` et `TWITCH_CLIENT_SECRET` restent dans GitHub Secrets. **Ne pas créer de fichier contenant leurs valeurs.** La tâche « Actualiser les lives Twitch » utilise un app access token temporaire, jamais sauvegardé dans le JSON. Elle se lance toutes les 15 minutes, avec les retards possibles de GitHub Actions, ou par `workflow_dispatch`.

Après installation de cette version, lancer la tâche une première fois. Elle parcourt `Get Streams` avec `language=fr`, filtre les tags déclarés, puis récupère `Get Users` pour les nouvelles chaînes et les quatre Spotlight. Le catalogue ne lit aucune ancienne liste de VTubers. La collecte peut être plafonnée par `maxPages` ; `coverage.complete=false` rend cette limite visible. Les changements entre pages sont dédupliqués. Les chaînes sans tag reconnu peuvent manquer : pas de prétention d'exhaustivité ni de certification des tags.

Une erreur d'API préserve le précédent relevé. Après 45 minutes (modifiable), aucun statut live ni suggestion de raid n'est considéré comme actuel. Les portraits publics restent le dernier portrait connu. Le premier fichier inclus garde les directs Spotlight du précédent format mais laisse Discover vide jusqu'à la nouvelle collecte ; il n'ajoute aucun faux direct.

Le workflow possède `contents: write` pour le JSON et `pages: write` pour demander une reconstruction Pages. **Un commit créé avec `GITHUB_TOKEN` ne déclenche pas à lui seul un build Pages.** Pour la configuration actuelle « Deploy from a branch », la tâche appelle explicitement l'API de reconstruction après son commit. Si vous migrez vers une source « GitHub Actions », configurez un workflow de déploiement déclenché par `workflow_run` après cette synchronisation (le workflow affiche une indication dans ce cas). Le domaine `CNAME` est conservé.

Références : [Get Streams / Get Users](https://dev.twitch.tv/docs/api/reference/) et [sources de publication GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Éditer les contenus

`spotlight.json` réserve `intro`, `universe`, `content`, `collaboration`, `contactEmail`, `mediaKit`, `socials` (`[{"label":"YouTube","url":"https://..."}]`) et `media` au contenu validé avec chaque créatrice. Les couleurs sont des accents de navigation, pas une description de leur identité officielle. La bio synchronisée est clairement identifiée comme une présentation Twitch. Les liens Discord et YouTube de Ryllaka sont repris de son ancien profil ; vérifier qu'ils sont toujours souhaités.

Un événement : `{ "date":"2026-12-01T18:00:00+01:00", "title":"...", "type":"Concert", "creator":"...", "login":"ryllaka", "url":"https://..." }` dans `events.json`.

Le contact compose un texte sur l'appareil. Sans adresse validée, le visiteur peut le copier et chercher le contact officiel sur la chaîne. Avec une adresse, il ouvre sa propre messagerie. Aucune confirmation d'envoi fictive. Vtuber Link n'est pas une agence et ne représente pas commercialement les créatrices.

## Vérifier en local

`python3 -m http.server 8000` puis `http://localhost:8000` (ne pas ouvrir les modules par double-clic).

`npm test` utilise seulement les tests intégrés à Node 22 : pagination, tags, déduplication, couverture partielle, erreurs et péremption.

`tests/browser-qa.cjs` utilise Playwright et un Chromium fourni par `BROWSER_EXECUTABLE`. Les fixtures de test sont injectées en mémoire, jamais écrites dans les données publiques. Il vérifie huit vues à 1440, 1024, 768, 390 et 320 px, le dock, les filtres, les propositions, le raid et la réduction des animations. Exécution : `BROWSER_EXECUTABLE=/chemin/chromium node tests/browser-qa.cjs` dans un environnement où Playwright est installé.

Les informations d'éditeur et les anciens documents juridiques provisoires doivent être complétés pour le lancement définitif. Aucun événement, partenariat ou disponibilité n'a été inventé.
