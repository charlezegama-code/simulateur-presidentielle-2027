import type { Condition, Predicate } from '../schema/condition'
import { ORDERS, type DerivedProfile } from '../domain/profile'

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
      const order = ORDERS[p.champ]
      // Valeur absente ou hors de l'ordre (ex. « non boursier ») : aucune comparaison n'est satisfaite.
      if (!order || typeof actual !== 'string' || typeof p.valeur !== 'string') return false
      const a = order.indexOf(actual)
      const b = order.indexOf(p.valeur)
      if (a < 0 || b < 0) return false
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
