import { describe, expect, it } from 'vitest'
import { validateDataset, type RawDataset } from '../src/schema/validate'
import { loadRaw } from '../scripts/lib/load-raw'

const TODAY = '2026-09-27'
const FIXTURES = 'tests/fixtures/valid'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any

function fixtures(): RawDataset & { candidates: Json; measures: Record<string, Json> } {
  return structuredClone(loadRaw(FIXTURES)) as Json
}

function run(raw: RawDataset, mode: 'prod' | 'fixtures' = 'fixtures') {
  return validateDataset(raw, { mode, today: TODAY })
}

function expectError(raw: RawDataset, pattern: RegExp, mode: 'prod' | 'fixtures' = 'fixtures') {
  const r = run(raw, mode)
  expect(r.dataset).toBeNull()
  expect(r.errors.join('\n')).toMatch(pattern)
}

describe('validateDataset', () => {
  it('accepte les fixtures valides (candidats A et B)', () => {
    const r = run(fixtures())
    expect(r.errors).toEqual([])
    expect(r.warnings).toEqual([])
    expect(r.dataset?.candidates.candidats).toHaveLength(2)
  })

  it('refuse les candidats fictifs en mode prod', () => {
    expectError(fixtures(), /candidat fictif interdit/, 'prod')
  })

  it('accepte un /data vide en prod avec un avertissement', () => {
    const r = run({ candidates: { dateMaj: TODAY, candidats: [] }, measures: {} }, 'prod')
    expect(r.errors).toEqual([])
    expect(r.warnings).toContain('candidates.json : aucun candidat')
  })

  describe('sources', () => {
    it('mesure sans source', () => {
      const d = fixtures()
      d.measures['candidat-a.json'].mesures[0].sourceIds = []
      expectError(d, /a-smic-5 *› *sourceIds|sourceIds : .*/)
    })

    it('source référencée mais inexistante', () => {
      const d = fixtures()
      d.measures['candidat-a.json'].mesures[0].sourceIds = ['inconnue']
      expectError(d, /source "inconnue" introuvable/)
    })

    it('URL mal formée', () => {
      const d = fixtures()
      d.measures['candidat-a.json'].sources[0].url = 'pas une url'
      expectError(d, /URL https valide attendue/)
    })

    it('URL http (non https)', () => {
      const d = fixtures()
      d.measures['candidat-a.json'].sources[0].url = 'http://example.org/x'
      expectError(d, /URL https valide attendue/)
    })

    it('date de consultation manquante', () => {
      const d = fixtures()
      delete d.measures['candidat-a.json'].sources[0].dateConsultation
      expectError(d, /dateConsultation/)
    })

    it('date mal formée', () => {
      const d = fixtures()
      d.measures['candidat-b.json'].sources[0].datePublication = '15/08/2026'
      expectError(d, /date ISO attendue/)
    })

    it('date dans le futur', () => {
      const d = fixtures()
      d.measures['candidat-b.json'].sources[0].dateConsultation = '2027-01-01'
      expectError(d, /dans le futur/)
    })

    it('consultation antérieure à la publication', () => {
      const d = fixtures()
      d.measures['candidat-b.json'].sources[0].dateConsultation = '2026-08-01'
      expectError(d, /antérieure à datePublication/)
    })

    it('avertit quand une source a plus de 90 jours', () => {
      const r = validateDataset(fixtures(), { mode: 'fixtures', today: '2027-01-15' })
      expect(r.errors).toEqual([])
      expect(r.warnings.some((w) => /à revérifier/.test(w))).toBe(true)
    })
  })

  describe('gabarit candidat', () => {
    it('champ obligatoire manquant', () => {
      const d = fixtures()
      delete d.candidates.candidats[0].parti
      expectError(d, /parti/)
    })

    it('champ inconnu refusé (gabarit identique pour tous)', () => {
      const d = fixtures()
      d.candidates.candidats[0].slogan = 'x'
      expectError(d, /slogan/)
    })

    it('fichier de mesures manquant', () => {
      const d = fixtures()
      delete d.measures['candidat-b.json']
      expectError(d, /measures\/candidat-b\.json manquant/)
    })

    it('statut inconnu', () => {
      const d = fixtures()
      d.candidates.candidats[0].statut = 'favori'
      expectError(d, /statut/)
    })

    it('thème ni couvert ni déclaré sans position', () => {
      const d = fixtures()
      d.measures['candidat-a.json'].sansPosition = d.measures['candidat-a.json'].sansPosition.filter(
        (s: Json) => s.theme !== 'sante',
      )
      expectError(d, /thème "sante" ni couvert/)
    })

    it('mesures d’un candidat absent de candidates.json', () => {
      const d = fixtures()
      d.candidates.candidats.pop()
      expectError(d, /candidat "candidat-b" absent/)
    })
  })

  describe('mesures et effets', () => {
    it('mesure chiffrable sans paramètres', () => {
      const d = fixtures()
      d.measures['candidat-a.json'].mesures[0].parametres = null
      expectError(d, /"chiffrable" sans parametres/)
    })

    it('effet chiffré sans ampleur', () => {
      const d = fixtures()
      d.measures['candidat-a.json'].mesures[0].effets[0].ampleur = null
      expectError(d, /"chiffre" sans ampleur/)
    })

    it('effet sans hypothèse', () => {
      const d = fixtures()
      d.measures['candidat-a.json'].mesures[0].effets[0].hypotheses = []
      expectError(d, /hypotheses/)
    })

    it('effet sans périmètre de simulation', () => {
      const d = fixtures()
      delete d.measures['candidat-a.json'].mesures[0].effets[0].perimetreSimulation
      expectError(d, /perimetreSimulation/)
    })

    it('financement absent', () => {
      const d = fixtures()
      delete d.measures['candidat-a.json'].mesures[1].financement
      expectError(d, /financement/)
    })

    it('condition sur un champ de profil inconnu', () => {
      const d = fixtures()
      d.measures['candidat-a.json'].mesures[0].effets[0].cible = { all: [{ champ: 'religion', op: 'eq', valeur: 'x' }] }
      expectError(d, /champ/)
    })

    it('condition avec une valeur invalide', () => {
      const d = fixtures()
      d.measures['candidat-a.json'].mesures[0].effets[0].cible = { all: [{ champ: 'logement', op: 'eq', valeur: 'chateau' }] }
      expectError(d, /valeur "chateau" invalide/)
    })

    it('vocabulaire évaluatif interdit', () => {
      const d = fixtures()
      d.measures['candidat-b.json'].mesures[0].description = 'Une mesure irréaliste de baisse de la CSG.'
      expectError(d, /vocabulaire évaluatif interdit « irréaliste »/)
    })

    it('contradiction avec une seule source', () => {
      const d = fixtures()
      d.measures['candidat-a.json'].mesures[4].contradictions[0].sourceIds = ['a-prog']
      expectError(d, /contradictions/)
    })

    it('id de mesure en double', () => {
      const d = fixtures()
      d.measures['candidat-b.json'].mesures[0].id = 'a-smic-5'
      expectError(d, /id de mesure en double/)
    })
  })
})
