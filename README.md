# My Personal OS

Eine vielseitige All-in-One Webanwendung, die als dein persönlicher, digitaler Begleiter dient. Sie vereint Produktivität, Kreativität und Unterhaltung in einer einzigen, aufgeräumten Oberfläche.

## ✨ Was kann die App?

Die App ist modular aufgebaut und bietet verschiedene Werkzeuge für deinen Alltag:

### 📔 Journal & Termine
Dein persönliches Tagebuch für Gedanken, Ideen und tägliche Einträge.
- **Kalenderansicht**: Navigiere einfach durch deine vergangenen Einträge.
- **Suche**: Finde alte Notizen in Sekundenschnelle wieder.

### � Finanzmanager (Budget)
Behalte deine Finanzen voll im Griff.
- **Einnahmen & Ausgaben**: Erfasse alle Transaktionen.
- **Trends**: Visuelle Grafiken zeigen dir, wie sich dein Vermögen entwickelt.
- **Sparziele**: Setze dir Budgets für verschiedene Kategorien.

### 🎵 Musik & Atmosphäre
- **Integrierter Player**: Spiele deine Lieblings-YouTube-Playlists (z.B. Lofi Beats) direkt in der Seitenleiste ab, während du arbeitest.
- **Zuletzt gehört**: Schnellzugriff auf deine ständigen Begleiter.

### 🔒 Deine Daten
- **Vollständige Kontrolle**: Alle Daten werden lokal in deinem Browser gespeichert.
- **Backup**: Du kannst jederzeit all deine Daten (Journal, Finanzen, Einstellungen) als Datei exportieren und sichern.
- **Offline-Fähig**: Die App funktioniert auch ohne Internetverbindung (PWA).

## 🛠️ Entwicklung

### Voraussetzungen

- Node.js (Version 20 oder höher)
- npm

### Installation

```bash
npm install
```

### Development Server

```bash
npm start
```

Die Anwendung ist dann unter `http://localhost:4200/` erreichbar.

### Build

```bash
npm run build:prod
```

Die Build-Artefakte werden im `dist/` Verzeichnis gespeichert.

## 📦 Deployment

### GitHub Pages

Das Projekt ist für automatisches Deployment auf GitHub Pages konfiguriert.

#### Einrichtung

1. **Repository Settings**:
   - Gehe zu deinem Repository auf GitHub
   - Navigiere zu `Settings` → `Pages`
   - Unter "Build and deployment":
     - Source: `GitHub Actions`

2. **Automatisches Deployment**:
   - Bei jedem Push auf den `main` Branch wird automatisch ein Deployment ausgelöst
   - Der GitHub Actions Workflow baut die Anwendung und deployed sie auf GitHub Pages
   - Die App ist dann unter `https://dev0gig.github.io/` erreichbar

#### Manuelles Deployment

Falls du manuell deployen möchtest:

```bash
# Build erstellen
npm run build:prod

# Die Dateien aus dem dist/ Ordner müssen dann auf den gh-pages Branch gepusht werden
```

## 📝 Technologie-Stack

- **Framework**: Angular 21
- **Styling**: Tailwind CSS
- **Icons**: Google Material Symbols
- **Build Tool**: Angular CLI
- **Deployment**: GitHub Pages

## 📄 Lizenz

Dieses Projekt ist privat.
