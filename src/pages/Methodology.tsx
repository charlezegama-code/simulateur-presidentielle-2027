import gridJson from '../../data/castypes/grid.json'
import consoJson from '../../data/conso/bdf2017.json'
import { H1, H2, SourceLinks } from '../components/ui'
import { candidates } from '../data/loader'
import { enumerateCells } from '../domain/grid'
import { dateFr, ISSUE_URL, REPO_URL } from '../lib/format'
import type { GridFile } from '../schema/castype'
import type { Source } from '../schema/common'

const grid = gridJson as unknown as GridFile
const consoSources = (consoJson as { sources: Source[] }).sources
const nCells = enumerateCells().length

export function Methodology() {
  return (
    <div className="space-y-4">
      <H1>Méthodologie</H1>

      <H2>1. Quels candidat·es ?</H2>
      <p>{candidates.critereAnalyse}</p>
      <p>
        Les statuts (déclaré, pressenti, officiel, retiré) sont datés et sourcés. La liste officielle du Conseil constitutionnel les remplacera
        lorsqu’elle sera publiée.
      </p>

      <H2>2. Quelles mesures ?</H2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Programme officiel quand il existe ; sinon déclarations publiques datées, rapportées par des médias identifiés.</li>
        <li>Chaque mesure a au moins une source (lien, date de publication, date de consultation). Sans source, elle n’apparaît pas.</li>
        <li>Les mesures sont paraphrasées, jamais recopiées ; le lien renvoie au texte exact.</li>
        <li>
          Pour chaque thème et chaque candidat·e : soit des mesures, soit la mention « aucune position identifiée » avec la date de recherche.
          Cela signifie que nous n’avons rien trouvé de précis à cette date, pas que le candidat n’a aucune idée sur le sujet.
        </li>
        <li>Quand deux sources se contredisent, les deux versions sont affichées : nous ne tranchons pas.</li>
      </ul>

      <H2>3. Trois types d’effets</H2>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Chiffré</strong> : la mesure est assez précise (montant, taux) pour être calculée pour ton profil.
        </li>
        <li>
          <strong>Qualitatif</strong> : l’effet est clair (par exemple « départ possible plus tôt ») mais ne peut pas être converti en euros.
        </li>
        <li>
          <strong>Flou</strong> : la mesure n’est pas assez précise pour être simulée (par exemple « baisser les impôts des classes moyennes » sans
          barème).
        </li>
      </ul>
      <p>Dans le doute, une mesure est classée qualitative ou floue : aucun chiffre n’est inventé.</p>

      <H2>4. Comment sont calculés les montants ?</H2>
      <p>
        Impôts, cotisations et prestations sont calculés avec{' '}
        <a href="https://openfisca.org/fr/" className="underline" target="_blank" rel="noopener noreferrer">
          OpenFisca-France
        </a>{' '}
        (version {grid.openfiscaFrance}, législation {grid.legislation}), le moteur de calcul socio-fiscal libre maintenu par l’administration.
        Le calcul est fait à l’avance pour {nCells.toLocaleString('fr-FR')} situations types, une par combinaison de réponses au questionnaire.
        Ton navigateur choisit simplement la situation qui correspond à tes réponses : rien n’est calculé sur un serveur.
      </p>
      <p className="font-medium">Hypothèses communes à tous les montants calculés :</p>
      <ul className="list-disc space-y-1 pl-5">
        {grid.hypothesesCommunes.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
      <SourceLinks sources={grid.sources} />

      <H2>5. TVA, carburants, énergie</H2>
      <p>
        OpenFisca ne modélise pas la consommation. Pour ne pas avantager les programmes qui jouent sur les revenus plutôt que sur les prix, les
        mesures de TVA ou de taxes sur l’énergie sont estimées à partir des dépenses réelles des ménages de ton décile de niveau de vie et de ton
        type de foyer (enquête Budget de famille de l’INSEE), ramenées en prix 2025. Hypothèses : quantités consommées inchangées et baisse ou
        hausse de taxe intégralement répercutée sur les prix. Sans voiture, les dépenses de carburant comptent pour zéro.
      </p>
      <SourceLinks sources={consoSources} />

      <H2>6. Limites connues</H2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Les effets sur l’emploi, les prix ou les comportements ne sont pas modélisés.</li>
        <li>Les retraites futures ne sont pas chiffrées : OpenFisca ne simule pas une carrière.</li>
        <li>Les indépendant·es (micro-entrepreneur·es) n’obtiennent pas de montant OpenFisca : leur revenu n’est pas encore calculé de façon fiable.</li>
        <li>Les revenus sont des tranches : le montant correspond au milieu de ta tranche, pas à ton revenu exact.</li>
        <li>La nationalité n’est pas demandée : les mesures réservant des aides aux ressortissant·es français·es sont décrites sans être chiffrées.</li>
        <li>Les données de consommation datent de 2017 (dernière enquête publiée).</li>
        <li>Beaucoup de programmes ne sont pas encore publiés en entier : les données sont mises à jour jusqu’au premier tour.</li>
      </ul>

      <H2>7. Signaler une erreur</H2>
      <p>
        Une mesure mal résumée, une source morte, une mesure manquante ?{' '}
        <a href={ISSUE_URL} className="underline" target="_blank" rel="noopener noreferrer">
          Ouvre un signalement
        </a>{' '}
        avec la source correcte. Le code et les données sont publics :{' '}
        <a href={REPO_URL} className="underline" target="_blank" rel="noopener noreferrer">
          dépôt GitHub
        </a>
        . Précalcul généré le {dateFr(grid.genereLe)}.
      </p>
    </div>
  )
}
