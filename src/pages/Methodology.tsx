import { Link } from 'wouter'
import gridJson from '../../data/castypes/grid.json'
import consoJson from '../../data/conso/bdf2017.json'
import { Faq } from '../components/Faq'
import { IconChevronDown } from '../components/icons'
import { TopBar } from '../components/TopBar'
import { Kicker, LINK, SourceLinks, TypeBadge } from '../components/ui'
import { candidates } from '../data/loader'
import { enumerateCells } from '../domain/grid'
import { TERMS } from '../lib/glossary'
import { dateFr, ISSUE_URL, REPO_URL } from '../lib/format'
import type { GridFile } from '../schema/castype'
import type { Source } from '../schema/common'

const grid = gridJson as unknown as GridFile
const consoSources = (consoJson as { sources: Source[] }).sources
const nCells = enumerateCells().length

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="disclosure raised overflow-hidden rounded-2xl">
      <summary className="flex items-center justify-between gap-3 p-4 font-bold text-[var(--ink)]">
        {title}
        <IconChevronDown className="chevron size-4 shrink-0 text-[var(--ink-faint)]" />
      </summary>
      <div className="space-y-3 border-t border-[var(--line)] p-4 pt-3 text-[15px] leading-relaxed text-[var(--ink-soft)]">{children}</div>
    </details>
  )
}

export function Methodology() {
  return (
    <div className="space-y-5 px-5 pb-8 pt-2">
      <TopBar title="Aide" />

      <div>
        <Kicker>Questions fréquentes</Kicker>
        <div className="mt-2">
          <Faq />
        </div>
      </div>

      <div>
        <Kicker>Méthodologie</Kicker>
        <div className="mt-2 space-y-2">
          <Section title="Quels candidat·es ?">
            <p>{candidates.critereAnalyse}</p>
            <p>
              Les statuts (déclaré, pressenti, officiel, retiré) sont datés et sourcés. La liste officielle du Conseil constitutionnel les
              remplacera lorsqu'elle sera publiée.
            </p>
          </Section>

          <Section title="Quelles mesures ?">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Programme officiel quand il existe ; sinon déclarations publiques datées, rapportées par des médias identifiés.</li>
              <li>Chaque mesure a au moins une source (lien, date de publication, date de consultation). Sans source, elle n'apparaît pas.</li>
              <li>Les mesures sont paraphrasées, jamais recopiées ; le lien renvoie au texte exact.</li>
              <li>Pour chaque thème et chaque candidat·e : soit des mesures, soit « aucune position identifiée » avec la date de recherche.</li>
              <li>Quand deux sources se contredisent, les deux versions sont affichées : nous ne tranchons pas.</li>
            </ul>
          </Section>

          <Section title="Trois types d'effets">
            <div className="grid gap-2.5">
              <div className="raised space-y-1.5 rounded-xl p-3.5">
                <TypeBadge type="chiffre" />
                <p className="text-sm">La mesure est assez précise (montant, taux) pour être calculée pour ton profil.</p>
              </div>
              <div className="raised space-y-1.5 rounded-xl p-3.5">
                <TypeBadge type="qualitatif" />
                <p className="text-sm">L'effet est clair mais ne peut pas être converti en euros.</p>
              </div>
              <div className="raised space-y-1.5 rounded-xl p-3.5">
                <TypeBadge type="flou" />
                <p className="text-sm">La mesure n'est pas assez précise pour être simulée.</p>
              </div>
            </div>
            <p>Dans le doute, une mesure est classée qualitative ou floue : aucun chiffre n'est inventé.</p>
          </Section>

          <Section title="Comment sont calculés les montants ?">
            <p>
              Impôts, cotisations et prestations sont calculés avec{' '}
              <a href="https://openfisca.org/fr/" className={LINK} target="_blank" rel="noopener noreferrer">
                OpenFisca-France
              </a>{' '}
              (version {grid.openfiscaFrance}, législation {grid.legislation}). Le calcul est fait à l'avance pour {nCells.toLocaleString('fr-FR')}{' '}
              situations types. Ton navigateur choisit la situation qui correspond à tes réponses : rien n'est calculé sur un serveur.
            </p>
            <div className="raised space-y-2 rounded-xl p-3.5">
              <p className="font-semibold text-[var(--ink)]">Hypothèses communes à tous les montants calculés</p>
              <ul className="list-disc space-y-1 pl-5">
                {grid.hypothesesCommunes.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
            <SourceLinks sources={grid.sources} />
          </Section>

          <Section title="TVA, carburants, énergie">
            <p>
              OpenFisca ne modélise pas la consommation. Ces mesures sont estimées à partir des dépenses réelles des ménages de ton décile de
              niveau de vie (enquête Budget de famille de l'INSEE), ramenées en prix 2025. Sans voiture, les dépenses de carburant comptent pour
              zéro.
            </p>
            <SourceLinks sources={consoSources} />
          </Section>

          <Section title="Limites connues">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Les effets sur l'emploi, les prix ou les comportements ne sont pas modélisés.</li>
              <li>Les retraites futures ne sont pas chiffrées : OpenFisca ne simule pas une carrière.</li>
              <li>Les indépendant·es n'obtiennent pas de montant OpenFisca : leur revenu n'est pas encore calculé de façon fiable.</li>
              <li>Les revenus sont des tranches : le montant correspond au milieu de ta tranche, pas à ton revenu exact.</li>
              <li>Les mesures réservant des aides aux ressortissant·es français·es sont décrites sans être chiffrées.</li>
              <li>Les données de consommation datent de 2017 (dernière enquête publiée).</li>
            </ul>
          </Section>
        </div>
      </div>

      <div>
        <Kicker>Glossaire</Kicker>
        <div className="raised mt-2 divide-y divide-[var(--line)] rounded-2xl">
          {Object.entries(TERMS).map(([term, def]) => (
            <div key={term} className="p-3.5">
              <p className="font-bold text-[var(--ink)]">{term}</p>
              <p className="text-sm text-[var(--ink-soft)]">{def}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm text-[var(--ink-soft)]">
        <Link href="/neutralite" className={LINK}>
          Neutralité et vie privée
        </Link>{' '}
        — détail des règles appliquées et gestion de tes données.
      </p>

      <p className="text-sm text-[var(--ink-soft)]">
        Une erreur ou une source manquante ?{' '}
        <a href={ISSUE_URL} className={LINK} target="_blank" rel="noopener noreferrer">
          Ouvre un signalement
        </a>
        . Code et données publics :{' '}
        <a href={REPO_URL} className={LINK} target="_blank" rel="noopener noreferrer">
          dépôt GitHub
        </a>
        . Précalcul généré le {dateFr(grid.genereLe)}.
      </p>
    </div>
  )
}
