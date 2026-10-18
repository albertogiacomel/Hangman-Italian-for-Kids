# Privacy e pubblicità di Hangman

Hangman è pubblicato su Vercel, su https://hangman.giacomel.info/ . Il proprietario ha cancellato il precedente progetto Google Cloud. Il controllo Google Cloud Build rimasto va scollegato dal repository tramite le [GitHub Apps installate](https://github.com/settings/installations), preservando eventuali altri repository: non ripristinare progetto o service account. La rimozione non è stata eseguita perché manca l'accesso di gestione all'installazione.

## Integrazione attuale

Il proprietario ha scelto AdSense per il portfolio e tutti i sette giochi pubblici individuati. Il modulo condiviso è `public/site-privacy/runtime.js`, generato dal repository videogames-kit con ricevuta SHA256 e commit sorgente. Usa Klaro 0.7.21 ospitato localmente, non un CDN. Espone `/privacy.html`, scelte facoltative inizialmente disattivate e cookie `giacomel_privacy_v1` condiviso con il dominio principale per massimo 180 giorni. Rifiuto e modifica sono disponibili senza azzerare i progressi; il link Preferenze privacy è disponibile anche dalle impostazioni del gioco.

La pronuncia Google AI online richiede la scelta corrispondente e la voce abilitata nelle impostazioni. Senza quella scelta sono disponibili i fallback locali del gioco; le voci del dispositivo sono usate senza chiamate Google AI. I link Google Fonts diventano attivi soltanto dopo la scelta per i caratteri: altrimenti si usano quelli del dispositivo.

## Unità fornita dal proprietario

Publisher `ca-pub-8896739816580918`, slot `5611479310`. `public/ads.txt` contiene:

```text
google.com, pub-8896739816580918, DIRECT, f08c47fec0942fa0
```

Il dominio principale pubblica la stessa riga e i riferimenti ai giochi. L'integrazione predisposta usa sempre `data-tag-for-age-treatment=1`, un solo loader, nessun premio per visualizzazioni o clic, nessun blocco del gioco e nessun codice AMP. No-fill ed errori nascondono lo spazio. Il vecchio AdSense con ID fittizi è stato rimosso.

**Gli annunci live restano disattivati** (`liveAdsEnabled=false`): il proprietario indica il sito Pronto, ma deve ancora configurare il messaggio privacy Google. Per il pannello AdSense usare `giacomel.info` e l'informativa https://www.giacomel.info/privacy.html . Non sono state generate impressioni reali nei test né verificati ricavi. Klaro non è una CMP Google certificata e non pubblica il messaggio nel pannello dell'account. Prima di attivare aggiornare/verificare la configurazione Google e rileggere l'informativa come titolare; il pannello locale non verifica età o consenso genitoriale.

`components/AdBanner.tsx` conserva come alternativa il messaggio sponsor statico; `data/sponsorship.ts` è null e non mostra nulla. Non è uno sponsor reale attivo e non genera ricavi. `project_bundle.yaml` è una fotografia storica: i suoi snippet non sono usati dalla build e non devono essere riutilizzati.

## Verifiche

La build verifica il manifesto privacy oltre al kit. Il kit centrale prova il Klaro reale con scelte, persistenza, revoca, geometria mobile e axe chiaro/scuro; la richiesta pubblicitaria è simulata, senza contattare Google. Restano obbligatori i test di gioco e del sito pubblicato. Le copie generate si aggiornano tramite `scripts/sync-sites.js` del kit con piano e backup.

Fonti: [CHILD AdSense](https://support.google.com/adsense/answer/9009582?hl=en), [CMP](https://support.google.com/adsense/answer/13554116?hl=en), [messaggio europeo](https://support.google.com/adsense/answer/10960768?hl=en), [Klaro](https://github.com/kiprotect/klaro).
