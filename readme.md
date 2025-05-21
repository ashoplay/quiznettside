# Quiz Nettside

En komplett web-applikasjon for å lage, administrere og ta quizzer med fokus på IT og teknologi.

## 📋 Prosjektoversikt

Quiz Nettside er en plattform der brukere kan opprette egne quizzer, ta quizzer laget av andre, og følge sin egen progresjon. Applikasjonen støtter forskjellige spørsmålstyper, brukeradministrasjon, og detaljert statistikk.

## ✨ Hovedfunksjoner

### For alle brukere
- Registrering og innlogging med sikker passordhåndtering (Argon2)
- Bla gjennom og søke i tilgjengelige quizzer
- Ta quizzer med umiddelbar tilbakemelding
- Se resultater og statistikk over egne prestasjoner

### For innloggede brukere
- Opprett egne quizzer med forskjellige spørsmålstyper:
  - Flervalgsoppgaver
  - Sant/usant-spørsmål
  - Tekstsvar
- Administrer egne quizzer (rediger, slett, publiser/avpubliser)
- Se detaljert statistikk over egne quizzer
- Oppdater profilinformasjon og profilbilde

### For administratorer
- Komplett administrasjonspanel
- Brukeradministrasjon med mulighet for å endre roller eller slette brukere
- Administrere alle quizzer i systemet
- Se aktivitetslogg og systemstatistikk

## 🛠️ Teknologier

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB** - NoSQL database for lagring av data
- **Mongoose** - Objekt-modelleringsbibliotek for MongoDB
- **Argon2** - Sikker passordkryptering
- **JWT** - JSON Web Tokens for autentisering
- **CSRF Protection** - Sikkerhet mot Cross-Site Request Forgery

### Frontend
- **EJS** - Embedded JavaScript templates
- **Bootstrap** - CSS framework for responsivt design
- **Font Awesome** - Ikonbibliotek
- **JavaScript** - Klientsidefunksjonalitet

## 🏗️ Prosjektstruktur

```
quiz/
├── config/             # Konfigurasjonfiler
├── controllers/        # Kontrollere for applikasjonslogikk
├── middleware/         # Express middleware
├── models/             # Mongoose modeller
├── public/             # Statiske filer (CSS, JS, bilder)
├── routes/             # API og sidefunksjonalitet
├── utils/              # Hjelpefunksjoner
├── views/              # EJS templates
│   ├── admin/          # Admin-relaterte visninger
│   ├── partials/       # Gjenbrukbare template-deler
│   └── quizzes/        # Quiz-relaterte visninger
├── app.js              # Applikasjonens startpunkt
└── package.json        # Prosjektavhengigheter
```

## 🚀 Installasjon og kjøring

### Forutsetninger
- Node.js (v14 eller nyere)
- MongoDB (v4.4 eller nyere)

### Utvikling
1. Klon prosjektet
2. Installer avhengigheter:
   ```
   npm install
   ```
3. Kopier `.env.example` til `.env` og konfigurer miljøvariablene
4. Start MongoDB
5. Start applikasjonen i utviklingsmodus:
   ```
   npm run dev
   ```
6. Opprett admin-bruker (valgfritt):
   ```
   npm run create-admin
   ```

### Produksjon
Se `DEPLOYMENT.md` for fullstendige instruksjoner om produksjonsoppsett.

## 🔒 Sikkerhet

- Passord lagres sikkert med Argon2-hashing
- CSRF-beskyttelse på alle POST/PUT/DELETE-forespørsler
- Input-validering for å hindre injeksjonsangrep
- Rollebasert tilgangskontroll

## 📈 Fremtidige forbedringer

- Støtte for bildebaserte spørsmål
- Integrasjon med eksterne læringsplattformer
- Støtte for quiz-kategorier og merking
- Offentlig API for tredjepartsintegrasjon
- Avansert analysefunksjonalitet

## 📄 Lisens

Dette prosjektet er lisensiert under MIT-lisensen.

## 👥 Bidrag

Bidrag, feilrapporter og forbedringsforslag er velkommen. 
Vennligst opprett en issue for større endringer før du sender en pull request.
