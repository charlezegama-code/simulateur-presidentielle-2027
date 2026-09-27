# Simulateur Présidentielle 2027

PWA qui montre, pour un profil (étudiant, salarié, retraité, parent, locataire…), ce que les programmes des candidats
à la présidentielle 2027 changeraient concrètement : avantages **et** inconvénients, chiffrés quand c'est possible.

**Ce n'est pas un outil de recommandation de vote** : pas de score, pas de classement. Le profil ne quitte jamais le
navigateur (pas de backend, pas d'analytics). Règles complètes : [`CLAUDE.md`](CLAUDE.md).

## Lancer en local

```bash
npm install
npm run dev              # serveur de dev
npm test                 # tests Vitest
npm run validate-data    # valide /data (lancé automatiquement avant chaque build)
npm run build            # validate-data + typecheck + build PWA dans dist/
npm run preview          # sert dist/
```

## Structure

```
data/                    données publiées (JSON), validées par Zod
  candidates.json        candidats, statut daté et sourcé
  measures/<id>.json     mesures + effets d'un candidat (un fichier par candidat)
  castypes/              résultats OpenFisca précalculés (étape 3)
  meta.json              version et date de mise à jour des données
scripts/
  validate-data.ts       validateur (prebuild + CI)
  openfisca/             précalcul des cas-types en Python (étape 3)
src/
  schema/                schémas Zod + validateur (fonctions pures)
  engine/                moteur de simulation (fonctions pures, sans UI)
  data/loader.ts         chargement des JSON dans le bundle
tests/
  fixtures/valid/        candidats FICTIFS A et B (jamais publiés)
public/_headers          CSP : aucune connexion hors du site
```

## Chiffrage (OpenFisca-France)

Les montants sont **précalculés hors ligne** pour une grille de cas-types (aucun backend, aucun appel réseau depuis l'app) :

```bash
cd scripts/openfisca
uv sync                                   # installe openfisca-france (version épinglée)
uv run python run.py --data ../../data    # écrit data/castypes/*.json
```

Relance le script après chaque modification des `parametres` d'une mesure chiffrable : sinon `validate-data` échoue
(« précalcul obsolète »). Réformes modélisées : `smic_pct`, `taux_csg`, `montant_prestation` (RSA, AAH, APL,
prime d'activité, allocations familiales), `bareme_ir`. Le reste reste qualitatif. Résultats de référence :
[`docs/cas-types-reference.md`](docs/cas-types-reference.md).

## Contribuer aux données

Chaque modification de `/data` doit respecter ces règles, vérifiées par `npm run validate-data` :

1. **Une source minimum par mesure** : `url` (https), `titre`, `editeur`, `datePublication`, `dateConsultation`,
   `type` (`programme` | `declaration` | `chiffrage_tiers`). Ajoute `archiveUrl` (web.archive.org) si possible.
2. **Paraphrase**, pas de copie. `intitule` ≤ 120 caractères, `description` ≤ 600.
3. **Vocabulaire descriptif** (« propose », « prévoit »). Les mots évaluatifs (« irréaliste », « courageux »…) sont refusés
   (liste : `src/schema/vocabulary.ts`).
4. **Financement** toujours renseigné : texte sourcé, ou `{ "nonPrecise": true }`.
5. **Type de mesure** : `chiffrable` (avec `parametres` simulables) · `qualitatif` · `flou` (pas assez précis).
6. **Chaque effet** a un `type` (`chiffre` | `qualitatif` | `flou`), au moins une hypothèse et un `perimetreSimulation`
   (ce que le calcul ne prend pas en compte). Dans le doute : pas de chiffre.
7. **Couverture** : pour chaque thème, soit une mesure, soit une entrée `sansPosition` datée. Aucun thème ignoré en silence.
8. **Contradictions** entre sources : on les documente (`contradictions`, ≥ 2 sources), on ne tranche pas.
9. **Historique** : une mesure modifiée ou abandonnée change de `statut` et gagne une entrée `historique`. Rien n'est supprimé.
10. Les candidats `fictif: true` sont refusés dans `/data`.

Exemple complet : `tests/fixtures/valid/measures/candidat-a.json`.

## Licences

Code : MIT. Données (`/data`) : CC BY 4.0.
