# Changelog

Alle wijzigingen per versie worden hier bijgehouden.
Formaat gebaseerd op [Keep a Changelog](https://keepachangelog.com/nl/1.0.0/).

---

## [Unreleased]
### Toegevoegd
- Volledige toegankelijkheid voor JAWS, NVDA, TalkBack en VoiceOver
  - `lang="nl"` op `<html>` voor correcte uitspraak door schermlezer
  - Skip-link "Ga naar schema" voor toetsenbordgebruikers
  - `<label>` gekoppeld aan tijdveld via `for`/`id`
  - `role="tablist"` + `role="tab"` + `aria-selected` op dagtabs, pijltoetsen voor navigatie
  - Unieke `aria-label` per "Bevestig"-knop met naam en tijdstip
  - `aria-live="polite"` regio kondigt schema-updates aan voor schermlezer
  - `momentAriaLabel()` beschrijft elk moment volledig (type, naam, tijd, status)
  - Focus verplaatst automatisch naar tijdveld bij bewerken begintijd
  - `aria-hidden="true"` op decoratieve emoji's en herhaalbare labels
  - Statusaankondigingen na bevestiging ("bevestigd, volgende melding is...")

### Opgelost
- `focus:outline-none` verwijderde focusindicator — vervangen door `focus-visible:ring`
- `text-gray-500` op donkere achtergrond haalde contrast AA niet — verhoogd naar `text-gray-400`/`text-gray-300`
- `showTomorrow` ref niet gedeclareerd in script — dode knop verwijderd
- Dag-tabknoppen waren niet met pijltoetsen te bedienen

### Gewijzigd
### Verwijderd

---

## [0.1.0] - 2026-05-03
### Toegevoegd
- Initiële projectstructuur (Electron + Vue 3 + Vite + Capacitor)
- Schema-engine: automatisch dag-schema berekenen op basis van begintijd
  - 30 min voor elke maaltijd: watermelding
  - 30 min na elke maaltijd: watermelding
  - 2,5 uur tussen maaltijden
  - Minimaal 6 voedingsmomenten per dag
- Dynamisch herberekenen van schema na bevestiging
- Dagweergave met status per moment (pending / done / missed)
- Begintijd instellen voor vandaag en morgen
- Bevestiging per moment via UI
- Push-notificaties op Windows (Electron Notification API)
- Push-notificaties op Android (Capacitor LocalNotifications)
- System tray — app blijft actief op de achtergrond voor notificaties
- Abstractielaag `services/api.js` voor Electron én Capacitor
- Windows NSIS installer via electron-builder
- Zelf-ondertekend code signing certificaat
- Auto-update via electron-updater (Windows)
