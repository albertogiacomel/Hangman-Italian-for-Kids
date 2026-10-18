# Sponsorizzazioni di Hangman

Hangman è pubblicato su Vercel. Il proprietario ha confermato che il precedente progetto Google Cloud è stato cancellato. Il controllo Google Cloud Build rimasto su GitHub è quindi un'integrazione obsoleta: non ripristinare progetto o service account. Aprire [le GitHub Apps installate](https://github.com/settings/installations), configurare Google Cloud Build e rimuovere l'accesso al solo repository Hangman; se l'installazione è condivisa, preservare gli altri repository. Seguire la [documentazione GitHub sulle app installate](https://docs.github.com/en/apps/using-github-apps/reviewing-and-modifying-installed-github-apps). La rimozione richiede accesso alle impostazioni dell'installazione e non è stata eseguita: le credenziali API disponibili non hanno l'autorizzazione necessaria. Dopo la rimozione verificare che un nuovo commit produca i soli controlli previsti; gli errori sui commit storici possono restare visibili.

## Scelta attuale

Usare uno sponsor scelto manualmente, con un messaggio fisso pertinente all'apprendimento. La sponsorizzazione diretta è una proposta commerciale, non una garanzia di guadagno. Il compenso dipende dall'accordo e dal pubblico reale; non sono disponibili dati di traffico o RPM che permettano una previsione attendibile.

Non c'è attualmente uno sponsor configurato. `data/sponsorship.ts` contiene `SPONSOR_MESSAGE = null`: nessun banner, spazio vuoto, richiesta pubblicitaria o ricavo è attivo. Lo script AdSense con identificativi fittizi è stato rimosso.

Per attivare un accordo reale, modificare quella costante con il nome dello sponsor, il testo italiano e inglese e `reviewed: true`, dopo aver esaminato entrambi i testi e l'identità dello sponsor. Esempio di struttura, da compilare con informazioni reali:

```ts
export const SPONSOR_MESSAGE: SponsorMessage | null = {
  reviewed: true,
  name: 'NOME DELLO SPONSOR CONCORDATO',
  copy: {
    it: 'TESTO ITALIANO APPROVATO',
    en: 'APPROVED ENGLISH TEXT',
  },
};
```

Il componente mostra solo testo React, sotto la tastiera, nella stessa colonna delle altre schede, con etichetta pubblicitaria esplicita. Non aggiunge link, immagini remote, cookie, pixel, chiamate di rete o registrazione di impressioni. Nome e messaggio sono testo: HTML e script non vengono interpretati. `reviewed: false`, nome vuoto o traduzione mancante nascondono il banner. Questo descrive il componente sponsor, non costituisce un audit privacy degli altri servizi del gioco.

Evitare inviti all'acquisto rivolti ai bambini, richieste di dati personali, messaggi ingannevoli, premi legati alla visione e sovrapposizioni ai controlli. Prima di pubblicare un messaggio controllare anche la sua adeguatezza al pubblico e gli obblighi applicabili alla sponsorizzazione. L'etichetta da sola non certifica l'adeguatezza dello sponsor.

## Eventuale provider automatico

Il proprietario ha fornito la dichiarazione pubblica AdSense seguente, salvata in `public/ads.txt` e copiata da Vite in `dist/ads.txt`:

```text
google.com, pub-8896739816580918, DIRECT, f08c47fec0942fa0
```

L'URL previsto è https://hangman.giacomel.info/ads.txt. Il sito del dominio principale pubblica `subdomain=hangman.giacomel.info` nel proprio `ads.txt`, per indicare il file specifico del gioco. La dichiarazione autorizza il venditore indicato; non carica annunci, non dimostra l'approvazione del sito o dell'account e non configura il trattamento del pubblico infantile. Questa modifica non attiva AdSense: lo sponsor statico resta disattivato e nessuno script pubblicitario è stato reintrodotto. Vedere le [FAQ ufficiali ads.txt e sottodomini](https://support.google.com/adsense/answer/9785052?hl=en).

Non attivare AdSense reinserendo il vecchio snippet. Servono un account e un sito approvati, identificativi reali, impostazioni del pubblico, controlli sui contenuti e una verifica aggiornata delle condizioni del provider e delle scelte privacy. La pubblicità non personalizzata non equivale automaticamente ad assenza di cookie.

Documentazione Google consultata il 18 ottobre 2026:

- [Trattamento per età delle richieste](https://support.google.com/adsense/answer/9007197?hl=en): il segnale corrente documentato è TFAT; il trattamento CHILD disabilita personalizzazione e remarketing e applica protezioni dedicate. Non usare vecchi esempi TFCD/TFUA senza verificarli.
- [Impostazioni del sito](https://support.google.com/adsense/answer/3248194?hl=en).
- [Annunci personalizzati e non personalizzati](https://support.google.com/adsense/answer/9007336?hl=en).

`project_bundle.yaml` è una fotografia storica del progetto, non la sorgente di pubblicazione. I suoi vecchi snippet AdSense non devono essere riutilizzati. La build Vercel usa `index.html`, `App.tsx` e i componenti attuali.

## Trovare un finanziamento

Per uno sponsor diretto preparare una presentazione con URL del gioco, finalità didattica, immagini e dati aggregati di visite realmente disponibili. Non inventare numeri, raccogliere dati personali dei bambini o promettere un numero di impressioni non misurato. Cercare interlocutori pertinenti, per esempio editori didattici e scuole di lingue; concordare testo, durata, compenso e modalità di verifica. Nessun contatto commerciale è stato inviato da questo progetto.

Esistono integrazioni già pronte, ma una libreria GitHub non paga per il solo fatto di essere installata:

- [GameDistribution HTML5 SDK](https://github.com/GameDistribution/GD-HTML5): SDK ufficiale per annunci nella sua rete. Il [programma sviluppatori](https://gamedistribution.com/developers/partnership/) prevede una partnership con condivisione dei ricavi; registrazione, condizioni commerciali e compatibilità con questo gioco rivolto ai bambini vanno verificati prima di integrare il servizio.
- [Google H5 Games Ads](https://support.google.com/adsense/answer/9959170?hl=en): API pubblicitaria per giochi HTML5, distinta dal messaggio sponsor statico attuale. Richiede le abilitazioni del programma e le impostazioni appropriate al pubblico; l'integrazione non garantisce ricavi.
- [GitHub Sponsors](https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/about-github-sponsors-for-open-source-contributors): sostegno volontario al lavoro open source, non vendita automatica di annunci né ricerca automatica di aziende sponsor.

Nessuna di queste integrazioni è stata attivata. La cancellazione del precedente progetto Google Cloud non determina lo stato di un eventuale account AdSense: sono servizi distinti.
