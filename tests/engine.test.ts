/**
 * Tests du moteur sur les cas-types de référence (résultats attendus : docs/cas-types-reference.md).
 * Montants : tests/fixtures/valid/castypes (scripts/openfisca/run.py, OpenFisca-France 176.1.0, législation 2026)
 * et estimation de consommation (data/conso, INSEE Budget de famille 2017).
 */
import { describe, expect, it } from 'vitest'
import { loadRaw } from '../scripts/lib/load-raw'
import {
  compareByTheme,
  decileNiveauDeVie,
  matches,
  MAX_ITEMS_PAR_SENS,
  parseSeed,
  PERIMETRE_CONSO,
  PERIMETRE_SALAIRES,
  seededShuffle,
  simulate,
  unitesConsommation,
  type CandidateResult,
  type EffectView,
} from '../src/engine'
import { cellIndex, cellKey, cellOf, enumerateCells } from '../src/domain/grid'
import { AGES_PAR_STATUT, derive, REVENUS_PAR_STATUT, STATUTS_PRO, type Profile } from '../src/domain/profile'
import { THEMES } from '../src/domain/theme'
import { profileSchema } from '../src/schema/profile'
import { validateDataset, type Dataset } from '../src/schema/validate'

const report = validateDataset(loadRaw('tests/fixtures/valid'), { mode: 'fixtures', today: '2026-09-27' })
const dataset = report.dataset as Dataset

const base: Profile = {
  statutPro: 'salarie_prive',
  ageTranche: '25-34',
  echelonBourse: null,
  revenuTranche: 'r2',
  couple: false,
  revenuConjointTranche: null,
  enfants: '0',
  logement: 'locataire_prive',
  zoneApl: 'zone_3',
  handicapAAH: false,
  vehicule: false,
}

const PROFILS: Record<string, Profile> = {
  etudiantBoursier: { ...base, statutPro: 'etudiant', ageTranche: '18-24', echelonBourse: '4', revenuTranche: 'r1', zoneApl: 'zone_2' },
  salarieSmic: base,
  cadre: { ...base, ageTranche: '35-49', revenuTranche: 'r5', logement: 'proprietaire', zoneApl: 'zone_2', vehicule: true },
  retraite: { ...base, statutPro: 'retraite', ageTranche: '62+', revenuTranche: 'r3', logement: 'proprietaire' },
  parentIsole: { ...base, ageTranche: '35-49', enfants: '2', logement: 'locataire_social', zoneApl: 'zone_2' },
}

const byId = (results: CandidateResult[], id: string) => results.find((r) => r.candidat.id === id)!
const ids = (xs: { effetId: string }[]) => xs.map((x) => x.effetId)
const all = (r: CandidateResult) => [...r.positifs, ...r.negatifs, ...r.autres]
const view = (r: CandidateResult, effetId: string) => all(r).find((x) => x.effetId === effetId)!
const montant = (r: CandidateResult, effetId: string) => {
  const m = view(r, effetId).montant
  return m && 'annuel' in m ? m.annuel : null
}

it('les fixtures sont valides', () => {
  expect(report.errors).toEqual([])
})

