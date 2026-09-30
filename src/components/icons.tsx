import type { SVGProps } from 'react'

/**
 * Bibliothèque d'icônes de l'app. Règle stricte : deux concepts différents ne partagent jamais le même
 * pictogramme (ex. le logo, « Fonctionnaire » et le badge « Qualitatif » utilisaient tous les trois une maison
 * dans la V3 — corrigé ici). Un même concept peut réutiliser la même icône partout (ex. Oui/Non).
 */
function base(props: SVGProps<SVGSVGElement>) {
  return { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, ...props }
}

export function IconBack(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M15 19l-7-7 7-7" />
    </svg>
  )
}

export function IconInfo(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16.5" />
      <circle cx="12" cy="7.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconClose(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function IconChevronDown(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function IconChevronRight(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

export function IconExternal(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M9 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-3" />
      <path d="M14 4h6v6M20 4l-9 9" />
    </svg>
  )
}

/** Marque de l'app (accueil) : deux formes qui se recouvrent, pour « comparer », sans référence à un logo existant. */
export function IconCompareMark(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <rect x="3.5" y="7.5" width="12" height="12" rx="3.5" />
      <rect x="8.5" y="4.5" width="12" height="12" rx="3.5" opacity="0.55" />
    </svg>
  )
}

export function IconChecklist(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2" />
      <path d="M8 8h8M8 11.5h8" />
      <path d="M8.5 15.3l1.6 1.6L14 13.2" />
    </svg>
  )
}

export function IconBars(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M6 20V10M12 20V4M18 20V14" />
    </svg>
  )
}

export function IconPeople(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="8" r="3.3" />
      <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    </svg>
  )
}

export function IconHelp(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.4 9.3a2.7 2.7 0 015.2.9c0 1.8-2.6 2-2.6 3.8" />
      <circle cx="12" cy="16.9" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Badge « Chiffré » : une pièce, pour l'idée de montant en euros. */
export function IconCoin(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.8 9.3a2.6 2.6 0 100 5.4M9 11.4h3.3" />
    </svg>
  )
}

/** Badge « Qualitatif » : une page à lignes droites, pour l'idée de description en langage courant. */
export function IconDocLines(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M6 3.5h9l3 3v14a1 1 0 01-1 1H6a1 1 0 01-1-1v-16a1 1 0 011-1z" />
      <path d="M8.5 11h7M8.5 14.5h7M8.5 18h4" />
    </svg>
  )
}

/** Badge « Flou » : lignes ondulées (brume), pour l'idée d'imprécision — jamais le même tracé que Qualitatif. */
export function IconFog(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M4 9c1-1.6 3-1.6 4 0s3 1.6 4 0 3-1.6 4 0 3 1.6 4 0" />
      <path d="M4 14.5c1-1.6 3-1.6 4 0s3 1.6 4 0 3-1.6 4 0 3 1.6 4 0" />
      <path d="M4 20c1-1.6 3-1.6 4 0s3 1.6 4 0 3-1.6 4 0 3 1.6 4 0" />
    </svg>
  )
}

export function IconArrowUp(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  )
}

export function IconArrowDown(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  )
}

/** Effet « incertain » : flèche ondulée, distincte du badge Flou (arrangement différent) et du reste. */
export function IconWaver(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M3 12c2-3 4 3 6 0s4 3 6 0 4 3 6 0" />
    </svg>
  )
}

export function IconCheckCircle(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.3 12.3l2.4 2.4 5-5.2" />
    </svg>
  )
}

export function IconXCircle(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
    </svg>
  )
}

// --- Tuiles « situation principale » (8 icônes distinctes, aucune répétée) -------------------------------------

export function IconCap(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M22 10L12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />
    </svg>
  )
}

/** Alternance : cycle (aller-retour étude/travail), jamais la mallette utilisée pour « salarié ». */
export function IconCycle(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M4 12a8 8 0 0113.6-5.7M20 12a8 8 0 01-13.6 5.7" />
      <path d="M17 3v4h-4M7 21v-4h4" />
    </svg>
  )
}

export function IconBriefcase(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
      <path d="M8.5 7.5V5.5a2 2 0 012-2h3a2 2 0 012 2v2" />
    </svg>
  )
}

/** Fonctionnaire : bâtiment public à colonnes, jamais la maison utilisée ailleurs. */
export function IconColumns(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M3 9.5L12 4l9 5.5" />
      <path d="M4.5 9.5v9.5M8 9.5v9.5M12 9.5v9.5M16 9.5v9.5M19.5 9.5v9.5" />
      <path d="M3 19.5h18" />
    </svg>
  )
}

export function IconLaptop(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <rect x="5" y="5" width="14" height="9.5" rx="1.2" />
      <path d="M2.5 18.5h19l-1.7-3H4.2z" />
    </svg>
  )
}

export function IconSearch(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.3-4.3" />
    </svg>
  )
}

export function IconClock(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.3 3.3" />
    </svg>
  )
}

export function IconMinusCircle(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </svg>
  )
}
