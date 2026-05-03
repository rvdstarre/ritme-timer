# Changelog

Alle wijzigingen per versie worden hier bijgehouden.
Formaat gebaseerd op [Keep a Changelog](https://keepachangelog.com/nl/1.0.0/).

---

## [Unreleased]
### Toegevoegd
### Gewijzigd
### Opgelost
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
