import { Link } from 'wouter'
import { meta } from '../data/loader'
import { dateFr, ISSUE_URL } from '../lib/format'

const LINK = 'font-medium text-[var(--accent-strong)] underline decoration-[var(--line-strong)] underline-offset-3 hover:decoration-[var(--accent)]'

function Item({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <details className="group/faq card overflow-hidden">
      <summary className="flex cursor-pointer select-none list-none items-center justify-between gap-3 p-4 font-semibold text-[var(--ink)] marker:content-none">
        {q}
        <span
          aria-hidden="true"
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] transition-transform duration-200 group-open/faq:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="space-y-2 border-t border-[var(--line)] p-4 pt-3 text-sm leading-relaxed text-[var(--ink-soft)]">{a}</div>
    </details>
  )
}

export function Faq() {
  return (
    <div className="space-y-3">
      <Item
        q="Pourquoi certains candidats n'ont aucune position ?"
        a={
          <>
            <p>
              L'app analyse en détail {7} programmes pour l'instant, parmi les candidatures déclarées ou pressenties (liste complète sur{' '}
              <Link href="/candidats" className={LINK}>
                Candidats
              </Link>
              ). Les autres n'ont pas encore été traités — ce n'est pas un jugement sur leur programme, juste un travail pas encore fait.
            </p>
            <p>
              Pour un candidat déjà analysé, si un thème n'affiche aucune mesure, c'est qu'on n'a rien trouvé de précis à cette date : ça ne veut
              pas dire que le candidat n'a pas de position sur le sujet.
            </p>
          </>
        }
      />
      <Item
        q="Mes réponses sont-elles envoyées quelque part ?"
        a={
          <>
            <p>
              Non. Ton profil est calculé et gardé uniquement dans ton navigateur — en mémoire le temps de ta visite, ou dans le stockage local de
              l'appareil si tu coches « se souvenir ». Aucune requête réseau ne contient tes réponses ; c'est vérifié automatiquement à chaque mise
              en ligne du site.
            </p>
            <p>
              Détails sur{' '}
              <Link href="/neutralite" className={LINK}>
                Neutralité et vie privée
              </Link>
              .
            </p>
          </>
        }
      />
      <Item
        q="Comment vous choisissez les sources ?"
        a={
          <p>
            Le programme officiel du candidat en priorité ; à défaut, une déclaration publique datée, rapportée par un média identifiable. Chaque
            mesure affichée a au moins un lien vérifiable, avec sa date de publication et la date à laquelle on l'a consultée. Sans source, la
            mesure n'entre pas dans l'app : c'est bloqué techniquement, pas seulement une intention.
          </p>
        }
      />
      <Item
        q="Un chiffre est faux ou une source est morte, comment signaler ?"
        a={
          <p>
            Utilise{' '}
            <a href={ISSUE_URL} target="_blank" rel="noopener noreferrer" className={LINK}>
              Signaler une erreur
            </a>{' '}
            (en bas de chaque page) : ça ouvre un formulaire pré-rempli où tu peux coller la source correcte. On corrige et on republie.
          </p>
        }
      />
      <Item
        q="C'est à jour jusqu'à quand ?"
        a={
          <p>
            Les données sont mises à jour au fil des annonces des candidats, jusqu'au premier tour (18 avril 2027). Dernière mise à jour :{' '}
            {dateFr(meta.dateMaj)}, visible en bas de chaque page.
          </p>
        }
      />
    </div>
  )
}
