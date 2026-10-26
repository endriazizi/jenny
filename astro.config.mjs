import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Dominio del sito: impostalo con la variabile SITE_URL (GitHub → Settings → Variables)
// quando il dominio è deciso. Senza, la build usa l'indirizzo provvisorio qui sotto.
const site = process.env.SITE_URL || 'https://jenny.milloshi.it';

export default defineConfig({
  site,
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
});
