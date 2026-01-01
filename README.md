# My Personal OS

Eine vielseitige All-in-One Webanwendung, die als dein persönlicher, digitaler Begleiter dient. Sie vereint Produktivität, Finanzen, Lernen und Unterhaltung in einer einzigen, aufgeräumten Oberfläche.

## ✨ Was kann die App?

Die App ist modular aufgebaut und bietet integrierte Werkzeuge für deinen Alltag, die alle lokal in deinem Browser laufen.

### 🏠 Dashboard
Deine persönliche Startseite mit einer integrierten Google-Suche und Schnellzugriff auf alle Module.

### 📔 Journal
Dein persönliches Tagebuch für Gedanken, Ideen und tägliche Einträge.
- **Kalenderansicht**: Navigiere intuitiv durch deine Historie.
- **Volltextsuche**: Finde Einträge und Notizen in Sekundenschnelle wieder.
- **Tagging**: Organisiere deine Gedanken mit einem flexiblen Tag-System.

### 💰 Finanzmanager (Budget)
Ein mächtiges Tool, um deine Finanzen im Griff zu behalten.
- **Transaktionsverwaltung**: Erfasse Einnahmen, Ausgaben und Fixkosten.
- **Budgetierung**: Setze monatliche Limits für verschiedene Kategorien.
- **Visuelle Analysen**: Interaktive Charts zeigen dir Trends und Vermögensentwicklung.
- **Sparziele**: Definiere und verfolge deine finanziellen Ziele.

### 📈 Savings Simulator
Ein Simulator für deine finanzielle Zukunft.
- Berechne Zinseszinseffekte.
- Spiele verschiedene Sparszenarien durch, um bessere Entscheidungen zu treffen.

### 🧠 Flashcards
Optimiere deinen Lernprozess mit digitalen Karteikarten.
- Erstelle eigene Decks zu beliebigen Themen.
- Ideal zum Lernen von Sprachen, Fachbegriffen oder Prüfungsvorbereitung.

### 🃏 MTG Inventory
Verwalte deine Magic: The Gathering Sammlung.
- **Inventarisierung**: Erfasse deine Karten schnell und effizient.
- **Suchfunktion**: Durchsuche deine Sammlung mit umfangreichen Filtern.
- **Backup**: Deine Sammlung wird Teil des globalen Backups.

### 🎵 Musik & Atmosphäre
- **Integrierter YouTube-Player**: Höre Musik (z.B. Lofi Beats) direkt in der Seitenleiste, ohne den Tab zu wechseln.
- **Fokus-Modus**: Sorge für die richtige Arbeitsatmosphäre.

## 🔒 Datenschutz & Sicherheit (Local First)

- **100% Privat**: Alle deine Daten (Journal, Finanzen, Karten, etc.) werden **ausschließlich lokal** in deinem Browser (LocalStorage) gespeichert. Es werden keine Daten an externe Server gesendet.
- **Backup & Restore**: Du hast die volle Kontrolle. Exportiere deinen kompletten Datenbestand jederzeit als ZIP-Datei und importiere ihn auf einem anderen Gerät oder Browser.
- **Offline-Fähig**: Dank PWA-Technologie funktioniert die App auch vollständig ohne Internetverbindung.

## 🛠️ Technologie-Stack

Dieses Projekt nutzt modernste Web-Technologien für maximale Performance und Developer Experience:

- **Framework**: Angular 21 (Standalone Components, Signals)
- **Styling**: Tailwind CSS
- **Sprache**: TypeScript
- **Charts**: Chart.js / ng2-charts
- **Build Tool**: Angular CLI

## 🚀 Entwicklung

### Voraussetzungen
- Node.js (Version 20 oder höher)
- npm

### Quick Start

```bash
# 1. Repository klonen
git clone https://github.com/dev0gig/dev0gig.github.io.git

# 2. Abhängigkeiten installieren
npm install

# 3. Entwicklungsserver starten
npm start
```
Die Anwendung ist nun unter `http://localhost:4200/` erreichbar.

### Build & Deployment

Das Projekt ist für **GitHub Pages** optimiert.

```bash
# Produktions-Build erstellen
npm run build:prod
```

Ein GitHub Actions Workflow deployed Änderungen auf dem `main` Branch automatisch.

## 📄 Lizenz

Dieses Projekt ist als "Personal OS" konzipiert und dient persönlichen Zwecken.
