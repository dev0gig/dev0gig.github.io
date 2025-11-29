# GitHub Pages Deployment Setup

## Schritte zur Einrichtung

### 1. Repository auf GitHub erstellen/überprüfen

Stelle sicher, dass dein Repository `dev0gig.github.io` auf GitHub existiert.

### 2. GitHub Pages in den Repository Settings aktivieren

1. Gehe zu deinem Repository auf GitHub: `https://github.com/dev0gig/dev0gig.github.io`
2. Klicke auf **Settings** (Einstellungen)
3. Navigiere im linken Menü zu **Pages**
4. Unter **Build and deployment**:
   - **Source**: Wähle `GitHub Actions` aus
   - (Nicht "Deploy from a branch" - das ist wichtig!)

### 3. Code auf GitHub pushen

```bash
# Status überprüfen
git status

# Alle Änderungen hinzufügen
git add .

# Commit erstellen
git commit -m "Setup GitHub Pages deployment"

# Auf main Branch pushen
git push origin main
```

### 4. Deployment überwachen

1. Gehe zu deinem Repository auf GitHub
2. Klicke auf den Tab **Actions**
3. Du solltest einen Workflow-Lauf sehen mit dem Namen "Deploy to GitHub Pages"
4. Klicke darauf, um den Fortschritt zu sehen
5. Nach erfolgreichem Abschluss (grüner Haken ✓) ist deine App live!

### 5. App aufrufen

Deine App ist dann erreichbar unter:
**https://dev0gig.github.io/**

## Automatisches Deployment

Ab jetzt wird bei jedem Push auf den `main` Branch automatisch ein neues Deployment ausgelöst:

```bash
# Änderungen machen
# ...

# Änderungen committen und pushen
git add .
git commit -m "Deine Änderungen"
git push origin main

# GitHub Actions baut und deployed automatisch!
```

## Lokaler Test vor dem Deployment

Bevor du pushst, kannst du lokal testen:

```bash
# Production Build erstellen
npm run build:prod

# Build-Ordner überprüfen
# Die Dateien sollten in dist/browser/ sein
```

## Troubleshooting

### Deployment schlägt fehl

1. Überprüfe den Actions-Tab auf GitHub für Fehlermeldungen
2. Stelle sicher, dass `package.json` und `package-lock.json` committed sind
3. Überprüfe, dass die Node-Version in `.github/workflows/deploy.yml` korrekt ist

### Seite zeigt 404

1. Warte 1-2 Minuten nach dem Deployment
2. Überprüfe, dass in den Repository Settings unter Pages "GitHub Actions" als Source ausgewählt ist
3. Leere den Browser-Cache (Strg+F5)

### Routing funktioniert nicht

Das ist bereits gelöst durch die `.nojekyll` Datei und die korrekte Angular-Konfiguration.

## Custom Domain (Optional)

Falls du später eine eigene Domain verwenden möchtest:

1. Erstelle eine Datei `public/CNAME` mit deiner Domain (z.B. `journal.example.com`)
2. Konfiguriere die DNS-Einstellungen bei deinem Domain-Provider
3. Aktiviere die Custom Domain in den GitHub Pages Settings
