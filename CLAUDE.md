# Projet : Simulateur Présidentielle 2027

## Objectif
PWA : l'utilisateur renseigne son profil (étudiant, salarié, retraité, indépendant, demandeur d'emploi, parent,
locataire/propriétaire, tranche de revenu, handicap/AAH…). L'app montre, candidat par candidat, ce que le programme
changerait concrètement pour lui : avantages ET inconvénients, chiffrés quand c'est possible.
Public : jeunes électeurs indécis, sur mobile. 1er tour : 18 avril 2027. 2nd tour : 2 mai 2027.
Ce n'est PAS un outil de recommandation de vote : pas de score global, pas de « meilleur candidat ».

## Règles non négociables
1. **Zéro donnée inventée.** Chaque mesure a au moins une source : URL, date de publication, date de consultation,
   type (`programme` / `declaration` / `chiffrage_tiers`). Sans source, la mesure n'entre pas dans /data.
   Le build échoue si une source manque (validation Zod en `prebuild`).
2. **Effets typés.** Chaque effet a un type (`chiffre` / `qualitatif` / `flou`), ses hypothèses et un champ
   `perimetreSimulation` (ce que le moteur ne modélise pas), tous affichés à l'utilisateur. Ne jamais forcer un chiffre :
   dans le doute, `qualitatif` ou `flou`.
3. **Neutralité.**
   - Même gabarit pour tous les candidats (mêmes champs, même nombre max d'items affichés).
   - Vocabulaire descriptif (« propose », « prévoit »), jamais évaluatif (« irréaliste », « courageux »…).
   - Financement annoncé toujours présent (ou explicitement « non précisé par le candidat »).
   - Ordre d'affichage aléatoire via une seed affichée et rejouable (`?seed=…`). Jamais d'ordre par sondage.
4. **RGPD.** Les opinions politiques sont des données sensibles (art. 9). Le profil ne quitte jamais le navigateur :
   pas de backend, pas d'analytics lié au profil, pas de requête réseau contenant des données du profil.
5. **Paraphrase** des programmes, pas de copie ni de longues citations. Toujours un lien vers la source.
6. **Statut des candidats** : `declare` / `pressenti` / `officiel` / `retire`, avec date du statut et source.
   Données datées et versionnées ; on ne supprime pas l'historique (mesures modifiées/abandonnées marquées comme telles).
7. **Contradictions entre sources** : les signaler, ne pas trancher.

## Stack
- Vite + React + TypeScript + Tailwind + vite-plugin-pwa (offline).
- Données JSON dans /data, validées par Zod (`npm run validate-data`, branché en `prebuild`).
- Tests : Vitest.
- Chiffrage : précalcul offline de cas-types (OpenFisca-France, Python, /scripts) → JSON. Pas de backend.
- Hébergement : GitHub + Cloudflare Pages (site statique).

## Conventions
- Français partout dans l'UI.
- Commits petits et descriptifs.
- Avant de dire « terminé » : `npm run validate-data`, `npm test`, `npm run build` au vert. Jamais de commit si le build échoue.
- Déroulé par étapes avec points d'arrêt : attendre la validation de l'utilisateur à chaque ⏸.

## Audit de neutralité (avant chaque mise à jour publiée)
- Asymétries entre candidats : nombre de mesures, ton, financement présent, effets positifs vs négatifs.
- **Part d'effets chiffrés par candidat** (`partChiffree`, src/engine/compare.ts) : au-delà de 25 points d'écart, le validateur avertit et l'app affiche un bandeau.
- Vocabulaire évaluatif, sources mortes (utiliser archiveUrl), dates anciennes, chiffres sans hypothèse.
- `npm run build` exécute aussi `check-bundle` : aucune requête hors du site.

## Mise à jour des données
1. Modifier `data/` (sources datées, ne rien supprimer : statut `modifiee`/`abandonnee` + historique).
2. Mesure chiffrable modifiée : `npx tsx scripts/export-grid.ts` puis `cd scripts/openfisca && uv run python run.py --data ../../data`.
3. `npm run validate-data && npm test && npm run build`.

## Photos des candidat·es
- Un seul portrait par candidat·e (analysé·e ou non), recadré au même format (7:9, ~480×617) que tous les autres —
  voir `src/components/CandidateAvatar.tsx`. Fichiers dans `public/candidats/<id>.jpg`.
- Uniquement des photos sous licence libre vérifiée (Wikimedia Commons de préférence : CC0, CC BY, CC BY-SA, ou
  Licence Ouverte/Etalab pour une source officielle). Jamais une photo de presse sans licence claire.
- Éviter les photos où un vêtement, un logo ou un fond trahit la couleur d'un parti (neutralité) ; préférer un visage
  face caméra, sans micro devant la bouche.
- Métadonnées obligatoires dans `candidates.json` (`photo.credit`, `photo.licence`, `photo.sourceUrl`,
  `photo.dateAcces`) — affichées sous le portrait sur la fiche candidat·e.
- Si aucune photo libre n'est trouvée pour un·e candidat·e : `photo: null`, jamais une photo de moins bonne qualité
  juste pour en avoir une. L'avatar générique s'affiche alors à la place, identique pour tout le monde.

## Typographie
- Une seule famille : **Hanken Grotesk Variable** (sans-serif), pour titres et texte courant. Pas de deuxième police
  serif : gardé une V2 avec Fraunces en titres qui jurait avec les boutons/badges déjà sans-serif — cohérence choisie
  plutôt qu'un contraste éditorial, pour rester proche d'une appli mobile plutôt qu'un journal.
- Hiérarchie via poids (700 pour titres) et taille, pas via une police différente. `--font-display` et `--font-sans`
  (src/index.css) pointent vers la même famille : les classes `font-display` existantes restent valides sans à
  changer chaque composant.

## Onboarding
- Écran d'accueil en 3 étapes affiché une seule fois (mémorisé dans `localStorage`, clé `onboarding-vu`), avant la
  première interaction. Bouton « Passer » à tout moment. Revisible depuis Méthodologie (« Revoir l'introduction »).
  Voir `src/components/Onboarding.tsx`.

## Couleurs
- Un seul accent : **violet** (`--accent`, #6d28d9 en light / #a78bfa en dark). Choisi parce qu'aucun parti français
  n'en fait sa couleur de marque (RN = bleu marine, LFI = rouge, PS = rose, LR = bleu, EELV = vert, Renaissance =
  jaune/bleu clair) — contrairement au bleu/rouge, plus risqués en contexte présidentielle française.
- Fond neutre gris (pas beige/sépia) en light (`--paper` #f7f6fb) et en dark (`--paper` #121317, pas brun) : la V2
  « vieux papier » était jugée terne. `--paper-raised` (cartes) contraste nettement avec `--paper` pour que les
  cartes se détachent (c'était le principal problème de contraste du round précédent).
- Vert (`--positive`) et corail (`--negative`) réservés au sens des effets simulés (avantage/inconvénient) — jamais
  utilisés comme couleur de marque de l'app, pour ne pas ajouter une deuxième teinte qui pourrait se lire comme un
  signal parti (le corail évite volontairement le rouge franc de LFI et le rose du PS).
- Toutes les paires texte/fond utilisées visent AA (≥ 4.5:1 texte normal, vérifié par calcul de contraste WCAG lors
  du choix de la palette).
- Scrollbar personnalisée, ombres de carte plus marquées, hover/focus visibles partout où un élément est cliquable
  (voir `src/index.css`, classes `.card`, `.card-hover`, `.card-lift`).
