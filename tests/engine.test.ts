/**
 * Tests du moteur sur les cas-types de référence (résultats attendus documentés dans docs/cas-types-reference.md).
 * Les montants viennent de tests/fixtures/valid/castypes/, générés par scripts/openfisca/run.py
 * (OpenFisca-France 176.1.0, législation 2026).
 */
import { describe, expect, it } from 'vitest'
import { loadRaw } from '../scripts/lib/load-raw'
import { compareByTheme, findCastype, matches, MAX_ITEMS_PAR_SENS, parseSeed, seededShuffle, simulate, type CandidateResult } from '../src/engine'
import { derive, type Profile } from '../src/schema/profile'
import { THEMES } from '../src/schema/theme'
import { validateDataset, type Dataset } from '../src/schema/validate'

const report = validateDataset(loadRaw('tests/fixtures/valid'), { mode: 'fixtures', today: '2026-09-27' })
const dataset = report.dataset as Dataset

const base: Profile = {
  ageTranche: '25-34',
  statutPro: 'salarie_prive',
  boursier: false,
  revenuTranche: 'r2',
  couple: false,
  revenuConjointTranche: null,
  enfants: '0',
  logement: 'locataire_prive',
  zone: 'ville_moyenne',
  handicapAAH: false,
  vehicule: false,
}

const PROFILS: Record<string, Profile> = {
  etudiantBoursier: { ...base, ageTranche: '18-24', statutPro: 'etudiant', boursier: true, revenuTranche: 'r1', zone: 'grande_ville' },
  salarieSmic: base,
  cadre: { ...base, ageTranche: '35-49', revenuTranche: 'r5', logement: 'proprietaire', zone: 'grande_ville' },
  retraite: { ...base, ageTranche: '62+', statutPro: 'retraite', revenuTranche: 'r3', logement: 'proprietaire', zone: 'rural' },
  parentIsole: { ...base, ageTranche: '35-49', enfants: '2', logement: 'locataire_social', zone: 'grande_ville' },
}

function byId(results: CandidateResult[], id: string) {
  return results.find((r) => r.candidat.id === id)!
}
const ids = (xs: { effetId: string }[]) => xs.map((x) => x.effetId)
const montant = (r: CandidateResult, effetId: string) => {
  const v = [...r.positifs, ...r.negatifs, ...r.autres].find((x) => x.effetId === effetId)!
  return v.montant?.kind === 'castype' ? v.montant.annuel : null
}

it('les fixtures sont valides', () => {
  expect(report.errors).toEqual([])
})

describe('cas-types de référence', () => {
  it('étudiant·e boursier·e', () => {
    const res = simulate(PROFILS.etudiantBoursier, dataset)
    const a = byId(res, 'candidat-a')
    expect(ids(a.positifs)).toEqual(['a-apl-10-gain', 'a-tva-energie-facture', 'a-etudes-repas-effet'])
    expect(montant(a, 'a-apl-10-gain')).toBe(239)
    expect(a.negatifs).toEqual([])
    expect(a.autresMesures.map((m) => m.mesureId)).toEqual(['a-smic-5', 'a-retraites-flou'])

    const b = byId(res, 'candidat-b')
    expect(b.positifs).toEqual([])
    expect(ids(b.negatifs)).toEqual(['b-age-retraite-effet', 'b-csg-baisse-tva'])
    expect(ids(b.autres)).toEqual(['b-service-civique-effet'])
    expect(b.autres[0].type).toBe('flou')
  })

  it('salarié·e au SMIC', () => {
    const res = simulate(PROFILS.salarieSmic, dataset)
    const a = byId(res, 'candidat-a')
    expect(ids(a.positifs)).toEqual(['a-smic-5-gain', 'a-tva-energie-facture'])
    expect(montant(a, 'a-smic-5-gain')).toBe(635)
    // APL : l'effet cible ce profil mais OpenFisca calcule 0 € (pas d'APL au SMIC seul·e) → neutre, écart visible.
    expect(ids(a.autres)).toEqual(['a-apl-10-gain'])
    expect(a.autres[0].sens).toBe('neutre')
    expect(a.autres[0].sensDeclare).toBe('positif')

    const b = byId(res, 'candidat-b')
    expect(ids(b.positifs)).toEqual(['b-csg-baisse-gain'])
    expect(montant(b, 'b-csg-baisse-gain')).toBe(178)
    expect(ids(b.negatifs)).toEqual(['b-age-retraite-effet', 'b-csg-baisse-tva'])
  })

  it('cadre', () => {
    const res = simulate(PROFILS.cadre, dataset)
    const a = byId(res, 'candidat-a')
    expect(ids(a.positifs)).toEqual(['a-tva-energie-facture'])
    expect(a.autresMesures.map((m) => m.mesureId)).toEqual(['a-smic-5', 'a-retraites-flou', 'a-etudes-repas', 'a-apl-10'])
    const b = byId(res, 'candidat-b')
    expect(montant(b, 'b-csg-baisse-gain')).toBe(414)
  })

  it('retraité·e', () => {
    const res = simulate(PROFILS.retraite, dataset)
    const b = byId(res, 'candidat-b')
    expect(b.positifs).toEqual([])
    expect(ids(b.negatifs)).toEqual(['b-csg-baisse-tva'])
    // Le recul de l'âge légal ne concerne pas une personne déjà retraitée.
    expect(b.autresMesures.map((m) => m.mesureId)).toContain('b-age-retraite')
  })

  it('parent isolé locataire', () => {
    const res = simulate(PROFILS.parentIsole, dataset)
    expect(derive(PROFILS.parentIsole).parentIsole).toBe(true)
    const a = byId(res, 'candidat-a')
    expect(ids(a.positifs)).toEqual(['a-smic-5-gain', 'a-apl-10-gain', 'a-tva-energie-facture'])
    expect(montant(a, 'a-smic-5-gain')).toBe(537)
    expect(montant(a, 'a-apl-10-gain')).toBe(291)
    const smic = a.positifs[0].montant
    // La hausse du SMIC réduit en partie la prime d'activité et l'aide au logement : le détail le montre.
    expect(smic?.kind === 'castype' && smic.detail).toEqual([
      { libelle: 'Salaire net', montant: 887 },
      { libelle: 'Prime d’activité', montant: -253 },
      { libelle: 'Aide au logement', montant: -98 },
    ])
    const b = byId(res, 'candidat-b')
    expect(montant(b, 'b-csg-baisse-gain')).toBe(157)
  })
})

