<div align="center">
  <h1>🏡⭐ My Dashboard</h1>
  <p>
    Ein persönliches Dashboard für schnellen Zugriff auf deine Projekte und Lesezeichen.
    <br />
    Entwickelt mit React, Vite und Tailwind CSS.
  </p>
</div>

## ✨ Features

- **Personalisiertes Dashboard**: Verwalte deine Lieblingsprojekte und Lesezeichen an einem Ort.
- **Grayscale Dark Mode**: Ein elegantes, ablenkungsfreies dunkles Design in Grautönen (Slate).
- **PWA Support**: Installiere die App als Progressive Web App (PWA) für ein natives Erlebnis auf Desktop und Mobile.
- **Lokale Datenspeicherung**: Deine Daten werden sicher im LocalStorage deines Browsers gespeichert.
- **Import & Export**: Sichere deine Konfiguration als JSON-Datei und stelle sie jederzeit wieder her.
- **Anpassbar**: Füge benutzerdefinierte Icons (Google Material Symbols) hinzu und organisiere deine Links.
- **Bearbeitungsmodus**: Einfaches Hinzufügen, Bearbeiten und Löschen von Einträgen direkt über die UI.

## 🛠️ Tech Stack

- **Frontend**: [React](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Google Material Symbols](https://fonts.google.com/icons)
- **Deployment**: [GitHub Pages](https://pages.github.com/)

## 🚀 Installation & Nutzung

### Voraussetzungen

- [Node.js](https://nodejs.org/) (Version 16 oder höher empfohlen)
- npm (wird mit Node.js installiert)

### Lokal ausführen

1. **Repository klonen:**
   ```bash
   git clone https://github.com/dev0gig/dev0gig.github.io.git
   cd dev0gig.github.io
   ```

2. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

3. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```
   Die App ist nun unter `http://localhost:5173` (oder einem ähnlichen Port) erreichbar.

### Build & Deployment

Das Projekt ist für das Deployment auf **GitHub Pages** konfiguriert.

1. **Produktions-Build erstellen:**
   ```bash
   npm run build
   ```

2. **Auf GitHub Pages deployen:**
   ```bash
   npm run deploy
   ```
   Dies erstellt den Build und pusht den Inhalt des `dist`-Ordners in den `gh-pages`-Branch.

## ⚙️ Konfiguration

Die Anwendung nutzt `localStorage` zur Speicherung der Daten:
- `dashboard_projects`: Liste der Projekte
- `dashboard_bookmarks`: Liste der Lesezeichen

Du kannst deine Daten über das **Einstellungen-Menü** (Zahnrad-Icon) exportieren und importieren.

## 🎨 Credits

- **Favicon/PWA Icon**: [House icons created by Freepik - Flaticon](https://www.flaticon.com/free-icons/house)
- **Icons**: [Google Material Symbols](https://fonts.google.com/icons)
- **Font**: [Ubuntu](https://fonts.google.com/specimen/Ubuntu)
- **Development**: Vibe Coding with Gemini AI

---

<div align="center">
  Erstellt mit ❤️ und 🤖
</div>
