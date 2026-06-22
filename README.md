# Référentiel pays LCB-FT

Interface de travail pour consulter un référentiel pays LCB-FT consolidé, filtrer les statuts par source, ouvrir une fiche pays et exporter les résultats.

## Contenu

- `Référentiel pays/public/index.html` : interface HTML du référentiel.
- `Référentiel pays/data/country-risk-catalog.json` : base pays utilisée par l'interface.
- `Référentiel pays/server.js` : serveur local Node.js.
- `Référentiel pays/start_training_catalog.cmd` : lancement Windows par double-clic.
- `Référentiel pays/start_training_catalog.ps1` : lancement PowerShell.
- `Référentiel pays/tools/record-demo-video.js` : script de capture vidéo du parcours utilisateur.
- `Référentiel pays/videos/referentiel-pays-demo-20260622T102551.webm` : dernière vidéo de présentation.

Les captures de travail intermédiaires et les sauvegardes locales sont ignorées par Git.

## Lancer en local

Depuis le dossier `Référentiel pays` :

```powershell
node server.js
```

Puis ouvrir :

```text
http://127.0.0.1:8787
```

Sur Windows, il est aussi possible d'utiliser :

```powershell
.\start_training_catalog.ps1
```

ou de lancer `start_training_catalog.cmd`.

## Fonctionnalités

- Tableau filtrable par pays, liste ou effet.
- Fiche pays en overlay au clic sur une ligne.
- Export CSV et JSON du référentiel filtré.
- Sélection de plusieurs pays pour export PDF.
- Section sources avec simulation d'actualisation.
- Overlay glossaire, sources et textes utiles.
- Statistiques descriptives de la base.

## Vidéo

La vidéo de présentation actuellement versionnée est :

```text
Référentiel pays/videos/referentiel-pays-demo-20260622T102551.webm
```

Elle présente un parcours utilisateur complet : consultation des sources, ouverture de l'overlay explicatif, actualisation, filtrage, fiche pays, sélection PDF et statistiques.

## Régénérer la vidéo

Le script de capture utilise Playwright et Chrome :

```powershell
node ".\tools\record-demo-video.js"
```

Il démarre le serveur local, enregistre un parcours guidé et dépose une nouvelle vidéo dans `Référentiel pays/videos`.

Si Playwright est installé via le runtime Codex, il peut être nécessaire de définir `NODE_PATH` vers les modules Node du runtime avant de lancer le script.