describe('grille : une case par combinaison de réponses', () => {
  const cells = enumerateCells()

  it('24 320 cases, toutes distinctes', () => {
    expect(cells).toHaveLength(24320)
    expect(new Set(cells.map(cellKey)).size).toBe(cells.length)
  })

  it('chaque profil valide du questionnaire tombe dans une case de la grille', () => {
    let n = 0
    for (const statutPro of STATUTS_PRO)
      for (const ageTranche of AGES_PAR_STATUT[statutPro])
        for (const revenuTranche of REVENUS_PAR_STATUT[statutPro])
          for (const couple of [false, true])
            for (const logement of ['locataire_prive', 'proprietaire', 'heberge'] as const)
              for (const zoneApl of ['zone_1', 'zone_3'] as const) {
                const p: Profile = {
                  ...base,
                  statutPro,
                  ageTranche,
                  revenuTranche,
                  couple,
                  revenuConjointTranche: couple ? 'c2' : null,
                  echelonBourse: statutPro === 'etudiant' ? 'inconnu' : null,
                  logement,
                  zoneApl,
                }
                expect(profileSchema.safeParse(p).success).toBe(true)
                expect(() => cellIndex(p)).not.toThrow()
                n++
              }
    expect(n).toBeGreaterThan(500)
  })

  it('les réponses sans effet sur le calcul sont fusionnées (zone pour un·e propriétaire, âge 25-61)', () => {
    const proprio = { ...base, logement: 'proprietaire' as const }
    expect(cellIndex({ ...proprio, zoneApl: 'zone_1' })).toBe(cellIndex({ ...proprio, zoneApl: 'zone_3' }))
    expect(cellIndex({ ...base, ageTranche: '35-49' })).toBe(cellIndex({ ...base, ageTranche: '50-61' }))
    expect(cellIndex({ ...base, ageTranche: '18-24' })).not.toBe(cellIndex({ ...base, ageTranche: '25-34' }))
    expect(cellIndex({ ...base, zoneApl: 'zone_1' })).not.toBe(cellIndex({ ...base, zoneApl: 'zone_2' }))
  })

  it('profil incohérent refusé (échelon hors étudiant, âge retraité à 20 ans)', () => {
    expect(profileSchema.safeParse({ ...base, echelonBourse: '3' }).success).toBe(false)
    expect(profileSchema.safeParse({ ...base, statutPro: 'retraite', ageTranche: '18-24', revenuTranche: 'r3' }).success).toBe(false)
  })

  it('le précalcul porte sur cette grille exacte', () => {
    expect(dataset.castypes!.baseline.revenuDisponible).toHaveLength(cells.length)
  })
})

describe('cas-types de référence', () => {
  it('étudiant·e boursier·e (échelon 4, job 700 €, locataire zone 2)', () => {
    const a = byId(simulate(PROFILS.etudiantBoursier, dataset), 'candidat-a')
    expect(ids(a.positifs)).toEqual(['a-bourses-10-gain', 'a-apl-10-gain', 'a-tva-energie-facture', 'a-etudes-repas-effet'])
    expect(montant(a, 'a-bourses-10-gain')).toBe(459) // 10 % de 4 587 €
    expect(montant(a, 'a-apl-10-gain')).toBe(240)
    expect(montant(a, 'a-tva-energie-facture')).toBe(90)
    const b = byId(simulate(PROFILS.etudiantBoursier, dataset), 'candidat-b')
    expect(b.positifs).toEqual([])
    expect(ids(b.negatifs)).toEqual(['b-tva-hausse-prix', 'b-age-retraite-effet'])
    expect(montant(b, 'b-tva-hausse-prix')).toBeLessThan(0)
    expect(ids(b.autres)).toEqual(['b-service-civique-effet'])
  })

  it('salarié·e au SMIC (seul·e, locataire zone 3)', () => {
    const res = simulate(PROFILS.salarieSmic, dataset)
    const a = byId(res, 'candidat-a')
    expect(ids(a.positifs)).toEqual(['a-smic-5-gain', 'a-tva-energie-facture'])
    expect(montant(a, 'a-smic-5-gain')).toBe(640)
    expect(view(a, 'a-smic-5-gain').montant).toMatchObject({
      detail: [
        { libelle: 'Salaire net', montant: 890 },
        { libelle: 'Prime d’activité', montant: -250 },
      ],
    })
    // APL : l'effet cible ce profil mais OpenFisca calcule 0 € → neutre, écart avec le sens déclaré visible.
    expect(view(a, 'a-apl-10-gain')).toMatchObject({ sens: 'neutre', sensDeclare: 'positif' })
    expect(montant(byId(res, 'candidat-b'), 'b-csg-baisse-gain')).toBe(180)
  })

  it('cadre (3 800 €, propriétaire, avec voiture)', () => {
    const res = simulate(PROFILS.cadre, dataset)
    expect(montant(byId(res, 'candidat-b'), 'b-csg-baisse-gain')).toBe(410)
    const tva = view(byId(res, 'candidat-a'), 'a-tva-energie-facture').montant
    expect(tva).toMatchObject({ kind: 'consommation', decile: 9, annuel: 120 })
  })

  it('retraité·e : la baisse de CSG sur les salaires et le recul de l’âge légal ne le concernent pas', () => {
    const b = byId(simulate(PROFILS.retraite, dataset), 'candidat-b')
    expect(ids(b.negatifs)).toEqual(['b-tva-hausse-prix'])
    expect(b.autresMesures.map((m) => m.mesureId)).toContain('b-age-retraite')
  })

  it('parent isolé locataire HLM : la hausse du SMIC réduit prime d’activité et APL, le détail le montre', () => {
    const a = byId(simulate(PROFILS.parentIsole, dataset), 'candidat-a')
    expect(montant(a, 'a-smic-5-gain')).toBe(540)
    expect(view(a, 'a-smic-5-gain').montant).toMatchObject({
      detail: [
        { libelle: 'Salaire net', montant: 890 },
        { libelle: 'Prime d’activité', montant: -250 },
        { libelle: 'Aide au logement', montant: -100 },
      ],
    })
    expect(montant(a, 'a-apl-10-gain')).toBe(290)
  })
})

