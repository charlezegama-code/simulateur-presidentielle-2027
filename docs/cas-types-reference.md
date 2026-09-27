# Cas-types de référence : résultats attendus

Générés par `scripts/openfisca/run.py` (OpenFisca-France 176.1.0, législation 2026) sur les candidats **fictifs**
de `tests/fixtures/valid`. Vérifiés par `tests/engine.test.ts`. Montants = variation annuelle du revenu disponible du ménage.

## Situation de départ (baseline, €/an)

| Cas-type | Revenu net | Prime d'activité | Aide logement | Alloc. familiales | Impôt sur le revenu | Revenu disponible |
|---|---:|---:|---:|---:|---:|---:|
| Étudiant·e boursier·e (job 700 €/mois, locataire grande ville, loyer 700 €) | 8 400 | 0 | 2 399 | 0 | 0 | 10 799 |
| Salarié·e au SMIC (seul·e, locataire ville moyenne, loyer 550 €) | 17 735 | 2 754 | 0 | 0 | 0 | 20 476 |
| Cadre (3 800 €/mois, propriétaire) | 45 600 | 0 | 0 | 0 | −5 859 | 39 741 |
| Retraité·e (pension 1 750 €/mois, propriétaire) | 21 000 | 0 | 0 | 0 | −149 | 20 851 |
| Parent isolé au SMIC, 2 enfants, HLM grande ville (loyer 520 €) | 17 735 | 2 567 | 2 916 | 1 832 | 0 | 31 309 |

La bourse sur critères sociaux n'est **pas** simulée : elle dépend des revenus des parents, que l'app ne demande pas.

## Effets attendus par profil

| Profil | Candidat A (fictif) | Candidat B (fictif) |
|---|---|---|
| Étudiant·e boursier·e | **+** APL +10 % : **+239 €/an** · **+** TVA énergie : 80–150 €/an (chiffrage tiers) · **+** repas à 1 € (qualitatif) · autres : SMIC, retraites (flou) | **−** âge légal 65 ans (qualitatif) · **−** hausse de TVA de financement (qualitatif) · **?** service civique (flou) |
| Salarié·e au SMIC | **+** SMIC +5 % : **+635 €/an** · **+** TVA énergie · **=** APL +10 % : **0 €** (pas d'APL à ce revenu ; sens déclaré « positif » affiché comme écart) | **+** baisse CSG : **+178 €/an** · **−** âge légal · **−** hausse de TVA |
| Cadre | **+** TVA énergie · autres : SMIC, retraites, repas, APL | **+** baisse CSG : **+414 €/an** · **−** âge légal · **−** hausse de TVA |
| Retraité·e | **+** TVA énergie | **−** hausse de TVA · âge légal : non concerné (autres mesures) |
| Parent isolé locataire | **+** SMIC +5 % : **+537 €/an** (salaire +887, prime d'activité −253, APL −98) · **+** APL +10 % : **+291 €/an** · **+** TVA énergie | **+** baisse CSG : **+157 €/an** · **−** âge légal · **−** hausse de TVA |

## Règles vérifiées

- Statut sans cas-type (fonctionnaire, indépendant, alternant) : l'effet reste **qualitatif**, avec la raison affichée.
- Tranche de revenu voisine : cas-type le plus proche, marqué « approché ». Plus d'une tranche d'écart : pas de chiffre.
- Pas de rapprochement entre situations familiales différentes.
- Montant calculé nul : effet affiché comme neutre, avec le sens déclaré dans les données.
- Pas de total ni de score ; même structure de résultat pour tous les candidats.
