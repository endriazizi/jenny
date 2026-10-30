# Avatar cliente Jenny Nails Studio

La lista Clienti e la scheda Cliente sono componenti del backoffice Angular ENEA (`enea-fe`), non del sito pubblico Astro.

Il componente `JennyCustomerAvatarComponent` usa caricamento lazy all'ingresso nel viewport, cache in memoria limitata a 150 clienti, deduplicazione delle richieste simultanee, TTL di cinque minuti per immagini presenti e 30 secondi per avatar assenti. Le foto sono caricate tramite API autenticata e memorizzate sul database ENEA, non sulla CDN del sito pubblico. Il clic su un avatar disponibile apre una finestra di ingrandimento accessibile, chiudibile tramite pulsante, Escape o sfondo.

La pubblicazione Astro non distribuisce il backoffice Angular: dopo gli aggiornamenti di `enea-fe/main` serve una build e distribuzione FE separata. Non esporre immagini clienti in pagine pubbliche.
