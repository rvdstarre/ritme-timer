# App Plan: Ritme Timer

## Samenvatting
Ritme Timer is een herinnerings-app voor voeding en water. De gebruiker stelt per dag een begintijd in, waarna de app automatisch een schema berekent met watermomenten voor en na elke maaltijd, en voedingsmomenten op vaste intervallen. Bevestig je een melding later dan gepland, dan past het schema zich dynamisch aan. De app is bedoeld voor publieke distributie via GitHub.

**Doelgroep:** Breed publiek (persoonlijk gezondheidsmanagement)

---

## Schema-regels (vast ingebakken)
- Altijd starten met water, daarna voeding
- **30 min voor** elke maaltijd: watermelding
- **30 min na** elke maaltijd: watermelding
- **2,5 uur na** een maaltijd: volgende voedingsmelding
- Minimaal **6 voedingsmomenten** per dag (3 hoofdmaaltijden + 3 tussendoor)
- Voedings- en watermeldingen zitten altijd minimaal 30 min uit elkaar
- Schema past zich **dynamisch aan** op basis van werkelijk bevestigingstijdstip

---

## Aanbevolen tech stack

| Onderdeel | Keuze |
|-----------|-------|
| Framework | Electron + Capacitor |
| Frontend | Vue 3 + Vite |
| Stijl | Tailwind CSS |
| Data | JSON (lokale opslag via electron-store / Capacitor Preferences) |
| Notificaties Android | `@capacitor/local-notifications` |
| Notificaties Windows | Electron `Notification` API |
| Auto-update Windows | `electron-updater` (electron-builder) |
| Update-check Android | GitHub Releases API pollt bij app-start |
| Distributie | GitHub Releases (Windows NSIS + Android APK) |
| Release-pipeline | PowerShell release.ps1 (naar voorbeeld Kasboek) |

**Motivatie:** Één codebase voor Windows en Android, bewezen setup (zoals Kasboek). Vue 3 + Vite is licht en snel. Lokale JSON-opslag is voldoende voor dagplanning zonder backend-complexiteit.

---

## Architectuur

```
Electron (main process)
  ├── Schema-engine (berekent tijden, beheert timers)
  ├── Notification manager (Windows toasts)
  ├── electron-store (persistente dagdata JSON)
  └── IPC handlers

Vue 3 (renderer / Capacitor webview)
  ├── Dagweergave (huidige schema + status per moment)
  ├── Begintijd instellen (vandaag + morgen)
  └── Bevestigingsscherm (meldingen bevestigen)

Capacitor (Android wrapper)
  ├── @capacitor/local-notifications
  └── @capacitor/preferences (opslag)

services/api.ts (abstractielaag Electron ↔ Capacitor)
```

### Schema-engine logica
1. Begintijd invoeren → maaltijdtijden berekenen op basis van 2,5-uursregel
2. Watermomenten inplannen: 30 min voor en na elke maaltijd
3. Timers instellen voor alle momenten
4. Bij bevestiging: verschil berekenen tussen gepland en werkelijk tijdstip → alle opvolgende tijden herberekenen

---

## MVP-scope (v1.0)

**Inbegrepen:**
- Begintijd instellen voor vandaag
- Begintijd alvast instellen voor morgen
- Automatisch dag-schema berekenen (water + voeding)
- Dagweergave: lijst van alle geplande momenten met status
- Push-notificaties op Android en Windows
- Bevestigen per moment (gegeten / gedronken)
- Dynamisch herberekenen na bevestiging
- Auto-update Windows (electron-updater)
- Update-check Android bij opstarten
- GitHub Releases distributie

**Niet in MVP:**
- Geschiedenis / statistieken
- Aanpasbare intervallen
- Accounts of cloud-sync
- iOS

---

## Fasering

- **Fase 1 (MVP):** Schema-engine + dagweergave + notificaties + bevestigingen + release pipeline
- **Fase 2:** Geschiedenis (afgelopen 7 dagen), visuele samenvatting
- **Fase 3:** Aanpasbare intervallen, meerdere profielen, eventueel iOS

---

## Tijdlijn (schatting, zonder harde deadline)

| Fase | Geschatte doorlooptijd |
|------|----------------------|
| Projectopzet + schema-engine | 1-2 sessies |
| Dagweergave + UI | 1-2 sessies |
| Notificaties (Android + Windows) | 1 sessie |
| Bevestigen + herberekenen | 1 sessie |
| Release pipeline + auto-update | 1 sessie |
| **MVP totaal** | **5-7 sessies** |

---

## Risico's & aandachtspunten

- **Achtergrond-notificaties Android:** Capacitor local notifications werken betrouwbaar, maar Android kan achtergrondprocessen killen. Testen op een echt apparaat is verplicht.
- **Schema-herberekening:** De dynamische aanpassing bij bevestiging is het meest complexe deel — goed testen met randgevallen (bijv. laat bevestigen vlak voor de volgende melding).
- **Windows notificaties bij gesloten app:** Electron moet als achtergrondproces blijven draaien (system tray icon) zodat notificaties ook werken als het venster gesloten is.
- **Tijdzones:** Lokale tijd gebruiken, geen UTC-conversie nodig voor dit gebruik.

---

## Eerste stap
Projectstructuur opzetten met Electron + Vue 3 + Vite + Capacitor, daarna de schema-engine bouwen als eerste — dit is de kern van de app.

Typ `/build-app` om te beginnen met bouwen.
