# Spec UX — refonte structurelle

Remplace la V3 (restylage de couleurs sur une structure de « liste de cartes ») par une nouvelle structure
d'écrans. Mobile d'abord (390×844 comme référence) ; sur desktop, une colonne centrée max 480px — pas de mise en
page desktop élargie séparée.

Règle transverse : **aucun lien de navigation textuel en haut d'écran**, ni sur mobile ni sur desktop. Le haut de
chaque écran ne montre que le titre de l'écran et, si besoin, une flèche retour ou une icône d'action (profil, ⓘ).
La navigation entre les 4 sections principales passe uniquement par la bottom tab bar.

## Navigation globale

Bottom tab bar fixe, 4 icônes + label court : **Résultat · Comparer · Candidats · Aide**. Visible sur toutes les
tailles d'écran (pas de bascule vers un menu horizontal en desktop — cohérence, un seul pattern de nav à maintenir).
État actif : icône + label en accent, poids de trait plus épais. `env(safe-area-inset-bottom)` pour l'encoche.

## 1. Accueil

**Contenu** : une phrase d'intro (ce que l'app fait, en une ligne), un gros bouton primaire « Commencer », une
ligne secondaire « 3 min · rien n'est enregistré ». Pas de hero illustré, pas de 3 cartes explicatives empilées.

**Hiérarchie** : phrase → bouton → ligne secondaire, verticalement centré dans le tiers supérieur/moyen de l'écran.
Une icône ⓘ en haut à droite (à la place d'un bandeau d'avertissement pleine largeur) ouvre une feuille modale avec
l'avertissement complet (pas une consigne de vote, simulation indicative, sources datées). Une mention discrète du
même avertissement reste en pied de page, en texte ≥14px (jamais plus petit), pour rester visible sans clic à qui
scrolle.

**Interactions** : tap « Commencer » → `/questionnaire`. Tap ⓘ → feuille modale (fermeture par balayage vers le bas,
tap en dehors, ou croix). Pas de scroll nécessaire pour voir l'essentiel (test des 5 secondes).

## 2. Questionnaire

**Contenu** : une question par écran (jamais deux). Options en grandes tuiles (pas de radio + label texte à plat),
chacune avec une icône représentative de l'option. Progression en segments en haut (un segment par question du
parcours courant, rempli jusqu'à l'étape en cours). Lien texte discret « Pourquoi cette question ? » sous le titre,
ouvrant une feuille modale avec la justification (à quoi sert la réponse dans le calcul).

**Hiérarchie** : segments de progression → titre de la question → tuiles d'options → (lien retour en bas à gauche
sous forme de flèche, pas de bouton « Suivant »).

**Interactions** : un tap sur une tuile sélectionne **et avance automatiquement** à la question suivante (pas de
bouton de validation séparé). Transition en glissement horizontal (slide) entre questions, dans le sens de la
navigation (avance = glisse vers la gauche, retour = vers la droite). Flèche retour en haut à gauche pour revenir à
la question précédente sans perdre les réponses suivantes déjà données. État "pressed" visible au tap (scale-down
bref) avant la transition.

## 3. Résultat

**Contenu** :
- Puce de profil en haut, résumé court et lisible (ex. « Étudiant · Paris · locataire »), pas une ligne de points
  médians concaténant tous les champs bruts du formulaire — un résumé à 2-3 éléments les plus pertinents. Tap sur la
  puce → retour au récap du questionnaire pour modifier une réponse.
- Sélecteur à deux segments : **Par thème** (par défaut) / **Par candidat**.

