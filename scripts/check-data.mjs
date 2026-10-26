// Blocca la pubblicazione se mancano i dati minimi del salone (controlla il sito compilato in dist/).
// Non inventiamo dati: finché non ci sono, il sito si compila ma non va online.
import fs from 'node:fs';

const read = (p) => fs.readFileSync(`dist/${p}`, 'utf8');
const home = read('index.html');
const privacy = read('privacy/index.html');
const errors = [];

if (home.includes('Anteprima grafica')) errors.push('build di anteprima (PUBLIC_ANTEPRIMA=1): non si pubblica');
if (!/href="(tel:|https:\/\/wa\.me\/)/.test(home)) errors.push('manca telefono o WhatsApp (src/data/site.ts)');
if (privacy.includes('[titolare da completare]')) errors.push('manca il titolare in privacy (legalName in src/data/site.ts)');

if (errors.length) {
  for (const e of errors) console.error(`::error::${e}`);
  process.exit(1);
}
console.log('Dati minimi presenti: si può pubblicare.');
