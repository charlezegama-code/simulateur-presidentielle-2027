/**
 * Vérifie le build (dist/) : aucune API d'envoi de données hors du site.
 * - pas de sendBeacon, XMLHttpRequest, WebSocket, EventSource, outils d'analytics ;
 * - chaque fetch du code applicatif vise un chemin relatif au site ("/data/…").
 * La CSP (public/_headers, connect-src 'self') bloque en plus toute connexion externe à l'exécution.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = 'dist/assets'
const files = readdirSync(dir).filter((f) => f.endsWith('.js'))
const forbidden = [/sendBeacon/, /new XMLHttpRequest/, /new WebSocket/, /new EventSource/, /googletagmanager|gtag\(|google-analytics|plausible|matomo|segment\.io|hotjar/i]
const errors: string[] = []
let fetches = 0
for (const f of files) {
  const code = readFileSync(join(dir, f), 'utf8')
  for (const re of forbidden) if (re.test(code)) errors.push(`${f} : motif interdit ${re}`)
  fetches += (code.match(/\bfetch\(/g) ?? []).length
  for (const m of code.matchAll(/fetch\(\s*["'`](https?:)?\/\//g)) errors.push(`${f} : fetch vers une URL externe (${m[0]})`)
}
const headers = readFileSync('dist/_headers', 'utf8')
if (!/connect-src 'self'/.test(headers)) errors.push("dist/_headers : CSP connect-src 'self' absente")
if (errors.length) {
  for (const e of errors) console.error(`❌ ${e}`)
  process.exit(1)
}
console.log(`✅ check-bundle : ${files.length} fichier(s) JS, ${fetches} appel(s) fetch, tous vers le site ; CSP connect-src 'self'`)