describe('chiffrage : jamais forcé', () => {
  it('statut sans cas-type (fonctionnaire) : l’effet devient qualitatif avec la raison', () => {
    const res = simulate({ ...base, statutPro: 'fonctionnaire' }, dataset)
    const gain = byId(res, 'candidat-b').positifs.find((v) => v.effetId === 'b-csg-baisse-gain')!
    expect(gain.type).toBe('qualitatif')
    expect(gain.montant).toBeNull()
    expect(gain.nonChiffreCar).toMatch(/non chiffré/)
  })

  it('tranche voisine : cas-type le plus proche, signalé comme approché', () => {
    const m = findCastype({ ...base, revenuTranche: 'r3' }, dataset.castypes!.grid)
    expect(m?.castype.id).toBe('salarie-smic')
    expect(m?.approche).toBe(true)
  })

  it('plus d’une tranche d’écart : aucun cas-type', () => {
    expect(findCastype({ ...base, revenuTranche: 'r5' }, dataset.castypes!.grid)).toBeNull()
  })

  it('jamais de rapprochement entre situations familiales différentes', () => {
    expect(findCastype({ ...base, enfants: '1' }, dataset.castypes!.grid)).toBeNull()
  })

  it('chaque effet chiffré affiche ses hypothèses et son périmètre', () => {
    for (const p of Object.values(PROFILS)) {
      for (const r of simulate(p, dataset)) {
        for (const v of [...r.positifs, ...r.negatifs, ...r.autres]) {
          expect(v.hypotheses.length).toBeGreaterThan(0)
          expect(v.perimetreSimulation.length).toBeGreaterThan(0)
          if (v.montant?.kind === 'castype') expect(v.montant.hypothesesCommunes.length).toBeGreaterThan(0)
        }
      }
    }
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
    for (const r of simulate(PROFILS.parentIsole, dataset)) {
      for (const v of [...r.positifs, ...r.negatifs, ...r.autres]) expect(v.financement).toBeDefined()
    }
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
    expect(matches({ all: [{ champ: 'revenuTranche', op: 'gte', valeur: 'r3' }] }, p)).toBe(true)
  })

  it('champ nullable non renseigné : aucune comparaison satisfaite', () => {
    const p = derive(base)
    expect(matches({ all: [{ champ: 'revenuConjointTranche', op: 'lte', valeur: 'r6' }] }, p)).toBe(false)
  })

  it('any / tous', () => {
    const p = derive(base)
    expect(matches({ any: [{ champ: 'statutPro', op: 'eq', valeur: 'retraite' }, { champ: 'couple', op: 'eq', valeur: false }] }, p)).toBe(true)
    expect(matches({ tous: true }, p)).toBe(true)
  })
})

it('comparaison par thème : chaque cellule est une mesure ou une absence de position datée', () => {
  const table = compareByTheme(dataset)
  for (const row of table.values()) {
    expect(Object.keys(row).sort()).toEqual([...THEMES].sort())
  }
  expect(table.get('candidat-b')!.salaires.kind).toBe('sansPosition')
})
