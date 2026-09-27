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