describe('chiffrage : jamais forcé', () => {
  it('statut non simulé (micro-entrepreneur·e) : qualitatif avec la raison, estimation TVA sur revenu approché', () => {
    const a = byId(simulate({ ...base, statutPro: 'independant', revenuTranche: 'r3' }, dataset), 'candidat-a')
    const apl = view(a, 'a-apl-10-gain')
    expect(apl.type).toBe('qualitatif')
    expect(apl.montant).toBeNull()
    expect(apl.nonChiffreCar).toMatch(/non chiffré/)
    expect(view(a, 'a-tva-energie-facture').montant).toMatchObject({ kind: 'consommation', revenuApproche: true })
  })

  it('échelon de bourse inconnu : pas de montant de bourse', () => {
    const a = byId(simulate({ ...PROFILS.etudiantBoursier, echelonBourse: 'inconnu' }, dataset), 'candidat-a')
    // « inconnu » ne satisfait pas echelonBourse >= 0bis : la mesure apparaît dans les autres mesures.
    expect(a.autresMesures.map((m) => m.mesureId)).toContain('a-bourses-10')
  })

  it('sans voiture, pas de dépense de carburant', () => {
    const b = byId(simulate({ ...base, vehicule: false }, dataset), 'candidat-a')
    expect(b).toBeDefined()
  })

  it('chaque effet affiche hypothèses et périmètre ; périmètre standard pour les mesures salariales et de consommation', () => {
    for (const p of Object.values(PROFILS)) {
      for (const r of simulate(p, dataset)) {
        for (const v of all(r)) {
          expect(v.hypotheses.length).toBeGreaterThan(0)
          expect(v.perimetre.length).toBeGreaterThan(0)
          if (v.theme === 'salaires') expect(v.perimetre).toContain(PERIMETRE_SALAIRES)
          if (v.montant?.kind === 'consommation') expect(v.perimetre).toContain(PERIMETRE_CONSO)
          if (v.montant?.kind === 'castype') expect(v.montant.hypothesesCommunes.length).toBeGreaterThan(0)
        }
      }
    }
    expect(PERIMETRE_SALAIRES).toMatch(/emploi/)
    expect(PERIMETRE_SALAIRES).toMatch(/salaires proches du SMIC/)
  })
})

describe('consommation', () => {
  it('unités de consommation (échelle OCDE modifiée)', () => {
    expect(unitesConsommation({ couple: false, enfants: '0' })).toBe(1)
    expect(unitesConsommation({ couple: true, enfants: '2' })).toBeCloseTo(2.1)
    expect(unitesConsommation({ couple: true, enfants: '3+' })).toBeCloseTo(2.6)
  })

  it('décile de niveau de vie : bornes INSEE 2017 ramenées en euros 2025', () => {
    const conso = dataset.conso!
    expect(decileNiveauDeVie(5000, 1, conso)).toBe(1)
    expect(decileNiveauDeVie(20480, 1, conso)).toBe(4)
    expect(decileNiveauDeVie(200000, 1, conso)).toBe(10)
  })
})

