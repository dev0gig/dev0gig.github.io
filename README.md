# Journal App

Eine moderne, minimalistische Journal-Anwendung mit Angular.

## 🚀 Features

- 📝 Tägliche Journal-Einträge
- 📅 Kalenderansicht mit Markierungen für Einträge
- 🔍 Suchfunktion
- 💾 Import/Export von Daten
- 🌙 Dark Mode
- 📱 Responsive Design
- 🔒 Offline-fähig (PWA)

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
