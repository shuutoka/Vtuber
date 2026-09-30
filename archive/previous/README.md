# Vtuber Link V2

Portail statique pour GitHub Pages. Ouvrir avec un serveur local (`python3 -m http.server 8000`) : les fichiers JSON sont chargés par `fetch`.

## Structure

- `index.html` : accueil et sections du portail ; `profile.html` : profils JSON.
- `assets/css/site.css` et `assets/js/` : présentation et interactions.
- `data/creators.json` : liste et champs éditoriaux ; `data/events.json` : événements confirmés ; `data/live.json` : instantané automatique.
- `scripts/update-live.mjs` et `.github/workflows/update-live.yml` : collecte Twitch côté GitHub Actions.
- `vtuber/` : anciens profils conservés avec leurs liens ; `pages/selection.html` : ancienne URL redirigée.

## Mise en service Twitch

Créer une application Twitch, puis définir les secrets GitHub `TWITCH_CLIENT_ID` et `TWITCH_CLIENT_SECRET`. Activer les droits d'écriture des workflows si le dépôt les restreint. Lancer « Actualiser les lives Twitch » manuellement une première fois ; la tâche planifiée demande ensuite une exécution toutes les 15 minutes (GitHub peut la retarder). Le client secret reste exclusivement dans les secrets GitHub. Un instantané de plus de 45 minutes est affiché comme indisponible, jamais comme un état live actuel.

## Modifier le contenu

Ajouter un créateur dans `data/creators.json` avec `id`, `name` et `twitch`. Ajouter `spotlight: true` pour la vitrine. Les champs `intro`, `universe`, `content`, `collaboration`, `socials` (`[{"label":"YouTube","url":"https://..."}]`), `mediaKit`, `events`, `media` et `contactEmail` sont facultatifs. N'ajouter une adresse professionnelle qu'après validation de la créatrice. Sans cette adresse, le formulaire copie une proposition et renvoie vers sa chaîne Twitch ; il ne prétend pas l'envoyer.

Un événement est un objet `{ "date":"2026-12-01T18:00:00+01:00", "title":"...", "type":"Concert", "creator":"...", "url":"https://..." }` dans `data/events.json`. Ne publier que les annonces vérifiées. Les anciennes fiches de profil et les pages juridiques provisoires n'ont pas été supprimées. Les textes juridiques doivent être revus avant une mise en production publique de la V2.
