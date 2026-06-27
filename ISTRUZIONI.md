# AMIRA vision Magazine — Istruzioni

## Come pubblicare un articolo

1. Vai su **amiravision.it/admin** (o il tuo dominio /admin)
2. Accedi con GitHub (account: fraamira)
3. Clicca **"Nuovo Articolo"**
4. Compila i campi:
   - Titolo
   - Foto copertina (carica dal tuo computer)
   - Testo introduttivo
   - Contenuto (aggiungi paragrafi, foto, citazioni)
5. Clicca **"Pubblica"**
6. Il sito si aggiorna in circa 1 minuto

## Struttura cartelle

```
amira-magazine/
├── index.html        ← il sito
├── admin/            ← pannello admin (non toccare)
├── _articoli/        ← articoli salvati automaticamente
├── immagini/         ← foto caricate dal pannello
└── netlify.toml      ← configurazione (non toccare)
```

## Collegare GitHub + Netlify (una volta sola)

1. Crea repo su github.com/fraamira/amira-magazine
2. Carica tutti questi file
3. Su netlify.com → "Add new site" → "Import from GitHub"
4. Seleziona il repo → Deploy
5. Fine
