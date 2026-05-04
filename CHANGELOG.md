# Changelog

Alle wijzigingen per versie worden hier bijgehouden.
Formaat gebaseerd op [Keep a Changelog](https://keepachangelog.com/nl/1.0.0/).

Platformtags worden alleen vermeld als een wijziging platform-specifiek is.
Geen tag = van toepassing op alle platformen.

| Tag | Platform |
|-----|----------|
| **Windows:** | Electron desktop (Windows) |
| **macOS:** | Electron desktop (macOS) |
| **Linux:** | Electron desktop (Linux) |
| **Android:** | Capacitor Android app |
| **iOS:** | Capacitor iOS app |

---

## [Unreleased]
### Toegevoegd
- Voortgangsbalk voor eten en water: toont hoeveel maaltijden/watermomenten al zijn bevestigd (X/Y + gekleurde balk), met `role="progressbar"` en `aria-label` voor schermlezers

### Gewijzigd
### Opgelost
### Verwijderd

---

## [0.2.0] - 2026-05-03

### Toegevoegd
- Volledige update-module met in-app UI (changelog tonen, voortgangsbalk, installeerknop)
  - **Windows:** automatisch downloaden via electron-updater, changelog tonen, "Nu installeren & herstarten"
  - **Linux (AppImage):** automatisch downloaden via electron-updater
  - **Linux (.deb/.rpm):** GitHub API check, melding met directe downloadlink naar GitHub releases
  - **macOS:** automatisch downloaden via electron-updater (vereist signing voor productie)
  - Changelog opgehaald van GitHub Releases API, gebundelde CHANGELOG.md als fallback
  - Updatecheck bij opstarten + elke 6 uur op de achtergrond
  - Update-banner is wegklikbaar, toegankelijk met `role="alert"` en `aria-live`
- Visuele tijdlijn met verbindingslijn: verticale lijn verbindt alle momenten, afgeronde momenten grijze lijn, actief moment gekleurde ring om dot
- Kleurcodering: water = blauw, eten = oranje — doorgevoerd in kaartrand, countdown en tijdlijn
- Live countdown op de volgende melding: "over 23 min" / "over 1u 15min" / "Nu!" — oranje bij ≤ 5 minuten
- Volledige toegankelijkheid (WCAG 2.1 AA) voor JAWS, NVDA, TalkBack en VoiceOver
  - `lang="nl"` voor correcte uitspraak, skip-link, `<label>` op tijdveld
  - `role="tablist"` + `aria-selected` + pijltoetsnavigatie op dagtabs
  - Unieke `aria-label` per "Bevestig"-knop, `aria-live` voor schema-updates
  - Focus verplaatst automatisch naar tijdveld bij bewerken begintijd
- **macOS:** Applicatiemenu met Cmd+Q, Verberg, Over; native traffic-light knoppen
- **macOS:** Electron dmg-build voor Intel (x64) en Apple Silicon (arm64) via GitHub Actions
- **Linux:** AppImage, .deb en .rpm builds via GitHub Actions
- **iOS:** Capacitor iOS-ondersteuning (`@capacitor/ios`), unsigned IPA via GitHub Actions
- GitHub Actions release-workflow voor macOS, Linux en iOS

### Opgelost
- Focusindicator ontbrak (`focus:outline-none`) — vervangen door `focus-visible:ring`
- Contrast te laag voor `text-gray-500` op donkere achtergrond — verhoogd naar `text-gray-400`
- Dode `showTomorrow`-knop verwijderd (ref niet gedeclareerd)
- Dag-tabknoppen waren niet met pijltoetsen te bedienen
- Bevestigen van morgen-momenten gebruikte altijd vandaag's datum

### Gewijzigd
- **macOS:** Venstergedrag: app blijft actief in dock bij sluiten, Cmd+Q sluit correct af
- **Linux:** System tray werkt zonder crash op desktops zonder tray-ondersteuning (GNOME)

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
- Abstractielaag `services/api.js` voor Electron én Capacitor
- **Windows:** Push-notificaties via Electron Notification API
- **Windows:** System tray — app blijft actief op de achtergrond voor notificaties
- **Windows:** NSIS installer via electron-builder
- **Windows:** Zelf-ondertekend code signing certificaat
- **Windows:** Auto-update via electron-updater
- **Android:** Push-notificaties via Capacitor LocalNotifications
