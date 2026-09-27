"""
Construit data/conso/bdf2017.json à partir de sources INSEE publiques (téléchargées à chaque exécution) :
- Enquête Budget de famille 2017, dépenses annuelles moyennes par ménage selon le décile de niveau de vie (TF106)
  et selon le type de ménage (TF105) ;
- Déciles de niveau de vie 2017 (ERFS 2017, tableau DNV01) ;
- Indice des prix à la consommation, base 2015, ensemble des ménages (série 001759970), moyennes 2017 et 2025.

Sert à estimer l'effet des mesures sur les prix (TVA, accises…) qu'OpenFisca-France ne modélise pas.
Usage : python3 scripts/conso/build_bdf.py  (aucune dépendance hors bibliothèque standard, curl requis)
"""
import csv, io, json, re, subprocess, statistics
from datetime import date

UA = 'Mozilla/5.0 (simulateur-presidentielle-2027)'

def get(url):
    return subprocess.run(['curl', '-sL', '--max-time', '60', '-A', UA, url], capture_output=True, check=True).stdout

def table(url):
    rows = list(csv.reader(io.StringIO(get(url).decode('latin1')), delimiter=';'))[1:]
    out = {}
    for code, key, value in rows:
        out.setdefault(code, {})[key] = float(value.replace(',', '.')) if value.strip() not in ('', 's') else None
    return out

TF106 = 'https://www.insee.fr/fr/statistiques/fichier/4648335/TF106.csv'
TF105 = 'https://www.insee.fr/fr/statistiques/fichier/4648335/TF105.csv'
IPC = 'https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/001759970'

# Déciles de niveau de vie 2017 (€/an) : INSEE, ERFS 2017, tableau DNV01 (10e, 20e… 90e centiles).
# Recopiés du fichier irsocerfs2017_DNV01.xls (format .xls non lisible sans dépendance).
DECILES_2017 = [11190, 14060, 16450, 18610, 20820, 23230, 26140, 30270, 38210]

def main():
    dec = table(TF106)
    typ = table(TF105)
    ipc_xml = get(IPC).decode('utf-8', 'replace')
    obs = dict(re.findall(r'TIME_PERIOD="([0-9-]+)"\s+OBS_VALUE="([0-9.]+)"', ipc_xml))
    ipc = {y: round(statistics.mean(float(v) for k, v in obs.items() if k.startswith(y)), 2) for y in ('2017', '2025')}

    depenses = {}
    ratios_type = {}
    for code, values in dec.items():
        if values.get('TOT') in (None, 0):
            continue
        depenses[code] = [values.get(str(i)) for i in range(1, 11)]
        t = typ.get(code, {})
        ratios_type[code] = {k: round(t[k] / values['TOT'], 4) if t.get(k) is not None else None for k in ('1', '2', '3', '4')}

    out = {
        'genereLe': date.today().isoformat(),
        'annee': 2017,
        'decilesNiveauDeVie2017': DECILES_2017,
        'ipc': {'serie': '001759970', 'moyenne2017': ipc['2017'], 'moyenne2025': ipc['2025']},
        'typesMenage': {'1': 'Personne seule', '2': 'Famille monoparentale', '3': 'Couple sans enfant', '4': 'Couple avec enfant(s)'},
        'depensesParDecile': depenses,
        'ratiosTypeMenage': ratios_type,
        'sources': [
            {'id': 'insee-bdf2017-tf106', 'url': 'https://www.insee.fr/fr/statistiques/4648335?sommaire=4648339', 'titre': 'Les dépenses des ménages en France en 2017 — TF106 : dépenses annuelles moyennes selon le niveau de vie', 'editeur': 'Insee', 'datePublication': '2020-09-15', 'dateConsultation': date.today().isoformat(), 'type': 'chiffrage_tiers', 'archiveUrl': None},
            {'id': 'insee-bdf2017-tf105', 'url': 'https://www.insee.fr/fr/statistiques/4648335?sommaire=4648339', 'titre': 'Les dépenses des ménages en France en 2017 — TF105 : dépenses annuelles moyennes selon le type de ménage', 'editeur': 'Insee', 'datePublication': '2020-09-15', 'dateConsultation': date.today().isoformat(), 'type': 'chiffrage_tiers', 'archiveUrl': None},
            {'id': 'insee-erfs2017-dnv01', 'url': 'https://www.insee.fr/fr/statistiques/4262094?sommaire=4261132', 'titre': 'Revenu, niveau de vie et pauvreté en 2017 — DNV01 : distribution des niveaux de vie', 'editeur': 'Insee', 'datePublication': '2020-04-15', 'dateConsultation': date.today().isoformat(), 'type': 'chiffrage_tiers', 'archiveUrl': None},
            {'id': 'insee-ipc-001759970', 'url': 'https://www.insee.fr/fr/statistiques/8726461', 'titre': 'En 2025, nouveau ralentissement des prix à la consommation en moyenne annuelle (IPC base 2015, série 001759970)', 'editeur': 'Insee', 'datePublication': '2026-01-15', 'dateConsultation': date.today().isoformat(), 'type': 'chiffrage_tiers', 'archiveUrl': None},
        ],
    }
    with open('data/conso/bdf2017.json', 'w') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
        f.write('\n')
    print('postes:', len(depenses), 'ipc:', ipc)

if __name__ == '__main__':
    main()
