import type { Condition, Predicate } from '../schema/condition'
import { PROFILE_FIELDS, type DerivedProfile } from '../schema/profile'

function rank(champ: Predicate['champ'], v: string | boolean): number {
  return (PROFILE_FIELDS[champ] as readonly (string | boolean)[]).indexOf(v)
}

export function matchesPredicate(p: Predicate, profile: DerivedProfile): boolean {
  const actual = profile[p.champ]
  switch (p.op) {
    case 'eq':
      return actual === p.valeur
    case 'neq':
      return actual !== p.valeur
    case 'in':
      return Array.isArray(p.valeur) && p.valeur.includes(actual as string | boolean)
    case 'gte':
    case 'lte': {
      // Un champ nullable non renseigné (ex. revenu du conjoint si seul·e) ne satisfait aucune comparaison.
      if (actual === null || Array.isArray(p.valeur)) return false
      const a = rank(p.champ, actual)
      const b = rank(p.champ, p.valeur)
      return p.op === 'gte' ? a >= b : a <= b
    }
  }
}

export function matches(condition: Condition, profile: DerivedProfile): boolean {
  if (condition.tous) return true
  if (condition.all) return condition.all.every((p) => matchesPredicate(p, profile))
  if (condition.any) return condition.any.some((p) => matchesPredicate(p, profile))
  return false
}
