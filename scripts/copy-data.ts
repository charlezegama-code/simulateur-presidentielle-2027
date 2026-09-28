/**
 * Copie les données volumineuses (précalcul OpenFisca, consommation INSEE) dans public/data pour qu'elles soient
 * servies en fichiers statiques. Tous les visiteurs téléchargent les mêmes fichiers : le profil n'est jamais transmis.
 */
import { cpSync, mkdirSync, rmSync } from 'node:fs'

rmSync('public/data', { recursive: true, force: true })
mkdirSync('public/data', { recursive: true })
cpSync('data/castypes', 'public/data/castypes', { recursive: true })
cpSync('data/conso', 'public/data/conso', { recursive: true })
console.log('données copiées dans public/data')
