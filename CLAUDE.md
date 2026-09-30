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
1. Modifier `data/` (sources datées, ne rien supprimer : statut `modifiee`/`abandonnee` + historique). Toute
   nouvelle mesure a un `libelleCourt` (≤ 60 caractères) en plus de son `intitule` complet.
2. Mesure chiffrable modifiée : `npx tsx scripts/export-grid.ts` puis `cd scripts/openfisca && uv run python run.py --data ../../data`.
3. `npm run validate-data && npm test && npm run build`.

## Photos des candidat·es
- Un seul portrait par candidat·e (analysé·e ou non), recadré au même format (7:9, ~480×617) que tous les autres,
  affiché en rond (cadrage carré centré sur le visage via `object-position`) — voir `src/components/Avatar.tsx`.
  Fichiers dans `public/candidats/<id>.jpg`.
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

## Structure de navigation (refonte V4)
- Refonte structurelle complète (docs/ux-spec.md) : plus de nav texte en haut d'écran, ni sur mobile ni sur
  desktop. Chaque écran affiche son propre `<TopBar>` (titre + flèche retour ou icône d'action seulement).
  Navigation entre les 4 sections principales (Résultat / Comparer / Candidats / Aide) uniquement via la bottom
  tab bar (`src/components/Layout.tsx`), visible sur toutes les tailles d'écran, masquée sur l'accueil.
- Accueil (`src/pages/Home.tsx`) : écran d'entrée hors des 4 onglets, pas de bottom tab bar. Une phrase, un bouton
  « Commencer », la mention vie privée, une icône ⓘ ouvre une feuille avec l'explication complète (a remplacé
  l'ancien onboarding en 3 étapes modal — pas de nouvel écran forcé au premier lancement).
- Composants transverses : `.tile` (questionnaire), `.row` (lignes Résultat/Comparer), `.pill` (thèmes),
  `.segctrl` (Par thème / Par candidat), feuilles modales (`Sheet.tsx`, rendues via portail React, jamais imbriquées
  dans un conteneur animé). Disclosure (FAQ, méthodologie, thèmes de la fiche candidat·e) : chevron qui pivote à
  180°, jamais l'icône +/× de la V3.
- Questionnaire : une question par écran, tap sur une tuile = sélection **et** avance automatique (pas de bouton
  Suivant), progression en segments, flèche retour en haut à gauche, lien discret « Pourquoi cette question ? »
  sous les tuiles.
- Résultat : puce de profil courte (2 éléments, jamais tous les champs bruts) tappable pour revenir au récap ;
  bascule Par thème (pastilles de thèmes triées par pertinence — d'abord les thèmes avec un effet **chiffré**,
  garantit un montant en € visible sans scroll) / Par candidat (pager horizontal, effets groupés
  Avantages/Désavantages/Incertain, jamais un compte isolé — toujours « x sur N mesures analysées »).

## Vocabulaire des types d'effets
- Un seul vocabulaire partout : **Chiffré** / **Qualitatif** / **Flou** (`TypeBadge`, `src/components/ui.tsx`),
  jamais « non chiffré » ici et « trop flou » ailleurs. Un pictogramme distinct par état (pièce / page à lignes /
  brume), jamais le même pictogramme pour deux concepts différents dans l'app (règle stricte de
  `src/components/icons.tsx`).
- `Measure.libelleCourt` (`src/schema/measure.ts`, ≤ 60 caractères, écrit à la main mesure par mesure) : libellé
  pour les lignes de liste (Résultat/Comparer), jamais tronqué visuellement par du texte coupé en "…". Le libellé
  complet (`intitule`) reste affiché dans la feuille de détail et la fiche candidat·e.

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
- Scrollbar personnalisée, élévation par ombre douce plutôt que bordure fine, hover/focus/pressed visibles partout
  où un élément est cliquable (voir `src/index.css`, classe `.raised` et les composants `.tile`/`.row`/`.pill`).