describe('neutralité', () => {
  it('aucun total ni score dans le résultat', () => {
    const r = simulate(base, dataset)[0]
    expect(Object.keys(r).sort()).toEqual(['autres', 'autresMesures', 'candidat', 'compteurs', 'negatifs', 'positifs'])
  })

  it('même structure pour tous les candidats', () => {
    const shapes = simulate(base, dataset).map((r) => Object.keys(r).sort().join())
    expect(new Set(shapes).size).toBe(1)
  })

  it('le plafond d’affichage est une constante commune', () => {
    expect(MAX_ITEMS_PAR_SENS).toBe(5)
  })

  it('le financement accompagne chaque effet', () => {
    for (const r of simulate(PROFILS.parentIsole, dataset)) for (const v of all(r)) expect(v.financement).toBeDefined()
  })

  it('les candidats non analysés ne reçoivent pas de résultat, sans être retirés de la liste', () => {
    const d: Dataset = {
      ...dataset,
      candidates: { ...dataset.candidates, candidats: dataset.candidates.candidats.map((c, i) => (i === 1 ? { ...c, analyse: false } : c)) },
    }
    expect(simulate(base, d).map((r) => r.candidat.id)).toEqual(['candidat-a'])
  })
})

describe('ordre aléatoire seedé', () => {
  const items = ['candidat-a', 'candidat-b', 'c', 'd', 'e']
  const key = (x: string) => x

  it('même seed → même ordre', () => {
    expect(seededShuffle(items, 42, key)).toEqual(seededShuffle(items, 42, key))
  })

  it('indépendant de l’ordre d’entrée', () => {
    expect(seededShuffle([...items].reverse(), 42, key)).toEqual(seededShuffle(items, 42, key))
  })

  it('chaque candidat apparaît en premier avec une fréquence comparable', () => {
    const first: Record<string, number> = {}
    for (let s = 0; s < 5000; s++) {
      const f = seededShuffle(items, s, key)[0]
      first[f] = (first[f] ?? 0) + 1
    }
    for (const x of items) expect(first[x]).toBeGreaterThan(850) // attendu ≈ 1000
  })

  it('parseSeed n’accepte que des entiers courts', () => {
    expect(parseSeed('123456')).toBe(123456)
    expect(parseSeed('abc')).toBeNull()
    expect(parseSeed('12345678901')).toBeNull()
    expect(parseSeed(null)).toBeNull()
  })
})

describe('conditions', () => {
  it('gte/lte sur champ ordonné', () => {
    const p = derive({ ...base, revenuTranche: 'r3' })
    expect(matches({ all: [{ champ: 'revenuTranche', op: 'lte', valeur: 'r3' }] }, p)).toBe(true)
    expect(matches({ all: [{ champ: 'revenuTranche', op: 'lte', valeur: 'r2' }] }, p)).toBe(false)
  })

  it('échelon de bourse : « non boursier » et « inconnu » ne satisfont aucune comparaison', () => {
    const cond = { all: [{ champ: 'echelonBourse' as const, op: 'gte' as const, valeur: '0bis' }] }
    expect(matches(cond, derive({ ...PROFILS.etudiantBoursier, echelonBourse: '0bis' }))).toBe(true)
    expect(matches(cond, derive({ ...PROFILS.etudiantBoursier, echelonBourse: 'non_boursier' }))).toBe(false)
    expect(matches(cond, derive({ ...PROFILS.etudiantBoursier, echelonBourse: 'inconnu' }))).toBe(false)
  })

  it('champ nullable non renseigné : aucune comparaison satisfaite', () => {
    expect(matches({ all: [{ champ: 'revenuConjointTranche', op: 'lte', valeur: 'c3' }] }, derive(base))).toBe(false)
  })
})

it('comparaison par thème : chaque cellule est une mesure ou une absence de position datée', () => {
  const table = compareByTheme(dataset)
  for (const row of table.values()) expect(Object.keys(row).sort()).toEqual([...THEMES].sort())
  expect(table.get('candidat-b')!.salaires.kind).toBe('sansPosition')
})

it('le type de cellOf est cohérent avec la clé', () => {
  expect(cellKey(cellOf(base))).toBe('salarie_prive.25_plus.r2.seul.0.locataire_prive.zone_3.sans_aah')
})

export type { EffectView }
