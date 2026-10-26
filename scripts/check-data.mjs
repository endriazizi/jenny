// Blocca la pubblicazione (senza far fallire la build) se mancano i dati minimi del salone (controlla il sito compilato in dist/).
// Non inventiamo dati: finché non ci sono, il sito si compila ma non va online.
import fs from 'node:fs';

const read = (p) => fs.readFileSync(`dist/${p}`, 'utf8');
const home = read('index.html');
const privacy = read('privacy/index.html');
const errors = [];

if (home.includes('Anteprima grafica')) errors.push('build di anteprima (PUBLIC_ANTEPRIMA=1): non si pubblica');
if (!/href="(tel:|https:\/\/wa\.me\/)/.test(home)) errors.push('manca telefono o WhatsApp (src/data/site.ts)');
// Titolare mancante: avviso, ma non blocca (in privacy compare il nome del salone).
if (privacy.includes('data-titolare="mancante"')) console.log('::warning::Privacy: manca il titolare (legalName in src/data/site.ts)');

// Su GitHub Actions scrive ready=true/false: la build resta verde, ma senza dati non si pubblica.
const out = process.env.GITHUB_OUTPUT;
if (out) fs.appendFileSync(out, `ready=${errors.length ? 'false' : 'true'}\n`);
if (errors.length) {
  for (const e of errors) console.log(`::warning::Sito NON pubblicato: ${e}`);
  if (!out) process.exit(1);
} else {
  console.log('Dati minimi presenti: si può pubblicare.');
}
