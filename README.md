# GitHub Easy Download

A browser extension that adds a one-click "Download" button to GitHub repo
pages. It reads the repo's latest release, figures out which file matches
your operating system, and lets you download it without hunting through
the Releases/Assets list.

## How to install (Chrome, Edge, Brave — any Chromium browser)

1. Unzip this folder somewhere permanent (don't delete it after installing —
   the browser loads the extension directly from these files).
2. Open `chrome://extensions` in your browser's address bar.
3. Turn on **Developer mode** (toggle, top-right corner).
4. Click **Load unpacked**.
5. Select the `github-easy-download` folder.
6. Done — visit any GitHub repo that has releases (e.g.
   `github.com/microsoft/vscode`) and you'll see a green download button
   in the bottom-right corner.

## How it works

- `manifest.json` — tells the browser what the extension is and which
  pages it should run on (`github.com/*`).
- `content.js` — the actual logic:
  1. Reads the repo owner/name from the URL.
  2. Calls GitHub's public API for the latest release.
  3. Detects your OS (Windows/Mac/Linux) from the browser.
  4. Scores each release file against your OS using filename patterns
     (`.exe`/`win` for Windows, `.dmg`/`mac` for macOS, etc.) and skips
     checksum/signature files.
  5. If one file clearly wins, the button downloads it directly. If it's
     ambiguous, clicking the button (or the small arrow) opens a list of
     all files so you can pick manually.
- `styles.css` — visual styling for the floating button.

## Notes / limitations

- Only works on repos that publish GitHub **Releases** with attached
  files. Repos without releases won't show the button.
- File-naming conventions vary a lot between projects, so the matching is
  a best-effort heuristic — when it's unsure, it shows you the options
  instead of guessing.
- GitHub's unauthenticated API is rate-limited to 60 requests/hour per IP,
  so if you browse a lot of repos back-to-back the button may briefly stop
  appearing until the limit resets.

## Publishing it so anyone can install it

### 1. Put the code somewhere public (recommended, optional)
Push this folder to a public GitHub repo. Not required by the stores, but
it builds trust — people are wary of installing extensions with no visible
source, and reviewers sometimes ask for it.

### 2. Chrome Web Store (covers Chrome, Edge, Brave, most Chromium browsers)
1. Create a developer account at
   https://chrome.google.com/webstore/devconsole — one-time $5 fee.
2. Zip **the contents** of this folder (not the folder itself — the zip
   should have `manifest.json` at its root).
3. In the dashboard, click **New Item**, upload the zip.
4. Fill in the store listing:
   - Short description (up to 132 chars) and a longer description.
   - At least one 1280×800 or 640×400 screenshot (take one of the button
     on a real repo page).
   - Category: "Developer Tools".
   - Privacy: paste in `PRIVACY.md`'s content or host it and link to it —
     Chrome requires a privacy policy since the extension calls a network
     API.
   - Justify the `host_permissions` for `api.github.com` in the
     permissions justification field (just explain it's used to fetch
     release info for the repo being viewed).
5. Submit for review. Typically takes a few hours to a few days.

### 3. Firefox Add-ons (optional, separate store)
Firefox supports the same Manifest V3 format with minor differences.
1. Create an account at https://addons.mozilla.org/developers/.
2. Zip the folder the same way.
3. Submit via "Submit a New Add-on" — Firefox's automated review is
   usually fast (minutes to hours) since the code is simple and has no
   obfuscation.
4. No listing fee for Firefox.

### 4. After publishing
- Once approved, you'll get a public store URL you can share directly —
  people click "Add to Chrome" / "Add to Firefox" and they're done, no
  zip files or developer mode needed.
- Keep the version number in `manifest.json` bumped (e.g. `1.0.1`) each
  time you update and re-upload.
