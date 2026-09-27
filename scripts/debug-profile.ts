/** Affiche le résultat du moteur pour un profil (aide au développement). Usage : npx tsx scripts/debug-profile.ts '<json partiel>' [dossier] */
import { simulate } from '../src/engine'
import type { Profile } from '../src/domain/profile'
import { validateDataset } from '../src/schema/validate'
import { loadRaw } from './lib/load-raw'

const base: Profile = {
  statutPro: 'salarie_prive', ageTranche: '25-34', echelonBourse: null, revenuTranche: 'r2', couple: false,
  revenuConjointTranche: null, enfants: '0', logement: 'locataire_prive', zoneApl: 'zone_3', handicapAAH: false, vehicule: false,
}
const profile = { ...base, ...JSON.parse(process.argv[2] ?? '{}') } as Profile
const r = validateDataset(loadRaw(process.argv[3] ?? 'tests/fixtures/valid'), { mode: 'fixtures', today: new Date().toISOString().slice(0, 10) })
if (!r.dataset) throw new Error(r.errors.join('\n'))
for (const c of simulate(profile, r.dataset)) {
  const fmt = (v: (typeof c.positifs)[number]) =>
    `${v.effetId} [${v.type}] ${v.montant && 'annuel' in v.montant ? v.montant.annuel : ''} ${v.montant?.kind === 'castype' ? JSON.stringify(v.montant.detail) : ''}${v.montant?.kind === 'consommation' ? ` décile ${v.montant.decile} dépense ${v.montant.depense}` : ''}${v.nonChiffreCar ? ' — ' + v.nonChiffreCar : ''}${v.sensDeclare ? ' (déclaré ' + v.sensDeclare + ')' : ''}`
  console.log(`== ${c.candidat.id}`)
  console.log(' +', c.positifs.map(fmt))
  console.log(' -', c.negatifs.map(fmt))
  console.log(' ~', c.autres.map(fmt))
  console.log(' autres mesures', c.autresMesures.map((m) => m.mesureId))
}