**Par thème (vue par défaut)** :
- Rangée de pastilles de thèmes en défilement horizontal, thèmes qui concernent le profil affichés en premier
  (ordre déterminé par la présence d'un effet chiffré ou qualitatif pertinent, pas alphabétique).
- Sous la pastille sélectionnée : une ligne par candidat·e, toutes de même hauteur — avatar rond, nom, une phrase
  descriptive courte (ex. « SMIC porté à 1 600 € net »), puis un montant en gros caractères tabulaires à droite
  (ex. « +85 €/mois »). Si l'effet n'est pas chiffrable : pictogramme (≠ montant) + « non chiffré » ou « trop flou »
  selon le type d'effet, jamais une case vide.
- Tap sur une ligne → feuille modale avec le détail : hypothèses retenues, limites/périmètre de la simulation,
  source (lien + date de consultation).

**Par candidat** : pager horizontal (swipe), un·e candidat·e par écran plein, même gabarit d'avatar/nom en tête,
puis les effets groupés en 3 sections : **Avantages / Désavantages / Incertain** (au lieu d'une liste plate). Jamais
un total isolé du type « 8 avantages » sans contexte — toujours formulé « x sur N mesures analysées pour ton
profil », pour ne pas se lire comme un classement basé sur le volume de mesures collectées (qui varie par
candidat·e indépendamment du programme réel).

**Vérification imposée** : le premier écran de Résultat (sans scroll) doit montrer au moins un montant en €.

## 4. Comparer

Indépendant du profil (pas de calcul personnalisé). Mêmes composants que la vue « Par thème » de Résultat :
pastilles de thèmes en défilement horizontal, puis une ligne par candidat·e pour le thème sélectionné, même feuille
modale de détail au tap. Pas de vue « par candidat » ici (redondante avec la page Candidats).

## 5. Candidats

**Contenu** : grille d'avatars ronds (2-3 colonnes selon largeur), même gabarit pour tous — cadrage carré centré sur
le visage, identique quelle que soit la photo source ; initiales dans le même rond (même couleur d'accent unique)
quand il n'y a pas de photo. Les 7 candidat·es analysé·es en premier, les autres repliés sous un intitulé « Pas
encore analysés » (accordéon ou bouton « Afficher les X autres »).

**Interactions** : tap sur un avatar → feuille modale avec statut de candidature, date du statut (« date non
précisée » si la date réelle est inconnue — jamais la date de mise à jour de la liste de données affichée à sa
place), lien vers la fiche complète / les sources.

## 6. Aide

**Contenu**, dans cet ordre : FAQ d'abord (déjà rédigée, réutilisée telle quelle côté contenu), puis méthodologie en
sections repliables (une section = un sujet : sources, neutralité, limites du moteur de calcul), puis un glossaire
des termes utilisés (ex. « effet chiffrable », « périmètre de simulation », « type flou »).

## Style transverse

- Icônes SVG maison, cohérentes en trait/poids sur tout l'écran (pas de mélange de styles d'icônes).
- Texte courant ≥16px ; aucun gris en dessous de 14px, aucune paire texte/fond sous le seuil AA.
- Un seul accent (violet, inchangé — cf. CLAUDE.md « Couleurs »), pas de deuxième teinte de marque.
- Chiffres en graisse tabulaire (`font-variant-numeric: tabular-nums`) partout où un montant est affiché, pour
  l'alignement en colonne dans les listes.
- Transitions courtes : glissement entre questions, ouverture en feuille modale (slide-up) pour les détails, état
  pressed visible sur tout élément tapable.

**Interdits explicites** (présents dans la V3, à ne pas reproduire) : carte à fine bordure + lien souligné
« Voir le détail → », accordéon à icône +/×, mur de texte en liste `<dl>` plate, bandeau d'avertissement pleine
largeur en tête de page, profil résumé en une ligne de points médians concaténant tous les champs bruts.

## Neutralité (rappel, s'applique à cette structure)

- Même gabarit, même taille, même traitement d'avatar pour tou·tes les candidat·es sans exception.
- Jamais un compte brut isolé de type « X avantages » sans dénominateur — toujours rapporté au nombre total de
  mesures analysées pour ce profil.
- « Déclaré depuis » (ou équivalent statut) : date réelle si connue, sinon « date non précisée » explicitement —
  jamais substituée silencieusement par la date de mise à jour des données.
- Photo de Retailleau à revérifier/recadrer : fond actuel montrant du bleu et du rouge en arrière-plan, à remplacer
  par un fond neutre uni comme les autres candidat·es.
