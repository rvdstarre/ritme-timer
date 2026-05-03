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
- Kleurcodering: water = blauw, eten = oranje — consequent doorgevoerd in kaart, countdown en tijdlijn
  - Volgende-melding kaart: gekleurde linker accentrand per type
  - Countdown tekst: type-kleur (blauw/oranje), oranje bij urgentie ongeacht type
  - Timeline items: subtiele gekleurde achtergrondcirkel per emoji
- Countdown op de volgende melding: toont "over 23 min" / "over 1u 15min" / "Nu!" in plaats van alleen het tijdstip
- Countdown kleurt oranje als de melding binnen 5 minuten is
- Tijdstip staat klein onder de countdown als referentie
- Schermlezer leest de countdown in volledige tekst ("over 23 minuten")
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
- **macOS:** Venstergedrag aangepast aan macOS-conventies: app blijft actief in dock bij sluiten venster, Cmd+Q sluit correct af
- **macOS:** Native traffic-light knoppen (hiddenInset titelbalk)
- **Linux:** System tray werkt nu zonder crash op desktops zonder tray-ondersteuning (bijv. GNOME)

### Toegevoegd
- **macOS:** Electron dmg-build voor Intel (x64) en Apple Silicon (arm64) via GitHub Actions
- **macOS:** Applicatiemenu met Cmd+Q, Verberg, Over
- **Linux:** AppImage, .deb en .rpm builds via GitHub Actions
- **iOS:** Capacitor iOS-ondersteuning toegevoegd (`@capacitor/ios`)
- **iOS:** Unsigned IPA-build via GitHub Actions (Xcode op macOS runner)
- GitHub Actions release-workflow voor macOS, Linux en iOS (triggert op git tag)

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
- Abstractielaag `services/api.js` voor Electron én Capacitor
- **Windows:** Push-notificaties via Electron Notification API
- **Windows:** System tray — app blijft actief op de achtergrond voor notificaties
- **Windows:** NSIS installer via electron-builder
- **Windows:** Zelf-ondertekend code signing certificaat
- **Windows:** Auto-update via electron-updater
- **Android:** Push-notificaties via Capacitor LocalNotifications
