import { data } from './data/loader'

// Écran provisoire : l'UI est construite à l'étape 5.
export default function App() {
  return (
    <main className="mx-auto max-w-xl px-4 py-8 text-slate-900 dark:text-slate-100">
      <h1 className="text-2xl font-bold">Simulateur Présidentielle 2027</h1>
      <p className="mt-2 text-sm">
        En construction. Données : {data.candidates.candidats.length} candidat(s), mise à jour du {data.meta.dateMaj}.
      </p>
    </main>
  )
}
