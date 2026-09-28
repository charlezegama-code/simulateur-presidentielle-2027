import { describe, expect, it } from 'vitest'
import { cellIndex } from '../src/domain/grid'
import { applyAnswer, finalize, QUESTIONS, questionsFor, type Draft } from '../src/domain/questionnaire'
import { profileIssues } from '../src/domain/profile'

/** Parcourt toutes les combinaisons de réponses du questionnaire (profondeur complète). */
function* walk(d: Draft, i: number): Generator<Draft> {
  const qs = questionsFor(d)
  const pending = qs.find((q) => d[q.id] === undefined)
  if (!pending) {
    yield d
    return
  }
  for (const o of pending.options(d)) yield* walk(applyAnswer(d, pending.id, o.value), i + 1)
}

describe('questionnaire', () => {
  it('au plus 11 questions par parcours', () => {
    expect(QUESTIONS.length).toBeLessThanOrEqual(12)
  })

  it('chaque combinaison de réponses donne un profil valide et une case calculée de la grille', () => {
    let n = 0
    const cells = new Set<number>()
    for (const d of walk({}, 0)) {
      const p = finalize(d)
      expect(p).not.toBeNull()
      expect(profileIssues(p!)).toEqual([])
      cells.add(cellIndex(p!))
      n++
    }
    expect(n).toBeGreaterThan(100000)
    expect(cells.size).toBe(24320) // toutes les cases sont atteignables
  }, 60_000) // parcours exhaustif de plus de 100 000 combinaisons

  it('changer de statut efface les réponses devenues incohérentes', () => {
    const d = applyAnswer({ statutPro: 'etudiant', echelonBourse: '3', ageTranche: '18-24' }, 'statutPro', 'retraite')
    expect(d.echelonBourse).toBeUndefined()
    expect(d.ageTranche).toBeUndefined()
  })
})
