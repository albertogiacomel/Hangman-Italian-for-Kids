# Sponsorizzazioni di Hangman

Hangman è pubblicato su Vercel. Il vecchio controllo Google Cloud Build è un'integrazione residua: disattivare il solo trigger Hangman dalla console Google Cloud; non ripristinare il service account. Questa pulizia richiede ancora accesso al progetto `gen-lang-client-0152302993` e non è stata eseguita dal codice del gioco.

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

Non attivare AdSense reinserendo il vecchio snippet. Servono un account e un sito approvati, identificativi reali, impostazioni del pubblico, controlli sui contenuti e una verifica aggiornata delle condizioni del provider e delle scelte privacy. La pubblicità non personalizzata non equivale automaticamente ad assenza di cookie.

Documentazione Google consultata il 18 ottobre 2026:

- [Trattamento per età delle richieste](https://support.google.com/adsense/answer/9007197?hl=en): il segnale corrente documentato è TFAT; il trattamento CHILD disabilita personalizzazione e remarketing e applica protezioni dedicate. Non usare vecchi esempi TFCD/TFUA senza verificarli.
- [Impostazioni del sito](https://support.google.com/adsense/answer/3248194?hl=en).
- [Annunci personalizzati e non personalizzati](https://support.google.com/adsense/answer/9007336?hl=en).

`project_bundle.yaml` è una fotografia storica del progetto, non la sorgente di pubblicazione. I suoi vecchi snippet AdSense non devono essere riutilizzati. La build Vercel usa `index.html`, `App.tsx` e i componenti attuali.
