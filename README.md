# CODE13 ACCESS GRID — static HTML/CSS/JS edition

## Overview

This project runs without PHP or a database. It can be opened locally, deployed to GitHub Pages, or hosted on any static web host.

## Local launch

1. Extract the archive.
2. Open `index.html` in a browser.
3. Open the admin panel through `forge/index.html`.

## Login credentials

- Login: `C13_Operator_Nyx`
- Password: `R7!vQ2@kL9#sT4$wX8mP`

## Using the admin panel

1. Open `/forge/`.
2. Sign in.
3. Add, edit, hide, delete, or reorder access points.
4. Click **DOWNLOAD LINKS.JS**.
5. Replace `data/links.js` in the project with the downloaded file.
6. Upload the change to GitHub. After GitHub Pages redeploys, all visitors will see the updated links.

Until `data/links.js` is replaced, edits remain a local draft in the current browser.

## GitHub Pages deployment

1. Create a repository.
2. Upload the project contents to the repository root.
3. Open `Settings → Pages`.
4. Under `Build and deployment`, select `Deploy from a branch`.
5. Select the `main` branch and `/ (root)` folder.
6. Save the settings.

The main page will be available at:

`https://username.github.io/repository/`

The admin panel will be available at:

`https://username.github.io/repository/forge/`

## Static-site limitation

Pure HTML/CSS/JS cannot securely write files back to GitHub or update the public site for every visitor. The panel therefore generates a new `links.js`, which must be uploaded to the repository.

The static login only discourages casual access; it is not server-side authentication. A visitor still cannot change the published website without access to the GitHub account or hosting environment.

## Structure

```text
.
├── index.html
├── forge/
│   └── index.html
├── data/
│   └── links.js
└── assets/
    ├── css/
    ├── js/
    └── img/
```
